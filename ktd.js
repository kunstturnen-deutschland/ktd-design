/* =====================================================================
   Kunstturnen Deutschland · zentrale Skripte
   Datei: ktd.js · Version 0.2.1 · Stand 28.09.2026
   Enthält: Karten umdrehen, Einblenden, Karten-Stapel mit Abdunkeln, Quiz.
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
      sek.forEach(function(s,i){s.style.top=i===sek.length-1?"":Math.min(oben,vh-s.offsetHeight)+"px"});
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


  /* ---------- Quiz ----------
     data-ktd-quiz-daten: id eines JSON-Blocks [{f,o:[..],r,a}], sonst .ktd-qf-Einträge (CMS)
     data-ktd-quiz-anzahl: Fragen je Runde (Standard 5) */
  var WORTE=["null","eine","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn"];
  function quiz(sek){
    var pool=[],runde=[],nr=0,gestanden=0,gerettet=0,FARBEN=["ktd-gold","ktd-silber","ktd-bronze","ktd-pinkfl"];
    var N=parseInt(sek.getAttribute("data-ktd-quiz-anzahl")||"5",10);
    function el(t,k,x){var e=document.createElement(t);if(k)e.className=k;if(x!==undefined)e.textContent=x;return e}
    function mische(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
    function karte(f){var k=sek.querySelector(".ktd-quiz-karte");k.textContent="";FARBEN.forEach(function(c){k.classList.remove(c)});if(f)k.classList.add(f);return k}
    function stand(){var s=sek.querySelector(".ktd-quiz-stand");if(s)s.textContent="Stand: "+gestanden+" gestanden"+(gerettet?" · "+gerettet+" gerettet":"")}
    function knopf(k,t,fn,fokus){var b=el("button","ktd-q-weiter",t);b.type="button";b.addEventListener("click",function(){fn(true)});k.appendChild(b);if(fokus)b.focus({preventScroll:true})}
    function stempel(f,w,t,kt,fn){var k=karte(f);k.appendChild(el("div","ktd-q-nr","Frage "+(nr+1)+" von "+runde.length));var s=el("div","ktd-stempel",w);s.setAttribute("role","status");k.appendChild(s);if(t)k.appendChild(el("div","ktd-q-text",t));knopf(k,kt,fn,true)}
    function weiter(){nr++;frage(true)}
    function ende(){var n=runde.length,fehl=n-gestanden,m=fehl===0?["ktd-gold","Gold"]:fehl===1&&n>=3?["ktd-silber","Silber"]:fehl===2&&n>=4?["ktd-bronze","Bronze"]:null;
      var k=karte(m?m[0]:null);k.appendChild(el("div","ktd-q-nr","Dein Ergebnis"));var s=el("div","ktd-stempel",m?m[1]:"Weiterturnen");if(!m)s.style.color="var(--ktd-gruen)";k.appendChild(s);
      k.appendChild(el("div","ktd-q-zahl",gestanden+" von "+n+" gestanden"+(gerettet?" · "+gerettet+" gerettet":"")));
      k.appendChild(el("div","ktd-q-text",fehl===0?"Alles im ersten Anlauf. Du kennst dich aus wie eine Kampfrichterin.":m?"Stark geturnt. Da hat jemand genau hingeschaut.":"Jede Turnerin kennt das: aufstehen, Magnesia an die Hände, nochmal."));
      knopf(k,pool.length>runde.length?"Noch einmal, mit neuen Fragen":"Noch einmal turnen",starte,true)}
    function frage(fokus){if(nr>=runde.length){ende();return}var k=karte(null),f=runde[nr],nt=nr+1<runde.length?"Nächste Frage →":"Ergebnis ansehen →";
      k.appendChild(el("div","ktd-q-nr","Frage "+(nr+1)+" von "+runde.length));k.appendChild(el("div","ktd-q-frage",f.f));
      if(f.v===1)k.appendChild(el("div","ktd-q-hinweis","Zweiter Versuch"));
      var o=el("div","ktd-q-opts");f.o.forEach(function(t,i){var b=el("button","ktd-q-opt",t);b.type="button";if(f.g===i)b.disabled=true;
        b.addEventListener("click",function(){
          if(i===f.r){if(f.v===0){gestanden++;stand();stempel("ktd-gold","Gestanden!",f.a,nt,weiter)}else{gerettet++;stand();stempel("ktd-gold","Gerettet!",f.a,nt,weiter)}}
          else if(f.v===0){f.v=1;f.g=i;stempel("ktd-pinkfl","Wackler!","Knapp daneben. Du hast noch einen Versuch.","Noch ein Versuch →",frage)}
          else stempel("ktd-pinkfl","Wackler!","Richtig wäre: "+f.o[f.r]+". "+f.a,nt,weiter)});o.appendChild(b)});
      k.appendChild(o);if(fokus){var b1=o.querySelector("button:not(:disabled)");if(b1)b1.focus({preventScroll:true})}}
    function starte(fokus){runde=mische(pool).slice(0,N).map(function(q){return{f:q.f,o:q.o,r:q.r,a:q.a,v:0,g:-1}});nr=0;gestanden=0;gerettet=0;stand();
      var e=sek.querySelector(".ktd-quiz-eyebrow");if(e)e.textContent="Spiel mit · "+(WORTE[runde.length]||runde.length)+" Fragen";frage(fokus)}
    var id=sek.getAttribute("data-ktd-quiz-daten");
    if(id){var d=document.getElementById(id);try{pool=JSON.parse(d.textContent)}catch(x){pool=[]}}
    else pool=[].slice.call(sek.querySelectorAll(".ktd-qf")).map(function(z){function t(k){var c=z.querySelector(k);return c&&!c.classList.contains("w-dyn-bind-empty")?c.textContent.trim():""}
      var al=[t(".ktd-qf-a"),t(".ktd-qf-b"),t(".ktd-qf-c")],r="ABC".indexOf(t(".ktd-qf-richtig").toUpperCase()),o=[],ri=-1;al.forEach(function(x,i){if(x){if(i===r)ri=o.length;o.push(x)}});
      return{f:t(".ktd-qf-frage"),o:o,r:ri,a:t(".ktd-qf-aufl")}});
    pool=pool.filter(function(q){return q&&q.f&&q.o&&q.o.length>=2&&q.r>=0});
    if(pool.length<2){sek.style.display="none";return}
    starte(false);
  }

  function start(){
    einblenden(document);
    document.querySelectorAll(".ktd-stapel").forEach(stapel);
    document.querySelectorAll(".ktd-quiz").forEach(quiz);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();

  /* Für nachgeladene Inhalte, z. B. Register mit neuen Karten */
  window.ktd={einblenden:einblenden,version:"0.2.1"};
})();
