(() => {
 const originalFetch=window.fetch.bind(window);
 window.fetch=(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:input,location.href);
  const method=(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  if(!['GET','HEAD'].includes(method)||url.pathname.startsWith('/team-review/api/')||url.pathname.startsWith('/api/')){
   return Promise.resolve(new Response(JSON.stringify({error:'This team preview is read-only.'}),{status:503,headers:{'content-type':'application/json'}}));
  }
  return originalFetch(input,options);
 };
 function limit(form){
  if(!form.closest('.review-local-form') && (form.querySelector('input[type=email],input[type=password],input[type=file],textarea')||form.matches('[method=post i]'))){
   for(const el of form.querySelectorAll('input,button,select,textarea')) el.disabled=true;
   form.title='Browsing preview. Personal information is not collected.';
  }
 }
 addEventListener('submit',e=>{if(e.target.matches('form')&&(e.target.method.toLowerCase()==='post'||e.target.querySelector('input[type=email],input[type=password],textarea'))){e.preventDefault();e.stopImmediatePropagation();}},true);
 addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('form').forEach(limit);new MutationObserver(changes=>{for(const ch of changes)for(const n of ch.addedNodes){if(n.nodeType!==1)continue;if(n.matches('form'))limit(n);n.querySelectorAll('form').forEach(limit);}}).observe(document.body,{childList:true,subtree:true});});
})();