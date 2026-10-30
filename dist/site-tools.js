'use strict';
window.FerrariUI?.init({page:true});
const planningForm=document.getElementById('planning-form');
if(planningForm){
 let step=0;
 const fields=[...planningForm.querySelectorAll('[data-form-step]')];
 const propertySelect=document.getElementById('empreendimento');
 const query=new URLSearchParams(location.search);
 const selectKnown=(element,value)=>{if([...element.options].some(option=>option.value===value))element.value=value};
 selectKnown(propertySelect,query.get('imovel'));
 const regionValues={sul:'Zona Sul',leste:'Zona Leste',oeste:'Zona Oeste',norte:'Zona Norte',jundiai:'Jundiaí'};
 if(regionValues[query.get('regiao')])selectKnown(document.getElementById('regiao'),regionValues[query.get('regiao')]);
 if(['1','2','3'].includes(query.get('dormitorios')))selectKnown(document.getElementById('dormitorios'),query.get('dormitorios')+' dormitório'+(query.get('dormitorios')==='1'?'':'s'));
 const updateSummary=()=>{
  const data=new FormData(planningForm);
  const lines=['Olá, Ferrari! Quero conversar sobre meu próximo imóvel.',''];
  if(data.get('empreendimento'))lines.push('Empreendimento: '+propertySelect.selectedOptions[0].textContent);
  for(const [key,label] of [['regiao','Região'],['dormitorios','Dormitórios'],['objetivo','Objetivo'],['momento','Momento de compra'],['pagamento','Pagamento']])lines.push(label+': '+data.get(key));
  if(data.get('renda')!=='Prefiro conversar no atendimento')lines.push('Renda familiar mensal aproximada: '+data.get('renda'));
  if(!['Ainda estou planejando','Prefiro conversar no atendimento'].includes(data.get('entrada')))lines.push('Entrada planejada: '+data.get('entrada'));
  if(data.get('empreendimento'))lines.push('Página do imóvel: https://ferrariassessoria.com/imoveis/'+data.get('empreendimento')+'/');
  lines.push('','Podem me orientar sobre disponibilidade e próximos passos?');
  const message=lines.join('\n');
  document.getElementById('planning-summary').textContent=message;
  document.getElementById('planning-send').href='https://wa.me/5511932362552?text='+encodeURIComponent(message);
 };
 const showStep=()=>{
  fields.forEach((field,index)=>field.hidden=index!==step);
  planningForm.querySelectorAll('[data-step-indicator]').forEach((item,index)=>{if(index===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current')});
  if(step===2)updateSummary();
  const legend=fields[step].querySelector('legend');legend.tabIndex=-1;legend.focus({preventScroll:true});
  fields[step].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 };
 planningForm.addEventListener('submit',event=>event.preventDefault());
 planningForm.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName!=='A'&&event.target.tagName!=='BUTTON')event.preventDefault()});
 planningForm.addEventListener('click',event=>{if(event.target.closest('[data-form-next]')){step=Math.min(2,step+1);showStep()}if(event.target.closest('[data-form-back]')){step=Math.max(0,step-1);showStep()}});
}
const materialSearch=document.getElementById('material-search');
if(materialSearch){
 const region=document.getElementById('material-region');const cards=[...document.querySelectorAll('[data-material-name]')];
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filter=()=>{const q=normalize(materialSearch.value.trim());let count=0;cards.forEach(card=>{const matches=normalize(card.dataset.materialName).includes(q)&&(region.value==='all'||card.dataset.materialRegion===region.value);card.hidden=!matches;if(matches)count++});document.getElementById('material-count').textContent=count+' empreendimento'+(count===1?'':'s');document.getElementById('material-empty').hidden=count!==0};
 materialSearch.addEventListener('input',filter);region.addEventListener('change',filter);
 let timer;const notify=message=>{const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),3000)};
 document.addEventListener('click',event=>{const button=event.target.closest('[data-copy-property]');if(button)window.FerrariUI.share(button.dataset.title,'https://ferrariassessoria.com/imoveis/'+button.dataset.copyProperty+'/',button,notify)});
}
