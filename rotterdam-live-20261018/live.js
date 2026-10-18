/* KTD Rotterdam live report, v1. Sanity article -> existing Webflow mirror -> both pages.
 * The unpublished report is a 404: the section stays absent until the first real dispatch.
 * Source: /magazin/live-aus-rotterdam-2026, never credentials or private Sanity data.
 */
(()=>{'use strict';
  if(window.__ktdRotterdamLive)return;window.__ktdRotterdamLive=true;
  const source='/magazin/live-aus-rotterdam-2026';
  const root=document.querySelector('#ktd-home')||document.querySelector('#ktd-rotterdam');
  if(!root)return;
  const athletes=[{"name":"Helen Kevric","image":"https://cdn.sanity.io/images/s2l1h79s/production/d3ab9f540571b6a202578e9acd861083f951ac50-2398x1599.jpg?w=900&auto=format&q=85","credit":"IMAGO / Schreyer"},{"name":"Emma Malewski","image":"https://cdn.sanity.io/images/s2l1h79s/production/7a869c9a2bd86b1f972cd12c2ead320814e964b4-3132x4698.jpg?w=900&auto=format&q=85","credit":"IMAGO / Schreyer"},{"name":"Madita Mayr","image":"https://cdn.sanity.io/images/s2l1h79s/production/b144623bf49960ddda06fe804253054f2cce010d-5504x8256.jpg?w=900&auto=format&q=85","credit":"IMAGO / Michael Weber"},{"name":"Lea Marie Quaas","image":"https://cdn.sanity.io/images/s2l1h79s/production/30c2fb22109d2708125e2ad01a5a7c6ba93d0af8-5472x3648.jpg?w=900&auto=format&q=85","credit":"IMAGO / Herrmann Agenturfotografie"},{"name":"Jesenia Schäfer","image":"https://cdn.sanity.io/images/s2l1h79s/production/07cad04298dc83793dc308dcb22ad2798b6bfc88-4500x3000.jpg?w=900&auto=format&q=85","credit":"IMAGO / Eibner"},{"name":"Karina Schönmaier","image":"https://cdn.sanity.io/images/s2l1h79s/production/9ad026ad2374c349143befc8a50e8c35ba63eab7-3000x2000.jpg?w=900&auto=format&q=85","credit":"IMAGO / Beautiful Sports"}];
  const devices=['Sprung','Barren','Balken','Boden'];
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const aliases={sprung:'Sprung',vt:'Sprung',barren:'Barren',stufenbarren:'Barren',ub:'Barren',balken:'Balken',schwebebalken:'Balken',bb:'Balken',boden:'Boden',fx:'Boden'};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const safeUrl=(value,image=false)=>{try{const u=new URL(value,location.origin);if(!/^https?:$/.test(u.protocol))return null;if(image&&!['cdn.sanity.io','cdn.prod.website-files.com','assets-global.website-files.com'].includes(u.hostname))return null;return u.href;}catch{return null;}};
  function parseScore(text){
    const m=text.trim().match(/^Ergebnis:\s*([^|]+)\|\s*([^|]+)\|\s*(\d{1,2}[.,]\d{1,3})(?:\s*\|\s*(.*))?$/i);
    if(!m)return null;const athlete=athletes.find(a=>normalize(a.name)===normalize(m[1]));const device=aliases[normalize(m[2])];const value=Number(m[3].replace(',','.'));
    if(!athlete||!device||!Number.isFinite(value)||value<0||value>30)return null;
    return {name:athlete.name,device,value,detail:m[4]||''};
  }
  function copySafe(node){
    if(node.nodeType===3)return document.createTextNode(node.textContent);
    if(node.nodeType!==1)return null;const tag=node.tagName.toLowerCase();
    if(['script','style','iframe','object','embed','form','input','button'].includes(tag))return null;
    if(tag==='img'){
      const src=safeUrl(node.getAttribute('src'),true);if(!src)return null;
      const img=el('img');img.src=src;img.alt=node.getAttribute('alt')||'';img.loading='lazy';img.decoding='async';return img;
    }
    const keep=['p','strong','b','em','i','br','ul','ol','li','blockquote','figure','figcaption','a'];
    const n=el(keep.includes(tag)?tag:'div');if(tag==='a'){const href=safeUrl(node.getAttribute('href'));if(href){n.href=href;n.rel='noopener';}}
    for(const child of node.childNodes){const clean=copySafe(child);if(clean)n.append(clean);}return n;
  }
  function parse(html){
    const doc=new DOMParser().parseFromString(html,'text/html');const body=doc.querySelector('.arth-text.w-richtext');
    if(!body)return null;
    const entries=[];let current=null;
    for(const node of body.children){
      const match=/^([0-2]?\d:[0-5]\d)\s*(?:Uhr)?\s*(?:[·|–—-]\s*)?(.*)$/.exec(node.textContent.trim());
      if(/^H[2-4]$/.test(node.tagName)&&match){
        if(Number(match[1].split(':')[0])>23)continue;
        current={time:match[1].padStart(5,'0'),title:match[2]||'Aus der Halle',nodes:[],scores:[]};entries.push(current);
      }else if(current){current.nodes.push(node);const score=parseScore(node.textContent);if(score)current.scores.push(score);}
    }
    if(!entries.length)return null;
    entries.sort((a,b)=>b.time.localeCompare(a.time));
    const hero=doc.querySelector('.arth-aufmacher img');const heroSrc=hero&&safeUrl(hero.getAttribute('src'),true);
    return {entries,hero:heroSrc?{src:heroSrc,alt:hero.getAttribute('alt')||'Die Halle bei der Turn-WM in Rotterdam',caption:doc.querySelector('.arth-bu')?.textContent.trim()||''}:null};
  }
  const style=el('style');style.textContent=`
  #ktd-live-rotterdam{--lr-v:#2D0060;--lr-deep:#1C0040;--lr-green:#76F637;--lr-pink:#E040AA;--lr-yellow:#DCFF00;--lr-light:#E7DEF6;background:var(--lr-v);color:#fff;font:400 17px/1.55 Roboto,Arial,sans-serif;isolation:isolate;scroll-margin-top:90px}
  #ktd-live-rotterdam *{box-sizing:border-box}
  #ktd-live-rotterdam [hidden]{display:none!important}
  #ktd-live-rotterdam h2,#ktd-live-rotterdam h3,#ktd-live-rotterdam h4{color:inherit;margin:0;font-family:'Lilita One',Impact,sans-serif;font-weight:400;line-height:1.08;letter-spacing:0;text-transform:none;max-width:none}
  #ktd-live-rotterdam a{color:inherit}
  #ktd-live-rotterdam button{font:700 15px/1.2 Roboto,Arial,sans-serif;cursor:pointer;min-height:44px;border:0;border-radius:99px;padding:13px 22px;background:var(--lr-pink);color:var(--lr-v)}
  #ktd-live-rotterdam :is(button,a):focus-visible{outline:3px solid var(--lr-yellow);outline-offset:5px}
  #ktd-live-rotterdam .lr-wrap{max-width:1600px;margin:0 auto;padding:48px clamp(20px,5vw,70px)}
  #ktd-live-rotterdam .lr-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;align-items:end;margin-bottom:28px}
  #ktd-live-rotterdam .lr-kicker{color:var(--lr-pink);font-size:14px;font-weight:700;margin:0 0 12px}
  #ktd-live-rotterdam h2{font-size:clamp(36px,5.5vw,76px);color:var(--lr-green)}
  #ktd-live-rotterdam .lr-badge{display:inline-flex;align-items:center;gap:8px;background:var(--lr-yellow);color:var(--lr-v);padding:9px 16px;border-radius:99px;font-size:14px;font-weight:700}
  #ktd-live-rotterdam .lr-badge::before{content:'';width:8px;height:8px;background:currentColor;border-radius:50%}
  #ktd-live-rotterdam .lr-hero{margin:0;background:var(--lr-deep)}
  #ktd-live-rotterdam .lr-hero img{display:block;width:100%;max-height:78vh;object-fit:cover;height:auto;margin:0}
  #ktd-live-rotterdam .lr-hero figcaption{padding:10px clamp(20px,5vw,70px);font-size:12px;color:var(--lr-light)}
  #ktd-live-rotterdam .lr-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:clamp(28px,5vw,70px);align-items:start}
  #ktd-live-rotterdam h3{font-size:clamp(28px,3vw,42px);margin-bottom:24px}
  #ktd-live-rotterdam .lr-stream{list-style:none;margin:0;padding:0}
  #ktd-live-rotterdam .lr-entry{position:relative;border-left:2px solid #ffffff30;padding:0 0 36px 24px;margin-left:5px;overflow-wrap:anywhere}
  #ktd-live-rotterdam .lr-entry::before{content:'';position:absolute;width:12px;height:12px;border-radius:50%;background:var(--lr-pink);left:-7px;top:6px}
  #ktd-live-rotterdam time{display:block;color:var(--lr-pink);font-size:14px;font-weight:700;margin-bottom:8px;font-variant-numeric:tabular-nums}
  #ktd-live-rotterdam h4{font-size:clamp(25px,2.3vw,34px);margin-bottom:12px}
  #ktd-live-rotterdam .lr-copy p{font-size:17px;margin:0 0 16px;line-height:1.6}
  #ktd-live-rotterdam .lr-copy img{display:block;width:100%;height:auto;border-radius:14px;margin:16px 0 8px}
  #ktd-live-rotterdam .lr-copy figure{margin:16px 0}
  #ktd-live-rotterdam .lr-copy figcaption{font-size:12px;color:var(--lr-light)}
  #ktd-live-rotterdam .lr-scoreline{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;padding:14px 18px;background:var(--lr-green);color:var(--lr-v);border-radius:14px;margin:16px 0}
  #ktd-live-rotterdam .lr-scoreline strong{font-family:'Lilita One',Impact,sans-serif;font-size:34px;font-weight:400}
  #ktd-live-rotterdam .lr-scoreline small{flex-basis:100%;font-size:13px}
  #ktd-live-rotterdam .lr-scores{background:var(--lr-deep);border-radius:22px;padding:24px;min-width:0}
  #ktd-live-rotterdam .lr-person{display:grid;grid-template-columns:70px minmax(0,1fr);gap:16px;padding:20px 0;border-top:1px solid #ffffff25}
  #ktd-live-rotterdam .lr-person-photo{margin:0}
  #ktd-live-rotterdam .lr-person-photo img{width:70px;height:86px;object-fit:cover;object-position:50% 22%;border-radius:10px;display:block}
  #ktd-live-rotterdam .lr-person-photo figcaption{font-size:8px;line-height:1.3;margin-top:5px;color:var(--lr-light)}
  #ktd-live-rotterdam .lr-person-name{font-size:17px;font-weight:700;margin:0 0 10px}
  #ktd-live-rotterdam dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0}
  #ktd-live-rotterdam dt{font-size:11px;color:var(--lr-light)}
  #ktd-live-rotterdam dd{font-size:clamp(16px,1.6vw,21px);font-weight:700;margin:2px 0 0;font-variant-numeric:tabular-nums;color:var(--lr-green)}
  #ktd-live-rotterdam .lr-note{font-size:12px;color:var(--lr-light);margin:20px 0 0}
  #ktd-live-rotterdam .lr-status{font-size:12px;color:var(--lr-light);margin:18px 0 0;min-height:18px}
  @media(max-width:900px){#ktd-live-rotterdam .lr-layout{grid-template-columns:1fr}#ktd-live-rotterdam .lr-scores{grid-row:1}#ktd-live-rotterdam .lr-wrap{padding-block:32px}#ktd-live-rotterdam .lr-person{grid-template-columns:58px minmax(0,1fr);gap:12px}#ktd-live-rotterdam .lr-person-photo img{width:58px;height:75px}#ktd-live-rotterdam .lr-scores{padding:20px}#ktd-live-rotterdam dd{font-size:18px}}
  `;document.head.append(style);
  let host,hash='',pending=null,shown=5,busy=false;const readerAtHome=!!document.querySelector('#ktd-home');
  function scoreLine(score){const n=el('div','lr-scoreline');n.append(el('span','',score.name+' · '+score.device),el('strong','',score.value.toFixed(3)));if(score.detail)n.append(el('small','',score.detail));return n;}
  function render(data){
    if(!host){host=el('section');host.id='ktd-live-rotterdam';host.setAttribute('aria-labelledby','lr-title');if(readerAtHome)root.prepend(host);else{const hero=root.querySelector('.hero');if(hero)hero.after(host);else root.prepend(host);}}
    const focusKey=document.activeElement?.closest('#ktd-live-rotterdam')?.dataset.action;
    host.replaceChildren();
    const header=el('div','lr-wrap');const head=el('div','lr-head');const title=el('div');title.append(el('p','lr-kicker','18. Oktober 2026 · Aus unserer Turnfamilie'));const h=el('h2','','Mittendrin in Rotterdam');h.id='lr-title';title.append(h);head.append(title,el('span','lr-badge','Aus der Halle'));header.append(head);host.append(header);
    if(data.hero){const f=el('figure','lr-hero');const img=el('img');img.src=data.hero.src;img.alt=data.hero.alt;img.decoding='async';f.append(img);if(data.hero.caption)f.append(el('figcaption','',data.hero.caption));host.append(f);}
    const wrap=el('div','lr-wrap lr-layout');const news=el('div');news.append(el('h3','','Unser Hallenticker'));const list=el('ol','lr-stream');
    for(const [index,entry] of data.entries.entries()){
      const item=el('li','lr-entry');if(index>=shown)item.hidden=true;
      const time=el('time','',entry.time+' Uhr');time.dateTime='2026-10-18T'+entry.time+':00+02:00';item.append(time,el('h4','',entry.title));
      const copy=el('div','lr-copy');for(const node of entry.nodes){const score=parseScore(node.textContent);const clean=score?scoreLine(score):copySafe(node);if(clean)copy.append(clean);}item.append(copy);list.append(item);
    }news.append(list);
    if(data.entries.length>shown){const more=el('button','','Ältere Einträge anzeigen');more.dataset.action='more';more.addEventListener('click',()=>{shown+=10;render(data);host.querySelector('[data-action="more"]')?.focus({preventScroll:true});});news.append(more);}
    const refresh=el('button','','Neue Meldungen anzeigen');refresh.dataset.action='refresh';refresh.hidden=true;refresh.addEventListener('click',()=>{if(pending){const next=pending;pending=null;render(next);host.scrollIntoView({behavior:'auto',block:'start'});}});news.prepend(refresh);
    const status=el('p','lr-status','Neue Meldungen werden automatisch geladen.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');news.append(status);wrap.append(news);
    const scores=el('aside','lr-scores');scores.setAttribute('aria-label','Bestätigte Noten der deutschen Turnerinnen');scores.append(el('h3','','Unsere Mädels · Die Noten'));
    const latest=new Map();for(const entry of [...data.entries].reverse())for(const score of entry.scores)latest.set(score.name+'|'+score.device,score);
    for(const athlete of athletes){const person=el('div','lr-person');const photo=el('figure','lr-person-photo');const img=el('img');img.src=athlete.image.replace('w=900','w=180');img.alt=athlete.name;img.loading='lazy';photo.append(img,el('figcaption','',athlete.credit));const body=el('div');body.append(el('p','lr-person-name',athlete.name));const dl=el('dl');for(const device of devices){const pair=el('div');const score=latest.get(athlete.name+'|'+device);pair.append(el('dt','',device),el('dd','',score?score.value.toFixed(3):'—'));dl.append(pair);}body.append(dl);person.append(photo,body);scores.append(person);}
    scores.append(el('p','lr-note','— = noch keine bestätigte Wertung. Die neuesten Meldungen stehen oben.'));wrap.append(scores);host.append(wrap);
    if(focusKey)host.querySelector('[data-action="'+focusKey+'"]')?.focus({preventScroll:true});
  }
  async function update(){
    if(busy||document.hidden)return;busy=true;
    try{
      const response=await fetch(source+'?live='+Math.floor(Date.now()/30000),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
      if(response.status===404){host?.remove();host=null;hash='';pending=null;return;}
      if(!response.ok)throw Error('Feed unavailable');const html=await response.text();const data=parse(html);if(!data)return;
      const next=JSON.stringify([data.hero,data.entries.map(e=>[e.time,e.title,e.nodes.map(n=>n.outerHTML)])]);if(next===hash){if(host&&!pending)host.querySelector('.lr-status').textContent='Stand geprüft · '+new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'}).format(new Date())+' Uhr';return;}hash=next;
      if(host&&host.getBoundingClientRect().top<0){pending=data;const button=host.querySelector('[data-action="refresh"]');button.hidden=false;button.textContent='Neue Meldungen anzeigen';host.querySelector('.lr-status').textContent='Es gibt neue Meldungen.';}else render(data);
    }catch{if(host)host.querySelector('.lr-status').textContent='Verbindung unterbrochen. Zuletzt geladener Stand bleibt sichtbar.';}
    finally{busy=false;}
  }
  update();setInterval(update,45000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
})();
