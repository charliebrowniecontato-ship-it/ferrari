import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createPartnershipHandler,validateFile,validateCompany,MAX_FILE_BYTES } from '../lib/partnership.mjs';
const secret='test-only-secret-not-for-production-123456';
const env={FERRARI_REGISTRATION_URL:'https://script.google.com/macros/s/test-exec/exec',FERRARI_REGISTRATION_SECRET:secret};
const now=1793380000000;
const company={razaoSocial:'Empresa de Teste',nomeFantasia:'Teste',cnpj:'00.000.000/0001-00',creci:'PJ TESTE',responsavel:'Responsável de teste',cargo:'Contato',email:'teste@example.invalid',whatsapp:'11999999999',cidade:'São Paulo / SP',site:'',consent:true};
const request=payload=>new Request('https://ferrariassessoria.com/api/parcerias',{method:'POST',headers:{origin:'https://ferrariassessoria.com','content-type':'application/json'},body:JSON.stringify(payload)});
test('disabled configuration rejects POST without accepting documents',async()=>{
 const handler=createPartnershipHandler({env:{},fetcher:()=>assert.fail('Must not call upstream')});
 const get=await handler(new Request('https://ferrariassessoria.com/api/parcerias'));assert.equal((await get.json()).enabled,false);
 const post=await handler(request({action:'start',company}));assert.equal(post.status,503);
});
test('active endpoint requires a same-site Origin before processing',async()=>{
 const handler=createPartnershipHandler({env,fetcher:()=>assert.fail('Must not call upstream')});
 const req=new Request('https://ferrariassessoria.com/api/parcerias',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'});assert.equal((await handler(req)).status,403);
});
test('file type, bytes and size are validated independently of the declared MIME',()=>{
 const pdf=Buffer.from('%PDF-1.7\nfixture');assert.equal(validateFile({kind:'cnpj',name:'documento.pdf',base64:pdf.toString('base64'),mime:'text/html'}).mime,'application/pdf');
 assert.throws(()=>validateFile({kind:'cnpj',name:'documento.pdf',base64:Buffer.from('<script>alert(1)</script>').toString('base64')}));
 assert.throws(()=>validateFile({kind:'cnpj',name:'documento.pdf',base64:Buffer.alloc(MAX_FILE_BYTES+1).toString('base64')}));
 assert.throws(()=>validateFile({kind:'arbitrary',name:'documento.pdf',base64:pdf.toString('base64')}));
});
test('company requires consent and contact information; accepts alphanumeric CNPJ syntax',()=>{
 assert.equal(validateCompany({...company,cnpj:'ABC12345678900'}).cnpj,'ABC12345678900');assert.throws(()=>validateCompany({...company,consent:false}));assert.throws(()=>validateCompany({...company,email:'invalid'}));
});
test('configuration response exposes only public document rules',async()=>{
 const handler=createPartnershipHandler({env,now:()=>now,fetcher:async()=>new Response(JSON.stringify({ok:true,enabled:true,documents:[{id:'cnpj',label:'CNPJ',required:true}],notifyEmail:'private@example.invalid'}))});
 const result=await (await handler(new Request('https://ferrariassessoria.com/api/parcerias'))).json();assert.equal(result.enabled,true);assert.equal(result.notifyEmail,undefined);assert.equal(result.secret,undefined);
});
test('signed start, per-file upload and finish preserve protocol and notification status',async()=>{
 const received=[];const handler=createPartnershipHandler({env,now:()=>now,fetcher:async(url,options)=>{
  const envelope=JSON.parse(options.body);assert.equal(envelope.signature,createHmac('sha256',secret).update(envelope.body).digest('hex'));
  const payload=JSON.parse(envelope.body);received.push(payload);
  return new Response(JSON.stringify(payload.action==='start'?{ok:true,sessionId:'11111111-1111-1111-1111-111111111111',token:'test-token-111111111111111111111111111111111111',protocol:'FERRARI-TEST'}:payload.action==='upload'?{ok:true,kind:'cnpj'}:{ok:true,protocol:'FERRARI-TEST',emailSent:true}));
 }});
 const start=await (await handler(request({action:'start',company,startedAt:now-5000}))).json();assert.equal(start.ok,true);
 const upload=await (await handler(request({action:'upload',sessionId:start.sessionId,token:start.token,file:{kind:'cnpj',name:'cnpj.pdf',base64:Buffer.from('%PDF-1.7\nfixture').toString('base64')}}))).json();assert.equal(upload.ok,true);
 const finish=await (await handler(request({action:'finish',sessionId:start.sessionId,token:start.token}))).json();assert.equal(finish.protocol,'FERRARI-TEST');assert.equal(finish.emailSent,true);assert.equal(received.length,3);
});
test('upstream failure cannot be reported as a successful submission',async()=>{
 const handler=createPartnershipHandler({env,now:()=>now,fetcher:async()=>new Response('not a valid receipt')});
 const response=await handler(request({action:'start',company,startedAt:now-5000}));assert.equal(response.status,502);assert.equal((await response.json()).ok,false);
});
test('oversized streaming body is rejected even without Content-Length',async()=>{
 const handler=createPartnershipHandler({env,fetcher:()=>assert.fail('Must not relay oversize')});
 const req=new Request('https://ferrariassessoria.com/api/parcerias',{method:'POST',headers:{origin:'https://ferrariassessoria.com','content-type':'application/json'},body:'x'.repeat(3000001)});assert.equal((await handler(req)).status,413);
});
