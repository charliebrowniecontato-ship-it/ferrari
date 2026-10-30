import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
const code=fs.readFileSync(new URL('../integrations/google-apps-script/Code.gs',import.meta.url),'utf8');
function fixture(){
 const secret='test-secret-that-is-not-a-production-value-12345',records=new Map(),sent=[],cache=new Map();let isPrivate=true;
 const iterator=array=>{let i=0;return {hasNext:()=>i<array.length,next:()=>array[i++]}};
 const blob=(data,mime='text/plain',name='')=>({data,mime,name,getDataAsString:()=>typeof data==='string'?data:Buffer.from(data).toString()});
 const folder=(id)=>{const files=[],folders=[];return {id,getSharingAccess:()=>isPrivate?'PRIVATE':'PUBLIC',getUrl:()=>`https://drive.google.com/drive/folders/${id}`,getFilesByName:name=>iterator(files.filter(f=>f.name===name)),getFoldersByName:name=>iterator(folders.filter(f=>f.id===name)),createFolder:name=>{const child=folder(name);folders.push(child);return child},createFile:(value,contents,mime)=>{const file={id:randomUUID(),name:typeof value==='string'?value:value.name,data:typeof value==='string'?contents:value.data,getId(){return this.id},getBlob(){return blob(this.data,mime,this.name)},setContent(data){this.data=data;return this}};files.push(file);records.set(file.id,file);return file}}};
 const root=folder('root');
 const properties={INTAKE_SECRET:secret,ROOT_FOLDER_ID:'root',NOTIFY_EMAIL:'recipient@example.invalid',DOCUMENTS_CONFIRMED:'true',DOCUMENTS_JSON:JSON.stringify([{id:'cnpj',label:'Cartão CNPJ',required:true},{id:'complemento',label:'Complemento',required:false}])};
 const context=vm.createContext({ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this}})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,text)=>[...createHash('sha256').update(text).digest()],computeHmacSha256Signature:(text,key)=>[...createHmac('sha256',key).update(text).digest()],getUuid:randomUUID,formatDate:()=> '20261030',base64Decode:text=>[...Buffer.from(text,'base64')],newBlob:blob},PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]})},DriveApp:{Access:{PRIVATE:'PRIVATE'},getFolderById:id=>{assert.equal(id,'root');return root},getFileById:id=>records.get(id)},MimeType:{PLAIN_TEXT:'text/plain'},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},CacheService:{getScriptCache:()=>({get:key=>cache.get(key),put:(key,value)=>cache.set(key,value)})},MailApp:{getRemainingDailyQuota:()=>20,sendEmail:message=>sent.push(message)},console});
 vm.runInContext(code,context);
 const call=(payload,corrupt=false)=>{const body=JSON.stringify({...payload,issued:Date.now()}),signature=createHmac('sha256',secret).update(body).digest('hex');return JSON.parse(context.doPost({postData:{contents:JSON.stringify({body,signature:corrupt?'x'.repeat(64):signature})}}).text)};
 return {call,sent,root,setPublic:()=>isPrivate=false};
}
const company={razaoSocial:'Empresa fictícia',nomeFantasia:'Teste',cnpj:'00000000000100',creci:'Teste',responsavel:'Responsável fictício',cargo:'Contato',email:'sender@example.invalid',whatsapp:'11999999999',cidade:'São Paulo',site:'',consent:true};
test('private Drive configuration is mandatory before exposing an enabled status',()=>{const f=fixture();assert.equal(f.call({action:'status'}).enabled,true);f.setPublic();assert.equal(f.call({action:'status'}).code,'ROOT_NOT_PRIVATE')});
test('invalid signature cannot create a registration',()=>{const f=fixture();assert.equal(f.call({action:'start',company,clientKey:'test'},true).ok,false);assert.equal(f.sent.length,0)});
test('required documents prevent completion and email notification',()=>{const f=fixture(),s=f.call({action:'start',company,clientKey:'test'});assert.equal(f.call({action:'finish',sessionId:s.sessionId,token:s.token}).code,'MISSING_DOCUMENTS');assert.equal(f.sent.length,0)});
test('complete registration sends attachments once, preserving private storage',()=>{
 const f=fixture(),s=f.call({action:'start',company,clientKey:'test'}),auth={sessionId:s.sessionId,token:s.token};
 const uploaded=f.call({action:'upload',...auth,file:{kind:'cnpj',name:'cnpj.pdf',base64:Buffer.from('%PDF-1.7\nfixture').toString('base64')}});assert.equal(uploaded.ok,true);
 const finished=f.call({action:'finish',...auth});assert.equal(finished.emailSent,true);assert.equal(f.sent.length,1);assert.equal(f.sent[0].attachments.length,1);assert.equal(f.sent[0].to,'recipient@example.invalid');assert.equal(f.sent[0].replyTo,'sender@example.invalid');assert.ok(f.sent[0].body.includes('Pasta privada:'));
 assert.equal(f.call({action:'finish',...auth}).emailSent,true);assert.equal(f.sent.length,1);
});
