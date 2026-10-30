import { createHmac, randomUUID } from 'node:crypto';
export const MAX_FILE_BYTES=2*1024*1024;
export const DOCUMENT_TYPES=[
 {id:'cnpj',label:'Cartão CNPJ',required:false},
 {id:'contrato',label:'Contrato social ou documento equivalente',required:false},
 {id:'creci',label:'Comprovante de CRECI da imobiliária',required:false},
 {id:'complemento',label:'Documentação complementar solicitada pela equipe',required:false}
];
const canonical='https://ferrariassessoria.com';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const clean=(v,max=150)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validateCompany(value){
 if(!value||typeof value!=='object')throw Error('INVALID_COMPANY');
 const data=Object.fromEntries(['razaoSocial','nomeFantasia','cnpj','creci','responsavel','cargo','email','whatsapp','cidade','site'].map(k=>[k,clean(value[k],k==='email'?200:150)]));
 data.cnpj=data.cnpj.toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(data.razaoSocial.length<3||data.responsavel.length<3||!/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email)||!/^([A-Z0-9]{12})(\d{2})$/.test(data.cnpj)||!/^\d{10,13}$/.test(data.whatsapp.replace(/\D/g,''))||!data.creci||!data.cidade||value.consent!==true)throw Error('INVALID_COMPANY');
 return {...data,consent:true,noticeVersion:'2026-10-30'};
}
export function validateFile(value){
 const kind=clean(value?.kind,30),name=clean(value?.name,160),base64=value?.base64;
 if(!DOCUMENT_TYPES.some(d=>d.id===kind)||!name||typeof base64!=='string'||base64.length>4*Math.ceil(MAX_FILE_BYTES/3)||base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw Error('INVALID_FILE');
 const data=Buffer.from(base64,'base64');
 if(!data.length||data.length>MAX_FILE_BYTES||data.toString('base64')!==base64)throw Error('INVALID_FILE');
 const ext=name.toLowerCase().split('.').at(-1);
 const mime=ext==='pdf'&&data.subarray(0,5).toString()==='%PDF-'?'application/pdf':ext==='png'&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':['jpg','jpeg'].includes(ext)&&data[0]===255&&data[1]===216&&data[2]===255?'image/jpeg':null;
 if(!mime)throw Error('INVALID_FILE');
 return {kind,name:name.replace(/[\\/\r\n]/g,'_'),mime,base64,size:data.length};
}
function connection(env){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.FERRARI_REGISTRATION_URL||'')&&(env.FERRARI_REGISTRATION_SECRET||'').length>=32}
export function createPartnershipHandler({env=process.env,fetcher=fetch,now=()=>Date.now()}={}){
 const relay=async(payload)=>{
  const issued=now();const body=JSON.stringify({...payload,issued});const signature=createHmac('sha256',env.FERRARI_REGISTRATION_SECRET).update(body).digest('hex');
  const response=await fetcher(env.FERRARI_REGISTRATION_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body,signature}),signal:AbortSignal.timeout(25000),redirect:'follow'});
  if(!response.ok)throw Error('UPSTREAM');const raw=await response.text();if(raw.length>30000)throw Error('UPSTREAM');
  let result;try{result=JSON.parse(raw)}catch{throw Error('UPSTREAM')}if(typeof result?.ok!=='boolean')throw Error('UPSTREAM');return result;
 };
 return async function handle(request){
  if(!['GET','POST'].includes(request.method))return reply({ok:false,message:'Método não permitido.'},405);
  if(!connection(env))return reply({ok:false,enabled:false,documents:DOCUMENT_TYPES,maxFileBytes:MAX_FILE_BYTES,message:'O cadastro está em preparação. O envio de documentos ainda não foi ativado.'},request.method==='GET'?200:503);
  if(request.method==='GET'){
   try{const status=await relay({action:'status'});return reply({ok:status.ok,enabled:status.enabled===true,documents:status.documents||DOCUMENT_TYPES,maxFileBytes:MAX_FILE_BYTES,message:status.enabled?'':'O envio de documentos ainda não está disponível.'})}catch{return reply({ok:false,enabled:false,message:'O envio está temporariamente indisponível.'},503)}
  }
  const origin=request.headers.get('origin');const allowed=new Set([canonical,'https://www.ferrariassessoria.com',...(env.VERCEL_URL?['https://'+env.VERCEL_URL]:[])]);
  if(!origin||!allowed.has(origin))return reply({ok:false,message:'Origem não permitida.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({ok:false,message:'Formato não permitido.'},415);
  try{
   if(Number(request.headers.get('content-length')||0)>3000000)return reply({ok:false,message:'Arquivo acima do limite.'},413);
   const reader=request.body?.getReader();if(!reader)return reply({ok:false,message:'Requisição inválida.'},400);
   let bytes=0,chunks=[];while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.byteLength;if(bytes>3000000){await reader.cancel();return reply({ok:false,message:'Arquivo acima do limite.'},413)}chunks.push(Buffer.from(item.value))}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(input.website)return reply({ok:false,message:'Não foi possível processar o cadastro.'},400);
   let payload;
   if(input.action==='start'){
    if(typeof input.startedAt!=='number'||now()-input.startedAt<2000||now()-input.startedAt>2*60*60*1000)return reply({ok:false,message:'Atualize a página e revise seu cadastro.'},400);
    const ip=request.headers.get('x-vercel-forwarded-for')||'unavailable';
    payload={action:'start',company:validateCompany(input.company),clientKey:createHmac('sha256',env.FERRARI_REGISTRATION_SECRET).update(ip).digest('hex'),requestId:randomUUID()};
   }else if(['upload','finish'].includes(input.action)){
    if(!/^[0-9a-f-]{36}$/.test(input.sessionId||'')||!/^[A-Za-z0-9-]{36,80}$/.test(input.token||''))throw Error('INVALID_SESSION');
    payload={action:input.action,sessionId:input.sessionId,token:input.token};
    if(input.action==='upload')payload.file=validateFile(input.file);
   }else throw Error('INVALID_ACTION');
   const result=await relay(payload);
   if(!result.ok)return reply({ok:false,message:result.code==='RATE_LIMIT'?'Muitas tentativas. Aguarde e tente novamente.':result.code==='MISSING_DOCUMENTS'?'Revise os documentos obrigatórios.':'Não foi possível concluir esta etapa. Seus arquivos não foram enviados por e-mail.',code:result.code},result.code==='RATE_LIMIT'?429:400);
   if(input.action==='start')return reply({ok:true,sessionId:result.sessionId,token:result.token,protocol:result.protocol});
   if(input.action==='upload')return reply({ok:true,kind:result.kind});
   return reply({ok:true,protocol:result.protocol,emailSent:result.emailSent===true});
  }catch(error){
   if(String(error.message).startsWith('INVALID_')||error instanceof SyntaxError)return reply({ok:false,message:'Confira os campos, o tipo e o tamanho dos arquivos.'},400);
   console.error('partnership_request_failed',{code:error.name==='TimeoutError'?'TIMEOUT':'UPSTREAM'});
   return reply({ok:false,message:'Não foi possível confirmar esta etapa. Tente novamente; a tela só indicará conclusão após a confirmação do servidor.'},502);
  }
 };
}
