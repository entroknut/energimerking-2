// ── Coord helpers ─────────────────────────────────────────────
// floorDxImg/floorDyImg er offset i BILETPIKSLAR — zoom-uavhengig.
// Skjermposisjon = (ix + floorDxImg)*sc + offX, slik at aligneringa held seg ved zoom.
// Ghost-forskyvinga høyrer til etasjane. Eit fasadeark har ingen, så det
// ville vore etasjen si forskyving som forskauv fasademåla.
function _arkOffset(){
  if(iFasade())return{x:0,y:0};
  const f=curFloor();
  return{x:f.floorDxImg||0,y:f.floorDyImg||0};
}
function s2i(sx,sy){
  const d=_arkOffset();
  return{x:(sx-offX)/sc-d.x,y:(sy-offY)/sc-d.y};
}
function i2s(ix,iy){
  const d=_arkOffset();
  return{x:(ix+d.x)*sc+offX,y:(iy+d.y)*sc+offY};
}
// Konverter biletkord for ei spesifikk etasje (for ghost-overlay)
// Med ulik skala på arka vert det andre arket skalert med k = mpp(f)/mpp(aktivt),
// så det står likt med 3D-modellen. Same skala ⇒ k=1, som før.
function i2sFloor(ix,iy,f){
  const k=_arkK(f);
  return{x:(ix+(f.floorDxImg||0))*k*sc+offX,y:(iy+(f.floorDyImg||0))*k*sc+offY};
}
// Teikn bakgrunnsbiletet til eit anna ark (ghost/delplan) der det står no
function _teiknArkBilete(f){
  if(!f||!f.bgImg)return;
  const k=_arkK(f);
  ctx.drawImage(f.bgImg,offX+(f.floorDxImg||0)*k*sc,offY+(f.floorDyImg||0)*k*sc,f.bgImg.width*k*sc,f.bgImg.height*k*sc);
}
// Hovudetasjen ghost-laget viser: etasjen under, eller over om vi står nedst.
// Ei delplan er ikkje ein nabo — ho er ein del av same etasje.
function ghostEtasje(){
  const hov=floors.filter(f=>!erDelplan(f));
  const hi=hov.indexOf(hovudEtasje(curFloor()));
  return hov[hi>0?hi-1:hi+1]||null;
}

// ── Scale helpers ─────────────────────────────────────────────
function imgPxToM(px){return mmPerImgPx===null?null:px*mmPerImgPx/1000;}
// ── Kalibrering per etasje ────────────────────────────────────
// mmPerImgPx-aliaset gjeld berre AKTIV etasje. All matematikk som kryssar
// etasjar (SXI-eksport, BRA-summar, 3D, sidepanel/tabell for alle etasjar)
// må slå opp skalaen for sona si eiga etasje via desse hjelparane.
function mppForFloor(f){
  if(!f)return mmPerImgPx;
  return f.ownCal?f.mmPerImgPx:(globalMmPerImgPx??f.mmPerImgPx);
}
function mppForZone(z){
  for(const f of floors){if(f.zones.includes(z))return mppForFloor(f);}
  return mmPerImgPx;
}

// ── Omkalibrering: alt som er teikna på planen skal følgje bygget ──
// Endrar brukaren skalaen etter å ha teikna, blir teikninga sjølv liggjande
// i ro — det er MÅLA som endrar seg. Sonearealer, veggengder og kontrollmål
// blir rekna på nytt frå biletpikslar ved kvar teikning, så dei følgjer med
// av seg sjølv. Vindaugs- og dørbreidder gjer det IKKJE: dei ligg lagra i mm
// (`breddeMm`), måla langs veggen med to klikk på fasaden. Utan denne
// reskaleringa vart eit vindauge liggjande med gammal millimeterbreidde på ein
// vegg som hadde fått ny lengd — det såg ut som om vindauget endra storleik
// utan å følgje bygget, og SXI-eksporten fekk glasareal som ikkje høyrde saman
// med veggarealet.
//
// Høgd og brystning er TASTA INN (aldri henta frå planteikninga), på same måte
// som etasjehøgda. Dei står difor urørte — akkurat som `defaultHoyde`.
// `areaOverride`, `perimOverride` og `segOverrides` er òg tasta fasit og står.
//
// `gavlflater` har cacha `area`/`lenM` i meter og må reknast på nytt.
// Returnerer talet på vindauge/dører som vart skalerte.
function reskalerVedNyKalibrering(fl,oldMpp,newMpp){
  if(!fl||!(oldMpp>0)||!(newMpp>0))return 0;
  const k=newMpp/oldMpp;
  if(!isFinite(k)||Math.abs(k-1)<1e-9)return 0;
  let n=0;
  (fl.zones||[]).forEach(z=>{
    (z.windows||[]).forEach(w=>{
      if(!(w.breddeMm>0))return;
      w.breddeMm=Math.max(1,Math.round(w.breddeMm*k));
      n++;
    });
    _syncGavlflater(z);
  });
  return n;
}
// Fangar effektiv skala for alle etasjar før ei kalibreringsendring.
function _snapshotMpp(){return floors.map(fl=>mppForFloor(fl));}
// Reskalerer dei etasjane som faktisk fekk ny skala. Kall ETTER at
// mmPerImgPx/globalMmPerImgPx/f.mmPerImgPx er oppdaterte.
function _reskalerAlleEtasjar(oldMppList){
  let n=0;
  floors.forEach((fl,i)=>{n+=reskalerVedNyKalibrering(fl,oldMppList[i],mppForFloor(fl));});
  _brukAlleAnker();   // delplanar held plasseringa si når skalaen endrar seg
  if(n)loggAuto(n+' vindauge/dør'+(n>1?'er':'')+' skalert med ny skala');
  return n;
}

function calcAreaM2(pts,mpp){
  if(mpp===undefined)mpp=mmPerImgPx;
  if(!mpp||pts.length<3)return null;
  let a=0;for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;}
  return Math.abs(a)/2*(mpp/1000)**2;
}
function calcPerimM(pts,mpp){
  if(mpp===undefined)mpp=mmPerImgPx;
  if(!mpp)return null;
  let p=0;for(let i=0;i<pts.length;i++){const p1=pts[i],p2=pts[(i+1)%pts.length];p+=Math.hypot(p2.x-p1.x,p2.y-p1.y);}
  return p*mpp/1000;
}
function calcSegments(pts,fhM,mpp){
  if(mpp===undefined)mpp=mmPerImgPx;
  if(pts.length<2)return null;
  if(fhM==null)fhM=parseFloat(fhI.value)||3.0;
  const nd=parseFloat(northI.value)||0;
  // Bestem om polygon er CW eller CCW (shoelace sum)
  let area2=0;
  for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;area2+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;}
  // Canvas Y-akse peikar ned, så positiv area2 = CW i skjermkoordinatar = CCW i matematisk
  // Utvendig normal: CW polygon → normal er 90° til venstre for veggretning (wallAngle-90)
  //                  CCW polygon → normal er 90° til høgre (wallAngle+90)
  const normalOffset=area2>0?-90:90;
  return pts.map((p1,i)=>{
    const p2=pts[(i+1)%pts.length];
    const lenPx=Math.hypot(p2.x-p1.x,p2.y-p1.y);
    const lenM=mpp?lenPx*mpp/1000:null;
    const areaM2=(lenM!==null)?lenM*fhM:null;
    const wallAngle=Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI;
    const normalAngle=wallAngle+normalOffset;
    // Juster for nord-rotasjon og konverter til kompassazimut (0=Nord, 90=Aust)
    const normalAz=((normalAngle-nd+90)%360+360)%360;
    const dirIdx=Math.round(normalAz/45)%8;
    const dir=DIRS[dirIdx>=0&&dirIdx<8?dirIdx:0];
    return{idx:i,dir,normalAz,lenM,lenPx,areaM2,midImgX:(p1.x+p2.x)/2,midImgY:(p1.y+p2.y)/2,wallAngle,p1,p2};
  });
}
function fmtM2(v){return v.toFixed(2)+' m²';}
function fmtM(v){return v.toFixed(2)+' m';}

