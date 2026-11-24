const send=(type,detail)=>document.dispatchEvent(new CustomEvent(type,{detail}));
const form=document.querySelector('[data-avatar-form]');
const avatarMenu=form.closest('details');
const controls=avatarMenu.closest('[data-companion-tools]');
const menu=controls.querySelector('[data-meet-menu]');
const breed=form.elements.breed;
const petButton=form.querySelector('[data-pet-companion]');
const join=menu.querySelector('[data-join-visitors]');
const status=menu.querySelector('[data-visitor-status]');
const greeting=menu.querySelector('[data-greeting]');
const partner=greeting.querySelector('select');
const offer=greeting.querySelector('[data-offer-hug]');
const invite=greeting.querySelector('[data-hug-invite]');
const mapStatus=document.querySelector('[data-map-status]');
const storage='woafypet-garden-avatar-v1';
let avatar;
function showBreeds(pet,value){
 for(const group of breed.querySelectorAll('optgroup')){
  group.hidden=group.disabled=group.dataset.species!==pet;
 }
 const choices=Array.from(breed.options).filter(o=>!o.parentElement.disabled);
 breed.value=choices.some(o=>o.value===value)?value:choices[0].value;
 form.querySelector('[data-fur-colors]').hidden=!breed.value.startsWith('mixed-');
}
let savedBreed;

