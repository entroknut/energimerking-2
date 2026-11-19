
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Constants ────────────────────────────────────────────────
const COLORS=['#1a7a6e','#2563eb','#d97706','#dc2626','#7c3aed','#0891b2','#c2410c'];
// Fargeindeks for sona zi på etasje fli. Kopla soner deler farge med den
// fyrste sona i gruppa, så same gruppe ser lik ut på alle etasjar.
function zoneColorIdx(fli,zi,z){
  const base=fi=>floors.slice(0,fi).reduce((s,fl)=>s+fl.zones.length,0);
  if(z&&z.groupId){
    let fst=null;
    floors.forEach((fl,a)=>fl.zones.forEach((zz,b)=>{if(!fst&&zz.groupId===z.groupId)fst={a,b};}));
    if(fst)return (base(fst.a)+fst.b)%COLORS.length;
  }
  return (base(fli)+zi)%COLORS.length;
}
const FILLS=['rgba(26,122,110,.10)','rgba(37,99,235,.10)','rgba(217,119,6,.10)','rgba(220,38,38,.10)','rgba(124,58,237,.10)','rgba(8,145,178,.10)','rgba(194,65,12,.10)'];
const DIRS=['Nord','Nordøst','Øst','Sørøst','Sør','Sørvest','Vest','Nordvest'];

// ── DOM refs ─────────────────────────────────────────────────
// `let`, ikkje `const`: PDF-eksporten låner draw() og peikar desse mellombels
// på eit eige lerret, så utskrifta vert teikna med nøyaktig same kode som skjermen.
let cv=document.getElementById('cv');
let ctx=cv.getContext('2d');
const cwrap=document.getElementById('cwrap');
const compassCanvas=document.getElementById('compassCanvas');
const cctx=compassCanvas.getContext('2d');
const fi=document.getElementById('fi');
const dropz=document.getElementById('dropz');
const emptyEl=document.getElementById('empty');
const zlist=document.getElementById('zlist');
const pgctrl=document.getElementById('pgctrl');
const pgLbl=document.getElementById('pgLbl');
const fhI=document.getElementById('fhI');
const northI=document.getElementById('northI');
const scaleBadge=document.getElementById('scaleBadge');
const hintText=document.getElementById('hintText');
const modeLabel=document.getElementById('modeLabel');
const calOverlay=document.getElementById('calOverlay');
const rettOverlay=document.getElementById('rettOverlay');
const calPxSpan=document.getElementById('calPxSpan');
const calMmInput=document.getElementById('calMmInput');
const winOverlay=document.getElementById('winOverlay');