// ── Utstrekning for vindauge/dør langs eit veggsegment ────────
// breddeMm er sanninga for kor breitt eit vindauge er; t0/t1 held berre
// SENTERposisjonen langs segmentet (dei blir ikkje oppdaterte når brukaren
// endrar breidda i dialogen). Difor må kvar visning rekne utstrekninga på nytt
// frå breddeMm — teikning, treff-testing, fasadevising, 3D og limeinn.
//
// `width` og `segLen` må ha same eining (biletpikslar ELLER meter).
// Er det ikkje plass til heile breidda frå senteret, blir vindauget SKYVD
// inn på veggen — ikkje klipt på éi side. Ei einsidig klipping ville vist ei
// anna breidde på skjermen enn den som går til SIMIEN.
function fitSpanT(centreT,width,segLen){
  if(!(segLen>0)||!(width>0))return{t0:0,t1:1};
  const halfT=(width/2)/segLen;
  if(halfT>=0.5)return{t0:0,t1:1};      // breiare enn veggen — fyll heile
  const c=isFinite(centreT)?centreT:0.5;
  let t0=c-halfT,t1=c+halfT;
  if(t0<0){t0=0;t1=2*halfT;}
  else if(t1>1){t1=1;t0=1-2*halfT;}
  return{t0,t1};
}
// Same, men for eit vindaugsobjekt i BILETpikslar. Fell tilbake på den lagra
// utstrekninga når teikninga ikkje er kalibrert (då finst ingen mm-breidde).
function winSpanPx(w,segLenPx,mpp){
  const widthPx=winBreiddPx(w,segLenPx,mpp);
  return fitSpanT((w.t0+w.t1)/2,widthPx,segLenPx);
}

