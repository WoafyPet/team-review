const wall=document.querySelector('[data-wall]');
const book=document.createElement('section');book.dataset.communityBook='';book.hidden=true;book.setAttribute('aria-label','Shared family cabinets');wall.append(book);
const recordsKey='woafypet-shared-cabinet-keys-v1';
const visitorKey='woafypet-guestbook-key-v1';
const gifts={flower:['🌷','Flowers'],candle:['🕯️','Candle'],treat:['🦴','Treat'],toy:['🧸','Toy']};
let cabinets=[],selected='',notice='',inbox=[],phase='list',next=null,ticket=0;
function el(tag,text){const node=document.createElement(tag);if(text)node.textContent=text;return node}
function button(label,run){const b=el('button',label);b.type='button';b.className='garden-back';b.onclick=async()=>{b.disabled=true;try{await run()}catch(e){announce(e.message)}finally{b.disabled=false}};return b}
function localKeys(){try{return JSON.parse(localStorage.getItem(recordsKey)||'{}')}catch{return {}}}
function personal(){const data={};document.dispatchEvent(new CustomEvent('garden:query-memories',{detail:data}));return (data.tributes||[]).filter(item=>item.id!=='bobby')}
function active(){return cabinets.find(c=>c.id===selected)}
function ownerKey(id){return Object.values(localKeys()).find(p=>p.publicId===id)?.secret}
function guestKey(){let key=localStorage.getItem(visitorKey);if(!key){key=crypto.randomUUID();localStorage.setItem(visitorKey,key)}return key}
function announce(text){notice=text;const live=book.querySelector('[role=status]');if(live)live.textContent=text}
function broadcast(){document.dispatchEvent(new CustomEvent('garden:community-changed',{detail:{cabinets}}))}
async function request(data,key,query=''){const r=await fetch('/team-review/api/garden-cabinets'+query,data?{method:'POST',headers:{'content-type':'application/json','x-cabinet-key':key},body:JSON.stringify(data)}:{cache:'no-store'});const out=await r.json();if(!r.ok)throw Error(out.error||'The guest book could not be opened. Please try again.');return out}
async function refresh(more=false,id=''){
 const n=++ticket;const result=await request(null,null,more&&next?'?after='+encodeURIComponent(next):'');
 if(id&&!result.cabinets.some(c=>c.id===id)){const extra=await request(null,null,'?id='+encodeURIComponent(id));result.cabinets.push(extra.cabinet)}
 if(n!==ticket)return;
 const rows=more?cabinets.concat(result.cabinets):result.cabinets;
 cabinets=[...new Map(rows.map(row=>[row.id,row])).values()];next=result.next;broadcast();
}
function apply(c){const i=cabinets.findIndex(row=>row.id===c.id);if(i<0)cabinets.unshift(c);else cabinets[i]=c;broadcast()}
function go(next,id=''){phase=next;selected=id;notice='';inbox=[];render()}
function privateWall(){book.hidden=true;delete wall.dataset.publicOpen}
function field(label,node){const l=el('label',label);l.append(node);return l}
function words(max){const t=el('textarea');t.required=true;t.maxLength=max;t.rows=3;return t}
function formSave(form,label,submit){const b=el('button',label);b.type='submit';b.className='button primary';form.append(b);form.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{await submit()}catch(e){announce(e.message)}finally{b.disabled=false}}}
async function thumbnail(source){
 const image=new Image();image.src=source;await image.decode();
 for(const side of [112,80,56,40]){
  const scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const data=canvas.toDataURL('image/png');if(data.length<16500)return data;
 }
 throw Error('Use a smaller pet portrait or share words only.');
}
function shareForm(){
 const pets=personal();book.append(el('h3','Share a memory with other families'));
 if(!pets.length){book.append(el('p','Make a private cabinet first. Then choose the words you would like others to see.'),button('Make a cabinet',()=>{privateWall();document.dispatchEvent(new CustomEvent('garden:new-memory'))}));return}
 const form=el('form'),select=el('select'),message=words(400),consent=el('input');consent.type='checkbox';consent.required=true;
 pets.forEach(p=>{const o=el('option',p.pet);o.value=p.id;select.append(o)});
 const photo=el('input');photo.type='checkbox';const photoLabel=el('label');photoLabel.className='community-check';photoLabel.append(photo,document.createTextNode('Also share a small copy of this pet’s portrait.'));
 const setSelected=()=>{photo.checked=false;photoLabel.hidden=!pets.find(p=>p.id===select.value)?.photo;message.value='';const old=localKeys()[select.value];if(old?.publicId){const entry=cabinets.find(c=>c.id===old.publicId);if(entry)message.value=entry.memory}};setSelected();select.onchange=setSelected;
 const agree=el('label');agree.className='community-check';agree.append(consent,document.createTextNode('Visitors may see this pet’s name and these words. My full-size photo, private letter and dates stay in my cabinet.'));
 form.append(field('Your pet',select),field('Words for the shared wall',message),photoLabel,agree);
 formSave(form,'Place on the shared wall',async()=>{
  const pet=personal().find(p=>p.id===select.value);if(!pet)throw Error('Choose a pet in your private garden.');
  const ids=localKeys();const record=ids[pet.id]||{secret:crypto.randomUUID()};ids[pet.id]=record;localStorage.setItem(recordsKey,JSON.stringify(ids));
  const out=await request({action:'publish',pet:pet.pet,memory:message.value,confirm:consent.checked,includePhoto:photo.checked,photo:photo.checked?await thumbnail(pet.photo):undefined},record.secret);
  record.publicId=out.cabinet.id;localStorage.setItem(recordsKey,JSON.stringify(ids));apply(out.cabinet);go('cabinet',out.cabinet.id);announce('Your shared cabinet is open. You can take it down here on this browser.');
 });book.append(form);
}
async function leaveGift(id,gift){if(!gifts[gift])return;const out=await request({action:'gift',id,gift},guestKey());apply(out.cabinet);notice='Your '+gifts[gift][1].toLowerCase()+' is on '+out.cabinet.pet+'’s shelf.';render();const status=document.querySelector('[data-map-status]');if(status)status.textContent=notice}
function cabinetView(c){
 book.append(el('h3',c.pet));if(c.photo){const img=el('img');img.src=c.photo;img.className='community-portrait';img.alt=c.pet+' in a portrait shared by the family';book.append(img)}book.append(el('blockquote',c.memory));
 const shelf=el('div');shelf.className='community-gifts';for(const [k,[icon,label]] of Object.entries(gifts))shelf.append(button(icon+' '+label+' · '+(c.gifts[k]||0),()=>leaveGift(c.id,k)));book.append(shelf);
 if(c.letters.length){book.append(el('h4','Letters on the shelf'));c.letters.forEach(l=>book.append(el('blockquote',l.text)))}
 const details=el('details'),summary=el('summary','Leave a note for the family'),form=el('form'),message=words(240);form.append(field('The family can choose to display your words.',message));formSave(form,'Send a kind note',async()=>{await request({action:'letter',id:c.id,text:message.value},guestKey());message.value='';details.open=false;announce('Your note is waiting for the family.')});details.append(summary,form);book.append(details);
 const key=ownerKey(c.id);if(!key)return;
 const admin=el('details');admin.append(el('summary','Tend your shared cabinet'));
 admin.append(button('Read pending letters',async()=>{const out=await request({action:'inbox',id:c.id},key);inbox=out.pending;render(true);announce(inbox.length?'Choose which notes to display.':'Your letter box is empty.')}));
 for(const note of inbox){const item=el('div');item.append(el('p',note.text));for(const [label,approve] of [['Place on shelf',true],['Discard',false]])item.append(button(label,async()=>{const out=await request({action:'review',id:c.id,noteId:note.id,approve},key);apply(out.cabinet);inbox=inbox.filter(n=>n.id!==note.id);render(true);announce(approve?'Letter placed on the shelf.':'Letter discarded.')}));admin.append(item)}
 const removal=el('details');removal.append(el('summary','Take down this public cabinet'),el('p','Your private cabinet stays in your garden. Gifts and letters on this shared shelf will be removed.'),button('Remove from shared wall',async()=>{await request({action:'remove',id:c.id},key);cabinets=cabinets.filter(x=>x.id!==c.id);const keys=localKeys();for(const [id,p] of Object.entries(keys))if(p.publicId===c.id)delete keys[id];localStorage.setItem(recordsKey,JSON.stringify(keys));broadcast();go('list');announce('Your public cabinet was removed.')}));admin.append(removal);admin.dataset.tending='';book.append(admin);
}
function render(tending=false){
 book.replaceChildren();const controls=el('div');controls.className='community-controls';controls.append(button('My Memory Wall',privateWall));if(phase!=='list')controls.append(button('All shared cabinets',()=>go('list')));book.append(controls);
 if(phase==='publish')shareForm();else if(phase==='cabinet'&&active())cabinetView(active());else{
  book.append(el('h3','Memories from other families'));if(!cabinets.length)book.append(el('p','No family has shared a memory here yet. Leave a few words about a pet you miss.'));
  else{
   const list=el('ul');list.className='community-list';
   for(const c of cabinets){
    const li=el('li'),visit=button('',()=>go('cabinet',c.id));visit.className='shared-memory-card';
    visit.setAttribute('aria-label','Read the memory of '+c.pet);
    if(c.photo){const image=el('img');image.src=c.photo;image.alt='';image.loading='lazy';visit.append(image)}
    const words=el('span');words.append(el('strong',c.pet),el('span',c.memory.length>140?c.memory.slice(0,137).trimEnd()+'…':c.memory));visit.append(words);
    li.append(visit);list.append(li);
   }
   book.append(list);
  }
  if(next)book.append(button('Visit more cabinets',async()=>{await refresh(true);render()}));
  book.append(button('Share a cabinet',()=>go('publish')));
 }
 const live=el('p',notice);live.setAttribute('role','status');book.append(live);if(tending&&book.querySelector('[data-tending]'))book.querySelector('[data-tending]').open=true;
}
document.addEventListener('garden:query-community',e=>{if(e.detail)e.detail.cabinets=cabinets});
document.addEventListener('garden:visit',e=>{privateWall();if(e.detail?.key==='memories')refresh().catch(()=>{})});
document.addEventListener('garden:public-cabinets',async e=>{
 document.dispatchEvent(new CustomEvent('garden:open',{detail:{key:'memories'}}));book.hidden=false;wall.dataset.publicOpen='';
 book.setAttribute('aria-label','Shared family cabinets');
 phase=e.detail?.id?'cabinet':'list';selected=e.detail?.id||'';inbox=[];notice='';
 const progress=el('p','Opening shared memories…');progress.setAttribute('role','status');book.replaceChildren(progress);
 try{await refresh(false,e.detail?.id);notice='';render()}catch(err){announce(err.message)}
});
document.addEventListener('garden:public-gift',e=>{const {id,gift}=e.detail||{};if(!cabinets.some(c=>c.id===id))return;leaveGift(id,gift).catch(err=>{const s=document.querySelector('[data-map-status]');if(s)s.textContent=err.message})});