try {
 const saved=JSON.parse(localStorage.getItem(storage) || '{}');
 for(const input of form.querySelectorAll('input'))if(saved?.[input.name]===input.value){input.checked=true}
 savedBreed=saved?.breed;
} catch {}
showBreeds(form.elements.pet.value,savedBreed);
avatar=Object.fromEntries(new FormData(form));
function breedName(v){
 return Array.from(breed.options).find(o=>o.value===v.breed)?.textContent||v.pet;
}
let position={x:0,z:3},token=null,timer=0,busy=false,pending=null;
let invited=null,lastInvite=null,lastHug=null;
const coats={'#58796e':'sage','#b96d63':'rose','#7188a7':'blue'};
function renderGreetings(data){
 const selected=partner.value;
 const options=data.visitors.map((v,i)=>new Option('Visitor '+(i+1)+' · '+(coats[v.coat]||'sage')+' coat & '+breedName(v),v.id));
 if(options.length!==partner.length||options.some((o,i)=>partner.options[i].value!==o.value||partner.options[i].text!==o.text)){
  partner.replaceChildren(...options);
  if(options.some(o=>o.value===selected))partner.value=selected;
 }
 greeting.hidden=!options.length;
 offer.disabled=Boolean(data.pendingHug);
 offer.textContent=data.pendingHug?'Hug offered':'Offer a hug';
 invited=data.invitations[0];
 invite.hidden=!invited;
 if(invited){
  const label=options.find(o=>o.value===invited.from)?.text;
  greeting.querySelector('[data-hug-message]').textContent=label+' offered you a hug.';
  if(lastInvite!==invited.id){
   avatarMenu.open=false;menu.open=true;lastInvite=invited.id;mapStatus.textContent='A visitor offered a hug. Accept or pass in Meet other owners.';
  }
 }
 if(data.hug && data.hug.id!==lastHug){
  lastHug=data.hug.id;menu.open=false;
  mapStatus.textContent='You shared a hug.';
  send('garden:hug',{id:data.hug.with});
 }
}
function updateAvatar(){
 petButton.textContent='Pet my '+avatar.pet;
 send('garden:avatar',avatar);
}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('change',event=>{
 showBreeds(form.elements.pet.value,breed.value);
 avatar=Object.fromEntries(new FormData(form));
 try{localStorage.setItem(storage,JSON.stringify(avatar))}catch{}
 updateAvatar();
 if(token)sync('move');
});
avatarMenu.addEventListener('toggle',()=>{if(avatarMenu.open)menu.open=false});
menu.addEventListener('toggle',()=>{if(menu.open)avatarMenu.open=false});
menu.querySelector('summary').addEventListener('click',()=>{if(!menu.open)send('garden:court',{})});
document.addEventListener('garden:meet',()=>{menu.open=true;avatarMenu.open=false;send('garden:court',{})});
document.addEventListener('garden:visit',()=>{menu.open=false});
form.querySelector('[data-see-companion]').onclick=()=>{avatarMenu.open=false;send('garden:close-up',{})};
petButton.onclick=()=>{avatarMenu.open=false;send('garden:close-up',{});send('garden:pet',{})};
greeting.querySelector('[data-walk-to-visitor]').onclick=()=>{menu.open=false;send('garden:approach',{id:partner.value})};
const map=document.querySelector('[data-garden-map]');
function ready(){if(map.classList.contains('garden-map-ready')){controls.hidden=false;updateAvatar();observer.disconnect()}}
const observer=new MutationObserver(ready);observer.observe(map,{attributes:true,attributeFilter:['class']});ready();
document.addEventListener('garden:position',e=>{position=e.detail;if(token)sync('move')});
document.addEventListener('garden:wave-to',e=>{if(token){partner.value=e.detail.id;menu.open=true;sync('wave',e.detail.id)}});
greeting.querySelector('[data-wave]').onclick=()=>sync('wave',partner.value);
offer.onclick=()=>sync('offer-hug',partner.value);
greeting.querySelector('[data-accept-hug]').onclick=()=>{if(invited)sync('accept-hug',invited.from,invited.id)};
greeting.querySelector('[data-decline-hug]').onclick=()=>{if(invited)sync('decline-hug',invited.from,invited.id)};
function reset(){
 clearInterval(timer);token=null;pending=null;lastInvite=null;lastHug=null;greeting.hidden=true;join.textContent='Join the shared walk';join.setAttribute('aria-pressed','false');send('garden:visitors',{visitors:[]});
}
async function sync(action,to,invitation){
 if(busy){if(action!=='move'||!pending)pending={action,to,invitation};return}
 if(action!=='join'&&!token)return;
 busy=true;join.disabled=true;
 try{
  const response=await fetch('/team-review/api/garden-visitors',{method:'POST',headers:{'content-type':'application/json',...(token?{'x-garden-session':token}:{})},body:JSON.stringify({action,...avatar,...position,to,invitation}),signal:AbortSignal.timeout(8000)});
  const data=await response.json();
  if(!response.ok){if(response.status===401)reset();throw Error(data.error || 'Try joining again.')}
  if(action==='leave'){reset();status.textContent='You’re exploring privately.';return}
  if(action==='join'){
   token=data.token;join.textContent='Leave shared walk';join.setAttribute('aria-pressed','true');
   timer=setInterval(()=>{if(!document.hidden)sync('move')},4000);
  }
  send('garden:visitors',{visitors:data.visitors});
  if(action==='join')send('garden:gather',{slot:data.slot});
  status.textContent=data.visitors.length?data.visitors.length+' other '+(data.visitors.length===1?'visitor':'visitors')+' here. Tap a visitor to say hello.':'You’re the first here. Other visitors can now see your avatar.';
  if(data.visitors.some(v=>v.wavedToMe))mapStatus.textContent='Another visitor waved to you.';
  if(action==='wave')mapStatus.textContent='You waved hello.';
  if(action==='decline-hug')mapStatus.textContent='Invitation closed.';
  renderGreetings(data);
 }catch(e){status.textContent=e.name==='TimeoutError'?'The shared walk is taking a moment. Try again.':e.message}
 finally{busy=false;join.disabled=false;const next=pending;pending=null;if(next)sync(next.action,next.to,next.invitation)}
}
join.onclick=()=>sync(token?'leave':'join');
window.addEventListener('pagehide',()=>{
 if(token)fetch('/team-review/api/garden-visitors',{method:'POST',keepalive:true,headers:{'content-type':'application/json','x-garden-session':token},body:'{"action":"leave"}'}).catch(()=>{});
 reset();
});