// ── Vindaugsgrupper: eitt SIMIEN-element, mange stk på veggen ─
// `antal` er talet på like vindauge i gruppa. I SXI-en er gruppa framleis
// EITT <window number="antal">, men på veggen — i planteikninga, fasadevisinga
// og 3D-modellen — står dei som antal stykk.
//
// `w.posT` held senterposisjonen (0-1 langs segmentet) for kvar stk. Feltet er
// VALFRITT: manglar det, vert stykka fordelte jamnt utover HEILE veggen.
// posT dukkar først opp når brukaren faktisk flyttar ei enkelt stk.
//
// t0/t1 er framleis gruppa sitt ANKER — plasseringa av éi einsleg stk, og det
// remap-funksjonane, kopieringa og deling av sone les. Når posT endrar seg må
// ankeret følgje snittet (winSyncAnchor), elles ville gruppa hoppe tilbake til
// den gamle staden om posT fall bort.
function winCount(w){const n=parseInt(w.antal);return n>0?n:1;}
function winHasPos(w){return Array.isArray(w.posT)&&w.posT.length===winCount(w);}
// Senterposisjon (t) for kvar stk. `width` og `segLen` i SAME eining.
//
// Ei gruppe vert fordelt jamnt utover heile veggen: kvar stk får si eiga rute
// på segLen/n og står midt i ruta. Då er avstanden mellom stykka lik overalt,
// med halve avstanden ned til kvar ende — slik ein fasade med like vindauge
// faktisk ser ut. Det er òg den tettaste fordelinga som finst, så er det plass
// til stykka i det heile, ligg dei ikkje oppå kvarandre.
//
// Utan posT styrer klikkpunktet (t0/t1) berre eit einsleg vindauge. Ei ny
// gruppe får likevel posT med ein gong (winPosFraKlikk): det teikna stykket
// står der det vart teikna, og resten vert spreidde utover veggen derifrå —
// aldri klumpa rundt klikket, det gav ein 3D-modell som ikkje likna på bygget.
function winCentres(w,width,segLen){
  const n=winCount(w);
  if(winHasPos(w))return w.posT.map(t=>isFinite(t)?Math.max(0,Math.min(1,t)):0.5);
  const c=(w.t0+w.t1)/2;
  const centre=isFinite(c)?c:0.5;
  if(n<=1||!(segLen>0))return Array.from({length:n},()=>centre);
  return Array.from({length:n},(_,i)=>(i+0.5)/n);
}
// Er gruppa breiare enn veggen? Då kan ikkje stykka stå utan å overlappe,
// uansett kor dei vert plasserte. Vi teiknar dei framleis så tett som råd,
// men brukaren må få vite det — tala går rett inn i energimerket.
function winForTrongt(w,width,segLen){
  return winCount(w)>1&&width>0&&segLen>0&&winCount(w)*width>segLen*1.0001;
}
// Opningsareal per fasade, med dei same reglane som buildSXI: ein YV-vegg er
// éin <facade>, samanslegne YV-grupper éin felles, SK- og kjellerveggar ingen.
// Areal = segOverrides → seg.areaM2 → lengd×høgd; opningar = h×b×antal med
// eksporten sine standardmål og 0,1 m-golv. Returnerer fasadane der opningane
// er større enn fasaden — sonekortet varslar, og eksporten stoppar
// (sxiForStoreOpningar, som les sjølve fila og er den endelege kontrollen).
function fasadarMedForStoreOpningar(z){
  const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z));
  if(!segs||!(z.windows||[]).length)return [];
  // Kopla soner slegne saman på tvers: éin fasade per himmelretning over alle
  // instansane, som i buildSXI. segs = veggane i DENNE sona i den fasaden.
  if(koplaFasadarSaman(z)){
    return koplaFasadeGrupper(getLinkedZones(z))
      .filter(g=>g.opn>0&&g.opn>g.area+0.005&&g.segs.some(x=>x.lz===z))
      .map(g=>({namn:g.dir+' (kopla soner)',segs:new Set(g.segs.filter(x=>x.lz===z).map(x=>x.seg.idx)),area:g.area,opn:g.opn}));
  }
  const sk=z.skillevegg||new Set(), fhM=getHoyde(z), lbl=getFacadeLabels(z,segs);
  const segA=gs=>{const ov=z.segOverrides?.[gs.idx]||{};return ov.areaM2??gs.areaM2??((ov.lenM??gs.lenM??0)*fhM)??0;};
  const opnA=w=>{
    const d=w.type==='dor';
    return Math.max(0.1,(w.hoyMm||(d?2100:1200))/1000)*Math.max(0.1,(w.breddeMm||(d?900:1200))/1000)*(w.antal||1);
  };
  const ut=[], sett=new Set();
  segs.forEach((seg,si)=>{
    if(sk.has(seg.idx)||isKjellervegg(z,seg.idx))return;
    const g=(z.yvMergedGroups||[]).find(g=>g.segs.includes(seg.idx));
    if(g&&sett.has(g))return;
    if(g)sett.add(g);
    const grp=g?segs.filter(s=>g.segs.includes(s.idx)):[seg];
    const idx=new Set(grp.map(s=>s.idx));
    const area=grp.reduce((a,gs)=>a+segA(gs),0);
    const opn=(z.windows||[]).filter(w=>idx.has(w.segIdx)).reduce((a,w)=>a+opnA(w),0);
    if(opn>0&&opn>area+0.005)ut.push({namn:g?g.name:lbl[si],segs:idx,area,opn});
  });
  return ut;
}
// Utstrekninga til kvar stk i BILETpikslar — teikning og treff-testing.
// Breidda på eitt stk i biletpikslar: frå breddeMm (sanninga, invariant 6).
// Berre gamle vindauge utan breddeMm, eller utan skala, fell tilbake på t1-t0.
// Den eine staden regelen står — ikkje skriv uttrykket på nytt.
function winBreiddPx(w,segLenPx,mpp){
  return(mpp&&w.breddeMm>0)?w.breddeMm/mpp:Math.max(0,(w.t1-w.t0))*segLenPx;
}
function winSpansPx(w,segLenPx,mpp){
  const widthPx=winBreiddPx(w,segLenPx,mpp);
  return winCentres(w,widthPx,segLenPx).map(c=>fitSpanT(c,widthPx,segLenPx));
}
// Segmentlengd og vindaugsbreidde i biletpikslar for eit vindauge i ei sone.
function winGeom(z,w){
  const mpp=mppForZone(z);
  const seg=(calcSegments(z.pts,getHoyde(z),mpp)||[])[w.segIdx]||null;
  const segLen=seg?seg.lenPx:0;
  const width=winBreiddPx(w,segLen,mpp);
  return{seg,segLen,width,mpp};
}
function winSyncAnchor(w,width,segLen){
  const cs=winCentres(w,width,segLen);
  if(!cs.length)return;
  const mean=cs.reduce((s,t)=>s+t,0)/cs.length;
  const sp=fitSpanT(mean,width,segLen);
  w.t0=sp.t0;w.t1=sp.t1;
}
// Plassering for ei ny gruppe: stykket brukaren teikna står der det vart
// teikna (centreT), og dei n-1 andre vert fordelte utover veggen derifrå.
// Kvar side av det teikna stykket får sitt eige tal stk, med lik luft mellom
// stykka og halv luft ned mot hjørnet — same rytme som den jamne rekkja.
// Fordelinga mellom sidene er den som gir mest luft på den trongaste sida.
// Klikkar brukaren midt i ei rute i den jamne rekkja, vert resultatet
// eksakt den jamne rekkja.
// Returnerer posT (sortert langs veggen), eller null når stykka ikkje får
// plass rundt det teikna — då fell gruppa tilbake til jamn fordeling.
//
// `opptekne` er [{a,b}] (same eining som segLen) for andre vindauge og dører
// som alt står på veggen. Dei nye stykka vert lagde i lukene mellom dei, aldri
// oppå — ei luke mot eit vindauge får heil luft på den sida, mot hjørnet halv.
function winPosFraKlikk(centreT,n,width,segLen,opptekne){
  if(n<=1||!(segLen>0)||!(width>0))return null;
  const sp=fitSpanT(centreT,width,segLen);
  const c=(sp.t0+sp.t1)/2*segLen;
  const nye=winFyllLuker([c],n-1,width,segLen,opptekne);
  return nye?[c,...nye].sort((x,y)=>x-y).map(x=>x/segLen):null;
}
// Legg k nye stk i dei ledige lukene på veggen. `faste` er senter (i eining,
// ikkje t) for stk i same gruppe som står i ro; `opptekne` er andre vindauge.
// Kvar luke får sitt eige tal stk med lik luft innanfor: heil luft mot eit
// vindauge, halv mot hjørnet — same rytme som den jamne rekkja. Fordelinga
// mellom lukene er den som gir mest luft der det er trongast (grådig: neste
// stk går alltid til luka som då har mest luft att, som er optimalt for
// maks-min når lufta minkar med kvar stk). Returnerer senter, eller null når
// det ikkje er plass utan overlapp.
function winFyllLuker(faste,k,width,segLen,opptekne){
  if(k<=0)return [];
  const blokk=[...faste.map(c=>({a:c-width/2,b:c+width/2})),...(opptekne||[])]
    .filter(o=>o.b>0&&o.a<segLen).sort((x,y)=>x.a-y.a);
  const luker=[];let pos=0,venstreVegg=true;
  blokk.forEach(o=>{
    if(o.a>pos)luker.push({a:pos,b:o.a,eL:venstreVegg?0.5:1,eR:1,k:0});
    if(o.b>pos){pos=o.b;venstreVegg=false;}
  });
  if(pos<segLen)luker.push({a:pos,b:segLen,eL:venstreVegg?0.5:1,eR:0.5,k:0});
  const luft=(l,kk)=>(l.b-l.a-kk*width)/(kk-1+l.eL+l.eR);
  for(let i=0;i<k;i++){
    let best=null;
    luker.forEach(l=>{const g=luft(l,l.k+1);if(!best||g>best.g)best={l,g};});
    if(!best||!(best.g>=0))return null;
    best.l.k++;
  }
  const cs=[];
  luker.forEach(l=>{
    if(!l.k)return;
    const g=luft(l,l.k);
    for(let j=0;j<l.k;j++)cs.push(l.a+l.eL*g+width/2+j*(width+g));
  });
  return cs;
}
// Utstrekninga [{a,b}] i biletpikslar til alle ANDRE vindauge og dører på
// same segment som w — det nye stk ikkje skal hamne oppå.
function winOpptekne(z,w,segLen,mpp){
  const ut=[];
  (z.windows||[]).forEach(o=>{
    if(o===w||o.segIdx!==w.segIdx)return;
    winSpansPx(o,segLen,mpp).forEach(s=>ut.push({a:s.t0*segLen,b:s.t1*segLen}));
  });
  return ut;
}
// Frys den jamne fordelinga til faktiske posisjonar, slik at dei andre stykka
// står i ro når brukaren flyttar eitt av dei.
function winFreezePos(w,width,segLen){
  if(!winHasPos(w))w.posT=winCentres(w,width,segLen);
  return w.posT;
}
// Endrar antalet og tek vare på plasseringa av dei som alt står der.
// Når antal vert auka utan eksisterende posT: det første stykket vert plassert
// der brukaren teikna det (t0/t1 sitt senter), resten fordelte rundt det.
// Nye stk får ein highlight som fader over nokre sekunder (markerNyeStk).
// Highlight for nyteikna stk. Ligg i ein WeakMap UTANFOR vindaugsobjektet
// med vilje: alt på w vert serialisert (lagring, angre, kopi), og eit Set
// vert til {} i JSON — då krasja draw() på {}.includes() i gamle filer.
const _winNy=new WeakMap();
const WIN_NY_MS=1500;
let _winNyTimer=null;
function markerNyeStk(w,stk){
  _winNy.set(w,{at:Date.now(),stk:new Set(stk)});
  clearInterval(_winNyTimer);
  const t0=Date.now();
  _winNyTimer=setInterval(()=>{
    if(Date.now()-t0>WIN_NY_MS+100){clearInterval(_winNyTimer);_winNyTimer=null;}
    draw();
  },50);
}
// 0–1: kor sterkt stk k av w skal lysa (0 = ikkje ny lenger)
function winNyFade(w,k){
  const m=_winNy.get(w);
  if(!m||!m.stk.has(k))return 0;
  return Math.max(0,1-(Date.now()-m.at)/WIN_NY_MS);
}
// Gruppelappen i planteikninga står ved det stykket brukaren teikna.
// `w.lappStk` er indeksen i posT; han vert sett når gruppa får posT frå
// winPosFraKlikk (det teikna stykket står eksakt på centreT). Berre visning.
// Utan posT (eller med ein indeks som ikkje finst lenger) står lappen ved det
// stykket som ligg nærast ankeret — i ei jamn rekkje er det der brukaren klikka.
function _naerastT(cs,t){
  let bi=0;
  cs.forEach((c,i)=>{if(Math.abs(c-t)<Math.abs(cs[bi]-t))bi=i;});
  return bi;
}
function winMerkTeikna(w,centreT){
  if(winHasPos(w))w.lappStk=_naerastT(w.posT,centreT);
  else delete w.lappStk;
}
// spans: [{t0,t1}] per stk, frå winSpansPx
function winLappStk(w,spans){
  const k=w.lappStk;
  if(winHasPos(w)&&Number.isInteger(k)&&k>=0&&k<spans.length)return k;
  return _naerastT(spans.map(s=>(s.t0+s.t1)/2),(w.t0+w.t1)/2);
}
// `opptekne`: andre vindauge på veggen (winOpptekne) — nye stk hamnar ikkje oppå dei.
function winSetAntal(w,n,width,segLen,opptekne){
  n=Math.max(1,Math.round(n)||1);
  const old=winCount(w);
  // Må lesast FØR antal endrar seg — winHasPos samanliknar posT med antal
  const hadPos=winHasPos(w);
  w.antal=n;

  if(n===old)return; // Ingen endring

  if(hadPos){
    // Allereie distribuerte stykk — endra eller legg til
    const cs=w.posT.slice();
    if(n<old){
      w.posT=cs.slice(0,n);
    } else {
      // Dei som står, står i ro; dei nye vert fordelte i dei ledige lukene
      const nye=winFyllLuker(cs.map(t=>t*segLen),n-old,width,segLen,opptekne);
      w.posT=nye?[...cs,...nye.map(x=>x/segLen)]:null;
      // Marker nye stykk for highlight
      if(w.posT)markerNyeStk(w,Array.from({length:n-old},(_,i)=>old+i));
    }
  } else if(n>1&&old<=1){
    // Fyrste gang antal > 1 — stykket som står der vert ståande, resten
    // vert fordelte utover veggen derifrå (winPosFraKlikk)
    const _c=(w.t0+w.t1)/2;
    w.posT=winPosFraKlikk(_c,n,width,segLen,opptekne);
    winMerkTeikna(w,_c);
    if(w.posT)markerNyeStk(w,Array.from({length:n},(_,i)=>i));
  }

  if(winHasPos(w))winSyncAnchor(w,width,segLen);
}

