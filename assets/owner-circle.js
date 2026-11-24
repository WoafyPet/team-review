export function mountOwnerCircle(circle) {
const find = name => circle.querySelector('[data-circle-' + name + ']');
const compose = find('compose');
const join = find('join');
const message = find('message');
const status = find('status');
const memberKey = 'woafypet-care-circle-member';
let account, member, replyTo;

async function request(path, data) {
  const options = data ? {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(data)
  } : {};
  const response = await fetch('/team-review/api/' + path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again.');
  return result;
}

function storedMember(email) {
  try {
    const saved = JSON.parse(localStorage.getItem(memberKey));
    return saved?.id && saved.token && saved.dogId && saved.email === email ? saved : null;
  } catch { return null; }
}

function updateComposer() {
  find('login').hidden = Boolean(account);
  join.hidden = !account || Boolean(member);
  message.hidden = !member;
  if (account && !member) {
    find('join-copy').textContent = 'Connect ' + account.profile.petName + ' to Care Circle using your verified profile. Joining again can replace your previous Care Circle session.';
  }
  if (!member) return;
  const name = member.dogName;
  find('byline').textContent = replyTo
    ? 'Your reply will appear publicly with ' + name + '’s name.'
    : 'Once reviewed, your question will appear with ' + name + '’s name. Leave out contact details.';
  find('question-label').textContent = replyTo ? 'Your reply to ' + replyTo.dogName : 'Your public question';
  message.elements.message.minLength = replyTo ? 12 : 24;
  message.querySelector('button').textContent = replyTo ? 'Post public reply' : 'Send question for review';
}
async function checkAccount() {
  try {
    const session = await request('account');
    account = session.signedIn && session.profile ? session : null;
    member = account && storedMember(account.email);
    updateComposer();
  } catch {
    find('login').hidden = join.hidden = message.hidden = true;
    status.textContent = 'Your profile could not be loaded. Close and reopen this form to retry.';
  }
}
compose.addEventListener('toggle', () => {
  if (compose.open) {
    status.textContent = '';
    checkAccount();
  } else {
    replyTo = null;
    compose.querySelector('summary').textContent = 'Ask the community';
    message.reset();
  }
});

async function submit(form, event, task) {
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = '';
  try {
    await task();
  } catch (error) {
    status.textContent = error.message || 'Please try again.';
  } finally {
    button.disabled = false;
  }
}

join.addEventListener('submit', event => submit(join, event, async () => {
  const session = await request('account');
  if (!account || !session.signedIn || !session.profile || session.email !== account.email) {
    account = member = null;
    updateComposer();
    throw new Error('Sign in before joining Care Circle.');
  }
  const profile = session.profile;
  const {member: joined} = await request('enroll', {
    ownerName: profile.ownerName, email: session.email, dogName: profile.petName,
    species: 'dog', breed: profile.breed, ageYears: Number(join.elements.ageYears.value), focus: 'not-sure'
  });
  member = {id:joined.id, token:joined.token, dogId:joined.dogId, dogName:joined.dogName, email:session.email};
  updateComposer();
  try { localStorage.setItem(memberKey, JSON.stringify(member)); }
  catch { status.textContent = 'You can post during this visit. This browser could not save your Care Circle session.'; }
  message.elements.message.focus();
}));

message.addEventListener('submit', event => submit(message, event, async () => {
  if (!member) return;
  const body = message.elements.message.value.trim();
  if (body.length < message.elements.message.minLength) {
    throw new Error('Add a little more detail before sending.');
  }
  const data = {memberId:member.id, memberToken:member.token, dogId:member.dogId, body};
  await request('community', replyTo
    ? {...data, kind:'reply', postId:replyTo.id}
    : {...data, kind:'post', topic:'Daily routine'});
  status.textContent = replyTo ? 'Your reply has been posted.' : 'Your question was sent for review.';
  message.reset();
  if (replyTo) await loadStories(true);
}));

function tag(name,text,style) {
  const node=document.createElement(name);
  if(text)node.textContent=text;
  if(style)node.className=style;
  return node;
}

function publicAnswer(post, details) {
  const waiting=tag('p','Opening the shared care chat…');
  waiting.setAttribute('role','status');
  const retry=tag('button','Try opening the answer again');
  retry.type='button';retry.hidden=true;
  details.append(waiting,retry);
  let loading=false,opened=false;
  async function load(){
    if(loading||opened)return;
    loading=true;retry.hidden=true;
    try{
      const result=await request('public-lesson?postId='+encodeURIComponent(post.id));
      if(!result.published||result.privacy!=='public'||!result.answer)throw Error();
      const answer=result.answer;
      const text=tag('section',null,'circle-published-answer');
      text.append(tag('h4','Shared care chat'),tag('p',result.question),tag('p',answer.summary));
      for(const chapter of answer.chapters||[]){
        const section=tag('section');section.append(tag('h5',chapter.title));
        for(const paragraph of chapter.paragraphs||[])section.append(tag('p',paragraph));
        if(chapter.bullets?.length){
          const list=tag('ul');for(const item of chapter.bullets)list.append(tag('li',item));section.append(list);
        }
        if(chapter.table?.length){
          const list=tag('dl');for(const [key,value] of chapter.table)list.append(tag('dt',key),tag('dd',value));section.append(list);
        }
        if(chapter.marginNote)section.append(tag('p',chapter.marginNote));
        text.append(section);
      }
      if(!answer.chapters?.length){
        for(const [heading,items] of [['What to notice',answer.notice],['What to do next',answer.tryNow]]){
          if(!items?.length)continue;
          const list=tag('ul');for(const item of items)list.append(tag('li',item));text.append(tag('h5',heading),list);
        }
      }
      if(answer.vet)text.append(tag('p',answer.vet));
      if(answer.questions?.length){
        text.append(tag('h5','Questions for your vet'));
        const list=tag('ul');for(const q of answer.questions)list.append(tag('li',q));text.append(list);
      }
      const sources=tag('ul');
      for(const [label,href] of answer.sources||[]){
        if(!/^https?:\/\//i.test(href))continue;
        const li=tag('li'),link=tag('a',label);link.href=href;li.append(link);sources.append(li);
      }
      if(sources.children.length)text.append(tag('h5','Sources'),sources);
      waiting.replaceWith(text);retry.remove();opened=true;
    }catch{
      waiting.textContent='The shared answer could not be opened.';retry.hidden=false;
    }finally{loading=false;}
  }
  details.addEventListener('toggle',()=>{if(details.open)load()});
  retry.addEventListener('click',load);
}

function storyCard(post) {
  const card=tag('article',null,'circle-thread');
  const label=tag('p',post.dogName||'A dog owner','circle-byline');
  if(post.topic)label.append(' · '+post.topic);
  card.append(label,tag('h3',post.body));
  for(const media of post.media||[]){
    if(!/^\/api\/media\/[\w-]+$/.test(media.url))continue;
    const nodeType={image:'img',video:'video',audio:'audio'}[media.mediaKind];
    if(!nodeType)continue;
    const item=tag(nodeType);item.src=media.url;
    if(nodeType==='img'){item.loading='lazy';item.alt='Photo shared with this question';}
    else{item.controls=true;item.preload='none';}
    card.append(item);
  }
  const replies=(post.replies||[]).filter(isPublic);
  const answers=tag('details',null,'circle-thread-answers');
  const labelCount=replies.length+' '+(replies.length===1?'reply':'replies');
  answers.append(tag('summary',post.conversationId?(replies.length?'Read care chat and '+labelCount:'Read shared care chat'):'Read '+labelCount));
  if(post.conversationId)publicAnswer(post,answers);
  for(const reply of replies){
    const row=tag('div',null,'circle-owner-reply');
    row.append(tag('strong',reply.dogName||'A dog owner'),tag('p',reply.body));answers.append(row);
  }
  if(post.conversationId||replies.length)card.append(answers);
  const button=tag('button','Reply','circle-reply-button');
  button.type='button';
  button.addEventListener('click',()=>{
    if(replyTo?.id!==post.id)message.reset();
    replyTo=post;compose.querySelector('summary').textContent='Reply to '+(post.dogName||'this question');
    compose.open=true;updateComposer();compose.scrollIntoView({block:'nearest'});compose.querySelector('summary').focus({preventScroll:true});
  });
  card.append(button);return card;
}

function isPublic(item){
  return item && (!item.status||item.status==='approved'||item.status==='published') &&
    (!item.privacy||item.privacy==='public') && item.published!==false;
}
const examples=new Set(['public_mobility','public_sleep','public_appetite','public_litter']);
const visibleStep=6,seen=new Set();
let posts=[],nextCursor=null,shown=0,fetching=false;
async function loadStories(reset=false) {
  if(fetching)return;
  fetching=true;
  const note=find('load'),retry=find('reload'),more=find('more'),list=find('stories');
  retry.hidden=true;more.disabled=true;
  if(reset){nextCursor=null;shown=0;posts=[];seen.clear();list.replaceChildren();}
  const cursor=nextCursor;
  try{
    if(reset||shown===posts.length){
      const path='community'+(cursor?'?cursor='+encodeURIComponent(cursor):'');
      const result=await request(path);
      if(!Array.isArray(result.posts))throw Error();
      for(const post of result.posts){
        if(!isPublic(post)||!post.id||!post.body||seen.has(post.id)||examples.has(post.id))continue;
        seen.add(post.id);posts.push(post);
      }
      nextCursor=typeof result.nextCursor==='string'&&result.nextCursor!==cursor?result.nextCursor:null;
    }
    const end=Math.min(posts.length,shown+visibleStep);
    list.append(...posts.slice(shown,end).map(storyCard));shown=end;
    note.textContent=shown?'':(nextCursor?'More conversations are available.':'No public conversations yet. You can start one or read the care questions below.');
    more.hidden=shown>=posts.length&&!nextCursor;
  }catch{
    note.textContent='Community conversations could not be loaded.';retry.hidden=false;more.hidden=true;
  }finally{fetching=false;more.disabled=false;}
}
find('reload').addEventListener('click',()=>loadStories(!shown));
find('more').addEventListener('click',()=>loadStories());
loadStories(true);
}

const standalone = document.querySelector('[data-owner-circle]');
if (standalone && !document.body.classList.contains('garden-page')) mountOwnerCircle(standalone);
