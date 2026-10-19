/* KTD first-paint guard, 2026-10-19. Inline in the site head, before page content. */
(()=>{
  'use strict';
  const html=document.documentElement;
  const path=location.pathname.replace(/\/$/,'')||'/';
  const view=path==='/'?'home':path==='/stars'?'stars':path==='/wettkampf/wm-rotterdam-2026'?'wm':/^\/turnerin\/[^/]+$/.test(path)?'portrait':null;
  if(!view||html.hasAttribute('data-ktd-view-guard'))return;
  html.setAttribute('data-ktd-view-guard','20261019');
  html.setAttribute('data-ktd-view-loading',view);
  // The final WM renderer removes this only after its full enhancement finishes.
  if(view==='wm')html.setAttribute('data-ktd-wm-loading','');
  let finished=false,queued=false,frame=0,panel=null,slowTimer;
  const ready=()=>{
    if(view==='home')return !!document.querySelector('#ktd-home #ktd-home-wm');
    if(view==='portrait')return !!document.querySelector('#ktd-portrait');
    if(view==='stars')return !!document.querySelector('.st .flip-card')&&!document.querySelector('.st .st-k');
    return !!document.querySelector('#ktd-rotterdam[data-wm-live-design] .sectionnav')&&!html.hasAttribute('data-ktd-wm-loading');
  };
  function finish(state){
    if(finished)return;
    finished=true;observer.disconnect();clearTimeout(slowTimer);cancelAnimationFrame(frame);
    document.removeEventListener('error',resourceError,true);
    html.removeAttribute('data-ktd-view-loading');html.removeAttribute('data-ktd-view-slow');html.removeAttribute('data-ktd-wm-loading');
    html.setAttribute('data-ktd-view-state',state);panel?.remove();
  }
  function check(){
    if(finished||queued||!ready())return;
    queued=true;
    // Let the mounting script finish its synchronous work and styles settle.
    frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{queued=false;if(ready())finish('ready');});});
  }
  function showFallback(){
    if(finished||!document.body||panel)return;
    check();
    panel=document.createElement('section');panel.id='ktd-view-fallback';panel.setAttribute('role','status');
    const message=document.createElement('p');message.textContent='Das Laden dauert länger als erwartet.';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Erneut laden';retry.addEventListener('click',()=>location.reload());
    const fallback=document.createElement('button');fallback.type='button';fallback.textContent='Basisansicht anzeigen';fallback.addEventListener('click',()=>finish('fallback'));
    panel.append(message,retry,fallback);document.body.append(panel);html.setAttribute('data-ktd-view-slow','');
  }
  function resourceError(event){
    const target=event.target;
    const url=target?.src||target?.href||'';
    if(url.startsWith('https://kunstturnen-deutschland.github.io/ktd-design/loading-20261019/kartenstory-v2.js')){showFallback();return;}
    if(!/^https:\/\/ktd-spiegel\.vercel\.app\//.test(url))return;
    if(/\/(?:kartenstory-v1\.js|wm-page\.js|wm-gold-release\.js|portrait\.(?:js|css)|wm\.css)$/.test(url.split('?')[0]))showFallback();
  }
  const observer=new MutationObserver(check);
  observer.observe(html,{childList:true,subtree:true,attributes:true,attributeFilter:['data-wm-live-design','data-ktd-wm-loading']});
  document.addEventListener('error',resourceError,true);
  // A slow response shows choices; it never automatically exposes an old layout.
  slowTimer=setTimeout(showFallback,20000);
  document.addEventListener('DOMContentLoaded',check,{once:true});check();
})();