// ── State ────────────────────────────────────────────────────
let bgImg=null,sc=1,offX=0,offY=0;
let nordCheck=false; // true while Nord-sjekk button is held
let dragging=false,dragSt=null,lastOff={x:0,y:0};
let mouse=null;
let mmPerImgPx=null;
let globalMmPerImgPx=null; // kalibrering som gjeld alle etasjar utan eigen kalibrering
// Bygget si adresse — sett frå kartsøket eller SXI-dialogen, lagra i prosjektfila
// og brukt som framlegg til filnamn.
let prosjektAdresse='';
// Gateadressa åleine — utan postnummer og poststad.
// «Nordre gate 3, 7011 Trondheim» → «Nordre gate 3»
// Både filnamnet og prosjektnamnet i SXI-dialogen byggjer på denne, så regelen
// for kva som er «adressa» bur på éin stad.
function gateadresse(a){
  if(!a)return null;
  const s=String(a).split(',')[0].replace(/\s+/g,' ').trim();
  return s||null;
}
function adresseTilFilnamn(a){
  const s=gateadresse(a);
  if(!s)return null;
  // «Bleivassvegen 105 B, 5178 Loddefjord, Norge» → «Bleivassvegen 105 B»
  return s.replace(/[\\/:*?"<>|]/g,'-').trim()||null;   // teikn som ikkje er lovlege i filnamn
}
// ── Verdiar frå EntroPi ──────────────────────────────────────
// Bygget i EntroPi har alt adresse og byggeår utfylt, så brukaren skal ikkje
// måtte tasta dei inn på nytt. Dette er **framlegg**, aldri fasit: vi fyller
// berre inn der feltet står tomt, og eit tal brukaren har skrive sjølv vert
// aldri overskrive. Verdiane kjem med sxi:init kvar gong verktøyet vert opna,
// så dei skal ikkje serialiserast — z.byggeaar og prosjektAdresse er det som
// vert lagra, og dei er brukaren sine.
// Brua er einaste skrivar. Utanfor EntroPi står objektet tomt, og då gjer
// _fyllFraPi() ingenting.
let piBygg={adresse:'',byggeaar:null};
// Den som er logga inn i EntroPi (sxi:init → brukar.namn). Går til «Ansvarlig
// person» i SXI-dialogen. Ikkje serialisert: det er den som eksporterer no som
// er ansvarleg, ikkje den som lagra prosjektet sist. Brua er einaste skrivar.
let piBrukar={namn:''};

// Fyller inn dei tomme felta frå bygget i EntroPi. Trygg å kalle fleire gonger.
// Returnerer true om noko vart endra, så kallaren veit om han må teikne på nytt.
// NB: floors[activeFloor].zones er ikkje same array som `zones` før eit
// saveFloorState()/syncFloorState() har gått, så vi må lese den live arrayen
// for aktiv etasje. Elles ville byggeåret stille ikkje nå sonene brukaren
// nettopp teikna. Kall difor denne etter syncFloorState() i lastProsjekt().
function _fyllFraPi(){
  let endra=false;
  if(piBygg.adresse&&!prosjektAdresse){prosjektAdresse=String(piBygg.adresse);_syncAdresseFelt();endra=true;}
  if(piBygg.byggeaar)floors.forEach((fl,i)=>(i===activeFloor?zones:fl.zones).forEach(z=>{
    if(!z.byggeaar){z.byggeaar=piBygg.byggeaar;endra=true;}
  }));
  return endra;
}

// Held adressefelta i kartet og SXI-dialogen i takt med den lagra adressa.
// Fyller berre inn tomme felt, så det brukaren har skrive sjølv står.
function _syncAdresseFelt(){
  const m=document.getElementById('mapSearchInput');
  if(m&&prosjektAdresse&&!m.value)m.value=prosjektAdresse;
  const s=document.getElementById('sxi_adresse');
  if(s&&prosjektAdresse&&!s.value)s.value=prosjektAdresse;
  // Prosjektnamnet er gateadressa — same framlegg som filnamnet får. Feltet er
  // eit vanleg skrivefelt, så det kan overskrivast fritt, og det brukaren
  // skriv står til han endrar det sjølv.
  const n=document.getElementById('sxi_namn');
  if(n&&!n.value){const g=gateadresse(prosjektAdresse);if(g)n.value=g;}
}
let zones=[],curPts=[],mode='navigate',calPts=[];
let rettPts=[],rettSnap=null;   // «Rett ut»: fire punkt i biletkoordinatar (rektangel eller to mål)
let draftZones=[];
let kiDraftWins=[];   // KI-forslag til opningar: {z,segIdx,t0,t1,type,breddeMm,hoyMm}
let editZoneIdx=null,dragCorner=null,dragZone=null; // dragZone={zoneIdx,startIx,startIy,origPts}
let pendingCalImgPx=0;
let pdfDoc=null,curPage=1,totalPages=1;
// Window drawing state
let winPts=[];
let winSnapPreview=null;
// Takflate drawing state
let takflatePts=[],activeTakflateZone=null;
// Klippeverktøy for takflater — kode bevart, DEAKTIVERT (sett KLIPP_TAKFLATE_ENA=true for å aktivere)
const KLIPP_TAKFLATE_ENA=true;
// Klippeverktøyet gjeld både takflater og golvflater — `kind` i target seier kva.
let klippTakflatePts=[],klippTakflateTarget=null,klippSnap=null;
// Kva lag som vert teikna oppå planteikninga. Berre eitt om gongen: tak- og
// golvoppdelinga ligg oppå kvarandre i planet, og to fyllfargar over kvarandre
// er uleseleg. Standard er 'tak' — slik det alltid har vore.
let flateLag='tak';
// Del sone: klippelinje som splittar ei sone i to
let delSonePts=[],delSoneTarget=null,delSoneSnap=null;
let drawSnap=null;
let calSnap=null;
let pendingWin=null;
// Measure tool state
let measurePts=[];   // [{x,y}] in image coords — max 2 (start + end)
// measureResults er eit ALIAS til curFloor().measurements — måla høyrer til etasjen
// og lever vidare til brukaren slettar dei. Ikkje tildel [] direkte; det bryt aliaset.
let measureResults=[];// [{p1,p2}] i biletkoordinatar for aktiv etasje
let showMeasurements=true; // av/på for lagra mål
let hoveredMeasure=null;   // {m,idx} — målelinja under peikaren
let measureSnap=null;    // {x,y} i biletkoordinatar — Shift-låst eller snappa punkt
let measureGeoSnap=null; // snap-treffet med type, for markøren

// ── Floor state ───────────────────────────────────────────────
// Each floor: {id, name, bgImg, pdfDoc, pdfPage, totalPages, mmPerImgPx, sc, offX, offY, zones}
// northAngle is GLOBAL — shared across all floors
let globalNorth=0;
let floors=[{id:1,name:'Etasje 1',bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,mmPerImgPx:null,ownCal:false,defaultHoyde:3.0,sc:1,offX:0,offY:0,floorDxImg:0,floorDyImg:0,zones:[],measurements:measureResults}];
let ghostMode=false; // vis nabeetasje som ghostbilde
let activeFloor=0;
let _nextFloorId=2;
let _nextGroupId=1;
let _nextZoneId=0; // pre-increment, so first zone = 1

// ── Fasadeteikningar ─────────────────────────────────────────
// Fasadearka ligg VED SIDA AV planteikningane og er eit reint oppmålingslag:
// ingen soner, ingen vindauge, inga kopling til 3D-modellen, kartet eller
// SXI-eksporten. Difor er dei ikkje etasjar — `floors` er modellen, og alt
// som reknar på bygget skal halde fram med å sjå berre den arrayen.
//
// Kvart ark har si EIGA kalibrering. Ei fasadeteikning er sjeldan i same
// målestokk som planen, og det finst ingen «global fasadeskala» å arve, så
// ownCal-mekanikken frå etasjane har ingen meining her.
//
// Lerret-globalane (bgImg, sc, offX, offY, mmPerImgPx, measureResults,
// pdfDoc/curPage/totalPages) peikar på det AKTIVE arket i begge visingar.
// Det er heile poenget: måleverktøyet, kalibreringa, zoom/pan og snappinga
// verkar uendra på eit fasadeark utan ein einaste ny kodeveg.
let fasadar=[];
let activeFasade=0;
let _nextFasadeId=1;
let viewMode='plan';   // 'plan' | 'fasade' — kva lerretet viser
let sideBySide=false;  // den andre visinga står i #sidePane — sjå «Side om side»
let _sideFit=new WeakSet(); // ark med zoom/pan som passar til ruta i side-om-side
function iFasade(){return viewMode==='fasade';}
function curFasade(){return fasadar[activeFasade]||null;}
// Arket lerretet viser no. Papirformat, PDF-sider og bakgrunnsbilete høyrer
// til arket — ikkje til etasjen — så alt som les dei skal gå gjennom denne.
function curArk(){return iFasade()?(curFasade()||{}):curFloor();}

function setGlobalNorth(nd){
  globalNorth=((nd%360)+360)%360;
  northI.value=globalNorth;
  const lbl=document.getElementById('northLabel');
  if(lbl)lbl.textContent=globalNorth+'°';
  if(window._nordEndra)window._nordEndra(globalNorth);
}

function curFloor(){return floors[activeFloor];}

// ── Delplanar: fleire planteikningar for same etasje ─────────
// Store bygg har ofte éi teikning per fløy. Kvar teikning er framleis eit
// eige element i `floors` — med sitt eige bilete, si eiga kalibrering, sine
// eigne soner og si eiga forskyving — men ei delplan ber `delAv` = id-en til
// hovudetasjen. Då deler ho etasjehøgda og står på same nivå i 3D og kart,
// og systerarka vert viste under det aktive arket, så ein kan plassere
// teikningane mot kvarandre og teikne og snappe på tvers.
//
// Alt som reknar per sone (areal, SXI, BRA) er urørt: ei sone høyrer framleis
// til nøyaktig eitt ark, og mppForZone/mppForFloor finn skalaen hennar.
// Invariantar (held av _ordneDelplanar):
//  - ei hovudetasje er aldri sjølv ei delplan, og delAv peikar alltid på ein
//    hovudetasje som finst — elles vert arket ei eiga etasje att
//  - delplanane står rett etter hovudetasjen sin i `floors`
//  - alle arka i ei etasje har same defaultHoyde
function hovudEtasje(f){
  if(!f||f.delAv==null)return f;
  const h=floors.find(x=>x.id===f.delAv);
  return(h&&h!==f&&h.delAv==null)?h:f;
}
function erDelplan(f){return !!f&&hovudEtasje(f)!==f;}
// Alle arka i etasjen til f, hovudetasjen fyrst
function etasjeArk(f){
  const h=hovudEtasje(f);
  return floors.filter(x=>x===h||hovudEtasje(x)===h);
}
// Namnet på arket der det står åleine (sonekort, eksport-suffiks)
function arkNamn(f){return erDelplan(f)?hovudEtasje(f).name+' · '+f.name:f.name;}
function _ordneDelplanar(){
  floors.forEach(f=>{if(f.delAv!=null&&hovudEtasje(f)===f)f.delAv=null;});
  // Eit anker gjeld berre innanfor same etasje
  floors.forEach(f=>{
    if(!f.plassAnker)return;
    const a=_anker(f);
    if(!a||hovudEtasje(a.t)!==hovudEtasje(f))f.plassAnker=null;
  });
  const akt=floors[activeFloor];
  const ut=[];
  floors.filter(f=>f.delAv==null).forEach(h=>{
    ut.push(h);
    floors.forEach(f=>{if(f.delAv===h.id)ut.push(f);});
  });
  floors.splice(0,floors.length,...ut);
  floors.forEach(f=>{if(f.delAv!=null)f.defaultHoyde=hovudEtasje(f).defaultHoyde;});
  const ai=floors.indexOf(akt);
  if(ai>=0)activeFloor=ai;
}
// Grunnhøgda (m over planteikninga til nedste etasje) for kvar etasje i
// `floors`. Ei delplan står på same nivå som hovudetasjen sin og legg ikkje
// til noko høgd i stabelen. Brukt av 3D, kartet og kjellersenkinga — dei
// MÅ rekne likt, elles hamnar terrenget på feil nivå.
function etasjeGrunnhoyder(){
  let cum=0;const base=new Map();
  floors.forEach(f=>{if(erDelplan(f))return;base.set(f,cum);cum+=_etasjeStakkHoyde(f);});
  return floors.map(f=>base.get(hovudEtasje(f))??0);
}
// Arkskala relativt til det aktive arket: k = mpp(ark)/mpp(aktivt). Verda er
// i meter, (ix+floorDxImg)*mpp — same formel som 3D-modellen brukar. Manglar
// ein av skalaene, reknar vi pikslane som like store (som ghost-laget før).
function _arkK(f){
  const a=mppForFloor(curFloor()),b=mppForFloor(f);
  return(a&&b)?b/a:1;
}
// Biletpunkt på arket f → biletpunkt på det aktive arket, og attende
function arkTilAktiv(p,f){
  const A=curFloor(),k=_arkK(f);
  return{x:(p.x+(f.floorDxImg||0))*k-(A.floorDxImg||0),y:(p.y+(f.floorDyImg||0))*k-(A.floorDyImg||0)};
}
function aktivTilArk(p,f){
  const A=curFloor(),k=_arkK(f);
  return{x:(p.x+(A.floorDxImg||0))/k-(f.floorDxImg||0),y:(p.y+(A.floorDyImg||0))/k-(f.floorDyImg||0)};
}
// Systerarka som skal visast og snappast mot no. Berre medan «Plasser» er
// på: elles skal ein sjå den eine teikninga ein arbeider i, og ingenting anna.
// (Auto-skiljekonstruksjonen på tvers av ark brukar _systerProxyar og verkar
// uansett.)
function synlegeSysterark(){
  if(iFasade()||mode!=='plasser-ark')return[];
  const A=curFloor();
  return etasjeArk(A).filter(f=>f!==A);
}
// Sonene på systerarka, med punkta omrekna til det aktive arket. `z` er
// originalen; `pts` er ein kopi — skriv aldri til han.
function systerSoner(){
  const ut=[];
  synlegeSysterark().forEach(f=>f.zones.forEach(z=>{
    if(z.skjult||(z.pts||[]).length<2)return;
    ut.push({z,f,ark:f,pts:z.pts.map(p=>arkTilAktiv(p,f))});
  }));
  return ut;
}
// ── Plassering av delplanar ──
// `f.plassAnker = {a:{x,y}, til:id, b:{x,y}}`: biletpunktet a på dette arket
// ligg oppå biletpunktet b på arket `til`. Ankeret er i BILETPIKSLAR på begge
// ark, så det er uavhengig av kalibreringa. Når ein skala endrar seg, vert
// floorDxImg rekna på nytt frå ankeret — elles ville arket gli ut av
// plasseringa si (forskyvinga er i biletpikslar, og verda er pikslar × mpp).
// Manglar ein av skalaene, står arket der det står til begge er kalibrerte.
function _anker(f){
  const a=f&&f.plassAnker;if(!a||!a.a||!a.b)return null;
  const t=floors.find(x=>x.id===a.til);
  return(t&&t!==f)?{a:a.a,b:a.b,t}:null;
}
function _kopiAnker(a){
  return(a&&a.a&&a.b)?{a:{x:+a.a.x,y:+a.a.y},til:a.til,b:{x:+a.b.x,y:+a.b.y}}:null;
}
function _brukAnker(f){
  const a=_anker(f);if(!a)return false;
  const mf=mppForFloor(f),mt=mppForFloor(a.t);if(!mf||!mt)return false;
  f.floorDxImg=(a.b.x+(a.t.floorDxImg||0))*mt/mf-a.a.x;
  f.floorDyImg=(a.b.y+(a.t.floorDyImg||0))*mt/mf-a.a.y;
  return true;
}
// To rundar, så eit ark som er plassert mot ei anna delplan følgjer med når
// den andre flyttar seg.
function _brukAlleAnker(){
  for(let r=0;r<2;r++)floors.forEach(f=>{if(f.plassAnker)_brukAnker(f);});
}
// Arket vart flytta for hand (piltastar, Plasser). Ankeret til arket sjølv
// skal følgje den nye staden; ark som er plasserte MOT det skal følgje med.
function _arkFlytta(f){
  const a=_anker(f);
  if(a){
    const mf=mppForFloor(f),mt=mppForFloor(a.t);
    const k=(mf&&mt)?mf/mt:1;
    f.plassAnker.b={x:(a.a.x+(f.floorDxImg||0))*k-(a.t.floorDxImg||0),
                    y:(a.a.y+(f.floorDyImg||0))*k-(a.t.floorDyImg||0)};
  }
  _brukAlleAnker();
}
// Redirect zones to active floor
function syncFloorState(){
  const f=curFloor();
  // `zones`-aliaset må alltid peike på den aktive etasjen — også medan
  // lerretet viser eit fasadeark. Elles ville ei angring i fasadevisinga
  // late aliaset stå att på den gamle arrayen, og saveFloorState() ville
  // seinare skrive den utdaterte lista tilbake på etasjen.
  zones=f.zones;
  if(!f.measurements)f.measurements=[];
  if(f.defaultHoyde==null)f.defaultHoyde=parseFloat(fhI.value)||3.0;
  // Fasadearket eig lerret-globalane medan det er framme.
  if(iFasade())return;
  bgImg=f.bgImg;sc=f.sc;offX=f.offX;offY=f.offY;
  // Bruk eigen kalibrering om ownCal=true, elles global
  mmPerImgPx=f.ownCal?f.mmPerImgPx:(globalMmPerImgPx??f.mmPerImgPx);
  measureResults=f.measurements;
  pdfDoc=f.pdfDoc;curPage=f.pdfPage||1;totalPages=f.totalPages||1;
  updatePdfSideUI();
  northI.value=globalNorth;
  const _nl=document.getElementById('northLabel');if(_nl)_nl.textContent=globalNorth+'°';
  // Synkroniser etasjehøgde-feltet med aktiv etasje
  fhI.value=f.defaultHoyde;
  updateScaleBadge();
  hoveredMeasure=null;
  updateMeasureUI();
}
function saveFloorState(){
  // Medan eit fasadeark er framme, eig arket lerret-globalane — då skal
  // ingenting av dette skrivast tilbake på etasjen. Autolagringa kallar
  // denne kvart minutt, så utan vakta ville fasadebiletet og fasadeskalaen
  // hamna på den aktive etasjen.
  if(iFasade()){saveFasadeState();return;}
  const f=curFloor();
  f.bgImg=bgImg;f.sc=sc;f.offX=offX;f.offY=offY;
  f.defaultHoyde=parseFloat(fhI.value)||3.0;
  etasjeArk(f).forEach(x=>{x.defaultHoyde=f.defaultHoyde;});   // delplanar deler høgda
  // Lagre berre tilbake til etasjen om den har eigen kalibrering
  if(f.ownCal)f.mmPerImgPx=mmPerImgPx;
  f.zones=zones;
  f.measurements=measureResults;
  f.pdfDoc=pdfDoc;f.pdfPage=curPage;f.totalPages=totalPages;
}