// ── Felles fasadenamn-generator ───────────────────────────────
// Returnerer array med same lengde som segs, kvart element er namn for det segmentet
function getFacadeLabels(z, segs){
  const sk=z.skillevegg||new Set();
  const dirCount={};
  segs.forEach(s=>{ if(!sk.has(s.idx)) dirCount[s.dir]=(dirCount[s.dir]||0)+1; });
  const dirSeen={};
  let skN=0;
  return segs.map(seg=>{
    const isSK=sk.has(seg.idx);
    const autoName=isSK?'SK'+(++skN):(dirSeen[seg.dir]=(dirSeen[seg.dir]||0)+1,dirCount[seg.dir]>1 ? seg.dir+'-'+dirSeen[seg.dir] : seg.dir);
    const customName=z.segOverrides?.[seg.idx]?.name;
    return customName?customName+' - '+autoName:autoName;
  });
}

// Finn grupper av samanhengande SK-segment for ei sone
function getSkAdjacentGroups(z, segs){
  if(!segs||!z.skillevegg)return[];
  const sk=z.skillevegg;
  // Finn rekkefølgja av indeksar — segs er i polygon-rekkjefølge
  const skSegs=segs.filter(s=>sk.has(s.idx));
  if(!skSegs.length)return[];
  // Bygg grupper av samanhengande (nabo i segs-rekkjefølga)
  const groups=[];
  let cur=[skSegs[0]];
  for(let i=1;i<skSegs.length;i++){
    // Sjekk om dette segmentet er naboar med det førre i segs-lista
    const prevGlobalIdx=segs.indexOf(skSegs[i-1]);
    const curGlobalIdx=segs.indexOf(skSegs[i]);
    if(curGlobalIdx===prevGlobalIdx+1){
      cur.push(skSegs[i]);
    } else {
      groups.push(cur);cur=[skSegs[i]];
    }
  }
  groups.push(cur);
  // Spesialhåndtering: siste og første er nabo i ein polygon (wrap-around)
  if(groups.length>1){
    const firstSeg=groups[0][0];
    const lastSeg=groups[groups.length-1][groups[groups.length-1].length-1];
    const firstGlobalIdx=segs.indexOf(firstSeg);
    const lastGlobalIdx=segs.indexOf(lastSeg);
    if(lastGlobalIdx===segs.length-1&&firstGlobalIdx===0){
      // Siste og første gruppe er nabo — slå saman
      const merged=[...groups[groups.length-1],...groups[0]];
      groups.splice(0,1);groups.splice(groups.length-1,1);groups.push(merged);
    }
  }
  return groups;
}

// ── YV-fasadesamanslåing ─────────────────────────────────────
function circularMeanAz(azimuths){
  if(!azimuths.length)return 0;
  const sinSum=azimuths.reduce((s,a)=>s+Math.sin(a*Math.PI/180),0);
  const cosSum=azimuths.reduce((s,a)=>s+Math.cos(a*Math.PI/180),0);
  return((Math.atan2(sinSum,cosSum)*180/Math.PI)+360)%360;
}
function getYvDirectionGroups(z,segs){
  if(!segs)return[];
  const sk=z.skillevegg||new Set();
  const byDir={};
  segs.forEach(s=>{if(!sk.has(s.idx)){if(!byDir[s.dir])byDir[s.dir]=[];byDir[s.dir].push(s);}});
  return Object.values(byDir).filter(g=>g.length>1);
}

