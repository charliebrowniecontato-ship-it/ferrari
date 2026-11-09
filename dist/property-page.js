'use strict';
window.FerrariUI?.init({page:true});
const inventorySection=document.querySelector('[data-inventory-property]');
if(inventorySection){
 const inventoryUI=window.FerrariInventory;
 const content=inventorySection.querySelector('[data-inventory-content]');
 inventoryUI.load().then(inventory=>{
  const entry=inventory[inventorySection.dataset.inventoryProperty];
  content.innerHTML=inventoryUI.optionsHTML(entry);
  if(entry?.delivery){
   const delivered=entry.delivery==='Entregue';
   document.querySelector('[data-delivery-label]').textContent=delivered?'Fase':'Previsão informada';
   document.querySelector('[data-delivery-value]').textContent=entry.delivery;
   if(delivered)document.querySelector('.detail-status').textContent='Pronto para morar';
  }
  const related=document.querySelector('.related-section');
  const cards=[...related.querySelectorAll('[data-project-id]')];
  cards.forEach(card=>card.hidden=!Object.hasOwn(inventory,card.dataset.projectId));
  related.hidden=cards.every(card=>card.hidden);
 }).catch(()=>{content.textContent=inventoryUI.unavailable});
}
const photoButton=document.getElementById('page-photo-toggle');
const mainPhotoSrcset=document.getElementById('page-photo')?.getAttribute('srcset')||'';
photoButton?.addEventListener('click',()=>{const active=photoButton.getAttribute('aria-pressed')==='true';const photo=document.getElementById('page-photo');photo.srcset=active?mainPhotoSrcset:'';photo.src=active?photoButton.dataset.main:photoButton.dataset.facade;photoButton.setAttribute('aria-pressed',!active);photoButton.innerHTML=window.FerrariUI.icon('image')+(active?' Ver fachada':' Ver perspectiva')});
const shareButton=document.getElementById('page-share');
let toastTimer;
const notify=text=>{const t=document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000)};
shareButton?.addEventListener('click',()=>window.FerrariUI.share(shareButton.dataset.title,document.querySelector('link[rel=canonical]').href,shareButton,notify));
