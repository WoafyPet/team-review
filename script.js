const retriedImages=new WeakSet();
const retryImage=image=>{
 if(!(image instanceof HTMLImageElement)||retriedImages.has(image)||!image.getAttribute('src'))return;
 const url=new URL(image.src,location.href);if(url.origin!==location.origin)return;
 retriedImages.add(image);url.searchParams.set('retry','1');image.src=url.href;
};
document.addEventListener('error',event=>retryImage(event.target),true);
document.querySelectorAll('img').forEach(image=>{if(image.complete&&!image.naturalWidth)retryImage(image)});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#site-nav');
document.querySelectorAll('main p,main li').forEach(node=>{if(node.textContent.trim().length>180&&!node.closest('.product-card,.consent'))node.classList.add('long-copy')});
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('open',open)});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu')}));
const filters=[...document.querySelectorAll('[data-filter]')],products=[...document.querySelectorAll('.collection-main .product-card')];
filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));products.forEach(p=>p.hidden=button.dataset.filter!=='all'&&p.dataset.category!==button.dataset.filter);const count=document.querySelector('#product-count');if(count){const n=products.filter(p=>!p.hidden).length;count.textContent=n+' product'+(n===1?'':'s')}}));
const sort=document.querySelector('#product-sort');sort?.addEventListener('change',()=>{const order=sort.value==='featured'?[...products]:[...products].sort((a,b)=>(Number(a.dataset.price)-Number(b.dataset.price))*(sort.value==='low'?1:-1));order.forEach(p=>p.parentElement.append(p))});
const need=new URLSearchParams(location.search).get('need');if(need)filters.find(b=>b.dataset.filter===need)?.click();
document.querySelectorAll('[data-gallery-src]').forEach(button=>button.addEventListener('click',()=>{const img=document.querySelector('.pdp-main-image img');img.src=button.dataset.gallerySrc;img.alt=button.querySelector('img').alt;document.querySelectorAll('[data-gallery-src]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
document.querySelector('.print-guide')?.addEventListener('click',()=>print());
const reservationPage = document.querySelector('.reserve-info');
if (reservationPage && new URLSearchParams(location.search).get('product') === 'smart-base') {
 const form = reservationPage.querySelector('form');
 document.title = 'Explore the WoafyPet Smart Base';
 reservationPage.querySelector('h1').textContent = 'Explore the Smart Base.';
 reservationPage.querySelector('.reserve-offer').hidden = false;
 form.elements.purpose.value = 'smart-base';
 form.querySelector('button').textContent = 'Show me the Smart Base';
 form.querySelector('.consent span').prepend('Email me WoafyPet care and product updates. ');
 const photo = document.querySelector('.reserve-layout figure img');
 photo.src = '/team-review/assets/smart-base-pitch-deck-compatible.png';
 photo.alt = 'The WoafyPet Smart Base under four styles of dog bed';
}
document.querySelectorAll('.updates-form').forEach(form=>form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]'),status=form.querySelector('.form-status'),purpose=form.elements.purpose?.value||'updates';
 const guide=form.querySelector('.guide-success')||form.parentElement.querySelector('.guide-success');
 if(guide)guide.hidden=true;
 button.disabled=true;status.textContent=purpose==='guide'?'Preparing your free guide…':'Saving your place…';
 try{
  const response=await fetch(form.action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:form.elements.email.value.trim(),consent:form.elements.consent.checked,purpose,...(form.elements.name?{name:form.elements.name.value.trim()}:{})})});
  const result=await response.json();if(!response.ok||result.saved!==true)throw new Error(result.error||'We could not save your request. Please try again.');
  switch(purpose){
   case 'reservation':status.textContent='Details saved. Opening your $3 deposit checkout…';location.assign(result.checkoutUrl);return;
   case 'smart-base':{
    const details=reservationPage.querySelector('.base-information');
    form.hidden=true;
    reservationPage.querySelector('.reserve-offer').textContent='Your details are saved.';
    details.hidden=false;
    details.focus();
    break;
   }
   case 'guide':if(guide)guide.hidden=false;status.textContent='Your free guide is ready below.';break;
   default:status.textContent='You’re in. Thank you for caring with us.';
  }
  form.reset();
 }catch(error){status.textContent=error.message||'We could not save your request. Please try again.'}finally{button.disabled=false}
}));
