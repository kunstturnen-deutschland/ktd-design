
(()=>{
  function start(){
    const rail=document.querySelector('#girls-component .girls-rail');
    if(!rail||rail.dataset.homeLoopReady)return;
    const cards=[...rail.querySelectorAll(':scope > .flip-card')];
    if(cards.length<2)return;
    rail.dataset.homeLoopReady='true';
    const last=cards[cards.length-1],lead=cards.find(c=>c.dataset.athleteId==='turnerin-6aafa5a2f97f052a1e2d04e0')||cards[0];
    let touched=false,step=0,adjusting=false,ready=false,contact=false,settleTimer=0;
    const navigation=performance.getEntriesByType('navigation')[0];
    let enterAtCards=!location.hash&&navigation?.type!=='back_forward';
    function cancelEntry(){enterAtCards=false;}
    for(const type of ['pointerdown','wheel','keydown'])window.addEventListener(type,cancelEntry,{once:true,passive:true});
    function enterCards(){
      if(!enterAtCards)return;
      enterAtCards=false;
      const heading=rail.closest('.hero')?.querySelector('.applaus')||rail;
      window.scrollTo({top:Math.max(0,heading.getBoundingClientRect().top+window.scrollY-24),behavior:'instant'});
    }
    function move(card,before){
      const focus=document.activeElement;
      if(before)rail.prepend(card);else rail.append(card);
      if(card.contains(focus)&&document.activeElement!==focus)focus.focus({preventScroll:true});
    }
    function scheduleNormalize(){
      clearTimeout(settleTimer);
      if(!ready||contact||adjusting)return;
      settleTimer=setTimeout(normalize,160);
    }
    function normalize(){
      if(contact||adjusting||!step||rail.scrollWidth<=rail.clientWidth+step*2)return;
      const max=rail.scrollWidth-rail.clientWidth;
      // Safari can report negative/beyond-end offsets during rubber-banding.
      const x=Math.max(0,Math.min(max,rail.scrollLeft));
      const before=x<step/2;
      if(!before&&x<=max-step/2)return;
      adjusting=true;
      clearTimeout(settleTimer);
      // Recycle only after the finger and inertial scroll have settled.
      // Keep the guard through the asynchronous scroll/layout notifications.
      const oldOverflow=rail.style.overflowAnchor;
      rail.style.overflowAnchor='none';
      move(before?rail.lastElementChild:rail.firstElementChild,before);
      rail.scrollTo({left:x+(before?step:-step),behavior:'instant'});
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        rail.style.overflowAnchor=oldOverflow;
        adjusting=false;
      }));
    }
    function measure(){
      const width=cards[0].getBoundingClientRect().width;
      if(!rail.clientWidth||!width)return;
      const previous=step;
      step=width+(parseFloat(getComputedStyle(rail).columnGap)||0);
      if(!touched){
        const bounds=rail.getBoundingClientRect(),style=getComputedStyle(rail);
        if(innerWidth>=992){
          rail.scrollLeft+=last.getBoundingClientRect().right-bounds.right+(parseFloat(style.paddingRight)||0);
        }else{
          rail.scrollLeft+=lead.getBoundingClientRect().left-bounds.left-(parseFloat(style.paddingLeft)||0);
        }
      }else if(previous&&previous!==step){rail.scrollLeft=rail.scrollLeft/previous*step;}
      ready=true;scheduleNormalize();
    }
    for(const type of ['pointerdown','wheel','keydown'])rail.addEventListener(type,()=>{touched=true},{passive:true});
    let pointerContact=false,touchContacts=0;
    function syncContact(){contact=pointerContact||touchContacts>0;}
    function begin(){
      touched=true;
      // A new gesture stops the preceding momentum. Make room before it starts,
      // even when successive swipes leave no time for the idle timer.
      if(!contact)normalize();
      clearTimeout(settleTimer);
    }
    function pointerStart(){begin();pointerContact=true;syncContact();}
    function touchStart(event){begin();touchContacts=event.touches.length;syncContact();}
    function pointerEnd(){pointerContact=false;syncContact();scheduleNormalize();}
    function touchEnd(event){
      touchContacts=event.touches.length;
      if(!touchContacts)pointerContact=false;
      syncContact();scheduleNormalize();
    }
    // Card/overlay handlers may stop bubbling. Track the gesture in capture
    // phase, and keep touch contact active after Safari's pointercancel.
    rail.addEventListener('pointerdown',pointerStart,{passive:true,capture:true});
    rail.addEventListener('touchstart',touchStart,{passive:true,capture:true});
    for(const type of ['pointerup','pointercancel'])
      window.addEventListener(type,pointerEnd,{passive:true,capture:true});
    for(const type of ['touchend','touchcancel'])
      window.addEventListener(type,touchEnd,{passive:true,capture:true});
    rail.addEventListener('scroll',scheduleNormalize,{passive:true});
    rail.addEventListener('scrollend',scheduleNormalize,{passive:true});
    requestAnimationFrame(()=>requestAnimationFrame(measure));
    document.fonts.ready.then(()=>{measure();requestAnimationFrame(enterCards);});
    new ResizeObserver(measure).observe(rail);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
