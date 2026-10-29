'use strict';
window.FerrariUI?.init({page:true});
const photoButton=document.getElementById('page-photo-toggle');
photoButton?.addEventListener('click',()=>{const active=photoButton.getAttribute('aria-pressed')==='true';document.getElementById('page-photo').src=active?photoButton.dataset.main:photoButton.dataset.facade;photoButton.setAttribute('aria-pressed',!active);photoButton.innerHTML=window.FerrariUI.icon('image')+(active?' Ver fachada':' Ver perspectiva')});
const shareButton=document.getElementById('page-share');
let toastTimer;
const notify=text=>{const t=document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000)};
shareButton?.addEventListener('click',()=>window.FerrariUI.share(shareButton.dataset.title,document.querySelector('link[rel=canonical]').href,shareButton,notify));
