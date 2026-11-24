// Only the selected care activity is mounted beside its 3D landmark.
const routes = {circle:'/team-review/care-circle/',profile:'/team-review/preview-info/',timeline:'/team-review/preview-info/',path:'/team-review/care-path/',support:'/team-review/pet-loss-support/',trees:'/team-review/memorial-tree/'};
const pages = new Map();
const stations = new Map();
let selectedLesson, circleVisit = 0;

function element(tag, text) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}
function action(label, run) {
  const button = element('button', label);
  button.type = 'button';
  button.className = 'station-action';
  button.addEventListener('click', run);
  return button;
}
function fold(label, ...children) {
  const box = element('details');
  box.className = 'station-fold';
  box.append(element('summary', label), ...children);
  return box;
}
function say(host, text) {
  const line = element('p',text);
  line.className='station-intro';
  host.append(line);
}
function emit(name,detail) { document.dispatchEvent(new CustomEvent('garden:'+name,{detail})); }
async function source(path) {
  if (!pages.has(path)) {
    pages.set(path,fetch(path).then(async response => {
      if (!response.ok) throw new Error('Could not load this garden activity.');
      return new DOMParser().parseFromString(await response.text(),'text/html');
    }).catch(error=>{pages.delete(path);throw error;}));
  }
  return pages.get(path);
}
function copy(doc, selector) { return document.importNode(doc.querySelector(selector), true); }
function copies(doc, selector) {
  return [...doc.querySelectorAll(selector)].map(node=>document.importNode(node,true));
}
function bindCare(root, pathname, navigate) {
  emit('bind-care',{root,url:new URL(pathname,location.origin),navigate});
}
function accountKey() {
  try { const p=JSON.parse(localStorage.getItem('woafmeow-account-v1')); return p?.email+'::'+p?.petName; }
  catch { return ''; }
}
async function showLesson(host, pathname, navigate) {
  const ownVisit=++circleVisit;
  const lesson=await source(pathname);
  if (ownVisit!==circleVisit) return;
  const reader=element('section');
  reader.className='station-reader';
  const shelf=host.querySelector('[data-circle-shelf]');
  const exit=action('Back to Care Circle',()=>{reader.remove();shelf.hidden=false;selectedLesson=null;});
  reader.append(exit,element('h3',lesson.querySelector('main h1')?.textContent.trim()||'Care lesson'));
  const context=element('p');
  context.dataset.tailoredContext='';
  reader.append(context);
  for(const chapter of lesson.querySelectorAll('[data-lesson-chapter]')){
    const copyOf=chapter.cloneNode(true);
    const title=copyOf.querySelector('h2');
    if(!title) continue;
    const panel=fold(title.textContent.trim());
    title.remove();
    copyOf.querySelectorAll('figure,img,.chapter-quiz,.lesson-step-number').forEach(i=>i.remove());
    panel.append(copyOf);
    reader.append(panel);
  }
  const sooner=lesson.querySelector('.call-sooner-v7');
  if(sooner) reader.append(sooner.cloneNode(true));
  host.querySelector('.station-reader')?.remove(); shelf.hidden=true; host.append(reader);
  bindCare(reader,pathname,navigate);
  exit.focus({preventScroll:true});host.scrollTop=0;
}

