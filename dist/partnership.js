'use strict';
window.FerrariUI?.init({page:true});
const form=document.getElementById('partner-form'),fieldset=document.getElementById('partner-fields'),notice=document.getElementById('intake-status');
if(form){
 form.noValidate=true;
 const steps=[...form.querySelectorAll('[data-partner-step]')];
 const error=document.getElementById('partner-error'),progress=document.getElementById('partner-upload-progress');
 const startedAt=Date.now();let enabled=false,step=0,documents=[],session=null,uploaded=new Set(),busy=false,maxFileBytes=2097152;
 const showError=message=>{error.textContent=message;error.hidden=!message};
 const showStep=()=>{steps.forEach((section,index)=>section.hidden=index!==step);document.querySelectorAll('[data-partner-indicator]').forEach((item,index)=>{if(index===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current')});const title=steps[step].querySelector('h2');title.focus({preventScroll:true});steps[step].scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
 const validateStep=()=>{for(const input of steps[step].querySelectorAll('input,select')){if(!input.checkValidity()){input.reportValidity();return false}}return true};
 const review=()=>{
  const data=new FormData(form);const list=document.getElementById('partner-review');list.replaceChildren();
  for(const [key,label] of [['razaoSocial','Razão social'],['nomeFantasia','Nome fantasia'],['cnpj','CNPJ'],['creci','CRECI PJ'],['cidade','Cidade / UF'],['responsavel','Responsável'],['cargo','Cargo'],['email','E-mail'],['whatsapp','WhatsApp'],['site','Site / perfil']]){
   const value=String(data.get(key)||'').trim();if(!value)continue;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;list.append(dt,dd);
  }
  for(const doc of documents){const input=document.getElementById('document-'+doc.id);if(input?.files?.[0]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=doc.label;dd.textContent=input.files[0].name;list.append(dt,dd)}}
 };
 form.addEventListener('click',event=>{
  if(busy||!enabled)return;
  if(event.target.closest('[data-partner-next]')&&validateStep()){showError('');step=Math.min(3,step+1);if(step===3)review();showStep()}
  if(event.target.closest('[data-partner-back]')){showError('');step=Math.max(0,step-1);showStep()}
 });
 form.addEventListener('change',event=>{
  const input=event.target;if(!input.matches('[data-document]'))return;
  input.setCustomValidity('');const file=input.files?.[0];if(!file)return;
  if(!/\.(pdf|jpe?g|png)$/i.test(file.name)||file.size>maxFileBytes||!file.size)input.setCustomValidity('Envie PDF, JPG ou PNG de até 2 MB.');
  if(session){showError('Um envio já foi iniciado. Para trocar um documento enviado, atualize a página e inicie um novo cadastro.');input.setCustomValidity('Atualize a página para iniciar um novo cadastro com este documento.')}
  input.reportValidity();
 });
 async function api(payload){
  const response=await fetch('/api/parcerias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,website:form.elements.website.value})});
  let result;try{result=await response.json()}catch{throw Error('Não foi possível confirmar o recebimento. Tente novamente em alguns instantes.')}
  if(!response.ok||!result.ok)throw Error(result.message||'Não foi possível concluir esta etapa.');return result;
 }
 const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Não foi possível ler o arquivo. Selecione-o novamente.'));reader.readAsDataURL(file)});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!enabled||busy)return;
  if(step<3){if(validateStep()){step++;if(step===3)review();showStep()}return}
  if(!validateStep())return;
  busy=true;fieldset.disabled=true;showError('');progress.hidden=false;progress.textContent='Iniciando o envio do cadastro…';
  try{
   if(!session){
    // Disabled controls are omitted by FormData: read each known company control explicitly.
    const company=Object.fromEntries(['razaoSocial','nomeFantasia','cnpj','creci','cidade','site','responsavel','cargo','email','whatsapp'].map(key=>[key,form.elements[key].value.trim()]));company.consent=form.elements.consent.checked;
    session=await api({action:'start',company,startedAt});
   }
   for(const doc of documents){const input=document.getElementById('document-'+doc.id),file=input?.files?.[0];if(!file||uploaded.has(doc.id))continue;progress.textContent='Enviando: '+doc.label+'…';const base64=await readFile(file);await api({action:'upload',sessionId:session.sessionId,token:session.token,file:{kind:doc.id,name:file.name,base64}});uploaded.add(doc.id)}
   progress.textContent='Confirmando o recebimento…';const result=await api({action:'finish',sessionId:session.sessionId,token:session.token});
   document.getElementById('partner-protocol').textContent=result.protocol;
   document.getElementById('partner-success-message').textContent=result.emailSent?'O cadastro e a documentação foram recebidos. O aviso por e-mail foi enviado à Equipe Ferrari para análise.':'O cadastro foi recebido. O aviso por e-mail ainda aguarda confirmação; guarde seu protocolo e consulte a equipe.';
   form.hidden=true;notice.hidden=true;document.querySelector('.partner-preview').hidden=true;document.getElementById('partner-success').hidden=false;document.getElementById('partner-success').focus();
  }catch(problem){showError(problem.message);fieldset.disabled=false}
  finally{progress.hidden=true;busy=false}
 });
 fetch('/api/parcerias',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error();return response.json()}).then(config=>{
  if(!config.enabled)return;
  const allowed=new Set(['cnpj','contrato','creci','complemento']);documents=Array.isArray(config.documents)?config.documents.filter(doc=>allowed.has(doc.id)&&typeof doc.label==='string'&&typeof doc.required==='boolean'):[];
  if(!documents.length||new Set(documents.map(d=>d.id)).size!==documents.length)return;
  maxFileBytes=Math.min(2097152,Number(config.maxFileBytes)||2097152);
  const area=document.getElementById('partner-documents');area.replaceChildren();
  for(const doc of documents){const label=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input'),small=document.createElement('small');label.className='form-field document-field';label.htmlFor='document-'+doc.id;span.textContent=doc.label+(doc.required?' *':' · opcional');input.type='file';input.id='document-'+doc.id;input.dataset.document=doc.id;input.accept='.pdf,.jpg,.jpeg,.png';input.required=doc.required;small.textContent='PDF, JPG ou PNG · até 2 MB por arquivo';label.append(span,input,small);area.append(label)}
  notice.replaceChildren();const title=document.createElement('strong'),message=document.createElement('p');title.textContent='Cadastro disponível';message.textContent='Preencha os dados, revise os arquivos e conclua o envio. O protocolo será exibido após a confirmação do recebimento.';notice.append(title,message);notice.classList.add('is-ready');fieldset.disabled=false;enabled=true;
 }).catch(()=>{});
}
