/* Gemeinsame goldene Rückseiten aus Sanity; bestehende Flip-, Swipe- und Cinema-Funktionen bleiben zuständig. */
(()=>{'use strict';
if(window.__ktdCardStories)return;window.__ktdCardStories=true;
const endpoint='https://ktd-spiegel.vercel.app/api/kartenstory';
const athletes={'helen kevric':'turnerin-6aae7d21bb1ce242130d0ff1','emma malewski':'turnerin-6ab4e646c392f321886bda7d','karina schönmaier':'turnerin-6aaf9d59873ff0f897ed95ab','lea marie quaas':'turnerin-6aafa5a2f97f052a1e2d04e0','madita mayr':'turnerin-6aafe6cbb2288cb5ac5bd400','jesenia schäfer':'turnerin-6aafe296073bebb8d3b929fc'};
const content=new Map(),pending=new WeakSet(),ready=new WeakSet();
const phases={qualifikation:'Quali',teamfinale:'Teamfinale',mehrkampffinale:'Mehrkampffinale',geraetefinale:'Finale',wettkampftag:'Wettkampftag'};
const devices={sprung:'Sprung',stufenbarren:'Stufenbarren',schwebebalken:'Balken',boden:'Boden',mehrkampf:'Mehrkampf'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number.isFinite(n)?n.toLocaleString('de-DE',{minimumFractionDigits:3,maximumFractionDigits:3}):null;
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('de-DE'):'';
const byScore=new Map();
function parts(s){return ['d','abzug','e','bonus'].filter(k=>Number.isFinite(s[k])&&(s[k]!==0||k==='d'||k==='e')).map(k=>`<span>${({d:'D',e:'E',abzug:'P',bonus:'Bonus'})[k]}: <b>${number(s[k])}</b></span>`).join('')}
function scoreHTML(w){
 let result=w.endnote,label=w.phase==='geraetefinale'?'Finale':'Wertung';
 if(w.device==='sprung'){
  if(w.sprung1&&w.sprung2){result=(w.sprung1.endnote+w.sprung2.endnote)/2+(w.sprungBonus||0);label='Finale'}
  else if(w.sprung1){result=w.sprung1.endnote;label='Sprung 1'}
  else label='Wettkampfwertung';
 }
 if(Number.isFinite(w.reportedScore))result=w.reportedScore;
 const top=Number.isFinite(result)?`<div class="score-top"><span>${label}${w.rang?' · Rang '+w.rang:''}</span><strong>${number(result)}</strong></div>`:'';
 const jumps=w.device==='sprung'?[1,2].filter(i=>w['sprung'+i]).map(i=>`<div class="vault-jump"><h4>Sprung ${i} · ${number(w['sprung'+i].endnote)}</h4><div class="score-parts">${parts(w['sprung'+i])}</div></div>`).join('')+(w.sprungBonus?`<p class="record-meta">Bonus +${number(w.sprungBonus)}</p>`:''):'';
 const regular=w.device!=='sprung'?`<div class="score-parts">${parts(w)}</div>`:'';
 return `<details class="routine-score" data-score-id="${esc(w._id)}"><summary>${top||'<span>Wertungsdetails</span>'}</summary>${jumps}${regular}</details>`;
}
function videoHTML(v){const label=/Sprung 2|\bVT2\b/i.test(v.title)?'Sprung 2':({sprung1:'Sprung 1',bericht:'Bericht',portraet:'Porträt',interview:'Interview',vlog:'Vlog'})[v.coverage]||'Übung';return `<a class="routine-video" href="https://www.youtube.com/watch?v=${esc(v.youtubeId)}&t=${v.start}s" data-youtube="${esc(v.youtubeId)}" data-start="${v.start}" data-title="${esc(v.title)}" aria-label="${esc(v.title)} abspielen"><div class="routine-thumb"><img src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/mqdefault.jpg" width="320" height="180" loading="lazy" alt=""><span class="play" aria-hidden="true">▶</span></div><span class="routine-caption">${label} · ${esc(v.channel)}</span></a>`}
const phaseLabel=w=>w.phaseLabel||phases[w.phase]||w.phase;
function rowHTML(w){return `<article class="record-row"><h4>${devices[w.device]}</h4><p class="record-meta">${esc(phaseLabel(w))} · ${date(w.datum)}</p>${(byScore.get(w._id)||[]).map(videoHTML).join('')}${scoreHTML(w)}</article>`}
async function hydrate(card,data){
 data.videos.forEach(v=>{const list=byScore.get(v.wertung)||[];if(!list.some(x=>x.youtubeId===v.youtubeId))byScore.set(v.wertung,[...list,v])});
 card.querySelectorAll('[data-clip]').forEach(slot=>{const v=[...data.videos,...data.weitereVideos].find(v=>v._id===slot.dataset.clip||v.youtubeId===slot.dataset.clip);if(v)slot.innerHTML=videoHTML(v)});
 card.querySelectorAll('[data-feature]').forEach(slot=>{const w=data.scores.find(w=>w._id===slot.dataset.feature);slot.innerHTML=`<p class="record-meta">${esc(w.event)} · ${esc(phaseLabel(w))} · ${date(w.datum)}</p>${(byScore.get(w._id)||[]).map(videoHTML).join('')}${scoreHTML(w)}`});
 const year=card.querySelector('[data-year]'),device=card.querySelector('[data-device]'),records=card.querySelector('[data-records]');
 const years=[...new Set(data.scores.map(w=>w.datum?.slice(0,4)).filter(Boolean))].sort().reverse();year.innerHTML='<option value="">Alle Jahre</option>'+years.map(y=>`<option>${y}</option>`).join('');
 let mode='videos';
 const additional=card.querySelector('[data-additional-videos]');additional.innerHTML=data.weitereVideos.map(v=>videoHTML(v)+`<span class="routine-title">${esc(v.title)}</span>`).join('');
 function filter(){
  const groups=new Map();
  for(const w of data.scores){if(year.value&&!w.datum?.startsWith(year.value)||device.value&&w.device!==device.value)continue;const key=w.eventId+'|'+w.datum+'|'+w.phase;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(w)}
  const sorted=[...groups.values()].sort((a,b)=>(b[0].datum||'').localeCompare(a[0].datum||''));
  if(mode==='videos')records.innerHTML=sorted.flatMap(group=>group.filter(w=>byScore.has(w._id)).map(w=>`<article class="record-row video-record"><h4 class="event-title">${esc(w.event)}</h4><p class="record-meta">${devices[w.device]} · ${esc(phaseLabel(w))} · ${date(w.datum)}</p>${(byScore.get(w._id)||[]).map(videoHTML).join('')}${scoreHTML(w)}</article>`)).join('');
  else records.innerHTML=sorted.map(group=>`<section class="record-event"><h4 class="event-title">${esc(group[0].event)}</h4><p class="record-meta">${date(group[0].datum)} · ${esc(phaseLabel(group[0]))}</p>${group.map(rowHTML).join('')}</section>`).join('');
  card.querySelector('.additional-videos').hidden=Boolean(year.value||device.value);
 }
 card.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;card.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter()}));
 year.addEventListener('change',filter);device.addEventListener('change',filter);filter();card.dataset.hydrated='true';
}