async function circle(host,doc,navigate) {
  const shelf=element('div');shelf.dataset.circleShelf='';
  const stories=copy(doc,'[data-owner-circle]');
  const prompt=copy(doc,'.care-conversation');
  prompt.querySelector('header h2')?.remove();
  const topics=element('div');topics.className='station-topics';
  const library=element('section');library.className='circle-garden-library';library.append(element('h3','Care questions, answered'));
  const more=fold('More care questions');
  for(const card of doc.querySelectorAll('[data-care-post]')){
    const a=card.querySelector('a[href*="/team-review/care-circle/"]');
    if(!a) continue;
    const link=element('a',card.querySelector('h2')?.textContent||a.textContent);
    link.href=a.getAttribute('href');topics.append(link);
    const question=fold(link.textContent,element('p',card.querySelector('p')?.textContent||''));
    const full=element('a','Read the full care guide');full.href=link.href;question.append(full);
    (library.querySelectorAll(':scope > details').length<3?library:more).append(question);
  }
  if(more.children.length>1)library.append(more);stories.append(library);
  shelf.append(stories,fold('Ask a private question',prompt),fold('Browse care lessons',topics));
  host.append(shelf);
  const ownerModule=await import(doc.querySelector('script[src^="/team-review/assets/owner-circle.js"]').getAttribute('src'));
  ownerModule.mountOwnerCircle(stories);
  bindCare(shelf,routes.circle,navigate);
  if(selectedLesson) await showLesson(host,selectedLesson,navigate);
}
function profile(host,doc,navigate){
  say(host,'Give this companion a name, a photo, and a care history.');
  const panel=copy(doc,'.account-scene-panel');
  host.append(panel);
  bindCare(panel,routes.profile,navigate);
}
function timeline(host,doc){
  let owner;
  function render() {
    const key=accountKey();
    if(host.firstChild && key===owner) return;
    owner=key;
    const page=copy(doc,'[data-health-root]');
    const work=page.querySelector('[data-health-workspace]');
    const log=page.querySelector('#log-change'), record=page.querySelector('#add-record');
    const insights=page.querySelector('.health-insights'), share=page.querySelector('.health-share');
    const saves=page.querySelector('.health-timeline-section'), summary=page.querySelector('.health-summary-grid');
    summary.hidden=true;
    const logAction=fold('Record a change',log), fileAction=fold('Add health records',record);
    logAction.open=true;
    work.replaceChildren(summary,element('p','Your private observations stay in this browser.'),logAction,fileAction,saves,fold('Review patterns',insights),fold('Share their history',share));
    host.replaceChildren(page);emit('bind-timeline',{root:page});
  }
  render();
  document.addEventListener('garden:visit',event=>{if(event.detail?.key==='timeline')render()});
  document.addEventListener('garden:profile-changed',render);
}
function path(host,doc,openPlace,navigate){
  say(host,'Choose the moment you noticed. The signpost will point you toward a first step.');
  const out=element('div');out.setAttribute('aria-live','polite');out.className='station-result';
  const choices=[
    ['Stiff after a nap','slower-after-rest','Watch the first few steps after rest. Record where they hesitate and how long it takes to loosen up.'],
    ['Restless at night','restless-at-night','Record when they wake, pace, or ask to go outside. Compare the next night.'],
    ['Walking away from food','changes-in-appetite','Note what they ate, what they left, and whether chewing seemed uncomfortable.'],
    ['Need support after loss',null,'Find words for today or leave a memory together in the garden.']
  ];
  for(const [label,slug,guidance] of choices) host.append(action(label,()=>{
    out.replaceChildren(element('h3',label),element('p',guidance),
      action(slug?'Read the care lesson':'Visit the quiet bench',()=>slug?navigate('/team-review/care-circle/'+slug+'/team-review/'):openPlace('support')));
  }));
  host.append(out,action('Ask in Care Circle',()=>openPlace('circle')));
}
function loss(host,doc,openPlace){
  const stagesGroup=element('section');
  stagesGroup.dataset.griefStages='';
  stagesGroup.setAttribute('aria-label','Support for each stage of pet loss');
  say(stagesGroup,'What would help you today?');
  const stages=[
    ['Keeping my dog comfortable', ['.loss-journey article:nth-of-type(1)', '.loss-journey article:nth-of-type(2)', '.loss-journey article:nth-of-type(3)']],
    ['Preparing to say goodbye', ['.loss-goodbye-detail article','.loss-words .loss-call-script']],
    ['Coping with the first days of loss', ['.loss-first-days article']]
  ];
  for(const [label,selectors] of stages) {
    const items=selectors.flatMap(s=>copies(doc,s));
    items.forEach(i=>i.querySelectorAll('figure,img,svg').forEach(n=>n.remove()));
    stagesGroup.append(fold(label,...items));
  }
  host.append(stagesGroup);
  host.append(action('Visit the memory stones',()=>emit('public-keepsakes',{kind:'stone'})),
    action('Read the garden letters',()=>emit('public-keepsakes',{kind:'letter'})),
    action('Visit their memory cabinet',()=>openPlace('memories')));
}
function trees(host,doc){
  say(host,'Choose a companion and plant a little tree in their place.');
  const form=element('form');form.className='station-note';
  const who=element('label','Companion'), select=element('select');
  who.append(select);
  const label=element('label','Tree dedication'), name=element('input');
  name.maxLength=55;name.required=true;label.append(name);
  const status=element('p');status.setAttribute('role','status');
  const plant=element('button','Plant in this garden');
  let choices=[];
  function fill(keepSelection=false){
    const state={};emit('query-memories',state);
    choices=state.tributes||[];
    const prev=keepSelection?select.value:state.tribute?.id;
    const fresh=element('option','Plant for my pet');fresh.value='';
    select.replaceChildren(fresh,...choices.map(t=>{const n=element('option',t.pet);n.value=t.id;return n}));
    select.value=prev && (prev!=='bobby'||keepSelection||state.tribute?.tree) && choices.some(t=>t.id===prev)?prev:'';
    const current=choices.find(t=>t.id===select.value);
    label.firstChild.textContent=current?'Tree dedication':'Pet’s name';
    name.placeholder=current?'Name their tree':'Their name';name.value=current?.tree||current?.pet||'';
    plant.textContent=current?.tree?'Update this dedication':'Plant in this garden';
  }
  fill();
  select.addEventListener('change',()=>fill(true));
  form.addEventListener('submit',evt=>{
    evt.preventDefault();if(!name.value.trim())return;
    const planting={id:select.value,name:name.value.trim(),newCompanion:!select.value};
    emit('plant',planting);
    status.textContent=planting.saved?'Your virtual tree is growing in the grove.':'Your tree could not be saved on this device. Please try again.';
    if(planting.saved)fill();
  });
  document.addEventListener('garden:visit',e=>{if(e.detail?.key==='trees') fill()});
  form.append(who,label,plant,status);
  const paid=copy(doc,'[data-checkout-form]');
  host.append(form,action('Add another companion',()=>emit('new-memory',{})),fold('Dedicate a real tree · $10',element('p','A separate planting through our tree partner. Continue to Stripe to confirm your dedication.'),paid));
  emit('bind-checkout',{form:paid});
}
function routeHref(href,openPlace) {
  const u=new URL(href,location.origin);
  if(u.origin!==location.origin)return false;
  if(/^\/care-circle\/[a-z0-9-]+\/$/.test(u.pathname)){
    selectedLesson=u.pathname;
    if(stations.has('circle')) showLesson(stations.get('circle'),u.pathname,next=>routeHref(next,openPlace)).catch(()=>{});
    openPlace('circle'); return true;
  }
  const key=Object.keys(routes).find(k=>routes[k]===u.pathname);
  if(!key)return false;
  openPlace(key);return true;
}
export async function mountStation(key,host,{openPlace}) {
  if(!routes[key])return;
  const doc=await source(routes[key]);
  const script=doc.querySelector('script[src^="/team-review/legacy/app.js"]');
  await import(script.getAttribute('src'));
  const navigate=url=>routeHref(url,openPlace);
  host.classList.add('garden-station');
  host.replaceChildren();
  stations.set(key,host);
  host.addEventListener('click',event=>{
    const a=event.target.closest('a[href]');
    if(!a||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    if(routeHref(a.href,openPlace))event.preventDefault();
  });
  if(key==='circle')await circle(host,doc,navigate);
  else if(key==='profile')profile(host,doc,navigate);
  else if(key==='timeline')timeline(host,doc);
  else if(key==='path')path(host,doc,openPlace,navigate);
  else if(key==='support')loss(host,doc,openPlace);
  else trees(host,doc);
}
