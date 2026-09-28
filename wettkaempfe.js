/* Kunstturnen Deutschland · Seite Wettkämpfe · wettkaempfe.js · Version 0.2.0 · Stand 28.09.2026
   Daten kommen aus JSON-Blöcken der Seite (#wk-daten-termine, #wk-daten-team, #wk-daten-fav-1/2). */

(function(){
  "use strict";
  var heute=new Date();heute.setHours(0,0,0,0);
  function d(s){var p=s.split("-");return new Date(+p[0],p[1]-1,+p[2])}
  function tage(s){return Math.round((d(s)-heute)/864e5)}
  function tt(s){var x=d(s);return ("0"+x.getDate()).slice(-2)+"."+("0"+(x.getMonth()+1)).slice(-2)+"."}
  function z(n){return n.toFixed(3).replace(".",",")}
  var ruhig=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===== Einblenden der Turnerinnen-Karten ===== */
  var io=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var k=e.target,i=[].slice.call(k.parentNode.children).indexOf(k);
    k.style.transitionDelay=((i%6)*110)+"ms";k.classList.add("in");io.unobserve(k);
    setTimeout(function(){k.style.transitionDelay=""},1200+(i%6)*110)}})},{rootMargin:"0px 0px -8% 0px",threshold:.15}):null;
  function beobachte(root){root.querySelectorAll(".karte").forEach(function(k){if(io)io.observe(k);else k.classList.add("in")})}

  /* ===== Zeitleiste: klickbar, Punkte ziehbar, federn zurück ===== */
  var NS="http://www.w3.org/2000/svg",W=1200,H=318,P=34,Y=190;
  var L0=d("2026-09-25"),L1=d("2026-12-04");
  function X(dt){return P+(dt-L0)/(L1-L0)*(W-2*P)}
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
  var EV=[
    {d:"2026-10-03",n:"Quali",i:"Stuttgart · 03./04.10.",l:1,t:"q",titel:"WM-Qualifikation",txt:"Zweiter und dritter Qualifikationswettkampf, Stuttgart, 3. und 4. Oktober",typ:"Nationalteam"},
    {d:"2026-10-21",n:"Rotterdam",i:"WM · 17.–25.10.",l:2,t:"wm",titel:"Weltmeisterschaft Rotterdam",txt:"Rotterdam Ahoy, 17. bis 25. Oktober. Das deutsche Team turnt am 18. Oktober ab 16 Uhr.",typ:"WM",link:"/wettkampf/wm-rotterdam-2026"},
    {d:"2026-10-31",n:"Combs-la-Ville",i:"Tournoi · 31.10.",l:1,titel:"Tournoi International",txt:"Combs-la-Ville, Frankreich, 31. Oktober bis 1. November",typ:"International"},
    {d:"2026-11-01",n:"Jugendspiele",i:"Dakar · bis 13.11.",l:3,titel:"Olympische Jugendspiele",txt:"Dakar, Senegal, 31. Oktober bis 13. November",typ:"International"},
    {d:"2026-11-07",n:"Swiss Cup",i:"Zürich · 07.11.",l:2,titel:"Swiss Cup",txt:"Hallenstadion, Zürich, 7. November",typ:"International",link:"/wettkampf/swiss-cup-zuerich-2026"},
    {d:"2026-11-14",n:"GymnovaCup",i:"Keerbergen · 14./15.11.",l:3,titel:"Gympies-GymnovaCup",txt:"Keerbergen, Belgien, 14. und 15. November",typ:"International",link:"/wettkampf/gymnovacup-keerbergen-2026"},
    {d:"2026-11-14",n:"Bundesliga",i:"Esslingen · 14.11.",l:1,t:"bl",titel:"Bundesliga in Esslingen",txt:"4. Wettkampftag, Sporthalle Weil, 14. November",typ:"Bundesliga",link:"/wettkampf/bundesliga-esslingen-2026"},
    {d:"2026-11-21",n:"Aufstiegsfinale",i:"DTL · 21.11.",l:2,t:"bl",titel:"DTL-Aufstiegsfinale",txt:"21. November, Ausrichter noch offen",typ:"Bundesliga",link:"/wettkampf/dtl-aufstiegsfinale-2026"},
    {d:"2026-11-28",n:"Čáslavská Cup",i:"Brünn · 28./29.11.",l:3,titel:"Čáslavská Cup",txt:"Brünn, Tschechien, 28. und 29. November",typ:"International",link:"/wettkampf/caslavska-cup-brno-2026"},
    {d:"2026-11-28",n:"DTL-Finale",i:"Heidelberg · 28.11.",l:1,t:"bl",titel:"DTL-Finale",txt:"SNP dome, Heidelberg, 28. November",typ:"Bundesliga",link:"/wettkampf/dtl-finale-2026"}
  ];
  var LY={1:228,2:266,3:304};
  var box=document.getElementById("leiste"),pop=document.getElementById("pop");if(!box||!pop)return;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"group","aria-label":"Die nächsten zehn Wochen als Sprungfolge. Punkte lassen sich anklicken und ziehen."});
  box.insertBefore(svg,pop);
  ["2026-10-01","2026-11-01","2026-12-01"].forEach(function(m,i){var x=X(d(m));el("line",{"class":"lt-raster",x1:x,y1:34,x2:x,y2:Y},svg);var t=el("text",{"class":"lt-monat",x:x+6,y:30},svg);t.textContent=["Oktober","November","Dezember"][i]});
  el("line",{"class":"lt-basis",x1:P,y1:Y,x2:W-P,y2:Y},svg);
  var dakar=el("line",{"class":"lt-dakar",x1:X(d("2026-10-31")),y1:Y+9,x2:X(d("2026-11-13")),y2:Y+9},svg);
  var hx=X(heute);
  var gB=el("g",{},svg);
  el("line",{"class":"lt-heute",x1:hx,y1:44,x2:hx,y2:Y+10},svg);
  var ht=el("text",{"class":"lt-heute-t",x:hx+7,y:56},svg);ht.textContent="Heute";
  var gE=el("g",{},svg);
  EV.forEach(function(e,i){
    e.x0=X(d(e.d));e.off=0;
    var g=el("g",{"class":"lt-ev",tabindex:0,role:"button","aria-label":e.titel+", "+e.i,"data-i":i},gE);
    e.g=g;
    e.st=el("line",{"class":"lt-stich",y1:e.t==="wm"?Y+52:Y+8,y2:LY[e.l]-15},g);
    e.nm=el("text",{"class":"lt-name",y:LY[e.l]},g);e.nm.textContent=e.n;
    e.inf=el("text",{"class":"lt-info",y:LY[e.l]+14},g);e.inf.textContent=e.i;
    if(e.t==="wm"){
      var wt=Math.max(0,tage("2026-10-17"));
      e.puls=el("g",{"class":"lt-puls"},g);
      e.mk=el("circle",{cy:Y-2,r:50,style:"fill:var(--gold);stroke:var(--vio);stroke-width:3"},e.puls);
      e.t1=el("text",{y:Y-16,"text-anchor":"middle",style:"font:700 11px var(--b);letter-spacing:.14em;fill:var(--vio)"},e.puls);e.t1.textContent="WM IN";
      e.t2=el("text",{y:Y+16,"text-anchor":"middle",style:"font:400 36px var(--h);fill:var(--vio)"},e.puls);e.t2.textContent=wt;
      e.t3=el("text",{y:Y+31,"text-anchor":"middle",style:"font:700 10px var(--b);letter-spacing:.14em;fill:var(--vio)"},e.puls);e.t3.textContent="TAGEN";
      e.hit=el("circle",{"class":"lt-hit",cy:Y-2,r:52},g);
    }else{
      var f=e.t==="q"?"var(--pink)":e.t==="bl"?"var(--gruen)":"var(--vio)";
      e.hit=el("circle",{"class":"lt-hit",cy:Y,r:17},g);
      e.mk=el("circle",{cy:Y,r:e.t==="bl"?8:7,style:"fill:"+f+";stroke:var(--vio);stroke-width:"+(e.t==="bl"?3:0)},g);
    }
  });
  // Sprungfolge: Heute + alle Termine in Datumsreihenfolge
  var SEQ=EV.slice();
  var arcs=[];for(var k=0;k<SEQ.length;k++)arcs.push(el("path",{"class":"lt-bogen"},gB));
  function cx(e){return e.x0+e.off}
  function zeichne(){
    EV.forEach(function(e){var x=cx(e);
      e.st.setAttribute("x1",x);e.st.setAttribute("x2",x);
      e.nm.setAttribute("x",x-4);e.inf.setAttribute("x",x-4);
      e.hit.setAttribute("cx",x);e.mk.setAttribute("cx",x);
      if(e.t==="wm"){e.t1.setAttribute("x",x);e.t2.setAttribute("x",x);e.t3.setAttribute("x",x)}
    });
    var prev=hx;
    SEQ.forEach(function(e,k){var x=cx(e),dist=x-prev,p=arcs[k];
      if(dist<3){p.setAttribute("d","")}else{var h=Math.max(10,Math.min(128,dist*.62));
        p.setAttribute("d","M"+prev+" "+Y+" Q"+((prev+x)/2)+" "+(Y-2*h)+" "+x+" "+Y)}
      prev=x});
  }
  zeichne();
  // Einmaliges Einzeichnen der Bögen
  var gezeichnet=false;
  function dashAus(){if(gezeichnet)return;gezeichnet=true;arcs.forEach(function(p){p.classList.remove("an");p.style.strokeDasharray="";p.style.strokeDashoffset="";p.style.animationDelay=""})}
  if(!ruhig){var n=0;arcs.forEach(function(p){var len=p.getTotalLength();if(!len)return;p.style.strokeDasharray=len;p.style.strokeDashoffset=len;p.style.animationDelay=(0.35+n*0.22)+"s";p.classList.add("an");n++});
    setTimeout(dashAus,350+n*220+1200)}else gezeichnet=true;

  // Ziehen und Zurückfedern
  function svgX(ev){var pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse()).x}
  var drag=null;
  function grenzen(i){var e=EV[i],lo=(i>0?cx(EV[i-1]):hx)+1,hi=(i<EV.length-1?cx(EV[i+1]):W-P)-1;return[lo,hi]}
  svg.addEventListener("pointerdown",function(ev){var g=ev.target.closest(".lt-ev");if(!g)return;
    var i=+g.dataset.i;dashAus();if(EV[i].fed)cancelAnimationFrame(EV[i].fed);
    drag={i:i,sx:svgX(ev),o:EV[i].off,moved:false};svg.setPointerCapture(ev.pointerId);g.classList.add("zieht");ev.preventDefault()});
  svg.addEventListener("pointermove",function(ev){if(!drag)return;var e=EV[drag.i],dx=svgX(ev)-drag.sx;
    if(Math.abs(dx)>4)drag.moved=true;if(!drag.moved)return;
    var gr=grenzen(drag.i),x=Math.max(gr[0],Math.min(gr[1],e.x0+drag.o+dx));e.off=x-e.x0;zeichne();schliesse()});
  function los(ev){if(!drag)return;var e=EV[drag.i];e.g.classList.remove("zieht");
    if(!drag.moved){oeffne(drag.i)}else federn(e);drag=null}
  svg.addEventListener("pointerup",los);svg.addEventListener("pointercancel",los);
  function federn(e){var o0=e.off,t0=performance.now();
    if(ruhig){e.off=0;zeichne();return}
    (function schritt(t){var s=(t-t0)/1000,v=o0*Math.exp(-s*5.5)*Math.cos(s*13);
      if(s>1.6||Math.abs(v)<.3){e.off=0;zeichne();return}e.off=v;zeichne();e.fed=requestAnimationFrame(schritt)})(t0)}
  svg.addEventListener("keydown",function(ev){var g=ev.target.closest(".lt-ev");if(g&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();tast=true;oeffne(+g.dataset.i)}});

  // Klick: Karte zum Termin
  var offen=-1,tast=false;
  function oeffne(i){var e=EV[i];if(offen===i){schliesse();return}
    EV.forEach(function(x){x.g.classList.remove("offen")});e.g.classList.add("offen");offen=i;
    var r=box.getBoundingClientRect(),sc=r.width/W;
    pop.style.left=Math.max(130,Math.min(r.width-130,cx(e)*sc))+"px";pop.style.top=((e.t==="wm"?Y-58:Y-14)*sc)+"px";
    pop.innerHTML="<button class='zu' aria-label='Schließen'>×</button><b>"+e.titel+"</b><p>"+e.txt+"</p><div class='reihe'><span class='pille'>"+e.typ+"</span><a class='los' href='"+(e.link||"#kalender")+"' data-z='"+e.titel+"'>Zum Wettkampf</a></div>";
    pop.classList.add("da");pop.querySelector(".zu").onclick=schliesse;if(tast)pop.querySelector(".los").focus({preventScroll:true});tast=false}
  function schliesse(){pop.classList.remove("da");EV.forEach(function(x){x.g.classList.remove("offen")});offen=-1}
  document.addEventListener("click",function(ev){if(offen>=0&&!box.contains(ev.target))schliesse()});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape")schliesse()});

  /* ===== WM-Zähler ===== */
  var w=tage("2026-10-17"),Z=document.getElementById("zaehler");
  if(w>0)document.getElementById("wm-tage").textContent=w;
  else if(tage("2026-10-25")>=0)Z.innerHTML="<small>Die Weltmeisterschaft</small><b>läuft</b>";

  /* ===== Karten der deutschen Turnerinnen (Design wie auf der Startseite) ===== */
  var K=JSON.parse((document.getElementById("wk-daten-team")||{}).textContent||"null")||[];
  var KA=document.getElementById("karten");
  if(KA){
    var esc=function(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")};
    KA.innerHTML=K.map(function(t){var href=t.u?"/turnerin/"+t.u:"/stars";
      return "<a class='hs-k' href='"+href+"'><span class='hs-kb'>"+(t.i?"<img src='"+esc(t.i)+"' alt='"+esc(t.v+" "+t.n)+"' loading='lazy'>":"")+
        (t.w?"<span class='hs-wm'>Gemeldet für Rotterdam</span>":"")+(t.u?"<span class='hs-pf' aria-hidden='true'>→</span>":"")+"</span>"+
        "<span class='hs-kn'><span class='hs-vn'>"+esc(t.v)+"</span><span class='hs-nn'>"+esc(t.n)+"</span></span>"+
        "<span class='hs-sig'>"+esc(t.s)+"</span>"+(t.c?"<span class='hs-cl'>"+esc(t.c)+"</span>":"")+"</a>"}).join("");
    var passen=function(){KA.querySelectorAll(".hs-nn").forEach(function(n){n.style.fontSize="";var max=n.parentNode.clientWidth,fs=parseFloat(getComputedStyle(n).fontSize);while(n.scrollWidth>max&&fs>11){fs-=1;n.style.fontSize=fs+"px"}})};
    passen();var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(passen,150)});if(document.fonts&&document.fonts.ready)document.fonts.ready.then(passen);
    var kio=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var k=e.target,i=[].slice.call(k.parentNode.children).indexOf(k);k.style.transitionDelay=((i%5)*110)+"ms";k.classList.add("in");kio.unobserve(k)}})},{rootMargin:"0px 0px -8% 0px",threshold:.15}):null;
    KA.querySelectorAll(".hs-k").forEach(function(k){if(kio)kio.observe(k);else k.classList.add("in")});
  }

  /* ===== Kalender ===== */
  var T=JSON.parse((document.getElementById("wk-daten-termine")||{}).textContent||"null")||[];

  var MO=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  var tab="2026",filt="alle",LI=document.getElementById("liste");
  function spanne(a,b){return a===b?tt(a):tt(a)+"–"+tt(b)}
  function liste(){
    var zz=T.filter(function(e){var v=d(e[1])<heute;
      if(tab==="vorbei"){if(!v)return false}else{if(v||e[0].slice(0,4)!==tab)return false}
      return filt==="alle"||e[4]===filt}).sort(function(a,b){return tab==="vorbei"?(a[0]<b[0]?1:-1):(a[0]<b[0]?-1:1)});
    if(!zz.length){LI.innerHTML="<p>In diesem Zeitraum steht nichts an.</p>";return}
    var h="",mon="";
    zz.forEach(function(e){var x=d(e[0]),m=MO[x.getMonth()]+" "+x.getFullYear();
      if(m!==mon){if(mon)h+="</div></div>";h+="<div class='monat'><h3>"+m+"</h3><div class='zeilen'>";mon=m}
      var t=tage(e[0]),v=d(e[1])<heute,p="";
      var uhr=v?"":(t<=0?"<span class='pille pille--gelb'>Läuft gerade</span>":"<span class='pille pille--gelb'>In "+t+(t===1?" Tag":" Tagen")+"</span>");
      p="<span class='pille"+(e[6]?" pille--gold":"")+"'>"+e[5]+"</span>";
      var tg=e[7]?"a":"div";h+="<"+tg+(e[7]?" href='"+e[7]+"'":"")+" class='zeile"+(v?" zeile--vorbei":"")+"'><span class='zeile__datum'>"+spanne(e[0],e[1])+"</span><span class='zeile__name'>"+e[2]+"<span class='zeile__ort'>"+e[3]+"</span></span><span class='zeile__typ'>"+p+"</span><span class='zeile__uhr'>"+uhr+"</span><span class='zeile__pfeil' aria-hidden='true'>"+(e[7]?"›":"")+"</span></"+tg+">"});
    LI.innerHTML=h+"</div></div>";
  }
  document.querySelectorAll(".tabs button").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll(".tabs button").forEach(function(x){x.setAttribute("aria-selected",x===b)});tab=b.dataset.tab;liste()})});
  document.querySelectorAll(".filter button").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll(".filter button").forEach(function(x){x.setAttribute("aria-pressed",x===b)});filt=b.dataset.f;liste()})});
  liste();
})();