function storyHTML(data){
 const story=data.story,allClips=[...data.videos,...data.weitereVideos],scores=new Set(data.scores.map(w=>w._id));
 const paragraphs=story.einstiegText.map(p=>`<p>${esc(p)}</p>`).join('');
 const chapters=story.kapitel.map(c=>`<section class="story-chapter"><h3>${esc(c.titel)}</h3>${c.inhalte.map(item=>item._type==='absatz'?`<p>${esc(item.text)}</p>`:scores.has(item._ref)?`<div data-feature="${esc(item._ref)}"></div>`:allClips.some(v=>v._id===item._ref)?`<div data-clip="${esc(item._ref)}"></div>`:'').join('')}${/^https:\/\//.test(c.quelleUrl||'')?`<a class="source" href="${esc(c.quelleUrl)}" target="_blank" rel="noopener">${esc(c.quelleTitel)}</a>`:''}</section>`).join('');
 return `<section class="story-intro"><h3>${esc(story.einstiegTitel)}</h3>${paragraphs}</section>${chapters}`+"<section class=\"story-records\"><h3>Wertungen &amp; Videos</h3><div class=\"record-modes\"><button type=\"button\" data-mode=\"videos\" aria-pressed=\"true\">Videos &amp; Noten</button><button type=\"button\" data-mode=\"all\" aria-pressed=\"false\">Alle Wertungen</button></div><div class=\"record-controls\"><label>Saison<select data-year aria-label=\"Saison wählen\"></select></label><label>Gerät<select data-device aria-label=\"Gerät wählen\"><option value=\"\">Alle Geräte</option><option value=\"sprung\">Sprung</option><option value=\"stufenbarren\">Stufenbarren</option><option value=\"schwebebalken\">Balken</option><option value=\"boden\">Boden</option><option value=\"mehrkampf\">Mehrkampf</option></select></label></div><div data-records></div><section class=\"additional-videos\"><h3>Weitere Videos</h3><div data-additional-videos></div></section></section>"+`<a class="profile-link" href="${esc(data.profile)}">Porträt &amp; Medienspiegel</a>`;
}
async function load(card){
 if(ready.has(card)||pending.has(card))return;
 const ident=athletes[card.dataset.name?.trim().toLowerCase()];if(!ident)return;
 pending.add(card);
 try{
  if(!content.has(ident))content.set(ident,fetch(endpoint+'?id='+encodeURIComponent(ident),{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Kartenquelle nicht verfügbar');return r.json()}).catch(e=>{content.delete(ident);throw e}));
  const data=await content.get(ident);if(data.version!==1||data.id!==ident||!data.story)return;
  const back=card.querySelector('.flip-back'),scroll=back?.querySelector('.back-scroll'),heading=back?.querySelector('.back-heading');
  if(!back||!scroll||!heading)return;
  scroll.innerHTML=storyHTML(data);scroll.tabIndex=0;scroll.setAttribute('aria-label',data.name+': Geschichte, Wertungen und Videos');
  heading.innerHTML=`<h3>${esc(data.name)}</h3><p>${esc(data.story.untertitel)}</p>`;
  const close=back.querySelector('.flip-return');if(close)close.innerHTML='Zurück zum Foto <span aria-hidden="true">↶</span>';
  await hydrate(card,data);ready.add(card);card.classList.add('ktd-story');
 }catch(e){console.warn('Kartenrückseite konnte nicht aktualisiert werden',e.message)}
 finally{pending.delete(card)}
}
document.addEventListener('click',e=>{const button=e.target.closest('.flip-card .flip-button');if(button)load(button.closest('.flip-card'))},true);
const observer=new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='attributes'&&record.target.matches('.flip-card.is-flipped'))load(record.target);
  if(record.type==='childList')for(const node of record.addedNodes)if(node instanceof Element){
   if(node.matches('.flip-card.is-flipped'))load(node);
   node.querySelectorAll('.flip-card.is-flipped').forEach(load);
  }
 }
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
document.querySelectorAll('.flip-card.is-flipped').forEach(load);
})();



/* Stars release: use the approved backs only on this page. */
(()=>{if(location.pathname.replace(/\/$/,'')!=='/stars')return;
const script=document.createElement('script');script.src='https://ktd-spiegel.vercel.app/kartenstory/stars-v1.js?v=20261011-2';script.defer=true;document.head.append(script);
})();

/* Approved KTD portraits 2026-10-11 */
(()=>{if(!/^\/turnerin\/[^/]+\/?$/.test(location.pathname))return;const script=document.createElement('script');script.src='https://ktd-spiegel.vercel.app/portraet/portrait.js?v=20261011-1';script.defer=true;document.head.appendChild(script);})();

/* Rotterdam: editor-selected 2026 all-around preview; existing shared cinema handles playback. */
(()=>{'use strict';
if(location.pathname.replace(/\/$/,'')!=='/wettkampf/wm-rotterdam-2026')return;
function addWorldsPreview(){
 const section=document.querySelector('#ktd-rotterdam #videos'),layout=section?.querySelector('.video-layout');
 if(!layout||section.querySelector('[data-wm-preview="l_J29edxkbU"]'))return;
 const card=document.createElement('a');
 card.className='video wm-mehrkampf-preview';card.dataset.wmPreview='l_J29edxkbU';
 card.href='https://www.youtube.com/watch?v=l_J29edxkbU';card.target='_blank';card.rel='noopener';
 card.dataset.youtube='l_J29edxkbU';card.dataset.start='0';card.dataset.title='Wer greift nach Mehrkampf-Gold · WM Rotterdam 2026';
 card.setAttribute('aria-label','Wer greift nach Mehrkampf-Gold – Video von gymnicetics abspielen');
 card.innerHTML='<div class="video-thumb"><img src="https://i.ytimg.com/vi/l_J29edxkbU/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play" aria-hidden="true">▶</span></div><div class="video-text"><h3>Wer greift nach Mehrkampf-Gold</h3><p>Die Medaillenkandidatinnen im Mehrkampf – ein Videoausblick auf Rotterdam 2026.</p><small>Video: gymnicetics · 7:51 Minuten · YouTube</small></div>';
 const style=document.createElement('style');
 style.textContent='#ktd-rotterdam #videos .wm-mehrkampf-preview{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:center;margin-bottom:32px}#ktd-rotterdam #videos .wm-mehrkampf-preview .video-thumb{aspect-ratio:16/9;min-width:0}#ktd-rotterdam #videos .wm-mehrkampf-preview .video-thumb img{width:100%;height:100%;object-fit:cover}#ktd-rotterdam #videos .wm-mehrkampf-preview .video-text{min-width:0;padding:28px}@media(max-width:760px){#ktd-rotterdam #videos .wm-mehrkampf-preview{grid-template-columns:1fr}#ktd-rotterdam #videos .wm-mehrkampf-preview .video-text{padding:22px}}';
 section.insertBefore(style,layout);section.insertBefore(card,layout);
 const heading=section.querySelector('.section-heading h2');if(heading)heading.textContent='Videos zur Turn-WM Rotterdam 2026';
 const label=section.querySelector('.section-heading .outline-tag');if(label)label.textContent='Ausblick 2026 · Rückblick 2025';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addWorldsPreview,{once:true});else addWorldsPreview();
})();

/* Sanity country directory: Stars only, approved green Bento section. */
(()=>{if(location.pathname.replace(/\/$/,'')!=='/stars')return;const s=document.createElement('script');s.src='https://ktd-spiegel.vercel.app/turnerinnen/turnerinnen.js?v=20261014-photos';s.defer=true;document.head.append(s);})();

/* KTD home: lazy Sanity search strip, using the shared directory. */
(()=>{if(!['/','/kalender','/verstehen'].includes(location.pathname.replace(/\/$/,'')||'/'))return;const s=document.createElement('script');s.src='https://ktd-spiegel.vercel.app/turnerinnen/startsuche.js?v=20261014-photos';s.defer=true;document.head.append(s);})();

/* Requested: retain yellow news marquee, remove old home Worlds strip. */
(()=>{const band=document.querySelector('#ktd-home .marquee[aria-label="WM Rotterdam 2026"]');if(band&&[...band.querySelectorAll('.marquee-word')].every(word=>word.textContent.trim()==='Sonderseiten · WM Rotterdam'))band.remove();})();

