/* Results ↔ portraits. Published directory resolves identities; existing portrait API owns scores.
 * The active renderer's JSON snapshot supplies provisional ranks when arriving from live results.
 * No copied result dataset and no credentials. Session-only navigation state expires after two hours. */
(()=>{'use strict';
const path=location.pathname.replace(/\/$/,'')||'/',isResults=path==='/wettkampf/wm-rotterdam-2026',slug=path.match(/^\/turnerin\/([^/]+)$/)?.[1];
if((!isResults&&!slug)||window.__ktdResultPortraits)return;window.__ktdResultPortraits=true;
const key='ktd-results-portrait-v1',endpoint='https://ktd-spiegel.vercel.app/api/',norm=s=>String(s||'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().replace(/[^a-z0-9]/g,'');
const ident=s=>norm(String(s).replace(/^Emma Leonie Malewski$/i,'Emma Malewski').split(/\s+/).sort((a,b)=>norm(a).localeCompare(norm(b))).join(' '));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('de-DE',{minimumFractionDigits:3,maximumFractionDigits:3}):'—';
function read(){try{const c=JSON.parse(sessionStorage.getItem(key));return c&&Date.now()-c.saved<7200000&&c.path==='/wettkampf/wm-rotterdam-2026'?c:null;}catch{return null;}}
function write(c){try{sessionStorage.setItem(key,JSON.stringify(c));return true;}catch{return false;}}
const style=document.createElement('style');style.textContent=`
#ktd-rotterdam .de-table button.rp-name{display:inline-flex;align-items:center;gap:8px;border:0!important;border-radius:0!important;padding:3px 0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;color:inherit!important;font:inherit!important;font-weight:700!important;text-align:left;cursor:pointer;min-height:36px!important;width:auto!important}#ktd-rotterdam .de-table button.rp-name:after{content:'';display:inline-block;flex:0 0 auto;width:6px;height:6px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(-45deg);margin-right:3px}.rp-name:focus-visible,.rp-return:focus-visible,.rp-latest a:focus-visible{outline:3px solid #e040aa;outline-offset:5px}
.rp-dialog{box-sizing:border-box;width:min(420px,calc(100% - 32px));border:0;border-radius:24px;padding:26px;background:#e7def6;color:#2d0060;font:16px/1.5 Roboto,Arial,sans-serif}.rp-dialog::backdrop{background:#1c004099}.rp-dialog h2{font:400 28px/1.1 'Lilita One',sans-serif;margin:12px 0 22px;color:inherit}.rp-dialog a{display:block;padding:15px 20px;border-radius:30px;background:#2d0060;color:white;font-weight:700;text-decoration:none}.rp-dialog button{display:block;margin:18px 0 0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.rp-dialog a:focus-visible,.rp-dialog button:focus-visible{outline:3px solid #e040aa;outline-offset:4px}
#ktd-portrait .rp-return{display:inline-block;color:inherit;text-decoration:underline;text-underline-offset:4px;font:700 15px/1.5 Roboto,Arial,sans-serif;margin:0 0 22px;padding:8px 0}
#ktd-portrait .rp-latest{background:#76f637;color:#2d0060;border-radius:24px;padding:clamp(22px,4vw,36px);margin:30px 0 0;font-family:Roboto,Arial,sans-serif}#ktd-portrait .rp-latest h2{font:400 clamp(26px,4vw,36px)/1.1 'Lilita One',sans-serif;color:inherit;margin:0 0 12px}#ktd-portrait .rp-latest p{color:inherit;margin:8px 0;font-size:15px;line-height:1.5}#ktd-portrait .rp-latest h3{font:700 19px/1.4 Roboto,Arial,sans-serif;color:inherit;margin:0}#ktd-portrait .rp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}#ktd-portrait .rp-score{padding:16px;border:1px solid #2d006044;border-radius:16px}#ktd-portrait .rp-score span{display:block;font-size:13px}#ktd-portrait .rp-score strong{display:block;font:400 32px/1.2 'Lilita One',sans-serif;margin:5px 0}#ktd-portrait .rp-score small{font-size:12px}#ktd-portrait .rp-latest a{display:inline-block;color:#fff;background:#2d0060;padding:13px 20px;border-radius:30px;text-decoration:none;font-weight:700;font-size:14px}#ktd-portrait .rp-note{font-size:12px!important}
`;document.head.append(style);
const phases={qualifikation:'Qualifikation',teamfinale:'Teamfinale',mehrkampffinale:'Mehrkampffinale',geraetefinale:'Gerätefinale',wettkampftag:'Wettkampftag'};
const devices={sprung:'Sprung',stufenbarren:'Barren',schwebebalken:'Balken',boden:'Boden',mehrkampf:'Mehrkampf',vault:'Sprung · zwei Sprünge',bars:'Barren',beam:'Balken',floor:'Boden',allaround:'Mehrkampf'};
let snapshotPromise;
function liveSnapshot(){if(snapshotPromise)return snapshotPromise;snapshotPromise=(async()=>{
 const src=[...document.scripts].map(s=>s.src).find(s=>s.includes('/wm-gold-release.js'));if(!src)return null;
 const response=await fetch(src);if(!response.ok)return null;
 const source=await response.text(),line=source.split('\n').find(s=>s.startsWith('const data={"completed"'));if(!line)return null;
 const data=JSON.parse(line.slice('const data='.length).replace(/;\s*$/,''));return data.tables&&data.checkedAt?data:null;
})().catch(()=>null);return snapshotPromise;}
async function latest(root){if(root.querySelector('.rp-latest')||root.dataset.rpLatest)return;root.dataset.rpLatest='loading';
 try{const res=await fetch(endpoint+'portraet?slug='+encodeURIComponent(slug));if(!res.ok)throw Error('portrait');const data=await res.json();const rows=(data.scores||[]).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.datum||'')).sort((a,b)=>b.datum.localeCompare(a.datum));
 let ctx=read();let snap=ctx?.slug===slug?ctx.snapshot:null;const scoreDate=rows[0]?.datum;
 const useLive=snap&&(!scoreDate||scoreDate<='2026-10-19')&&snap.results?.length;
 if(!rows.length&&!useLive){root.dataset.rpLatest='empty';return;}
 const first=rows[0],eventRows=first?rows.filter(r=>r.eventId===first.eventId&&r.datum===first.datum):[];
 let cards=eventRows.map(r=>({label:devices[r.device]||r.device,score:r.reportedScore??r.sprungMittelOffiziell??r.endnote??r.sprung1?.endnote,rank:r.rang,phase:phases[r.phase]||r.phase||'',date:r.datum})).filter(r=>Number.isFinite(r.score));
 if(useLive){const mapped={bars:'Barren',beam:'Balken',floor:'Boden',allaround:'Mehrkampf',vault:'Sprung · zwei Sprünge'};for(const r of snap.results){const label=mapped[r.key];cards=cards.filter(c=>c.label!==label);cards.push({label,score:Number(r.values.at(-1)),rank:/^\d+$/.test(r.rank)?r.rank:null,phase:'Qualifikation',live:true});}}
 const title=useLive?'WM Rotterdam 2026':first.event;
 const date=useLive?'18.–19. Oktober 2026':new Date(first.datum+'T12:00:00').toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'});
 const section=document.createElement('section');section.className='rp-latest';section.setAttribute('aria-labelledby','rp-latest-title');
 section.innerHTML='<h2 id="rp-latest-title">Zuletzt geturnt</h2><h3>'+esc(title)+'</h3><p>'+esc(date)+(useLive?' · Qualifikation':'')+'</p><div class="rp-grid">'+cards.map(c=>'<div class="rp-score"><span>'+esc(c.label)+'</span><strong>'+num(c.score)+'</strong><small>'+esc(c.live?'Vorläufig'+(c.rank?' · Rang '+c.rank:''):[c.phase,c.rank?'Rang '+c.rank:''].filter(Boolean).join(' · '))+'</small></div>').join('')+'</div>';
 if(useLive){const note=document.createElement('p');note.className='rp-note';note.textContent='Laufende Qualifikation · Ergebnisstand '+new Date(snap.checkedAt).toLocaleString('de-DE',{timeZone:'Europe/Amsterdam',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' Uhr. Platzierungen können sich ändern.';section.append(note);}
 if(useLive||/Rotterdam/i.test(title)){const a=document.createElement('a');a.href='/wettkampf/wm-rotterdam-2026#rotterdam-tagesabschluss';a.textContent='Alle Ergebnisse dieses Wettkampfs →';section.append(a);}
 const hero=root.querySelector('.hero .hero-grid');if(hero)hero.after(section);else root.prepend(section);root.dataset.rpLatest='ready';
 }catch{delete root.dataset.rpLatest;}}
function portrait(root){let ctx=read();if(ctx?.slug===slug&&!root.querySelector('.rp-return')){
 ctx.visited=true;write(ctx);const a=document.createElement('a');a.className='rp-return';a.href=ctx.path+'?wm-zurueck=1#rotterdam-tagesabschluss';a.textContent='← Zurück zu den WM-Ergebnissen';root.querySelector('.hero-copy')?.prepend(a);
 }latest(root);}
let directory=new Map(),dialog,trigger,restored=false,queued=false;
async function loadDirectory(){try{const r=await fetch(endpoint+'turnerinnen');if(!r.ok)return;const doc=new DOMParser().parseFromString(await r.text(),'text/html');for(const card of doc.querySelectorAll('[data-td-athlete]')){const link=card.querySelector('a[href^="/turnerin/"]'),name=card.getAttribute('aria-label')||card.querySelector('h4')?.textContent;if(link&&name){const href=link.getAttribute('href');if(/^\/turnerin\/[a-z0-9-]+$/.test(href))directory.set(ident(name),{href,name});}}scan();}catch{}}
function openProfile(button,person){trigger=button;if(!dialog){dialog=document.createElement('dialog');dialog.className='rp-dialog';dialog.setAttribute('aria-label','Porträt öffnen');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>trigger?.focus({preventScroll:true}));}
 dialog.replaceChildren();const heading=document.createElement('h2');heading.textContent=person.name;const a=document.createElement('a');a.href=person.href;a.textContent='Porträt ansehen →';const close=document.createElement('button');close.textContent='Bei den Ergebnissen bleiben';close.type='button';close.onclick=()=>dialog.close();dialog.append(heading,a,close);
 a.addEventListener('click',()=>{const section=document.getElementById('rotterdam-tagesabschluss'),c={path,slug:person.href.split('/').at(-1),saved:Date.now(),category:section.querySelector('.de-category[aria-pressed="true"]')?.textContent,filter:section.querySelector('.de-filter')?.getAttribute('aria-pressed')==='true',scrollY:window.scrollY,left:[...section.querySelectorAll('.de-scroll')].map(s=>s.scrollLeft),name:person.name,snapshot:null};
 // Snapshot is already prefetched; navigation never waits on a network response.
 if(liveData){const results=Object.entries(liveData.tables).filter(([k])=>k!=='team').flatMap(([key,t])=>t.rows.filter(r=>ident(r[1])===ident(person.name)).map(r=>({key,rank:r[0],values:r.slice(3)})));c.snapshot={checkedAt:liveData.checkedAt,results};}write(c);
 });dialog.showModal();}
let liveData=null;
function restore(section){const ctx=read();if(restored||!ctx?.visited)return;const button=[...section.querySelectorAll('.de-category')].find(b=>b.textContent===ctx.category);if(!button)return;restored=true;
 button.click();const filter=section.querySelector('.de-filter');if(filter&&!filter.hidden&&(filter.getAttribute('aria-pressed')==='true')!==ctx.filter)filter.click();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{section.querySelectorAll('.de-scroll').forEach((s,i)=>s.scrollLeft=ctx.left[i]||0);window.scrollTo({top:ctx.scrollY,behavior:'instant'});[...section.querySelectorAll('.rp-name')].find(b=>b.textContent===ctx.name)?.focus({preventScroll:true});ctx.visited=false;write(ctx);}));}
function scan(){queued=false;if(slug){const root=document.getElementById('ktd-portrait');if(root)portrait(root);return;}
 const section=document.getElementById('rotterdam-tagesabschluss');if(!section)return;
 for(const cell of section.querySelectorAll('.de-name')){if(cell.querySelector('.rp-name'))continue;const raw=[...cell.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();const person=directory.get(ident(raw));if(!person)continue;
 const textNodes=[...cell.childNodes].filter(n=>n.nodeType===3);textNodes.forEach(n=>n.remove());const b=document.createElement('button');b.type='button';b.className='rp-name';b.textContent=raw;b.setAttribute('aria-label','Porträt von '+person.name+' öffnen');b.addEventListener('click',()=>openProfile(b,person));cell.prepend(b);
 }restore(section);if(!liveData)liveSnapshot().then(d=>{liveData=d;});}
function schedule(){if(!queued){queued=true;requestAnimationFrame(scan);}}
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.rp-name,.rp-return,.rp-latest,.rp-dialog')&&!n.closest?.('.rp-latest,.rp-dialog'))))schedule();}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',e=>{if(e.persisted){restored=false;schedule();}});
if(isResults)loadDirectory();scan();
})();
