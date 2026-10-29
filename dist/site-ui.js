'use strict';
window.FerrariUI=(()=>{const paths={
'chevron-down':'<path d="m6 9 6 6 6-6"/>','arrow-up':'<path d="M12 20V4m-6 6 6-6 6 6"/>','share':'<path d="M12 16V3m-5 5 5-5 5 5M5 13H3v8h18v-8h-2"/>','arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>','arrow-left':'<path d="M20 12H4m6-6-6 6 6 6"/>','arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>','arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
'pin':'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
'heart':'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
'whatsapp':'<path d="m3 21 1.5-5.3A9 9 0 1 1 8 20l-5 1Z"/><path d="M8.2 7.5c.8 4.3 3.7 7.2 8 8l1-2.2-2.8-1.5-1.2 1.2c-1.8-.8-3.4-2.3-4.2-4.1l1.2-1.2-1.4-2.3-1.1.1c-.8 0-.7 1.6-.5 2Z"/>',
'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>','search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>','home':'<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
'key':'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-4-4 3-3m-6 0 3-3"/>','check':'<path d="m5 12 4 4L20 5"/>','message':'<path d="M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z"/><path d="M7 7h10M7 12h6"/>',
'plus':'<path d="M12 4v16M4 12h16"/>','x':'<path d="m6 6 12 12M18 6 6 18"/>','area':'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M7 12h10m-7-3-3 3 3 3m4-6 3 3-3 3"/>','bed':'<path d="M3 18V6m18 12V9M3 15h18M3 9h6v6m0-6h9a3 3 0 0 1 3 3v3M3 18v3m18-3v3"/>',
'compare':'<path d="M8 3v18M16 3v18M4 7h8M12 17h8"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="16" cy="17" r="2" fill="currentColor"/>','image':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-6-6L3 21"/>','play':'<path d="m9 5 11 7-11 7V5Z"/>','file':'<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v6h5M8 12h8M8 16h8"/>'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths['arrow-right']}</svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon))}
function imageAttributes(property,sizes='(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw'){
 const set=(property.responsive||[]).map(image=>`/${image.src} ${image.width}w`).join(', ');
 return set?`srcset="${set}" sizes="${sizes}" decoding="async"`:'decoding="async"';
}
function initMotion(){
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(preference.matches||!('IntersectionObserver'in window)||!Element.prototype.animate)return;
 const running=new Set();
 const play=element=>{
  if(preference.matches)return;
  const lines=element.querySelectorAll('.motion-line-inner');
  const targets=lines.length?[...lines]:[element];
  targets.forEach((line,index)=>{
   const animation=line.animate([
    {opacity:.25,transform:'translate3d(-22px, 18px, 0)'},
    {opacity:1,transform:'translate3d(0, 0, 0)'}
   ],{duration:720,delay:index*95,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
   running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));
  });
 };
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){play(entry.target);observer.unobserve(entry.target)}
 }),{threshold:0,rootMargin:'0px 0px 45px 0px'});
 document.querySelectorAll('[data-text-motion],.about-visual,.lifestyle-card,.journey-grid article,.match-preview').forEach(el=>{
  if(!el.closest('dialog'))observer.observe(el);
 });
 preference.addEventListener('change',event=>{if(event.matches){observer.disconnect();running.forEach(animation=>animation.cancel());running.clear()}});
}
function init({page=false}={}){if(document.documentElement.dataset.ferrariUiReady)return;document.documentElement.dataset.ferrariUiReady='true';icons();const menu=document.getElementById('property-menu'),nav=document.getElementById('main-nav'),toggle=document.getElementById('menu-btn');
if(toggle)toggle.addEventListener('click',event=>{event.stopPropagation();const opened=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',!opened);toggle.setAttribute('aria-label',opened?'Abrir menu':'Fechar menu');nav.classList.toggle('open',!opened)});
document.addEventListener('click',e=>{if(menu?.open&&!menu.contains(e.target))menu.open=false;if(nav?.classList.contains('open')&&!nav.contains(e.target)&&!toggle.contains(e.target)){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menu?.open){menu.open=false;menu.querySelector('summary').focus()}if(nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');toggle.focus()}}});
const onScroll=()=>{document.body.classList.toggle('has-scrolled',scrollY>240);if(!page){for(const id of ['imoveis','seu-jeito','sobre']){const section=document.getElementById(id),rect=section?.getBoundingClientRect();const active=rect&&rect.top<180&&rect.bottom>180;const link=id==='imoveis'?menu?.querySelector('summary'):nav?.querySelector(`a[href="#${id}"]`);link?.classList.toggle('is-current',!!active)}}};let scrollPending=false;window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{onScroll();scrollPending=false})},{passive:true});onScroll();initMotion();
const signature=document.querySelector('.legacy');if(signature&&'IntersectionObserver'in window){const footerObserver=new IntersectionObserver(entries=>document.body.classList.toggle('at-signature',entries[0].isIntersecting),{threshold:0});footerObserver.observe(signature)}
document.querySelectorAll('dialog').forEach(d=>{let lastFocus;d.addEventListener('beforetoggle',e=>{if(e.newState==='open')lastFocus=document.activeElement});d.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true})})});
}
async function share(title,url,button,notify){try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);notify?.('Link do imóvel copiado.');return}}catch(e){if(e.name==='AbortError')return}let field=button.parentElement.querySelector('.share-copy-field');if(!field){field=document.createElement('input');field.className='share-copy-field';field.readOnly=true;field.setAttribute('aria-label','Link para compartilhar o imóvel');button.parentElement.appendChild(field)}field.value=url;field.focus();field.select();notify?.('Copie o link selecionado para compartilhar.');}
return{icon,icons,init,share,imageAttributes};})();