/* Existing-page photos: same Sanity asset, bounded responsive delivery, no observers. */
(()=>{
'use strict';
if(/^\/turnerin\/[^/]+\/?$/.test(location.pathname)||window.__ktdSanityPhotos)return;window.__ktdSanityPhotos=true;
const allowed=u=>/^https:\/\/(?:cdn\.prod\.website-files\.com|uploads-ssl\.webflow\.com|assets\.website-files\.com|cdn\.sanity\.io)\//.test(u)&&/\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(u);
function variant(source,width){const u=new URL(source);u.searchParams.set('w',String(width));u.searchParams.set('fit','max');u.searchParams.set('auto','format');u.searchParams.set('q','82');u.searchParams.delete('fm');return u.href}
function optimized(source){const u=new URL(source);return (u.searchParams.has('w')||u.searchParams.has('h'))&&(u.searchParams.get('auto')==='format'||['webp','avif'].includes(u.searchParams.get('fm')))}
function applyImage(img,source){
 if(!img.isConnected||!source.startsWith('https://cdn.sanity.io/images/s2l1h79s/production/'))return;
 const r=img.getBoundingClientRect(),width=r.width>0?Math.ceil(r.width):640;
 img.srcset=[320,640,960,1280,1600].map(w=>variant(source,w)+' '+w+'w').join(', ');
 img.sizes=img.getAttribute('sizes')||`(max-width:700px) 100vw, ${width}px`;
 img.src=variant(source,Math.min(1600,Math.max(320,Math.ceil(width*2))));img.decoding='async';
 if(r.top>innerHeight+160)img.loading='lazy';
}
async function run(){
 const images=[...document.querySelectorAll('main img[src],article img[src],.arth img[src],#ktd-home img[src],#ktd-rotterdam img[src],#ktd-parents img[src],.main-wrapper img[src]')].filter(i=>allowed(i.src)&&i.getClientRects().length);
 const old=images.filter(i=>!i.src.startsWith('https://cdn.sanity.io/'));
 for(const img of images)if(img.src.startsWith('https://cdn.sanity.io/')&&!optimized(img.src))applyImage(img,img.src);
 const backgrounds=[...document.querySelectorAll('main section,main figure,article section,article figure,article [style*="url("],.arth [style*="url("],main .hero,main [style*="url("],.main-wrapper [style*="url("]')].map(el=>({el,value:getComputedStyle(el).backgroundImage})).filter(b=>/url\(/.test(b.value));
 const sources=[...new Set([...old.map(i=>i.src),...backgrounds.flatMap(b=>[...b.value.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]).filter(source=>allowed(source)&&!source.startsWith('https://cdn.sanity.io/')))])];
 for(let at=0;at<sources.length;at+=12){
  const batch=sources.slice(at,at+12);let mapped;
  try{const response=await fetch('https://ktd-spiegel.vercel.app/api/fotos?v=20261013b&sources='+encodeURIComponent(JSON.stringify(batch)));if(!response.ok)continue;mapped=await response.json()}catch{continue}
  for(const img of old){const source=img.src;if(Object.hasOwn(mapped,source)&&typeof mapped[source]==='string')applyImage(img,mapped[source]);}
  for(const b of backgrounds){if(!b.el.isConnected)continue;let value=b.value;
   for(const source of batch)if(Object.hasOwn(mapped,source)&&typeof mapped[source]==='string'&&mapped[source].startsWith('https://cdn.sanity.io/images/s2l1h79s/production/'))value=value.replaceAll(source,variant(mapped[source],1600));
   if(value!==b.value){b.el.style.backgroundImage=value;b.value=value;}
  }
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();

/* Approved KTD magazine report and Sanity news section, 2026-10-13. */
(()=>{
'use strict';const path=location.pathname.replace(/\/$/,'')||'/';
const report='/magazin/russische-turnerinnen-keine-visa-wm-2026';
const credits=document.createElement('style');credits.textContent=".credit,.arth-nachweis{font-family:Roboto,Arial,sans-serif!important;font-size:9px!important;font-weight:400!important;line-height:1.2!important;color:rgba(255,255,255,.48)!important;background:none!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;text-shadow:none!important;right:8px!important;bottom:10px!important;top:auto!important;writing-mode:horizontal-tb!important;transform:none!important;letter-spacing:0!important;pointer-events:none}";document.head.append(credits);
if(path===report){document.querySelector('.arth-text>p')?.classList.add('kd-initiale');const date=document.querySelectorAll('.arth-meta>div')[2];if(date){const value=new Date(date.textContent);if(!Number.isNaN(value.getTime()))date.textContent=value.toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})}const fonts=document.createElement('link');fonts.rel='stylesheet';fonts.href='https://fonts.googleapis.com/css2?family=Lilita+One&family=Roboto:wght@400;700&display=swap';document.head.append(fonts);const style=document.createElement('style');style.textContent=".arth-bildstrecke{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;margin:42px 0}.arth-text .arth-bildstrecke figure{margin:0!important;min-width:0;width:100%!important;max-width:none!important}.arth-bildstrecke-foto{position:relative;overflow:hidden;border-radius:18px}.arth-bildstrecke img{display:block;width:100%;height:auto;aspect-ratio:2/3;object-fit:cover;object-position:50% 35%}.arth-bildstrecke .credit{position:absolute}.arth-text .arth-bildstrecke figcaption{text-align:left!important;margin:12px 0 0!important;font:400 22px/1.2 'Lilita One',Arial,sans-serif!important;color:#2D0060}@media(max-width:600px){.arth-bildstrecke{grid-template-columns:1fr;gap:28px;margin:28px 0}}.arth-aufmacher{position:relative}.arth-aufmacher .arth-credit{position:absolute;right:10px;bottom:12px;font:400 9px/1.2 Roboto,Arial,sans-serif;color:rgba(255,255,255,.48);background:none;padding:0;margin:0;text-shadow:none;pointer-events:none}.arth-titel .arth-titel__dek{font-size:clamp(17px,1.6vw,20px);line-height:1.65;max-width:78ch}.arth-titel .arth-chip{background:#DCFF00;color:#2D0060}.arth-aufmacher img{object-fit:contain!important;object-position:center!important;background:#1C0040}.arth-lesebereich .arth-text > p.kd-initiale::first-letter{font-family:'Lilita One',Impact,sans-serif;float:left;font-size:3.3em;line-height:.8;padding:.08em .1em 0 0;margin:0;color:#E040AA}.arth-korpus{grid-template-columns:1fr!important}.arth-korpus .arth-text{max-width:76ch!important;margin-inline:auto!important}";document.head.append(style);document.querySelector('.arth-eyebrow')?.remove();document.querySelectorAll('.arth-korpus>.arth-seite,.arth-korpus>aside').forEach(e=>e.remove());const credit=document.querySelector('.arth-credit');if(credit)document.querySelector('.arth-aufmacher')?.append(credit);document.title='Drei russische Turnerinnen erhalten keine Visa für die WM · Kunstturnen Deutschland';}
function linkNames(root,athletes){
 if(!root||!Array.isArray(athletes))return;
 const aliases=new Map(),counts=new Map();
 const people=athletes.filter(a=>a.name&&(a.webflowId||a.profileUrl)&&/^[a-z0-9-]+$/.test(a.slug||''));
 people.forEach(a=>counts.set(a.surname,(counts.get(a.surname)||0)+1));
 people.forEach(a=>{aliases.set(a.name.toLocaleLowerCase('de'),a.profileUrl||'/turnerin/'+a.slug);if(a.surname&&counts.get(a.surname)===1)aliases.set(a.surname.toLocaleLowerCase('de'),a.profileUrl||'/turnerin/'+a.slug)});
 if(!aliases.size)return;const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('(?<![\\p{L}])('+[...aliases.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![\\p{L}])','giu');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('a,script,style,button,input,textarea'))nodes.push(n)}
 for(const node of nodes){const text=node.textContent;pattern.lastIndex=0;const matches=[...text.matchAll(pattern)];if(!matches.length)continue;const fragment=document.createDocumentFragment();let offset=0;for(const m of matches){fragment.append(text.slice(offset,m.index));const a=document.createElement('a');a.href=aliases.get(m[0].toLocaleLowerCase('de'));a.textContent=m[0];a.className='ktd-portrait-link';fragment.append(a);offset=m.index+m[0].length}fragment.append(text.slice(offset));node.replaceWith(fragment)}
}
const portraitStyle=document.createElement('style');portraitStyle.textContent='.arth a.ktd-portrait-link,#ktd-russinnen-eilmeldung a.ktd-portrait-link{color:inherit;text-decoration:none}.arth a.ktd-portrait-link:hover,#ktd-russinnen-eilmeldung a.ktd-portrait-link:hover{color:inherit;text-decoration:underline;text-underline-offset:3px}';document.head.append(portraitStyle);
const articleMatch=/^\/magazin\/([^/]+)$/.exec(path);
if(articleMatch)fetch('https://ktd-spiegel.vercel.app/api/magazin?slug='+encodeURIComponent(articleMatch[1])).then(r=>{if(!r.ok)throw Error('article');return r.json()}).then(data=>{const root=document.querySelector('.arth');if(!root)return;if(data.article?.title)document.title=data.article.title+' · Kunstturnen Deutschland';const date=root.querySelectorAll('.arth-meta>div')[2];if(date&&data.article?.date)date.textContent=new Date(data.article.date+'T12:00:00Z').toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'});if(data.article?.hasEditorialContext){root.querySelector('.arth-eyebrow')?.remove();const first=[...root.querySelectorAll('.arth-text>p')].find(p=>p.textContent.trim());first?.classList.add('kd-initiale');const initial=document.createElement('style');initial.textContent='.arth-text>p.kd-initiale::first-letter{float:left;font-family:Lilita One,Arial,sans-serif!important;font-size:3.3em!important;line-height:.8!important;color:#E040AA;padding:.08em .1em 0 0}';document.head.append(initial);}if(path!==report&&data.article?.contextHtml){let aside=root.querySelector('.arth-seite');if(!aside){aside=document.createElement('aside');aside.className='arth-seite';root.querySelector('.arth-korpus')?.append(aside)}if(data.article.hasEditorialContext||!aside.children.length)aside.innerHTML=data.article.contextHtml;else if(!aside.querySelector('.mag-teamkarte'))aside.insertAdjacentHTML('beforeend',data.article.contextHtml);aside.setAttribute('aria-label','Passende Inhalte');const style=document.createElement('style');style.textContent=".arth-korpus{align-items:start}.arth-seite{display:flex;flex-direction:column;gap:16px;min-width:0}.mag-kontext__karte{display:block;text-decoration:none!important;color:#fff!important;background:#2D0060;border-radius:16px;padding:22px}.mag-kontext__karte h3{font:400 24px/1.12 'Lilita One',Arial,sans-serif!important;color:#DCFF00!important;margin:0 0 10px!important}.mag-kontext__karte p{font:400 14px/1.55 Roboto,Arial,sans-serif!important;margin:12px 0 0!important;color:#fff!important}.mag-kontext__karte:hover h3{text-decoration:underline;text-underline-offset:4px}.mag-kontext__label{display:block;margin-bottom:10px;color:#FECBF1;font:400 12px/1.3 Roboto,Arial,sans-serif}.mag-kontext__foto{position:relative;overflow:hidden;border-radius:10px;margin-top:16px}.mag-kontext__foto img{width:100%;height:auto;display:block}.mag-kontext__foto .credit,.arth-credit{font:400 8px/1.2 Roboto,Arial,sans-serif!important;color:rgba(255,255,255,.48)!important;background:none!important;padding:0!important;text-shadow:none!important}.mag-kontext__foto .credit{position:absolute;right:7px;bottom:8px}\n.arth-text .mag-foto{width:100%!important;max-width:none!important;margin:28px 0!important}.mag-foto__motiv{position:relative;overflow:hidden;border-radius:18px}.mag-foto img{width:100%;height:auto;display:block}.mag-foto .credit{position:absolute;right:8px;bottom:9px;font:400 9px/1.2 Roboto,Arial,sans-serif;color:rgba(255,255,255,.48);background:none}.mag-foto figcaption{font:400 13px/1.5 Roboto,Arial,sans-serif;text-align:left;margin-top:9px}.arth-text .mag-foto--links{float:left;width:42%!important;margin:6px 26px 16px 0!important}.arth-text .mag-foto--rechts{float:right;width:42%!important;margin:6px 0 16px 26px!important}.mag-bildstrecke{display:grid;grid-template-columns:repeat(var(--fotos,2),minmax(0,1fr));gap:22px;clear:both}.arth-text .mag-bildstrecke .mag-foto{float:none;width:100%!important;margin:22px 0!important}.arth-text:after{content:'';display:block;clear:both}\n@media(max-width:760px){.arth-korpus{grid-template-columns:1fr!important}.arth-seite{display:grid;grid-template-columns:1fr;position:static!important;grid-column:auto!important;grid-row:auto!important;margin-top:24px}.arth-text .mag-foto--links,.arth-text .mag-foto--rechts{float:none;width:100%!important;margin:26px 0!important}.mag-bildstrecke{grid-template-columns:1fr}}\n\n.arth-seite{padding-top:0!important}\n";document.head.append(style)}linkNames(root,data.article?.athletes)}).catch(()=>{});

if(!['/','/magazin'].includes(path)||document.getElementById('ktd-russinnen-eilmeldung'))return;
const homeNews=path==='/';const root=document.querySelector(homeNews?'#ktd-home':'#ktd-magazin');if(!root)return;
if(homeNews){const heading=root.querySelector('#hero-title');if(heading)heading.textContent='Diese Kaderathletinnen vertreten unsere deutsche Nation bei der WM';root.querySelector('.hero-sub')?.remove();const applause=root.querySelector('.applaus');if(applause)applause.textContent='WIR SIND STOLZ AUF EUCH:';const pokal=root.querySelector('#aktuell .pokal-layout'),pokalCopy=pokal?.querySelector('.pokal-copy'),pokalPhoto=pokal?.querySelector('figure');if(pokalCopy&&pokalPhoto)pokalPhoto.before(pokalCopy);const favs=root.querySelector('#wm .favs-label');if(favs)for(const node of favs.childNodes)if(node.nodeType===Node.TEXT_NODE&&node.textContent.includes('FAVS'))node.textContent='';const oldSearch=root.querySelector('#wm-search');if(oldSearch){oldSearch.value='';oldSearch.hidden=true;oldSearch.disabled=true;oldSearch.style.setProperty('display','none','important');}if(!document.getElementById('wm-device-button-style')){const style=document.createElement('style');style.id='wm-device-button-style';style.textContent='#ktd-home #wm-device{display:inline-flex;align-items:center;justify-content:center;gap:16px;background:#FECBF1;color:#2D0060;border:0;border-radius:999px;padding:14px 24px;min-height:52px;font-size:clamp(20px,2vw,28px);line-height:1.1}#ktd-home #wm-device svg{width:22px;height:22px;flex-shrink:0}#ktd-home #wm-device:hover{background:#f9b6e8}#ktd-home #wm-device:focus-visible{outline:3px solid #2D0060;outline-offset:5px}#ktd-home #wm .device-picker{position:relative}';document.head.append(style);}}

})();



/* Artikelbeteiligung und Teameinladung, 2026-10-13. */
(()=>{'use strict';const match=location.pathname.match(/^\/magazin\/([a-z0-9-]{1,120})\/?$/);if(!match)return;function mount(){const text=document.querySelector('.arth-text');if(!text||document.querySelector('[data-beitragsbereich]'))return;const box=document.createElement('div');box.innerHTML="<section class=\"mag-beteiligung\" data-beitragsbereich data-artikel=\"__SLUG__\" aria-labelledby=\"beitragen-titel\"><h2 id=\"beitragen-titel\">Was möchtest du beitragen?</h2><div class=\"mag-auswahl\"><button type=\"button\" data-art=\"kommentar\" aria-expanded=\"false\">Kommentar schreiben</button><button type=\"button\" data-art=\"fehler\" aria-expanded=\"false\">Fehler melden</button></div><form class=\"mag-beitragsform\" hidden><div class=\"mag-felder\"><label data-name-label>Name · öffentlich beim Kommentar<input name=\"name\" autocomplete=\"name\" maxlength=\"80\" required></label><label>E-Mail · optional, nur für Rückfragen<input name=\"email\" type=\"email\" autocomplete=\"email\" maxlength=\"254\" ></label></div><label data-message-label>Deine Nachricht<textarea name=\"nachricht\" rows=\"5\" minlength=\"10\" maxlength=\"5000\" required></textarea></label><div class=\"mag-honig\" aria-hidden=\"true\"><label>Website<input name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div><label class=\"mag-zustimmung\"><input type=\"checkbox\" name=\"zustimmung\" required><span data-consent>Mein Kommentar darf nach redaktioneller Prüfung mit meinem Anzeigenamen veröffentlicht werden. Meine E-Mail bleibt vertraulich. <a href=\"/impressum#datenschutz\">Datenschutz</a></span></label><div class=\"mag-formabschluss\"><button class=\"mag-submit\" type=\"submit\">Kommentar senden</button><button class=\"mag-abbrechen\" type=\"button\">Schließen</button></div><p class=\"mag-status\" role=\"status\" aria-live=\"polite\" tabindex=\"-1\"></p></form><div class=\"mag-kommentare\" aria-label=\"Freigegebene Kommentare\"></div></section>".replace('__SLUG__',match[1]);text.append(...box.children);const css=document.createElement('link');css.rel='stylesheet';css.href='https://ktd-spiegel.vercel.app/magazin/beitraege.css';document.head.append(css);const script=document.createElement('script');script.src='https://ktd-spiegel.vercel.app/magazin/beitraege.js';script.defer=true;document.head.append(script);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();})();

/* Remove superseded round day counters; the exact WAG clock below stays independent. */
(()=>{
 'use strict';
 function removeLegacyDays(){
  document.querySelectorAll('.st-stk, .wm-countdown, .wk .t--zaehler').forEach(node=>node.remove());
  if(document.querySelector('.wk .t--quali')){
   const css=document.createElement('style');css.id='ktd-legacy-days-grid';
   css.textContent='.wk .t--quali{grid-column:8/13}@media(max-width:900px){.wk .t--quali{grid-column:1/7}}';
   document.head.append(css);
  }
  // Stars previously reserved room for its floating circular badge on phones.
  if(document.querySelector('#nationalteam .st-senior')){
   const css=document.createElement('style');css.id='ktd-legacy-days-spacing';
   css.textContent='@media(max-width:720px){#nationalteam .st-senior{margin-top:0}}';
   document.head.append(css);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeLegacyDays,{once:true});else removeLegacyDays();
})();

/* WM-Sonderseiten directly below navigation; compact fixed countdown. */
(()=>{
 'use strict';
function mountWmMarqueeExpiry(selector){
 const marquee=document.querySelector(selector);if(!marquee||marquee.dataset.expiryMounted)return;
 const end=Date.parse(marquee.dataset.expires);if(!Number.isFinite(end))return;
 marquee.dataset.expiryMounted='true';let timer;
 function refresh(){
  clearTimeout(timer);
  const left=end-Date.now();
  if(left<=0){marquee.remove();document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pageshow',refresh);return;}
  // Avoid the browser's 32-bit timeout limit; recheck when a tab becomes visible.
  if(!document.hidden)timer=setTimeout(refresh,Math.min(left,86400000));
 }
 document.addEventListener('visibilitychange',refresh);window.addEventListener('pageshow',refresh);refresh();
}

 function mount(){
  const anchor=document.getElementById('kdnavPlatz');
  if(!anchor||document.getElementById('ktd-countdown-style'))return;
  const css=document.createElement('style');css.id='ktd-countdown-style';
  css.textContent=`
  #ktd-wm-marquee,#ktd-deutschland-countdown{box-sizing:border-box;background:#FFFF00;color:#2D0060;font-family:'Lilita One',Impact,sans-serif}
  #ktd-wm-marquee{display:block;overflow:hidden;text-decoration:none;padding:12px 0 14px;font-size:clamp(30px,4.2vw,64px);line-height:1.08}
  #ktd-wm-marquee .dc-track{display:flex;width:max-content;animation:dc-scroll 26s linear infinite}
  #ktd-wm-marquee .dc-group{display:flex;flex-shrink:0}
  #ktd-wm-marquee .dc-word{white-space:nowrap;padding-inline:clamp(28px,4vw,64px)}
  #ktd-wm-marquee:hover .dc-track,#ktd-wm-marquee:focus-visible .dc-track{animation-play-state:paused}
  #ktd-wm-marquee:hover .dc-word,#ktd-wm-marquee:focus-visible .dc-word{text-decoration:underline;text-underline-offset:.13em;text-decoration-thickness:.09em}
  #ktd-wm-marquee:focus-visible{outline:3px solid #2D0060;outline-offset:-5px}
  #ktd-deutschland-countdown{position:fixed;inset:auto 0 0;z-index:8900;display:flex;align-items:center;justify-content:center;padding:9px 16px calc(11px + env(safe-area-inset-bottom,0px));text-decoration:none}
  #ktd-deutschland-countdown .dc-clock{display:flex;align-items:baseline;justify-content:center;gap:5px;font-size:clamp(32px,4.2vw,64px);line-height:1;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap}
  #ktd-deutschland-countdown .dc-number{font:inherit;display:inline-block;min-width:1.12em;text-align:center}
  #ktd-deutschland-countdown .dc-colon{font:inherit}
  #ktd-deutschland-countdown:focus-visible{outline:3px solid #2D0060;outline-offset:-5px}
  body{padding-bottom:var(--ktd-countdown-height,0px)!important}
  html{scroll-padding-bottom:calc(var(--ktd-countdown-height,0px) + 12px)}
  @keyframes dc-scroll{to{transform:translateX(-50%)}}
  @media(prefers-reduced-motion:reduce){#ktd-wm-marquee .dc-track{animation:none}}
  @media(max-width:650px){#ktd-wm-marquee{padding:11px 0 13px}#ktd-deutschland-countdown{padding-top:8px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}#ktd-deutschland-countdown .dc-clock{gap:3px;font-size:38px}}
  `;
  document.head.append(css);
  // The special already carries its news marquee; avoid a second, self-linking strip.
  if(location.pathname.replace(/\/$/,'')!=='/wettkampf/wm-rotterdam-2026'){
  const marquee=document.createElement('a');marquee.id='ktd-wm-marquee';marquee.dataset.expires='2026-10-25T17:00:00Z';marquee.href='/wettkampf/wm-rotterdam-2026';marquee.setAttribute('aria-label','WM-Sonderseiten');
  marquee.innerHTML='<span class="dc-track" aria-hidden="true">'+[0,1].map(()=>'<span class="dc-group">'+[0,1,2].map(()=>'<span class="dc-word">WM-Sonderseiten</span>').join('')+'</span>').join('')+'</span>';
  (anchor.closest('.w-nav')||anchor).after(marquee);
  mountWmMarqueeExpiry('#ktd-wm-marquee');
  }
  // WAG / deutscher Start: 18. Oktober, 16 Uhr MESZ (14 Uhr UTC).
  // Die Winterzeit beginnt erst am 25. Oktober; absolute Zeitdifferenz statt lokaler Stunden.
  const deadline=Date.parse('2026-10-18T16:00:00+02:00');
  if(Date.now()>=deadline)return;
  const banner=document.createElement('a');banner.id='ktd-deutschland-countdown';banner.href='/wettkampf/wm-rotterdam-2026#deutschland';banner.title='Deutscher WM-Start · Sonntag, 18. Oktober 2026, 16.00 Uhr';banner.setAttribute('aria-label',banner.title);
  banner.innerHTML='<span class="dc-clock" role="timer" aria-live="off">'+['days','hours','minutes','seconds'].map(key=>'<span class="dc-number" data-unit="'+key+'">00</span>').join('<span class="dc-colon" aria-hidden="true">:</span>')+'</span>';
  document.body.append(banner);
  const fields=Object.fromEntries([...banner.querySelectorAll('[data-unit]')].map(e=>[e.dataset.unit,e]));
  const size=()=>document.documentElement.style.setProperty('--ktd-countdown-height',banner.offsetHeight+'px');
  const observer=new ResizeObserver(size);observer.observe(banner);size();
  let timer;
  function tick(){
   const value=Math.max(0,Math.ceil((deadline-Date.now())/1000));
   if(!value){clearTimeout(timer);banner.remove();observer.disconnect();document.documentElement.style.removeProperty('--ktd-countdown-height');document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pageshow',refresh);return;}
   const values={days:Math.floor(value/86400),hours:Math.floor(value%86400/3600),minutes:Math.floor(value%3600/60),seconds:value%60};
   for(const [key,number] of Object.entries(values)){const next=String(number).padStart(2,'0');if(fields[key].textContent!==next)fields[key].textContent=next;}
   banner.querySelector('.dc-clock').setAttribute('aria-label',values.days+' Tage, '+values.hours+' Stunden, '+values.minutes+' Minuten und '+values.seconds+' Sekunden bis zum deutschen WM-Start');
   if(!document.hidden)timer=setTimeout(tick,1000-Date.now()%1000+15);
  }
  function refresh(){clearTimeout(timer);if(!document.hidden)tick();}
  document.addEventListener('visibilitychange',refresh);window.addEventListener('pageshow',refresh);tick();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();


/* Approved Rotterdam WM layout, backed by the existing Sanity endpoint. */
(()=>{if(location.pathname.replace(/\/$/,'')!=='/wettkampf/wm-rotterdam-2026')return;const s=document.createElement('script');s.src='https://ktd-spiegel.vercel.app/rotterdam/wm-page.js?v=20261015';s.defer=true;document.head.append(s)})();

/* Shared magazine listings: home, magazine and Worlds, from central Sanity articles. */
(()=>{const p=location.pathname.replace(/\/$/,'')||'/';if(!['/','/magazin','/wettkampf/wm-rotterdam-2026'].includes(p))return;const s=document.createElement('script');s.src='https://ktd-spiegel.vercel.app/magazin/teaser.js';s.defer=true;document.head.append(s)})();

(()=>{if(location.pathname.replace(/\/$/,'')!=='/magazin/reese-esponda-boden-fig-wm-2026')return;const css=document.createElement('link');css.rel='stylesheet';css.href='https://ktd-spiegel.vercel.app/magazin/reese.css';document.head.append(css);document.querySelector('.arth-nach')?.remove();const c=document.querySelector('.arth-credit');if(c)document.querySelector('.arth-aufmacher')?.append(c);const image=document.querySelector('.arth-aufmacher img');if(image){image.loading='eager';image.fetchPriority='high'}const h=[...document.querySelectorAll('.arth-text h2')].find(e=>e.textContent.startsWith('Kommentar:'));if(h){h.id='kommentar';h.classList.add('redaktion-kommentar');h.nextElementSibling?.classList.add('kommentar-autor')}const note=[...document.querySelectorAll('.arth-text p')].find(e=>e.textContent.startsWith('Die Angaben zur Mitteilung'));note?.classList.add('artikel-quellenhinweis')})();

/* Approved site-wide photo gallery; existing modules and settings stay unchanged. */
(()=>{function mount(){if(document.querySelector('script[data-ktd-photo-gallery]'))return;const css=document.createElement('link');css.rel='stylesheet';css.href='https://ktd-spiegel.vercel.app/galerie/galerie.css';document.head.append(css);const script=document.createElement('script');script.src='https://ktd-spiegel.vercel.app/galerie/galerie.js';script.dataset.ktdPhotoGallery='';script.defer=true;document.head.append(script)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount()})();

/* Approved news below navigation on home and Worlds special; green Worlds link on home only. */
(()=>{
'use strict';
const newsPath=location.pathname.replace(/\/$/,'')||'/';
if(newsPath!=='/wettkampf/wm-rotterdam-2026'||document.getElementById('ktd-jesenja-news'))return;
function mount(){
 const anchor=document.getElementById('kdnavPlatz');if(!anchor||document.getElementById('ktd-jesenja-news'))return;
 const css=document.createElement('style');
 css.textContent=`
 #ktd-jesenja-news{background:#ffff00;color:#2d0060;overflow:clip;font-family:'Lilita One',Impact,sans-serif}
 #ktd-jesenja-news .jn-track{display:flex;width:max-content;animation:jn-scroll 48s linear 2s infinite}
 #ktd-jesenja-news .jn-copy{flex-shrink:0;padding:26px 44px;font-size:clamp(30px,4.2vw,64px);line-height:1.15;white-space:nowrap}
 #ktd-jesenja-news a{color:inherit;text-decoration:none;text-underline-offset:.13em}
 #ktd-jesenja-news a:hover,#ktd-jesenja-news a:focus-visible{text-decoration:underline}
 #ktd-jesenja-news:focus-within .jn-track,#ktd-jesenja-news:hover .jn-track{animation-play-state:paused}
 #ktd-jesenja-news .jn-worlds{display:block;background:#2d0060;color:#73f127;text-align:center;font-size:clamp(32px,4vw,62px);line-height:1.1;padding:22px 20px}
 @keyframes jn-scroll{to{transform:translateX(-50%)}}
 @media(prefers-reduced-motion:reduce){#ktd-jesenja-news .jn-track{animation:none;width:100%}#ktd-jesenja-news .jn-copy{white-space:normal;padding:24px}#ktd-jesenja-news .jn-copy+ .jn-copy{display:none}}
 `;
 const news=document.createElement('aside');news.id='ktd-jesenja-news';news.setAttribute('aria-label','Eilmeldung');
 const track=document.createElement('div');track.className='jn-track';
 for(let i=0;i<2;i++){
  const copy=document.createElement('div');copy.className='jn-copy';if(i)copy.setAttribute('aria-hidden','true');
  const jesenja=document.createElement('a');jesenja.href='https://kunstturnen-deutschland.de/turnerin/jesenia-schaefer';jesenja.textContent='Jesenia Schäfer';const charleen=document.createElement('a');charleen.href='https://kunstturnen-deutschland.de/turnerin/charleen-pach';charleen.textContent='Charleen Pach';if(i){jesenja.tabIndex=-1;charleen.tabIndex=-1;}copy.append('EILMELDUNG: ',jesenja,' verletzt sich im WM Training und wird durch ',charleen,' ersetzt – COME BACK STRONGER');
  track.append(copy);
 }
 const worlds=document.createElement('a');worlds.className='jn-worlds';worlds.href='https://kunstturnen-deutschland.de/wettkampf/wm-rotterdam-2026';worlds.textContent='WM-Sonderseiten';
 news.append(track);if(newsPath==='/')news.append(worlds);document.head.append(css);(document.getElementById('ktd-wm-marquee')||anchor.closest('.w-nav')||anchor).after(news);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* Homepage team cards follow the same published Sanity roster as the Worlds special. */
(()=>{
'use strict';if(location.pathname!=='/')return;
async function refresh(){
 if(document.hidden)return;
 const rail=document.querySelector('#girls-component .girls-rail');if(!rail)return;
 const old=rail.querySelector('[data-athlete-id="turnerin-6aafe296073bebb8d3b929fc"]');if(!old)return;
 try{
  const response=await fetch('https://ktd-spiegel.vercel.app/api/rotterdam',{credentials:'omit'});if(!response.ok)return;
  const data=await response.json();if(data.version!==1||!data.germanyHtml)return;
  const template=document.createElement('template');template.innerHTML=data.germanyHtml;
  const replacement=template.content.querySelector('[data-athlete-id="turnerin-6ab3b2d1049c295fb62607d6"]');
  if(!replacement||template.content.querySelector('[data-athlete-id="turnerin-6aafe296073bebb8d3b929fc"]'))return;
  // Retain the card and controls: the established rail, flip and save listeners keep working.
  for(const selector of ['.portrait','.front-caption h3','.back-heading','.back-scroll']){
   const target=old.querySelector(selector),source=replacement.querySelector(selector);if(!target||!source)return;
  }
  const expanded=old.querySelector('.flip-button').getAttribute('aria-expanded');
  for(const selector of ['.portrait','.front-caption h3','.back-heading','.back-scroll'])old.querySelector(selector).innerHTML=replacement.querySelector(selector).innerHTML;
  for(const key of ['athleteId','ioc','name'])old.dataset[key]=replacement.dataset[key];
  for(const selector of ['.star-save','.flip-button','.flip-return']){
   const target=old.querySelector(selector),source=replacement.querySelector(selector);target.setAttribute('aria-label',source.getAttribute('aria-label'));
  }
  const save=old.querySelector('.star-save');save.dataset.save=replacement.dataset.athleteId;
  let saved=false;try{saved=JSON.parse(localStorage.getItem('ktd-dummy-stars-v1')||'[]').includes(save.dataset.save)}catch{}
  save.setAttribute('aria-pressed',String(saved));save.textContent=saved?'♥':'♡';
  old.querySelector('.flip-button').setAttribute('aria-expanded',expanded);
  old.querySelectorAll('.profile-link').forEach(a=>{const u=new URL(a.href);a.href='/turnerin/'+u.pathname.split('/').filter(Boolean).pop()});
  old.querySelectorAll('[data-photo-zoom]').forEach(e=>e.removeAttribute('data-photo-zoom'));
 }catch{/* Keep the complete existing card if the central endpoint is temporarily unavailable. */}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
setInterval(refresh,120000);document.addEventListener('visibilitychange',refresh);
})();

/* Approved: Team Deutschland film above Pauline's existing self-produced video. */
(()=>{'use strict';
function mount(){
 const prior=document.querySelector('#ktd-home #news');if(!prior||document.getElementById('karina-la28'))return;
 const section=prior.cloneNode(true);section.id='karina-la28';section.setAttribute('aria-labelledby','karina-la28-title');const label=section.querySelector('.home-news-label');if(label)label.textContent='News';
 const heading=section.querySelector('h2');heading.id='karina-la28-title';heading.textContent='Intime Einblicke in Karinas Weg zu den Olympischen Spielen 2028';
 const copy=section.querySelector('.home-news-copy');copy.replaceChildren();
 const p1=document.createElement('p'),name=document.createElement('a');name.href='https://kunstturnen-deutschland.de/turnerin/karina-schoenmaier';name.textContent='Karina Schönmaier';p1.append('Was von außen mühelos aussieht, ist für ',name,' tägliche Arbeit an winzigen Details.');
 const p2=document.createElement('p');p2.textContent='In „TAG FÜR TAG“ spricht sie offen über den Kampf mit dem eigenen Kopf, Rückhalt im Training und ihre Leidenschaft fürs Turnen.';
 const p3=document.createElement('p');p3.textContent='Die Team-Deutschland-Doku gibt persönliche Einblicke in ihren Alltag auf dem Weg nach Los Angeles 2028.';
 copy.append(p1,p2,p3);const layout=section.querySelector('.home-news-layout');if(label)layout.insertBefore(heading,label.nextSibling);else layout.prepend(heading);
 const video=section.querySelector('.home-news-video');video.href='https://www.youtube.com/watch?v=nkp7FmOyrWk';video.dataset.youtube='nkp7FmOyrWk';video.dataset.start='0';video.dataset.title='Karina Schönmaier · Noch 22 Monate bis LA28 · TAG FÜR TAG';video.setAttribute('aria-label','Karinas Weg nach Los Angeles 2028 abspielen');
 const img=video.querySelector('img');img.src='https://i.ytimg.com/vi/nkp7FmOyrWk/maxresdefault.jpg';img.removeAttribute('srcset');img.alt='Karina Schönmaier in der Team-Deutschland-Doku TAG FÜR TAG';section.querySelector('figcaption').textContent='TAG FÜR TAG · Team Deutschland · 6:12 Minuten';
 const css=document.createElement('style');css.textContent=`#ktd-home #karina-la28 .home-news-label{grid-column:1/-1;grid-row:1;background:#E040AA;border-color:#E040AA;color:#2D0060}#ktd-home #karina-la28 .home-news-copy,#ktd-home #karina-la28 figure{grid-row:3}#ktd-home #karina-la28-title{grid-column:1/-1;grid-row:2;font-size:clamp(36px,5.5vw,76px);line-height:1.04;letter-spacing:0;margin:0 0 12px}#ktd-home #karina-la28 .home-news-copy{min-height:0;justify-content:flex-start}#ktd-home #karina-la28 .home-news-copy p:last-child{margin-top:0}#ktd-home #karina-la28 .home-news-video{min-height:0;height:auto;width:100%;aspect-ratio:16/9}#ktd-home #karina-la28 figure{align-self:start}#ktd-home #karina-la28 .home-news-layout{align-items:start;row-gap:32px}@media(max-width:820px){#ktd-home #karina-la28-title{grid-column:1;grid-row:auto;font-size:clamp(34px,6vw,44px)}#ktd-home #karina-la28 .home-news-copy,#ktd-home #karina-la28 figure{grid-row:auto}}`;
 document.head.append(css);prior.before(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* Approved: alternating editorial rhythm; existing text, links and video retained. */
(()=>{'use strict';function mount(){
 const section=document.querySelector('#ktd-home #news');if(!section||section.dataset.videoRhythm)return;
 section.dataset.videoRhythm='true';const layout=section.querySelector('.home-news-layout'),heading=section.querySelector('#home-news-title');if(!layout||!heading)return;
 const label=section.querySelector('.home-news-label');if(label)layout.insertBefore(heading,label.nextSibling);else layout.prepend(heading);
 const style=document.createElement('style');style.textContent=`
 #ktd-home #news{background:#2D0060;color:#fff}
 #ktd-home #news .home-news-layout{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start;row-gap:32px}
 #ktd-home #news .home-news-label{grid-column:1/-1;grid-row:1;background:#E040AA;border-color:#E040AA;color:#2D0060}
 #ktd-home #news #home-news-title{grid-column:1/-1;grid-row:2;color:#73F127;margin:0 0 12px;font-size:clamp(36px,5.5vw,76px);line-height:1.04;letter-spacing:0}
 #ktd-home #news .home-news-copy{grid-column:2;grid-row:3;min-height:0}
 #ktd-home #news .home-news-copy p:last-child{margin-top:0}
 #ktd-home #news figure{grid-column:1;grid-row:3;align-self:start}
 #ktd-home #news .home-news-video,#ktd-home #karina-la28 .home-news-video{display:block;width:100%;height:auto;min-height:0;aspect-ratio:16/9;overflow:hidden}
 #ktd-home #news .home-news-video img,#ktd-home #karina-la28 .home-news-video img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}
 #ktd-home #news .home-news-play{background:#E040AA;color:#2D0060}
 #ktd-home #news a:focus-visible{outline-color:#73F127}
 #ktd-home #news figcaption,#ktd-home #karina-la28 figcaption{position:static;margin-top:14px}
 #ktd-home #news,#ktd-home #karina-la28{scroll-margin-top:100px}
 @media(max-width:820px){
  #ktd-home #news .home-news-layout{grid-template-columns:minmax(0,1fr)}
  #ktd-home #news #home-news-title{grid-column:1;grid-row:2;font-size:clamp(34px,6vw,44px)}
  #ktd-home #news .home-news-copy{grid-column:1;grid-row:3}
  #ktd-home #news figure{grid-column:1;grid-row:4}
 }
 `;document.head.append(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();})();

/* Medien-Einstiege: Preview 16.10.2026, Freigabe vor Livegang. */
(()=>{if(document.querySelector('script[data-media-entries-loader]'))return;const s=document.createElement('script');s.src='https://ktd-spiegel.vercel.app/medien/einstiege.js';s.dataset.mediaEntriesLoader='true';document.head.append(s)})();

/* Approved KTD card/navigation refinement, 2026-10-16. */
(()=>{'use strict';if(window.__ktdYellowCards)return;window.__ktdYellowCards=true;const style=document.createElement('style');style.dataset.ktdYellowCards='';style.textContent='.flip-back .portrait-card-link{display:flex;flex-shrink:0;justify-content:center;align-items:center;width:100%;min-height:44px;margin-top:12px;padding:11px 18px;border:0;border-radius:40px;background:#2D0060;color:#fff;font:700 14px/1.3 Roboto,Arial,sans-serif;text-align:center;text-decoration:none}\n.flip-back .portrait-card-link:hover{text-decoration:underline}\n.flip-back .portrait-card-link:focus-visible{outline:3px solid #E040AA;outline-offset:3px}\n/* Local card-front experiment: name carries the interaction, no extra button bar. */\n.flip-card .flip-front .flip-button{display:none!important}\n.flip-card .front-caption h3{margin-bottom:0}\nhtml .flip-card .flip-front .front-caption h3 strong{color:#FFFF00!important}\n.flip-card .front-caption h3 .card-name-toggle{display:block;width:100%;margin:0;padding:0;border:0;border-radius:0;background:none;color:inherit;text-align:left;cursor:pointer;font:inherit}\n.flip-card .card-name-toggle:focus-visible{outline:3px solid #FFFF00;outline-offset:7px;border-radius:3px}\n.flip-card .card-name-toggle:hover strong{text-shadow:0 2px 12px #1c0040}\n\n/* Functional flip cue beside the first name, matching the GW reference. */\n.flip-card .card-name-toggle>span::after{content:\'\';display:inline-block;width:7px;height:7px;margin-left:10px;margin-bottom:1px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(-45deg);vertical-align:middle}\n\n/* Local experiment: bright yellow card backs instead of gold. */\nhtml body .flip-card .flip-back,html body .flip-card.ktd-story .flip-back{background:#FFFF00!important}\n\nhtml body .flip-card[data-portrait-link="true"] .flip-back>.flip-return{display:none!important}\n';document.head.append(style);
 const targets=new WeakMap(),known=new Map();let queued=false;const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
 function update(){queued=false;document.querySelectorAll('a[href*="/turnerin/"]').forEach(a=>{if(!a.closest('.flip-card'))known.set(norm(a.textContent),new URL(a.href,location.href).pathname);});
 document.querySelectorAll('.st nav[aria-label="Alle Porträts"]').forEach(e=>e.remove());
 const subline=document.querySelector('#hall-of-fame .st-kopf>p');if(subline?.textContent.includes('Sie haben Geschichte geschrieben'))subline.remove();
  document.querySelectorAll('.flip-card').forEach(card=>{
   const back=card.querySelector('.flip-back');if(!back)return;
   const title=card.querySelector('.front-caption h3'),flip=card.querySelector('.flip-button');
   if(title&&flip&&!title.querySelector('.card-name-toggle')){const toggle=document.createElement('button');toggle.type='button';toggle.className='card-name-toggle';toggle.setAttribute('aria-label','Infos und Noten zu '+card.dataset.name);toggle.setAttribute('aria-expanded',String(card.classList.contains('is-flipped')));if(flip.getAttribute('aria-controls'))toggle.setAttribute('aria-controls',flip.getAttribute('aria-controls'));while(title.firstChild)toggle.append(title.firstChild);title.append(toggle);toggle.addEventListener('click',()=>{flip.click();toggle.setAttribute('aria-expanded','true');});}

   const source=back.querySelector('a.profile-link[href*="/turnerin/"]');
   if(source){const u=new URL(source.href,location.href);targets.set(card,u.pathname);}
   const target=targets.get(card)||known.get(norm(card.dataset.name));if(!target)return;const href=target;
   const name=(card.querySelector('.front-caption h3 span')?.textContent||card.dataset.name?.split(/\s+/)[0]||'').trim();if(!name)return;
   let link=back.querySelector('.portrait-card-link');
   if(!link){const old=back.querySelector('.flip-return');if(!old)return;link=document.createElement('a');link.className='portrait-card-link';old.after(link);card.dataset.portraitLink='true';}
   const label='Porträt von '+name;
   if(link.textContent!==label)link.textContent=label;
   if(link.getAttribute('href')!==href)link.setAttribute('href',href);
   back.querySelectorAll('.back-scroll .profile-link').forEach(a=>a.remove());
  });
 }
 document.addEventListener('click',e=>{const button=e.target.closest('.flip-button');if(button)requestAnimationFrame(()=>button.closest('.flip-card')?.querySelector('.portrait-card-link')?.focus({preventScroll:true}));},true);
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const card=e.target.closest('.flip-card');if(card)requestAnimationFrame(()=>{const toggle=card.querySelector('.card-name-toggle');toggle?.setAttribute('aria-expanded','false');toggle?.focus({preventScroll:true});});},true);
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
 const observer=new MutationObserver(records=>{if(records.some(r=>r.target.closest?.('.flip-card')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.flip-card,.st')||n.querySelector?.('.flip-card')))))schedule();});observer.observe(document.body,{childList:true,subtree:true});schedule();
})();

/* Full-frame editorial photography and understated article links, 2026-10-16. */
(()=>{if(!/^\/magazin\/[^/]+\/?$/.test(location.pathname))return;const s=document.createElement('style');s.id='ktd-article-full-frame';s.textContent="/* Large, uncropped photographs throughout article bodies. */\n.arth .arth-text :is(figure,.mag-foto){float:none!important;width:100%!important;max-width:none!important;margin:36px 0!important}\n.arth .arth-text :is(.arth-bildstrecke,.mag-bildstrecke){display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:36px!important}\n.arth :is(.arth-aufmacher,.mag-foto__motiv,.arth-bildstrecke-foto){height:auto!important;max-height:none!important;aspect-ratio:auto!important}\n.arth :is(.arth-text,.arth-aufmacher) img{position:static!important;display:block!important;width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:auto!important;object-fit:contain!important}\n.arth :is(.arth-text,.arth-titel,.arth-aufmacher,figcaption,.arth-bildunterschrift) a,\n.arth :is(.arth-text,.arth-titel,.arth-aufmacher,figcaption,.arth-bildunterschrift) a:hover,\n.arth :is(.arth-text,.arth-titel,.arth-aufmacher,figcaption,.arth-bildunterschrift) a:focus-visible{color:inherit!important;text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:4px!important}\n";document.head.append(s);function prepareImages(){document.querySelectorAll('.arth .arth-text img,.arth .arth-aufmacher img').forEach(img=>{const match=(img.currentSrc||img.getAttribute('src')||'').match(/-(\d+)x(\d+)\.[a-z]+(?:[?#]|$)/i);const w=match?Number(match[1]):Number(img.getAttribute('width')),h=match?Number(match[2]):Number(img.getAttribute('height'));if(w>0&&h>0){img.setAttribute('width',String(w));img.setAttribute('height',String(h));img.style.setProperty('aspect-ratio',w+' / '+h,'important')}else img.loading='eager'})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepareImages,{once:true});else prepareImages()})();

/* Approved KTD editorial commentary in rose, 2026-10-16. */
(()=>{if(!/^\/magazin\/[^/]+\/?$/.test(location.pathname))return;const s=document.createElement('style');s.id='ktd-comment-surface';s.textContent=".arth .arth-text .ktd-kommentar{\n  background:#FECBF1;\n  color:#2D0060;\n  border-radius:24px;\n  margin:52px 0;\n  padding:clamp(24px,4vw,44px);\n}\n.arth .arth-text .ktd-kommentar>h2:first-child{margin-top:0!important;color:inherit;scroll-margin-top:120px}\n.arth .arth-text .ktd-kommentar>p:last-child{margin-bottom:0!important}\n.arth .arth-text .ktd-kommentar>.kommentar-autor{font-size:15px;line-height:1.5;margin-bottom:26px}\n.arth .arth-text .ktd-kommentar a{color:inherit!important;text-decoration:underline!important;text-underline-offset:4px}\n@media(max-width:600px){.arth .arth-text .ktd-kommentar{margin:36px 0;border-radius:18px;padding:26px 22px}}\n";document.head.append(s)})();
/* Existing editorial commentary receives its own KTD rose surface. */
(()=>{
 'use strict';
 if(!/^\/magazin\/[^/]+\/?$/.test(location.pathname))return;
 function mount(){
  document.querySelectorAll('.arth-text h2').forEach(heading=>{
   if((!heading.textContent.trim().startsWith('Kommentar:')&&!heading.nextElementSibling?.textContent.trim().startsWith('Ein Kommentar von '))||heading.closest('.ktd-kommentar'))return;
   const section=document.createElement('section');section.className='ktd-kommentar';
   if(!heading.id)heading.id=document.getElementById('kommentar')?'kommentar-redaktion':'kommentar';
   section.setAttribute('aria-labelledby',heading.id);heading.before(section);
   let node=heading;
   while(node){
    const next=node.nextSibling;
    if(node!==heading&&node.nodeType===1&&(node.matches('h2,[data-beitragsbereich],.mag-beteiligung,.mag-sources')))break;
    section.append(node);node=next;
   }
   const author=heading.nextElementSibling;
   if(author?.tagName==='P'&&/^(?:Von |Ein Kommentar von )/.test(author.textContent.trim()))author.classList.add('kommentar-autor');
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* Matthias, 19.10.2026: neuer Pauline-Aufmacher; im Magazin beide eigenen Filme erhalten. */
(()=>{'use strict';
const path=location.pathname.replace(/\/$/,'')||'/';if(path!=='/'&&path!=='/magazin')return;
const clip='B89sRdqcfVo',oldClip='fSK_MBHWcCA';
const title='Meine zweite Hüft-OP! Plötzlich ging alles ganz schnell | Pauline Schäfer-Betz';
function copy(){
 const box=document.createElement('div');
 const p1=document.createElement('p'),name=document.createElement('a');name.href='/turnerin/pauline-schaefer-betz';name.textContent='Pauline Schäfer';p1.append('Beeindruckend, wie ',name,' mit schonungsloser Ehrlichkeit ihre Gefühle und ihre Entschlossenheit teilt.');
 const p2=document.createElement('p');p2.textContent='Sie will zu den Olympischen Spielen 2028 – und Kunstturnen Deutschland ist überzeugt, dass sie es schaffen wird.';
 const p3=document.createElement('p');p3.textContent='Die ganze Turnfamilie wünscht ihr eine vollständige Genesung und eine baldige Rückkehr auf die Matten, die die Welt bedeuten.';
 const p4=document.createElement('p'),channel=document.createElement('a');channel.href='https://www.youtube.com/@pauline_schaefer';channel.target='_blank';channel.rel='noopener';channel.textContent='Abonniert ihren Kanal.';p4.append(channel);box.append(p1,p2,p3,p4);return [...box.children];
}
function video(link){
 link.href='https://www.youtube.com/watch?v='+clip;link.dataset.youtube=clip;link.dataset.start='0';link.dataset.title=title;link.setAttribute('aria-label','Paulines Video Meine zweite Hüft-OP abspielen');
 const img=link.querySelector('img');if(img){img.src='https://i.ytimg.com/vi/'+clip+'/maxresdefault.jpg';img.removeAttribute('srcset');img.alt='Pauline Schäfer-Betz berichtet über ihre zweite Hüftoperation';img.width=1280;img.height=720;}
}
function mount(){
 if(path==='/'){
  const s=document.querySelector('#ktd-home #news'),link=s?.querySelector('.home-news-video'),body=s?.querySelector('.home-news-copy'),heading=s?.querySelector('#home-news-title');
  if(!s||!link||!body||!heading||s.dataset.paulineOp==='20261019')return;
  s.dataset.paulineOp='20261019';heading.textContent='Paulines zweite Hüft-OP';s.setAttribute('aria-label','Paulines zweite Hüft-OP');body.replaceChildren(...copy());video(link);const cap=s.querySelector('figcaption');if(cap)cap.textContent='Meine zweite Hüft-OP! Plötzlich ging alles ganz schnell';
 }else{
  const lead=document.querySelector('#ktd-magazin #aktuelles .lead'),old=lead?.querySelector('a[data-youtube="'+oldClip+'"]'),heading=lead?.querySelector('h2');
  if(!lead||!old||!heading||lead.dataset.paulineOp==='20261019')return;
  lead.dataset.paulineOp='20261019';const original=old.closest('figure'),latest=original.cloneNode(true);latest.dataset.paulineFilm='neu';original.dataset.paulineFilm='bisher';video(latest.querySelector('a'));lead.prepend(latest);
  heading.textContent='Paulines zweite Hüft-OP';lead.querySelectorAll(':scope > p').forEach(p=>p.remove());let previous=heading;for(const p of copy()){previous.after(p);previous=p;}previous.after(original);
  for(const [figure,text] of [[latest,'Meine zweite Hüft-OP! Plötzlich ging alles ganz schnell'],[original,'Warum ich die WM absagen musste?!']]){let caption=figure.querySelector('figcaption');if(!caption){caption=document.createElement('figcaption');figure.append(caption);}caption.textContent=text;}
 }
}
function start(){
 const style=document.createElement('style');style.id='ktd-pauline-op-20261019';style.textContent=`
 #ktd-home #news .home-news-copy a,#ktd-magazin #aktuelles .lead[data-pauline-op] p a{color:inherit;text-decoration:underline;text-underline-offset:.15em}
 #ktd-home #news .home-news-play,#ktd-magazin #aktuelles .lead[data-pauline-op] .play{background:#FFFF00!important;color:#2D0060!important;left:auto!important;top:auto!important;right:16px!important;bottom:16px!important;transform:none!important}
 #ktd-magazin #aktuelles .lead[data-pauline-op] .media{height:auto;min-height:0;aspect-ratio:auto}
 #ktd-magazin #aktuelles .lead[data-pauline-op] .media .poster{display:block;aspect-ratio:16/9;position:relative}
 #ktd-magazin #aktuelles .lead[data-pauline-op] .media img{display:block;position:static;width:100%;height:100%;object-fit:contain}
 #ktd-magazin #aktuelles .lead[data-pauline-op] figcaption{position:static;padding:12px 16px;font:400 14px/1.45 Roboto,Arial,sans-serif;background:#2D0060;color:#fff}
 #ktd-magazin #aktuelles .lead[data-pauline-op] figure[data-pauline-film="bisher"]{margin-top:28px}
 `;document.head.append(style);mount();let queued=false;new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;mount()})}}).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Matthias, 19.10.2026: Pauline ersetzt nur Karinas Podiumtraining an dessen bisheriger Position. */
(()=>{'use strict';if((location.pathname.replace(/\/$/,'')||'/')!=='/')return;
function move(){const root=document.querySelector('#ktd-home'),target=root?.querySelector('#karina-podiumtraining'),pauline=root?.querySelector('#news');if(!target||!pauline)return;pauline.dataset.paulinePosition='podiumtraining';target.replaceWith(pauline);}
function start(){move();let queued=false;new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;move()})}}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();

/* Approved Rotterdam special, 19 October 2026. */
/* One WM renderer, only where used, after the replacement root is ready. */
(()=>{
  const path=location.pathname.replace(/\/$/,'')||'/';
  if(path!=='/'&&path!=='/wettkampf/wm-rotterdam-2026')return;
  const source='https://kunstturnen-deutschland.github.io/ktd-design/rotterdam-live-20261019/wm-gold-release.js?v=20261019-1730';

  // Own team photograph: retain the caption, never display the supplier credit.
  // Keep this at the shared renderer boundary so future live-result updates remain live.
  const ownPhoto='6ad5c594d8ebf4fd9a049342_';
  function cleanOwnCaption(){
    document.querySelectorAll('#ktd-home-wm figure, #ktd-rotterdam figure').forEach(figure=>{
      const img=figure.querySelector('img'),caption=figure.querySelector('figcaption');
      if(!img||!caption||!(img.getAttribute('src')||'').includes(ownPhoto))return;
      const text=caption.textContent;
      const clean=text.replace(/\s*Bereitgestellt von Matthias (?:Wellmer|Wämer)\.?/gi,'').trim();
      if(clean!==text)caption.textContent=clean;
    });
  }
  cleanOwnCaption();
  new MutationObserver(cleanOwnCaption).observe(document.body,{childList:true,subtree:true,characterData:true});

  let observer;
  function load(){
    if(path!=='/'&&!document.querySelector('#ktd-rotterdam[data-wm-live-design]'))return;
    observer?.disconnect();
    if(document.querySelector('script[data-ktd-wm-single-loader]'))return;
    const script=document.createElement('script');script.src=source;script.dataset.ktdWmSingleLoader='';document.head.append(script);
  }
  if(path!=='/'){
    observer=new MutationObserver(load);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-wm-live-design']});
  }
  load();
})();