// ── Standardverdiar ─────────────────────────────────────────
function entroStandard(year){
  if(!year||isNaN(year))return null;
  const y=parseInt(year);
  // U-vegg
  let uVegg=y<1940?1.56:y<=1953?1.32:y<=1968?1.02:y<=1984?0.66:y<=1986?0.42:y<=1996?0.36:y<=2006?0.26:0.18;
  // U-tak
  let uTak=y<1940?1.20:y<=1953?1.08:y<=1968?0.90:y<=1984?0.60:y<=1986?0.30:y<=1996?0.24:y<=2006?0.18:0.13;
  // U-gulv
  let uGulv=y<1959?1.30:y<=1989?0.70:y<=1999?0.40:y<=2007?0.35:y<=2009?0.18:y<=2016?0.15:0.10;
  // U-vindu
  let uVindu=y<1920?4.80:y<=1968?2.80:y<=1986?2.80:y<=1996?2.40:y<=2006?1.60:y<=2009?1.40:1.20;
  let uDor=uVindu;
  // n50
  let n50=y<1940?9.0:y<=1960?9.0:y<=1980?7.0:y<=2000?5.0:y<=2007?3.5:y<=2009?3.0:1.5;
  // Kuldebro
  let kuldebro=y>=1997?0.09:0.12;
  // Kjellervegg og kjellergulv — eiga trapp, sidan konstruksjonar mot terreng
  // er isolerte etter andre krav enn vegg og gulv over terreng.
  // (Første steget er «før 1949»; 1949 vert rekna med der.)
  let uKjVegg=y<1950?1.30:y<=1959?0.70:y<=1986?0.55:y<=1989?0.45:y<=1999?0.45:y<=2006?0.30:0.18;
  let uKjGulv=y<1950?1.30:y<=1959?1.30:y<=1986?0.70:y<=1989?0.55:y<=1999?0.30:y<=2006?0.25:0.10;
  return {uVegg,uTak,uGulv,uVindu,uDor,n50,kuldebro,uKjVegg,uKjGulv};
}

function getAreaM2(z){return z.areaOverride!=null?z.areaOverride:calcAreaM2(z.pts,mppForZone(z));}
// Get all zone instances across floors that share the same groupId
function getLinkedZones(z){
  if(!z.groupId)return[z];
  return floors.flatMap(f=>f.zones).filter(x=>x.groupId===z.groupId);
}
// Fasadane i kopla soner slått saman på tvers: éin <facade> per himmelretning
// i SXI-en for alle instansane. Valet ligg på kvar instans (`yvKoplaSaman`) og
// vert sett/fjerna på alle samstundes; ei instans som vert kopla til seinare
// får det med seg, sidan det held at éin har det.
function koplaFasadarSaman(z){
  if(!z||!z.groupId)return false;
  const l=getLinkedZones(z);
  return l.length>1&&l.some(x=>x.yvKoplaSaman);
}
// Ytterveggane (ikkje SK, ikkje kjellervegg) i alle instansane, gruppert på
// himmelretning. Same tal som buildSXI og fasadarMedForStoreOpningar brukar.
// Gavlflater er ikkje med — dei er eigne <facade>-element som før.
function koplaFasadeGrupper(instances){
  const per=new Map();
  instances.forEach(lz=>{
    const segs=calcSegments(lz.pts,getHoyde(lz),mppForZone(lz));
    if(!segs)return;
    const sk=lz.skillevegg||new Set(),fhM=getHoyde(lz);
    segs.forEach(seg=>{
      if(sk.has(seg.idx)||isKjellervegg(lz,seg.idx))return;
      const ov=lz.segOverrides?.[seg.idx]||{};
      const area=(ov.areaM2??seg.areaM2??((ov.lenM??seg.lenM??0)*fhM))??0;
      if(!per.has(seg.dir))per.set(seg.dir,{dir:seg.dir,segs:[],area:0,opn:0,az:0});
      const g=per.get(seg.dir);
      g.segs.push({lz,seg,area});g.area+=area;
      g.opn+=(lz.windows||[]).filter(w=>w.segIdx===seg.idx).reduce((s,w)=>{
        const d=w.type==='dor';
        return s+Math.max(0.1,(w.hoyMm||(d?2100:1200))/1000)*Math.max(0.1,(w.breddeMm||(d?900:1200))/1000)*(w.antal||1);
      },0);
    });
  });
  const ORD=['Nord','Nordøst','Øst','Sørøst','Sør','Sørvest','Vest','Nordvest'];
  return [...per.values()].map(g=>({...g,az:Math.round(circularMeanAz(g.segs.map(x=>x.seg.normalAz)))}))
    .sort((a,b)=>ORD.indexOf(a.dir)-ORD.indexOf(b.dir));
}
// Total area for a zone (sum across all linked floors)
function getTotalAreaM2(z){
  return getLinkedZones(z).reduce((s,lz)=>{const a=getAreaM2(lz);return s+(a||0);},0)||null;
}
// Total volume
function getTotalVolum(z){
  return getLinkedZones(z).reduce((s,lz)=>{const v=getVolum(lz);return s+(v||0);},0)||null;
}
function getPerimM(z){return z.perimOverride!=null?z.perimOverride:calcPerimM(z.pts,mppForZone(z));}
function getHoyde(z){
  if(z.hoyde!=null)return z.hoyde;
  for(const f of floors){if(f.zones.includes(z))return (f.defaultHoyde!=null?f.defaultHoyde:null)||(parseFloat(fhI.value)||3.0);}
  return parseFloat(fhI.value)||3.0;
}
function getHimling(z){return z.himling!=null?z.himling:getHoyde(z);}
function getVolum(z){const a=getAreaM2(z);return a!=null?a*getHimling(z):null;}

// ── Kjeller ───────────────────────────────────────────────────
// Ei sone kan setjast til kjeller via gulvtypen. Då erstattar eitt
// <cellar>-element både golvet og alle ytterveggane i sona (SIMIEN
// reknar oppfyllinga mot terreng sjølv). Skiljeveggar mot andre soner
// vert framleis eksporterte som <partition>, og taket/himlinga som før.
// Seksjonane i sonekortet startar samanslegne når lista er lengre enn
// grensa. Alle står på 0: kvar seksjon er éi linje med teljar (og varsel)
// til brukaren opnar han, så korta held seg korte på store bygg.
const WINLIST_AUTO_COLLAPSE=0;   // vindauge og dører
const KONSTR_AUTO_COLLAPSE=0;    // konstruksjonar (veggar)
const KOPLA_AUTO_COLLAPSE=0;     // kopla soner
const FLATELIST_AUTO_COLLAPSE=0; // oppdelt tak/golv

const KJELLER_GULV='Kjeller (golv + yttervegg)';
const KJELLER_VEGGTJUKN=0.30;   // m — fast inntil vidare

