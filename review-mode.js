(() => {
 const originalFetch=window.fetch.bind(window);
 const reservationApi='https://woafypet-senior-care-review.woafmeow.chatgpt.site/api/updates';
 function isBedSignup(form){
  return form.id==='hero-updates' && form.action===reservationApi && form.elements.purpose?.value==='reservation';
 }
 window.fetch=(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:input,location.href);
  const method=(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  const form=document.getElementById('hero-updates');
  if(method==='POST' && url.href===reservationApi && form && isBedSignup(form) && form.checkValidity()){
   let payload; try {payload=JSON.parse(options.body)} catch {}
   if(payload?.purpose==='reservation' && payload.name===form.elements.name.value.trim() && payload.email===form.elements.email.value.trim() && payload.consent===true && form.elements.consent.checked){
    const fallback=form.querySelector('[data-reservation-fallback]');
    fallback.hidden=true;
    return originalFetch(reservationApi,{...options,credentials:'omit',signal:AbortSignal.timeout(20000)}).then(async response=>{
     if (!response.ok || (await response.clone().json()).saved!==true) fallback.hidden=false;
     return response;
    }).catch(error=>{fallback.hidden=false; throw error});
   }
  }
  if(!['GET','HEAD'].includes(method)||url.pathname.startsWith('/team-review/api/')||url.pathname.startsWith('/api/')){
   return Promise.resolve(new Response(JSON.stringify({error:'This team preview is read-only.'}),{status:503,headers:{'content-type':'application/json'}}));
  }
  return originalFetch(input,options);
 };
 function limit(form){
  if(!isBedSignup(form) && !form.closest('.review-local-form') && (form.querySelector('input[type=email],input[type=password],input[type=file],textarea')||form.matches('[method=post i]'))){
   for(const el of form.querySelectorAll('input,button,select,textarea')) el.disabled=true;
   form.title='Browsing preview. Personal information is not collected.';
  }
 }
 addEventListener('submit',e=>{if(e.target.matches('form')&&!isBedSignup(e.target)&&(e.target.method.toLowerCase()==='post'||e.target.querySelector('input[type=email],input[type=password],textarea'))){e.preventDefault();e.stopImmediatePropagation();}},true);
 addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('form').forEach(limit);new MutationObserver(changes=>{for(const ch of changes)for(const n of ch.addedNodes){if(n.nodeType!==1)continue;if(n.matches('form'))limit(n);n.querySelectorAll('form').forEach(limit);}}).observe(document.body,{childList:true,subtree:true});});
})();