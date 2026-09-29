/* =====================================================================
   Kunstturnen Deutschland · zentrale Skripte
   Datei: ktd.js · Version 0.3.2 · Stand 28.09.2026
   Enthält: Karten umdrehen, Einblenden, Karten-Stapel mit Abdunkeln, Quiz, Termine in den Kalender.
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


  /* ---------- In den Kalender ----------
     Jedes Element mit data-ktd-kal öffnet ein kleines Menü: Apple/Outlook (.ics) oder Google Kalender.
     data-titel, data-start (JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM), data-ende, data-ort, data-url, data-info, data-dauer (Minuten) */
  var KM=null;
  function zwei(n){return(n<10?"0":"")+n}
  function tagPlus(s,n){var p=s.split("-"),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n));return d.getUTCFullYear()+zwei(d.getUTCMonth()+1)+zwei(d.getUTCDate())}
  function zeitPlus(s,min){var p=s.split(/[-T:]/),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2],+p[3],+p[4]+min));return d.getUTCFullYear()+zwei(d.getUTCMonth()+1)+zwei(d.getUTCDate())+"T"+zwei(d.getUTCHours())+zwei(d.getUTCMinutes())+"00"}
  function termin(b){var t={titel:b.getAttribute("data-titel")||"",start:b.getAttribute("data-start")||"",ende:b.getAttribute("data-ende")||"",ort:b.getAttribute("data-ort")||"",url:b.getAttribute("data-url")||"",info:b.getAttribute("data-info")||"",dauer:parseInt(b.getAttribute("data-dauer")||"120",10)};
    if(t.url&&t.url.charAt(0)==="/")t.url=location.origin+t.url;t.zeit=t.start.indexOf("T")>0;
    if(t.zeit){t.a=zeitPlus(t.start,0);t.b=zeitPlus(t.start,t.dauer)}else{t.a=tagPlus(t.start,0);t.b=tagPlus(t.ende||t.start,1)}return t}
  function ics(t){function esc(s){return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n")}
    var jetzt=new Date(),st=jetzt.getUTCFullYear()+zwei(jetzt.getUTCMonth()+1)+zwei(jetzt.getUTCDate())+"T"+zwei(jetzt.getUTCHours())+zwei(jetzt.getUTCMinutes())+"00Z";
    var z=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Kunstturnen Deutschland//Termine//DE","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
    if(t.zeit)z.push("BEGIN:VTIMEZONE","TZID:Europe/Berlin","BEGIN:DAYLIGHT","TZOFFSETFROM:+0100","TZOFFSETTO:+0200","TZNAME:CEST","DTSTART:19700329T020000","RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU","END:DAYLIGHT","BEGIN:STANDARD","TZOFFSETFROM:+0200","TZOFFSETTO:+0100","TZNAME:CET","DTSTART:19701025T030000","RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU","END:STANDARD","END:VTIMEZONE");
    z.push("BEGIN:VEVENT","UID:"+t.a+"-"+t.titel.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"@kunstturnen-deutschland.de","DTSTAMP:"+st);
    if(t.zeit)z.push("DTSTART;TZID=Europe/Berlin:"+t.a,"DTEND;TZID=Europe/Berlin:"+t.b);else z.push("DTSTART;VALUE=DATE:"+t.a,"DTEND;VALUE=DATE:"+t.b);
    z.push("SUMMARY:"+esc(t.titel));if(t.ort)z.push("LOCATION:"+esc(t.ort));
    var info=[t.info,t.url?"Alles zum Wettkampf: "+t.url:"","Kunstturnen Deutschland"].filter(Boolean).join("\n");z.push("DESCRIPTION:"+esc(info));if(t.url)z.push("URL:"+t.url);
    if(t.zeit)z.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc(t.titel),"TRIGGER:-PT30M","END:VALARM");
    z.push("END:VEVENT","END:VCALENDAR");return z.join("\r\n")}
  function google(t){var q="action=TEMPLATE&text="+encodeURIComponent(t.titel)+"&dates="+t.a+"/"+t.b+"&details="+encodeURIComponent([t.info,t.url].filter(Boolean).join("\n"))+"&location="+encodeURIComponent(t.ort);if(t.zeit)q+="&ctz=Europe%2FBerlin";return "https://calendar.google.com/calendar/render?"+q}
  function kalZu(){if(KM){KM.remove();KM=null}}
  function kalAuf(b){kalZu();var t=termin(b);if(!t.start)return;
    var m=document.createElement("div");m.className="ktd-kalmenu";m.setAttribute("role","menu");
    var a1=document.createElement("a");a1.className="ktd-kalmenu__a";a1.setAttribute("role","menuitem");a1.href="data:text/calendar;charset=utf-8,"+encodeURIComponent(ics(t));a1.download=(t.titel.replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g,"-").replace(/^-|-$/g,"")||"termin")+".ics";a1.textContent="Apple, Outlook und andere";
    var a2=document.createElement("a");a2.className="ktd-kalmenu__a";a2.setAttribute("role","menuitem");a2.href=google(t);a2.target="_blank";a2.rel="noopener";a2.textContent="Google Kalender";
    var k=document.createElement("p");k.className="ktd-kalmenu__k";k.textContent="In den Kalender";m.appendChild(k);m.appendChild(a1);m.appendChild(a2);
    document.body.appendChild(m);var r=b.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;
    var x=Math.min(Math.max(8,r.right-w),window.innerWidth-w-8),y=r.bottom+8;if(y+h>window.innerHeight-8)y=Math.max(8,r.top-h-8);
    m.style.left=x+"px";m.style.top=y+"px";KM=m;[a1,a2].forEach(function(a){a.addEventListener("click",function(){setTimeout(kalZu,50)})});a1.focus({preventScroll:true})}
  document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest("[data-ktd-kal]");if(b){ev.preventDefault();ev.stopPropagation();if(KM&&KM.__b===b){kalZu();return}kalAuf(b);if(KM)KM.__b=b;return}if(KM&&!KM.contains(ev.target))kalZu()},true);
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape")kalZu()});
  window.addEventListener("scroll",function(){if(KM)kalZu()},{passive:true});


  /* ---------- Kalender abonnieren ----------
     Element mit data-ktd-abo="https://…/kalender.ics" öffnet ein Menü: Apple/Outlook (webcal), Google, Adresse kopieren */
  function aboAuf(b){kalZu();var u=b.getAttribute("data-ktd-abo"),w=u.replace(/^https?:/,"webcal:");
    var m=document.createElement("div");m.className="ktd-kalmenu";m.setAttribute("role","menu");
    var k=document.createElement("p");k.className="ktd-kalmenu__k";k.textContent="Kalender abonnieren";m.appendChild(k);
    function eintrag(t,h,neu){var a=document.createElement("a");a.className="ktd-kalmenu__a";a.setAttribute("role","menuitem");a.textContent=t;a.href=h;if(neu){a.target="_blank";a.rel="noopener"}a.addEventListener("click",function(){setTimeout(kalZu,50)});m.appendChild(a);return a}
    var a1=eintrag("Apple, Outlook und andere",w);eintrag("Google Kalender","https://calendar.google.com/calendar/r?cid="+encodeURIComponent(w),true);
    var c=eintrag("Adresse kopieren","#");c.addEventListener("click",function(ev){ev.preventDefault();try{navigator.clipboard.writeText(u);c.textContent="Adresse kopiert"}catch(x){prompt("Adresse zum Kopieren:",u)}});
    var mac=/Macintosh/.test(navigator.userAgent)&&!("ontouchend" in document);var h=document.createElement("p");h.className="ktd-kalmenu__h";h.textContent=mac?"Tut sich am Mac nichts? Adresse kopieren und in der App Kalender unter „Ablage › Neues Kalenderabonnement“ einfügen.":"Alle Wettkämpfe im eigenen Kalender, aktualisiert sich von selbst.";m.appendChild(h);
    document.body.appendChild(m);var r=b.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight;
    var x=Math.min(Math.max(8,r.left),window.innerWidth-mw-8),y=r.bottom+8;if(y+mh>window.innerHeight-8)y=Math.max(8,r.top-mh-8);
    m.style.left=x+"px";m.style.top=y+"px";KM=m;KM.__b=b;a1.focus({preventScroll:true})}
  document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest("[data-ktd-abo]");if(!b)return;ev.preventDefault();ev.stopPropagation();if(KM&&KM.__b===b){kalZu();return}aboAuf(b)},true);

  function start(){
    einblenden(document);
    document.querySelectorAll(".ktd-stapel").forEach(stapel);
    document.querySelectorAll(".ktd-quiz").forEach(quiz);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();

  /* Für nachgeladene Inhalte, z. B. Register mit neuen Karten */
  window.ktd={einblenden:einblenden,version:"0.3.2"};
})();