// ── Tak- og golvflater ────────────────────────────────────────
// Taket og golvet i ei sone kan delast opp i fleire flater, og KVAR flate har
// sin eigen konstruksjonstype. Ei sone kan altså ha halve taket mot det fri og
// halve som himling mot ei uoppvarma sone. Utan oppdeling gjeld sona sin eigen
// `taktype`/`gulvtype` for heile flata — det er framleis normaltilfellet, og
// SXI-fila vert då teikn for teikn den same som før.
const TAK_TYPER=['Tak','Himling mot uoppvarma sone','Himling mot varm sone'];
const GULV_TYPER=['Gulv på grunn','Gulv mot uoppvarma sone','Gulv mot oppvarma sone',KJELLER_GULV];
// Alt som skil dei to laga ligg her, så UI, teikning og eksport kan dele kode.
const FLATE={
  tak:{arr:'takflater',typar:TAK_TYPER,std:'Tak',zoneFelt:'taktype',uFelt:'uTak',
       lbl:'Takflate',eining:'taket',ikon:'⌂'},
  gulv:{arr:'gulvflater',typar:GULV_TYPER,std:'Gulv på grunn',zoneFelt:'gulvtype',uFelt:'uGulv',
        lbl:'Golvflate',eining:'golvet',ikon:'▭'}
};
function flateListe(z,kind){return z[FLATE[kind].arr]||[];}
// Typen til éi flate. Gamle takflater manglar feltet — dei arvar sona sin
// taktype, som den gongen alltid var 'Tak'.
function flateType(z,kind,fl){return (fl&&fl.type)||z[FLATE[kind].zoneFelt]||FLATE[kind].std;}
function harFlater(z,kind){return flateListe(z,kind).length>0;}
function flateAreaM2(z,fl){return calcAreaM2(fl.pts,mppForZone(z))??0;}
// Kortform til merkelappar i teikninga og lista
function flateTypeKort(t){
  return {'Tak':'Tak','Himling mot uoppvarma sone':'Himling · uoppv.','Himling mot varm sone':'Himling · varm',
          'Gulv på grunn':'Mot grunn','Gulv mot uoppvarma sone':'Mot uoppv.','Gulv mot oppvarma sone':'Mot oppv.',
          [KJELLER_GULV]:'Kjeller'}[t]||t;
}
// Lengda (m) av flatekanten som ligg på sona sin ytterkant. `pred(segIdx)`
// avgrensar til visse veggar. Ei delflate midt inne i sona har ingen ytterkant
// — då er både perimeteren og kjellerveggen null, og det er rett svar.
function flateKantLenM(z,fl,pred){
  const mpp=mppForZone(z);
  if(!mpp||!fl||!(fl.pts||[]).length)return 0;
  const segs=calcSegments(z.pts,getHoyde(z),mpp)||[];
  let sum=0;
  const pts=fl.pts;
  for(let i=0;i<pts.length;i++){
    const a=pts[i],b=pts[(i+1)%pts.length];
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    for(const s of segs){
      const dx=s.p2.x-s.p1.x,dy=s.p2.y-s.p1.y,L2=dx*dx+dy*dy;
      if(L2<1)continue;
      let t=((mx-s.p1.x)*dx+(my-s.p1.y)*dy)/L2;
      if(t<-0.01||t>1.01)continue;
      t=Math.max(0,Math.min(1,t));
      if(Math.hypot(mx-(s.p1.x+dx*t),my-(s.p1.y+dy*t))>1.5)continue;
      if(!pred||pred(s.idx))sum+=Math.hypot(b.x-a.x,b.y-a.y)*mpp/1000;
      break;
    }
  }
  return sum;
}
// Flatene slik eksporten (og tabellen) ser dei: alltid minst éi oppføring, så
// begge vegane — oppdelt og ikkje — går gjennom same løkka.
function eksportFlater(z,kind){
  const F=FLATE[kind];
  const list=flateListe(z,kind);
  if(!list.length)return[{fl:null,type:z[F.zoneFelt]||F.std,navn:null,area:getAreaM2(z)??0}];
  return list.map((fl,i)=>({fl,type:flateType(z,kind,fl),navn:fl.name||(F.lbl+' '+(i+1)),
                            area:flateAreaM2(z,fl)}));
}
// Sum av delflatene mot sonearealet — brukt til å melde frå når noko manglar.
function flateAvvikM2(z,kind){
  const list=flateListe(z,kind);
  if(!list.length)return 0;
  const a=getAreaM2(z);
  if(a==null)return 0;
  return a-list.reduce((s,fl)=>s+flateAreaM2(z,fl),0);
}

// Ei sone er kjellersone når golvet — heilt eller delvis — er kjellergolv.
function isKjeller(z){
  const gf=z.gulvflater||[];
  if(gf.length)return gf.some(fl=>flateType(z,'gulv',fl)===KJELLER_GULV);
  return (z.gulvtype||'Gulv på grunn')===KJELLER_GULV;
}
// Oppfyllingshøgde: kor djupt kjellaren ligg under terreng. Blank = heile veggen.
function getOppfylling(z){
  const v=z.oppfylling;
  return (v!=null&&!isNaN(v)&&v>0)?v:getHoyde(z);
}
// Kvar vegg i ei kjellersone har ei av tre roller: KJ (del av kjellerelementet),
// YV (vanleg yttervegg over terreng) eller SK (skiljekonstruksjon).
// z.kjellerveggar er ei LISTE med segmentindeksar — ikkje eit Set som
// z.skillevegg. Ei liste overlever JSON-serialiseringa av seg sjølv, så feltet
// treng ingen særhandsaming i dei fem lagringsstadene. undefined = alle
// ytterveggane er med i kjellerelementet (rimeleg utgangspunkt).
function isKjellervegg(z,segIdx){
  if(!isKjeller(z))return false;
  if((z.skillevegg||new Set()).has(segIdx))return false;
  return z.kjellerveggar?z.kjellerveggar.includes(segIdx):true;
}
function segRolle(z,segIdx){
  if((z.skillevegg||new Set()).has(segIdx))return 'SK';
  return isKjellervegg(z,segIdx)?'KJ':'YV';
}
// Skriv ut den implisitte «alle er KJ»-tilstanden før første manuelle endring
function ensureKjellerveggar(z,segs){
  if(!z.kjellerveggar){
    const sk=z.skillevegg||new Set();
    z.kjellerveggar=segs.filter(s=>!sk.has(s.idx)).map(s=>s.idx);
  }
  return z.kjellerveggar;
}
// 3D: kor mykje heile bygget skal senkast så terrenget — planteikninga i
// y=0 — hamnar på oppfyllingskanten til den NEDSTE etasjen med kjeller.
// Etasjar under den vert då liggjande enda djupare, heilt av seg sjølv.
// Returnerer 0 når ingen etasje har kjellerelement.
// Stakkingsformelen må vere identisk med floorBaseY i 3D-bygginga, elles
// hamnar terrenget på feil nivå.
function _etasjeStakkHoyde(f){
  return f.defaultHoyde??Math.max(...etasjeArk(f).flatMap(a=>a.zones.map(z=>getHoyde(z))),3);
}
function kjellerSenking(){
  let terreng=0,funne=false;
  const grunn=etasjeGrunnhoyder();
  for(let fi=0;fi<floors.length;fi++){
    const f=floors[fi],cum=grunn[fi];
    const kjSoner=f.zones.filter(z=>isKjeller(z));
    if(kjSoner.length){
      // Fleire kjellersoner i same etasje: den djupaste oppfyllinga styrer
      const d=Math.max(...kjSoner.map(z=>Math.min(getOppfylling(z),getHoyde(z))));
      // Fleire kjelleretasjar: terrenget er øvste oppfyllingskant, elles ville
      // ein kjeller over den nedste hamna heilt over bakken.
      terreng=Math.max(terreng,cum+d);
      funne=true;
    }
  }
  return funne?terreng:0;
}

// Samla lengd på veggane som går inn i <cellar> — ikkje det same som
// getUtvOmkrets(), som tel alle ytterveggar uansett rolle.
function getKjellerVeggLen(z){
  const _mpp=mppForZone(z);
  const segs=calcSegments(z.pts,getHoyde(z),_mpp);
  if(!segs||!_mpp)return null;
  return segs.filter(s=>isKjellervegg(z,s.idx)).reduce((t,s)=>t+(s.lenM||0),0);
}

// Returns actual roof area, accounting for pitch angle
// Formula: skraareal = flatareal / cos(vinkel_rad)
function getTakvinkel(z){return (z.takvinkel!=null&&!isNaN(z.takvinkel))?z.takvinkel:0;}
function getTakAreal(z){
  const flat=getAreaM2(z);
  if(flat==null)return null;
  const deg=getTakvinkel(z);
  if(!deg||deg<=0||deg>=90)return flat;
  return flat/Math.cos(deg*Math.PI/180);
}