const keepsakeReceipts='woafypet-public-keepsakes-v1';
function receipts(){
 try{return JSON.parse(localStorage.getItem(keepsakeReceipts)||'{}')||{};}catch{return {};}
}
function saveReceipt(id,value){
 try{
  const owned=receipts();if(value)owned[id]=value;else delete owned[id];
  localStorage.setItem(keepsakeReceipts,JSON.stringify(owned));
 }catch{/* Public words can still be read when device storage is unavailable. */}
}

document.addEventListener('garden:public-keepsakes',async event=>{
 const kind=event.detail?.kind;
 if(kind!=='stone'&&kind!=='letter')return;
 document.dispatchEvent(new CustomEvent('garden:open',{detail:{key:'memories',landmark:'support'}}));
 book.hidden=false;wall.dataset.publicOpen='';
 const stone=kind==='stone',title=stone?'Memory stones':'Garden letters';
 document.getElementById('visit-title').textContent=title;
 const shelf=el('section');shelf.className='public-keepsake-shelf';book.setAttribute('aria-label',title);book.replaceChildren(shelf);
 const list=el('ul');list.className=stone?'keepsake-list stones':'keepsake-list letters';
 const live=el('p');live.setAttribute('role','status');
 const more=button('Read more',()=>load(true));more.hidden=true;
 const intro=el('p',stone?'Read the words families have left for the pets they miss.':'Open letters from people who still have things to tell their pets.');
 const compose=el('details'),summary=el('summary',stone?'Leave a memory stone':'Write a garden letter');
 const form=el('form'),pet=el('input'),message=words(stone?120:800);
 pet.required=true;pet.maxLength=55;pet.autocomplete='off';
 const note=el('small','Every visitor can read the pet’s name and your words.');
 form.append(field('Pet’s name',pet),field(stone?'Stone inscription':'Your letter',message),note);
 let cursor=null,draft=null,reading=0;
 function draw(entry){
  const li=el('li'),quote=el('blockquote',entry.text),name=el('strong','For '+entry.pet);
  li.dataset.keepsake=entry.id;li.append(name,quote);
  const owned=receipts()[entry.id];
  if(owned)li.append(button('Remove my '+kind,async()=>{
   if(!confirm('Remove these words from the public garden?'))return;
   try{await request({action:'lift',kind,created:owned.created},owned.key);saveReceipt(entry.id,null);await load();}catch{live.textContent='Your words could not be removed. Try again.';}
  }));
  return li;
 }
 async function load(append=false){
  const ownRead=++reading;
  if(!append)live.textContent='Opening the garden…';
  try{
   const response=await request(null,null,'?kind='+kind+(append&&cursor?'&after='+encodeURIComponent(cursor):''));
   if(ownRead!==reading)return;
   if(!append)list.replaceChildren();
   list.append(...response.entries.map(draw));cursor=response.next;more.hidden=!cursor;
   live.textContent=list.children.length?'':(stone?'Be the first to leave a stone here.':'Be the first to leave a letter here.');
  }catch{
   if(ownRead===reading)live.textContent='The garden could not load these words. Try refreshing the shelf.';
  }
 }
 formSave(form,stone?'Share my stone publicly':'Share my letter publicly',async()=>{
  const text=message.value.trim(),name=pet.value.trim();
  if(!text||!name){live.textContent='Add a pet’s name and a message.';return;}
  if(!draft||draft.text!==text||draft.pet!==name)draft={key:crypto.randomUUID(),created:Date.now(),pet:name,text};
  try{
   const {entry}=await request({action:'place',kind,pet:name,text,created:draft.created,confirm:true},draft.key);
   saveReceipt(entry.id,{key:draft.key,created:draft.created});draft=null;form.reset();compose.open=false;
   ++reading;for(const node of list.children)if(node.dataset.keepsake===entry.id)node.remove();
   list.prepend(draw(entry));live.textContent=stone?'Your stone is here for everyone to read.':'Your letter is here for everyone to read.';
  }catch(error){live.textContent=error.message||'Your words could not be shared. Please try again.';}
 });
 compose.append(summary,form);
 const refreshButton=button('Refresh shelf',()=>load());
 const family=el('figure');family.className='garden-family-memory';
 family.append(el('blockquote',stone?'For eight years, he was my best friend.':'When I miss him now, that’s the moment I want back. A regular school day, and my boy there at the end of it.'));
 const byline=el('figcaption'),story=el('a','Rob, from Bobby’s story');story.href='/team-review/about/';byline.append(story);family.append(byline);
 shelf.append(intro,family,compose,list,more,live,refreshButton);
 await load();
});
