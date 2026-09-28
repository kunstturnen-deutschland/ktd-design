/* =====================================================================
   Kunstturnen Deutschland · zentrale Skripte
   Datei: ktd.js · Version 0.1.0 · Stand 28.09.2026
   Enthält: Karten umdrehen, Einblenden, Karten-Stapel mit Abdunkeln.
   Alles greift nur auf Elemente mit ktd-Klassen zu.
   ===================================================================== */
(function(){
  "use strict";
  var ruhig=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Karten umdrehen ---------- */
  document.addEventListener("click",function(ev){
    var k=ev.target.closest&&ev.target.closest(".ktd-karte");
    if(!k||ev.target.closest("a"))return;
    k.setAttribute("aria-pressed",k.getAttribute("aria-pressed")==="true"?"false":"true");
  });

  /* ---------- Einblenden wie auf der Landingpage ----------
     Versatz 110 ms je Element innerhalb einer Gruppe, höchstens sechs Stufen. */
  var io=null;
  if("IntersectionObserver" in window&&!ruhig){
    io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var el=e.target,i=[].slice.call(el.parentNode.children).indexOf(el);
        el.style.transitionDelay=((i%6)*110)+"ms";
        el.classList.add("ktd-in");io.unobserve(el);
        setTimeout(function(){el.style.transitionDelay=""},1300+(i%6)*110);
      });
    },{rootMargin:"0px 0px -8% 0px",threshold:.15});
  }
  function einblenden(root){
    (root||document).querySelectorAll(".ktd-einblenden:not(.ktd-in)").forEach(function(el){
      if(io)io.observe(el);else el.classList.add("ktd-in");
    });
  }

  /* ---------- Karten-Stapel ----------
     data-ktd-oben am Container: Abstand oben (Höhe der Navigation), Standard 64. */
  function stapel(box){
    var oben=parseInt(box.getAttribute("data-ktd-oben")||"64",10);
    var sek=[].slice.call(box.children),MAXD=.42,tick=false;
    function hoehen(){
      var vh=window.innerHeight;
      sek.forEach(function(s){s.style.top=Math.min(oben,vh-s.offsetHeight)+"px"});
    }
    function dunkeln(){
      tick=false;var span=window.innerHeight-oben;
      for(var i=0;i<sek.length-1;i++){
        var nt=sek[i+1].getBoundingClientRect().top,f=1-(nt-oben)/span;
        f=Math.max(0,Math.min(1,f));
        sek[i].style.setProperty("--ktd-dunkel",(f*f*MAXD).toFixed(3));
      }
    }
    hoehen();dunkeln();
    window.addEventListener("resize",function(){hoehen();dunkeln()});
    window.addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(dunkeln)}},{passive:true});
    if("ResizeObserver" in window){var ro=new ResizeObserver(hoehen);sek.forEach(function(s){ro.observe(s)})}
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(hoehen);
  }

  function start(){
    einblenden(document);
    document.querySelectorAll(".ktd-stapel").forEach(stapel);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();

  /* Für nachgeladene Inhalte, z. B. Register mit neuen Karten */
  window.ktd={einblenden:einblenden,version:"0.1.0"};
})();