// ── Segmentindeks-bokføring ───────────────────────────────────
// Vindauge (segIdx), skiljeveggar (Set), segOverrides og skMergedGroups
// refererer alle veggsegment via indeks i calcSegments(). Når punkt vert
// sett inn eller fjerna i z.pts forskyvast indeksane — alt må remappast.
function _remapSegRefs(z,mapWin,mapIdx){
  if(z.windows&&z.windows.length)z.windows=z.windows.filter(w=>mapWin(w)!==false);
  if(z.skillevegg&&z.skillevegg.size){
    const ns=new Set();
    z.skillevegg.forEach(i=>{const m=mapIdx(i);(Array.isArray(m)?m:[m]).forEach(x=>{if(x!=null)ns.add(x);});});
    z.skillevegg=ns;
  }
  if(z.kjellerveggar&&z.kjellerveggar.length){
    const nk=[];
    z.kjellerveggar.forEach(i=>{const m=mapIdx(i);(Array.isArray(m)?m:[m]).forEach(x=>{if(x!=null&&!nk.includes(x))nk.push(x);});});
    z.kjellerveggar=nk;
  }
  if(z.segOverrides){
    const no={};
    Object.keys(z.segOverrides).forEach(k=>{
      if(k==='sk_merged'){no[k]=z.segOverrides[k];return;}
      const m=mapIdx(parseInt(k,10));
      const ni=Array.isArray(m)?m[0]:m;
      if(ni!=null&&no[ni]===undefined)no[ni]=z.segOverrides[k];
    });
    z.segOverrides=no;
  }
  if(z.skMergedGroups&&z.skMergedGroups.length){
    z.skMergedGroups=z.skMergedGroups.filter(g=>{
      const segs=[];
      g.segs.forEach(i=>{const m=mapIdx(i);(Array.isArray(m)?m:[m]).forEach(x=>{if(x!=null&&!segs.includes(x))segs.push(x);});});
      g.segs=segs;
      return segs.length>=2;
    });
  }
  if(z.yvMergedGroups&&z.yvMergedGroups.length){
    z.yvMergedGroups=z.yvMergedGroups.filter(g=>{
      const segs=[];
      g.segs.forEach(i=>{const m=mapIdx(i);(Array.isArray(m)?m:[m]).forEach(x=>{if(x!=null&&!segs.includes(x))segs.push(x);});});
      g.segs=segs;
      return segs.length>=2;
    });
  }
}

// Punkt sett inn på segment i (z.pts.splice(i+1,0,pt)) — kall ETTER splice.
// t = kvar på segmentet punktet hamna (0-1). Utelaten t tyder midtpunktet.
function remapSegsAfterInsert(z,i,t){
  const tt=(t!=null&&t>0&&t<1)?t:0.5;
  const mapIdx=j=>j<i?j:(j===i?[i,i+1]:j+1);
  const mapWin=w=>{
    if(w.segIdx<i)return;
    if(w.segIdx>i){w.segIdx++;return;}
    // Vindauget sat på segmentet som vart delt — legg det på den delen der senteret er
    const c=(w.t0+w.t1)/2;
    if(c<=tt){w.t0=Math.max(0,w.t0/tt);w.t1=Math.min(1,w.t1/tt);_mapWinPos(w,x=>x/tt);}
    else{w.segIdx=i+1;w.t0=Math.max(0,(w.t0-tt)/(1-tt));w.t1=Math.min(1,(w.t1-tt)/(1-tt));_mapWinPos(w,x=>(x-tt)/(1-tt));}
  };
  _remapSegRefs(z,mapWin,mapIdx);
}

// Plasseringa av kvar stk (posT) følgjer same lineære omrekninga som t0/t1.
// Hamnar ei stk utanfor den nye veggen, fell heile gruppa tilbake til jamn
// fordeling — å klemme dei inn mot kanten ville stabla dei oppå kvarandre.
function _mapWinPos(w,fn){
  if(!winHasPos(w))return;
  const ny=w.posT.map(fn);
  w.posT=ny.every(x=>isFinite(x)&&x>=0&&x<=1)?ny:null;
}

// Punkt pi skal fjernast — kall FØR z.pts.splice(pi,1) (treng gamle lengder)
function remapSegsBeforeDelete(z,pi){
  const n=z.pts.length;
  const segA=(pi-1+n)%n,segB=pi; // dei to segmenta som smeltar saman
  const pA=z.pts[segA],pM=z.pts[pi],pB=z.pts[(pi+1)%n];
  const lenA=Math.hypot(pM.x-pA.x,pM.y-pA.y),lenB=Math.hypot(pB.x-pM.x,pB.y-pM.y);
  const tot=lenA+lenB||1;
  const merged=pi===0?n-2:pi-1; // indeks til samanslått segment etter splice
  const mapIdx=j=>{
    if(j===segA||j===segB)return merged;
    if(pi===0)return j-1;
    return j<pi?j:j-1;
  };
  const mapWin=w=>{
    if(w.segIdx===segA){w.segIdx=merged;w.t0=w.t0*lenA/tot;w.t1=w.t1*lenA/tot;_mapWinPos(w,x=>x*lenA/tot);}
    else if(w.segIdx===segB){w.segIdx=merged;w.t0=(lenA+w.t0*lenB)/tot;w.t1=(lenA+w.t1*lenB)/tot;_mapWinPos(w,x=>(lenA+x*lenB)/tot);}
    else{const ni=mapIdx(w.segIdx);if(ni==null)return false;w.segIdx=ni;}
  };
  _remapSegRefs(z,mapWin,mapIdx);
}

// Rydd opp ugyldige segmentreferansar (t.d. frå eldre lagra prosjekt)
function sanitizeZoneSegRefs(z){
  const n=(z.pts||[]).length;
  if(z.windows){
    z.windows=z.windows.filter(w=>Number.isInteger(w.segIdx)&&w.segIdx>=0&&w.segIdx<n);
    // Plasseringslista må ha ei oppføring per stk — elles jamn fordeling
    z.windows.forEach(w=>{if(w.posT&&!winHasPos(w))w.posT=null;});
    // Rester etter highlight-felta i v5.0.1–5.0.3 — lagra som {} og ubrukelege
    z.windows.forEach(w=>{delete w._newWindows;delete w._createdAt;});
  }
  if(z.skillevegg&&z.skillevegg.size)z.skillevegg=new Set([...z.skillevegg].filter(i=>i>=0&&i<n));
  if(z.kjellerveggar)z.kjellerveggar=z.kjellerveggar.filter(i=>Number.isInteger(i)&&i>=0&&i<n);
  if(z.skMergedGroups)z.skMergedGroups=z.skMergedGroups.filter(g=>{
    g.segs=(g.segs||[]).filter(i=>i>=0&&i<n);
    return g.segs.length>=2;
  });
}


function getUtvOmkrets(z){
  const _mpp=mppForZone(z);
  const segs=calcSegments(z.pts,getHoyde(z),_mpp);
  if(!segs||!_mpp)return null;
  const sk=z.skillevegg||new Set();
  return segs.filter(s=>!sk.has(s.idx)).reduce((t,s)=>t+(s.lenM||0),0);
}

