/** Private Drive intake. Deploy only in the Ferrari owner's Google account.
 * Script Properties: INTAKE_SECRET (32+ chars), ROOT_FOLDER_ID, NOTIFY_EMAIL,
 * DOCUMENTS_CONFIRMED=true, DOCUMENTS_JSON=[{id,label,required}].
 * The Web App URL and matching secret belong in Vercel server environment only.
 * No browser receives these properties. No file is shared publicly.
 */
const TYPES_=['cnpj','contrato','creci','complemento'];
const FILE_LIMIT_=2*1024*1024;
function response_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)}
function digest_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('')}
function configured_(){
 const p=PropertiesService.getScriptProperties();let documents;
 try{documents=JSON.parse(p.getProperty('DOCUMENTS_JSON')||'[]')}catch(e){documents=[]}
 return {secret:p.getProperty('INTAKE_SECRET')||'',root:p.getProperty('ROOT_FOLDER_ID'),email:p.getProperty('NOTIFY_EMAIL'),confirmed:p.getProperty('DOCUMENTS_CONFIRMED')==='true',documents:documents};
}
function ready_(c){return c.secret.length>=32&&!!c.root&&/^\S+@[^\s@]+\.[^\s@]+$/.test(c.email||'')&&c.confirmed&&c.documents.length>0&&c.documents.length<=4&&c.documents.every(d=>TYPES_.indexOf(d.id)>=0&&typeof d.required==='boolean'&&typeof d.label==='string')&&new Set(c.documents.map(d=>d.id)).size===c.documents.length}
function save_(folder,state){
 const matches=folder.getFilesByName('_cadastro.json');const data=JSON.stringify(state,null,2);
 if(matches.hasNext())matches.next().setContent(data);else folder.createFile('_cadastro.json',data,MimeType.PLAIN_TEXT);
}
function load_(root,id,token){
 const folders=root.getFoldersByName(id);if(!folders.hasNext())throw Error('INVALID_SESSION');const folder=folders.next();const files=folder.getFilesByName('_cadastro.json');if(!files.hasNext())throw Error('INVALID_SESSION');
 const state=JSON.parse(files.next().getBlob().getDataAsString());if(state.tokenHash!==digest_(token)||Date.now()-state.createdAt>2*60*60*1000)throw Error('INVALID_SESSION');return {folder:folder,state:state};
}
function doPost(e){
 try{
  const c=configured_();if(!ready_(c))return response_({ok:false,code:'NOT_CONFIGURED'});
  if(!e.postData||e.postData.contents.length>3000500)return response_({ok:false,code:'INVALID_REQUEST'});
  const envelope=JSON.parse(e.postData.contents);if(typeof envelope.body!=='string'||typeof envelope.signature!=='string')throw Error('UNAUTHORIZED');
  const expected=Utilities.computeHmacSha256Signature(envelope.body,c.secret).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
  if(expected.length!==envelope.signature.length)throw Error('UNAUTHORIZED');let difference=0;for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^envelope.signature.charCodeAt(i);if(difference)throw Error('UNAUTHORIZED');
  const request=JSON.parse(envelope.body);if(Math.abs(Date.now()-request.issued)>90000)throw Error('UNAUTHORIZED');
  const root=DriveApp.getFolderById(c.root);if(root.getSharingAccess()!==DriveApp.Access.PRIVATE)throw Error('ROOT_NOT_PRIVATE');
  if(request.action==='status')return response_({ok:true,enabled:true,documents:c.documents});
  const lock=LockService.getScriptLock();if(!lock.tryLock(15000))return response_({ok:false,code:'BUSY'});
  try{
   if(request.action==='start'){
    if(!request.company||request.company.consent!==true||!request.company.razaoSocial||!request.company.email)throw Error('INVALID_COMPANY');
    const cache=CacheService.getScriptCache(),key='rate:'+request.clientKey;const count=Number(cache.get(key)||0);if(count>=12)return response_({ok:false,code:'RATE_LIMIT'});cache.put(key,String(count+1),3600);
    const id=Utilities.getUuid(),token=Utilities.getUuid()+Utilities.getUuid();const protocol='FERRARI-'+Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyyMMdd')+'-'+id.slice(0,8).toUpperCase();
    const folder=root.createFolder(id),state={id:id,protocol:protocol,tokenHash:digest_(token),createdAt:Date.now(),company:request.company,files:{},status:'incomplete',emailStatus:'not_sent'};save_(folder,state);
    return response_({ok:true,sessionId:id,token:token,protocol:protocol});
   }
   const loaded=load_(root,request.sessionId,request.token),folder=loaded.folder,state=loaded.state;
   if(request.action==='upload'){
    if(state.status==='received')throw Error('ALREADY_FINISHED');const file=request.file;
    if(!file||!c.documents.some(d=>d.id===file.kind)||typeof file.base64!=='string'||file.base64.length>2796204||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64))throw Error('INVALID_FILE');
    const bytes=Utilities.base64Decode(file.base64);if(!bytes.length||bytes.length>FILE_LIMIT_)throw Error('INVALID_FILE');
    const positive=b=>(b+256)%256;const ext=String(file.name).toLowerCase().split('.').pop();
    const pdf=ext==='pdf'&&bytes.slice(0,5).map(b=>String.fromCharCode(positive(b))).join('')==='%PDF-';
    const png=ext==='png'&&bytes.slice(0,8).map(positive).join(',')==='137,80,78,71,13,10,26,10';
    const jpeg=['jpg','jpeg'].indexOf(ext)>=0&&bytes.slice(0,3).map(positive).join(',')==='255,216,255';
    if(!(pdf||png||jpeg))throw Error('INVALID_FILE');const hash=digest_(file.base64);
    if(state.files[file.kind]){if(state.files[file.kind].hash!==hash)throw Error('FILE_ALREADY_EXISTS');return response_({ok:true,kind:file.kind})}
    const name=file.kind+'.'+ext;const saved=folder.createFile(Utilities.newBlob(bytes,pdf?'application/pdf':png?'image/png':'image/jpeg',name));state.files[file.kind]={id:saved.getId(),name:name,bytes:bytes.length,hash:hash};save_(folder,state);return response_({ok:true,kind:file.kind});
   }
   if(request.action==='finish'){
    if(c.documents.some(d=>d.required&&!state.files[d.id]))return response_({ok:false,code:'MISSING_DOCUMENTS'});
    if(state.emailStatus==='sent')return response_({ok:true,protocol:state.protocol,emailSent:true});
    if(state.emailStatus==='sending')return response_({ok:true,protocol:state.protocol,emailSent:false});
    if(MailApp.getRemainingDailyQuota()<1)return response_({ok:false,code:'EMAIL_QUOTA'});
    state.status='received';state.emailStatus='sending';save_(folder,state);
    const company=state.company;const body=['Novo cadastro de imobiliária — Equipe Ferrari','Protocolo: '+state.protocol,'Recebido em: '+Utilities.formatDate(new Date(),'America/Sao_Paulo','dd/MM/yyyy HH:mm'),'','Razão social: '+company.razaoSocial,'Nome fantasia: '+company.nomeFantasia,'CNPJ: '+company.cnpj,'CRECI PJ: '+company.creci,'Responsável: '+company.responsavel,'Cargo: '+company.cargo,'E-mail: '+company.email,'WhatsApp: '+company.whatsapp,'Cidade/UF: '+company.cidade,'Site: '+company.site,'','Documentos recebidos: '+Object.keys(state.files).join(', '),'Pasta privada: '+folder.getUrl(),'','Este recebimento não constitui aprovação automática de parceria.'].join('\n');
    try{MailApp.sendEmail({to:c.email,subject:'[Ferrari] Cadastro de imobiliária — '+state.protocol,body:body,name:'Equipe Ferrari',replyTo:company.email,attachments:Object.keys(state.files).map(kind=>DriveApp.getFileById(state.files[kind].id).getBlob())});state.emailStatus='sent';state.receivedAt=Date.now();save_(folder,state)}catch(error){state.emailStatus='failed';save_(folder,state);throw Error('EMAIL_FAILED')}
    return response_({ok:true,protocol:state.protocol,emailSent:true});
   }
   throw Error('INVALID_ACTION');
  }finally{lock.releaseLock()}
 }catch(error){return response_({ok:false,code:/^[A-Z_]+$/.test(error.message)?error.message:'SERVER_ERROR'})}
}