// Målestokken arket faktisk er teikna i, utleidd frå skalaen og papirformatet.
// Eksakt «1:100» når han ligg innanfor 1,5 % av eit rundt tal, elles «≈1:103»
// (t.d. etter lengdekalibrering). Utan kjent papir: null — vi gjettar ikkje.
function maalestokkTekst(ark,mpp){
  const img=ark&&ark.bgImg;
  if(!mpp||!img||!ark.paperWMm)return null;
  const m=mpp*img.width/ark.paperWMm;
  if(!(m>0))return null;
  const steg=m<100?5:m<1000?10:50;
  const r=Math.round(m/steg)*steg;
  return Math.abs(m-r)/r<0.015?'1:'+r:'≈1:'+Math.round(m);
}
function _skalaTekstEl(ark,mpp){
  const wrap=document.createElement('span');
  const ms=maalestokkTekst(ark,mpp);
  if(ms){
    const b=document.createElement('strong');
    b.style.cssText='color:var(--text);font-weight:700';
    b.textContent=ms;
    wrap.appendChild(b);
    wrap.appendChild(document.createTextNode(' · '));
  }
  wrap.appendChild(document.createTextNode('1 px = '+(mpp?mpp.toFixed(3):'—')+' mm'));
  return wrap;
}
// Byter frå eigen til global skala for etasjen f (måla følgjer med)
function brukGlobalSkala(f){
  if(!f.ownCal)return;
  snapshot();
  const _oldMpp=_snapshotMpp();
  f.ownCal=false;
  f.mmPerImgPx=globalMmPerImgPx;
  syncFloorState();
  const _nRe=_reskalerAlleEtasjar(_oldMpp);
  updateScaleBadge();updateResults();renderTable();renderFloorTabs();draw();
  hintText.textContent=arkNamn(f)+' brukar no den globale skalaen'
    +(globalMmPerImgPx?'':' — men han er ikkje sett enno. Kalibrer for å setje han')+'.'
    +(_nRe>0?' '+_nRe+' vindauge/dør'+(_nRe>1?'er':'')+' vart skalert med bygget.':'');
}
// Opnar kalibreringa med eit fast val av kva ho skal gjelde for
function kalibrerMed(eigen){
  calBtn.click();
  calScopeOwn=!!eigen;
  oppdaterCalScope();
}
function visSkalaMeny(anker){
  const f=curFloor();
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
  const menu=document.createElement('div');
  menu.className='ctx-menu';
  const r=anker.getBoundingClientRect();
  menu.style.cssText=`left:${r.left}px;top:${r.bottom+6}px`;
  const hdr=document.createElement('div');
  hdr.className='ctx-menu-header';
  hdr.textContent='Skala for '+arkNamn(f);
  menu.appendChild(hdr);
  const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',close);}};
  const mk=(merka,tittel,under,fn)=>{
    const b=document.createElement('button');
    b.className='ctx-menu-item';
    b.style.alignItems='flex-start';
    b.innerHTML=`<span class="ctx-ik">${merka?ctxIkon('✓'):''}</span><span><span style="font-weight:${merka?700:500}">${tittel}</span><br><span style="font-size:11px;color:var(--text3)">${under}</span></span>`;
    b.onclick=()=>{menu.remove();document.removeEventListener('mousedown',close);fn();};
    menu.appendChild(b);
  };
  const gMs=globalMmPerImgPx?(maalestokkTekst(f,globalMmPerImgPx)||('1 px = '+globalMmPerImgPx.toFixed(3)+' mm')):'ikkje sett';
  mk(!f.ownCal,'Global skala','Felles for alle etasjar · '+gMs,()=>{if(f.ownCal)brukGlobalSkala(f);});
  mk(f.ownCal,'Eigen skala for denne etasjen'+(f.ownCal?'':'…'),
    f.ownCal?'Klikk for å kalibrere han på nytt':'Kalibrer berre '+arkNamn(f)+' — dei andre står urørte',
    ()=>kalibrerMed(true));
  const sep=document.createElement('div');sep.className='ctx-menu-sep';menu.appendChild(sep);
  mk(false,'Kalibrer på nytt…',f.ownCal?'Gjeld berre denne etasjen':'Gjeld alle etasjar med global skala',()=>kalibrerMed(f.ownCal));
  document.body.appendChild(menu);
  const mr=menu.getBoundingClientRect();
  if(mr.right>window.innerWidth)menu.style.left=(window.innerWidth-mr.width-8)+'px';
  setTimeout(()=>document.addEventListener('mousedown',close),10);
}

function updateScaleBadge(){
  const f=curFloor();
  const multiFloor=floors.length>1;

  if(!mmPerImgPx){
    scaleBadge.innerHTML='';
    const txt=document.createElement('span');
    txt.textContent='⚠ Ikkje kalibrert — klikk for å kalibrere';
    scaleBadge.appendChild(txt);
    scaleBadge.className='uncal';
    scaleBadge.style.pointerEvents='all';
    scaleBadge.title='';
    scaleBadge.onclick=()=>{if(bgImg)calBtn.click();};
    return;
  }

  scaleBadge.className='';
  scaleBadge.innerHTML='';
  scaleBadge.style.pointerEvents='all';
  scaleBadge.style.cursor='pointer';
  scaleBadge.title='Klikk for å kalibrere på nytt';
  scaleBadge.onclick=()=>{if(bgImg)calBtn.click();};

  // Fasadeark har alltid si eiga kalibrering — ingen global skala å veksle mot.
  if(iFasade()){
    scaleBadge.appendChild(_skalaTekstEl(curFasade(),mmPerImgPx));
    scaleBadge.appendChild(document.createTextNode(' · eigen skala for arket'));
    return;
  }

  const txt=_skalaTekstEl(f,mmPerImgPx);
  txt.style.marginRight=multiFloor?'8px':'';
  scaleBadge.appendChild(txt);
  if(!multiFloor)return;

  // Fleire etasjar: pille som opnar valet global / eigen skala
  const pill=document.createElement('span');
  pill.style.cssText=`
    display:inline-flex;align-items:center;gap:4px;
    padding:2px 6px 2px 6px;border-radius:10px;cursor:pointer;font-size:11px;font-weight:600;
    transition:background .15s,color .15s;user-select:none;
    ${f.ownCal
      ? 'background:var(--dm-lil-bg,#eef2ff);color:var(--dm-lil-tx,#4338ca);border:1px solid var(--dm-lil-bd,#c7d2fe);'
      : 'background:var(--dm-gr-bg,#f0fdf4);color:var(--dm-gr-tx,#166534);border:1px solid var(--dm-gr-bd,#bbf7d0);'}
  `;
  const dot=document.createElement('span');
  dot.style.cssText=`width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${f.ownCal?'#6366f1':'#22c55e'}`;
  const lbl=document.createElement('span');
  lbl.textContent=f.ownCal?'Eigen skala':'Global';
  const pil=document.createElement('span');
  pil.textContent='▾';pil.style.cssText='font-size:9px;opacity:.7;margin-left:1px';
  pill.appendChild(dot);pill.appendChild(lbl);pill.appendChild(pil);
  pill.title=f.ownCal
    ?'Denne etasjen har eigen skala. Klikk for å velje.'
    :'Alle etasjar deler same skala. Klikk for å gi denne etasjen eigen skala.';
  pill.onclick=e=>{e.stopPropagation();visSkalaMeny(pill);};
  scaleBadge.appendChild(pill);
}

