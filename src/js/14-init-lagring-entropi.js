// ── Init ──────────────────────────────────────────────────────
function resize(){
  if(!bgImg)return;
  const r=cwrap.getBoundingClientRect();
  cv.width=r.width;cv.height=r.height;draw();
}
window.addEventListener('resize',resize);
// Verktøylinja kan brekke til fleire rader utan at vindauget endrar storleik
// (t.d. når sidekontrollar eller PDF-navigasjonen dukkar opp) — då fyrer
// ingen resize-hending, så vi ser på cwrap direkte.
if(window.ResizeObserver)new ResizeObserver(()=>resize()).observe(cwrap);

// ── 1. Åtvaring ved lukking ───────────────────────────────────
let isDirty=false;
function markDirty(){isDirty=true;if(window.EntroHost)window.EntroHost.notifyDirty();}
function markClean(){isDirty=false;if(window.EntroHost)window.EntroHost.notifyDirty();}

// Køyrer vi innbygd i EntroPi, med ein vert som har sagt at han handterer
// lagring? Dette er gaten for all EntroPi-berre logikk — bruk han i staden
// for å gjenta vakta på window.EntroHost (brua vert definert lenger ned).
// Sann først etter sxi:init, aldri berre av at vi ligg i ein iframe.
function inPi(){return !!(window.EntroHost&&window.EntroHost.active());}

// ── Mørk modus ──
// Temaet kjem frå EntroPi: ?theme= på iframe-URL-en (lagt på i <head> før
// fyrste teikning), `theme` i sxi:init og sxi:theme når brukaren byter.
// 'light' | 'dark' | 'system' (følgjer operativsystemet). Utanfor EntroPi vert
// setTema aldri kalla, og programmet står i lys modus som før. Ikkje lagra —
// verten sender det på nytt kvar gong verktøyet vert opna.
// CSS-en gjer nesten alt; berre det som er teikna på lerret må teiknast på nytt.
let _temaVal='light',_temaMq=null;
function erMork(){return document.documentElement.getAttribute('data-theme')==='dark';}
function setTema(t){
  t=String(t||'').toLowerCase();
  if(t!=='dark'&&t!=='light'&&t!=='system')return;
  _temaVal=t;
  if(t==='system'&&!_temaMq&&window.matchMedia){
    _temaMq=matchMedia('(prefers-color-scheme: dark)');
    _temaMq.addEventListener('change',()=>{if(_temaVal==='system')_brukTema();});
  }
  _brukTema();
}
function _brukTema(){
  const mork=_temaVal==='dark'||(_temaVal==='system'&&!!_temaMq&&_temaMq.matches);
  if(mork===erMork())return;
  if(mork)document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  try{drawCompass();draw();}catch(e){}
  document.dispatchEvent(new Event('sxi-tema'));
}
window.addEventListener('beforeunload',e=>{
  if(isDirty){e.preventDefault();e.returnValue='';}
});
// Patch snapshot and zone-add to mark dirty
const _origSnapshot=snapshot;
// Namnet på angre-steget må følgje med gjennom innpakkinga
window.snapshot=snapshot=function(namn){_origSnapshot(namn);markDirty();};

// ── 2. Autosave til localStorage ─────────────────────────────
const AUTOSAVE_KEY='sxi_generator_autosave';
const AUTOSAVE_INTERVAL=60000; // 1 min

// ── Prosjekt-serialisering (delt) ────────────────────────────
// Manuell lagring (.entro), autolagringa til localStorage, EntroPi-brua og
// etasje-klippbordet går alle gjennom dei fire funksjonane her, slik at dei
// aldri kjem i utakt om eit nytt felt kjem til. bgImg kan ikkje serialiserast
// direkte og vert lagra som dataURL (eller Blob, for klippbordet); pdfDoc vert
// hoppa over (brukaren lastar opp PDF-en på nytt).

// Éin etasje ut av prosjektet. Prosjektlagringa og etasje-klippbordet brukar
// same funksjonen, så eit nytt felt ikkje kan bli med i den eine og gløymast i
// den andre. opts.mime/qual styrer enkodinga av bakgrunnen; opts.utanBilete
// hoppar over biletet heilt — klippbordet legg det ved som Blob i staden.
function serialiserEtasje(f,opts){
  const o=opts||{};
  const obj={..._etasjeUt(f),
    zones:f.zones.map(z=>{
      const s=_soneUt(z);
      delete s._uk;   // UI-nøkkel for sidepanelet — berre for økta
      return s;
    })
  };
  _serBgInn(f,obj,o);
  _serPdfRef(f,obj,o);
  return obj;
}

// PDF-dokumentet til eit ark. Sjølve bytane ligg éin gong per dokument i
// prosjektet sitt `pdfar` — fleire etasjar frå same PDF («Neste side i same
// PDF») deler dokument, og skulle ikkje få kvar sin kopi. Arket ber berre
// indeksen. Utan dette forsvann sidebla-kontrollen kvar gong eit prosjekt vart
// opna att, sidan pdfDoc aldri kom med. opts.pdfReg kjem frå serialiserProsjekt;
// klippbordet og autolagringa har han ikkje, og hoppar over PDF-en.
function _serPdfRef(f,obj,o){
  if(o.pdfReg&&f.pdfDoc&&f.pdfDoc._entroBytes)obj.pdfRef=o.pdfReg(f.pdfDoc);
}
function _bytesTilB64(u8){
  let s='';
  for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));
  return btoa(s);
}
// pdfar → pdf.js-dokument, i same rekkjefølgje. Eit dokument som ikkje lèt seg
// opne vert null; arket står då som ei PDF utan dokument, og sidebla-knappen
// ber om fila på nytt.
async function _lastPdfar(pdfar){
  return Promise.all((pdfar||[]).map(async b64=>{
    try{
      const bin=atob(b64),u8=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      const doc=await opnePdf(u8.buffer);
      doc._entroB64=b64;
      return doc;
    }catch(e){return null;}
  }));
}
function _koplPdf(ark,ser,docs){
  const d=ser&&Number.isInteger(ser.pdfRef)?docs[ser.pdfRef]:null;
  if(d){ark.pdfDoc=d;ark.totalPages=d.numPages;}
}

// Bakgrunnsbiletet frå eit ark (etasje eller fasade) inn i `obj.bgImgData`.
// Enkodinga er det dyre her: ei PDF-side på ~48 Mpx tek rundt 0,7 s i
// toDataURL, og han blokkerer hovudtråden. Bakgrunnen endrar seg berre når
// brukaren lastar opp ei ny fil eller byter PDF-side, medan autolagringa går
// kvart minutt så lenge noko som helst er endra — utan mellomlagring betalte
// vi altså full enkoding for kvar sonejustering. Nøkkelen inneheld sjølve
// biletobjektet, så eit nytt bilete gir bom av seg sjølv. Éin plass per ark,
// så minnebruken er den same som den strengen vi uansett måtte lage.
// `_bgCache` vert aldri serialisert — både serialiserEtasje og
// serialiserFasade byggjer `obj` felt for felt.
function _serBgInn(f,obj,o){
  if(!f.bgImg||o.utanBilete)return;
  const mime=o.mime||'image/png';
  const nokkel=mime+'|'+(o.qual!=null?o.qual:'');
  const buf=f._bgCache;
  if(buf&&buf.img===f.bgImg&&buf.nokkel===nokkel){
    obj.bgImgData=buf.data;
    return;
  }
  try{
    const tmp=document.createElement('canvas');
    tmp.width=f.bgImg.width;tmp.height=f.bgImg.height;
    tmp.getContext('2d').drawImage(f.bgImg,0,0);
    obj.bgImgData=o.qual!=null?tmp.toDataURL(mime,o.qual):tmp.toDataURL(mime);
    f._bgCache={img:f.bgImg,nokkel,data:obj.bgImgData};
  }catch(e){/* tainted canvas — hopp over */}
}

// Eitt fasadeark ut og inn. Arket har ingen soner, ingen etasjehøgde og inga
// ghost-forskyving — berre teikninga, si eiga kalibrering og måla.
function serialiserFasade(fa,opts){
  const o=opts||{};
  const obj={
    id:fa.id,name:fa.name,
    mmPerImgPx:fa.mmPerImgPx??null,
    sc:fa.sc,offX:fa.offX,offY:fa.offY,
    pdfPage:fa.pdfPage,totalPages:fa.totalPages,
    paperWMm:fa.paperWMm??null,paperHMm:fa.paperHMm??null,paperSource:fa.paperSource??null,
    measurements:normMaal(fa.measurements)
  };
  _serBgInn(fa,obj,o);
  _serPdfRef(fa,obj,o);
  return obj;
}
async function deserialiserFasade(fa){
  const ark={
    id:fa.id,name:fa.name||'Fasade',
    mmPerImgPx:fa.mmPerImgPx??null,
    sc:fa.sc??1,offX:fa.offX??0,offY:fa.offY??0,
    pdfPage:fa.pdfPage??1,totalPages:fa.totalPages??1,
    paperWMm:fa.paperWMm??null,paperHMm:fa.paperHMm??null,paperSource:fa.paperSource??null,
    pdfDoc:null,bgImg:null,
    measurements:normMaal(fa.measurements)
  };
  if(fa.bgImgData){
    await new Promise(res=>{
      const img=new Image();
      img.onload=()=>{ark.bgImg=img;res();};
      img.onerror=()=>res();
      img.src=fa.bgImgData;
    });
  }
  return ark;
}

function serialiserProsjekt(opts){
  // saveFloorState() skriv fasadearket i staden når det er framme — sjå vakta
  // der. Difor må begge kallast, slik at det arket som IKKJE ligg på lerretet
  // også er oppdatert (det vart lagra då vi bytta vising, men eit ekstra kall
  // kostar ingenting og gjer rekkjefølgja likegyldig).
  saveFloorState();
  // PDF-dokumenta vert registrerte etter kvart som arka refererer dei.
  // opts.utanPdf (autolagringa) held dei ute — localStorage har ikkje plass.
  const pdfDocs=[];
  const o={...(opts||{})};
  if(!o.utanPdf)o.pdfReg=d=>{let i=pdfDocs.indexOf(d);if(i<0){pdfDocs.push(d);i=pdfDocs.length-1;}return i;};
  const serFloors=floors.map(f=>serialiserEtasje(f,o));
  const serFasadar=fasadar.map(fa=>serialiserFasade(fa,o));
  // Base64-strengen vert hugsa på dokumentet — PDF-en endrar seg aldri, og
  // EntroPi-autolagringa går kvart andre minutt.
  const pdfar=pdfDocs.map(d=>d._entroB64||(d._entroB64=_bytesTilB64(d._entroBytes)));
  return {version:1,savedAt:new Date().toISOString(),activeFloor,globalNorth,globalMmPerImgPx,
    ...(pdfar.length?{pdfar}:{}),
    prosjektAdresse,_nextFloorId,_nextGroupId,_nextZoneId,
    // Fasadeteikningane — eige oppmålingslag, utanfor modellen
    fasadar:serFasadar,activeFasade,_nextFasadeId,
    // Kva bygg fila kjem frå. Stemplar lokalkopien (sjå _autolagringEigar), og
    // lèt etasje-importen sjå om tekniske system framleis peikar på rett bygg.
    _eigar:_autolagringEigar(),
    floors:serFloors};
}

// Byggjer heile tilstanden opp att frå eit serialisert prosjekt.
// opts.fit=true → zoom til biletet (som ved opning av fil); elles vert lagra
// zoom/pan frå prosjektet ståande (som ved gjenoppretting av autolagring).
// Éin serialisert etasje tilbake til eit etasjeobjekt. Bakgrunnen kjem anten
// som dataURL (prosjektfila) eller som Blob (klippbordet) — begge endar i eit
// vanleg Image, slik at resten av koden ikkje ser skilnad.
async function deserialiserEtasje(f){
  const floor={..._etasjeInn(f),pdfDoc:null,bgImg:null,
    zones:(f.zones||[]).map(z=>{const nz=_soneInn(z);sanitizeZoneSegRefs(nz);return nz;})
  };
  const kilde=f.bgImgData||(f.bgBlob?URL.createObjectURL(f.bgBlob):null);
  if(kilde){
    await new Promise(res=>{
      const img=new Image();
      img.onload=()=>{floor.bgImg=img;res();};
      img.onerror=()=>res();
      img.src=kilde;
    });
    if(f.bgBlob)URL.revokeObjectURL(kilde);
  }
  return floor;
}

async function lastProsjekt(proj,opts){
  const o=opts||{};
  if(!proj||!Array.isArray(proj.floors))throw new Error('Ugyldig prosjektfil.');
  mpFjernSkann();
  const newFloors=await Promise.all(proj.floors.map(f=>deserialiserEtasje(f)));
  floors=newFloors;
  // Sikra at alle soner har korrekt zoneConnections-format (kan vere object, array, eller Map)
  ensureAllZoneConnectionsMaps();
  activeFloor=Math.min(proj.activeFloor??0,floors.length-1);
  _ordneDelplanar();
  // Vis den oppdelinga prosjektet faktisk har. Berre eitt lag om gongen, og
  // taket vinn — utan oppdelt tak ville golvlaget elles ligge usynleg.
  flateLag=floors.some(fl=>fl.zones.some(z=>(z.takflater||[]).length))?'tak'
          :(floors.some(fl=>fl.zones.some(z=>(z.gulvflater||[]).length))?'gulv':'tak');
  globalNorth=proj.globalNorth??0;
  globalMmPerImgPx=proj.globalMmPerImgPx??null;
  prosjektAdresse=proj.prosjektAdresse||'';
  _syncAdresseFelt();
  _nextFloorId=proj._nextFloorId??floors.length+1;
  _nextGroupId=proj._nextGroupId??1;
  _nextZoneId=proj._nextZoneId??1;
  // Fasadearka. Eldre prosjektfiler har ikkje feltet — då står lista tom.
  fasadar=await Promise.all((proj.fasadar||[]).map(fa=>deserialiserFasade(fa)));
  // PDF-dokumenta tilbake på arka. Eldre filer har ikkje pdfar — då står
  // arka utan dokument, og sidebla-knappen ber om fila (updatePdfSideUI).
  const _pdfDocs=await _lastPdfar(proj.pdfar);
  floors.forEach((fl,i)=>_koplPdf(fl,proj.floors[i],_pdfDocs));
  fasadar.forEach((fa,i)=>_koplPdf(fa,proj.fasadar[i],_pdfDocs));
  activeFasade=Math.min(proj.activeFasade??0,Math.max(0,fasadar.length-1));
  _nextFasadeId=proj._nextFasadeId??(fasadar.length+1);
  // Eit prosjekt vert alltid opna i planvisinga. Må stå FØR syncFloorState(),
  // som elles ville tru at eit fasadeark eig lerret-globalane.
  viewMode='plan';
  applyViewUI();
  renderFasadeTabs();
  syncFloorState();
  // Prosjektfila kan mangle felt som bygget i EntroPi alt har — då tek vi dei
  // derifrå. Må stå etter syncFloorState() (så `zones` peikar på den nye
  // etasjen) og etter at prosjektAdresse er sett, som elles ville viska ut
  // adressa vi alt hadde fått frå verten.
  _fyllFraPi();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();
  if(o.fit&&bgImg)fitImage();else draw();
}

// Framlegg til filnamn: bygget si adresse, elles dato
function foreslaaFilnamn(){
  const base=adresseTilFilnamn(prosjektAdresse)||('SXI_generatoren_'+new Date().toISOString().slice(0,10));
  return base+'.entro';
}

// Kven lokalkopien høyrer til. I EntroPi er lagringa PÅ BYGGET den eigentlege
// lagringa, og localStorage berre eit nett for det som ikkje rakk fram. Då må
// kopien vite kva bygg han gjeld: utan stempelet kunne arbeid på eitt bygg
// blitt tilbode att på eit anna, sidan nøkkelen er den same for heile
// nettlesaren. Utanfor EntroPi står kjelda som 'lokal' og byggId er tom.
function _autolagringEigar(){
  const H=window.EntroHost;
  if(H&&H.active&&H.active())
    return {kjelde:'entropi',byggId:H.byggId()||'',byggNamn:H.byggNamn()||''};
  return {kjelde:'lokal',byggId:'',byggNamn:''};
}
// Lokalkopien finst berre for det som ikkje har nådd fram. Har bygget (eller
// brukaren) fått lagringa, skal han vekk — elles ville han bli tilbydd att
// som «ulagra arbeid» sjølv om alt låg trygt på bygget.
function slettAutolagring(){
  try{localStorage.removeItem(AUTOSAVE_KEY);}catch(e){}
}

function autosave(){
  try{
    // JPEG 85 % — autolagringa må vere liten nok til localStorage
    // _eigar-stempelet kjem frå serialiserProsjekt — sjå _autolagringEigar
    const proj=serialiserProsjekt({mime:'image/jpeg',qual:0.85,utanPdf:true});
    localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(proj));
    markClean(); // elles re-enkodar autolagringa alle bileta kvart minutt for alltid
  }catch(e){/* localStorage full */}
}

// opts (alle valfrie — utan dei er åtferda som før):
//   byggId    berre tilby ein kopi som høyrer til dette bygget. '' = berre ein
//             kopi utan byggstempel. Utelaten = kva som helst.
//   nyareEnn  ISO-tid frå fila som alt er lasta; ein eldre kopi er berre støy.
//   tekst     teksten i brikka, knapp = teksten på knappen
//   etterpaa  vert kalla når kopien er henta inn (EntroPi markerer skitten,
//             slik at arbeidet går vidare til bygget)
function restoreAutosave(opts){
  const o=opts||{};
  try{
    const raw=localStorage.getItem(AUTOSAVE_KEY);
    if(!raw)return false;
    const proj=JSON.parse(raw);
    if(!proj.floors||!Array.isArray(proj.floors))return false;
    // Eit prosjekt som berre har fasadeteikningar er òg arbeid verdt å berge.
    const hasZones=proj.floors.some(f=>(f.zones||[]).some(z=>(z.pts||[]).length>=3))
      ||(proj.fasadar||[]).some(fa=>fa.bgImgData||(fa.measurements||[]).length);
    if(!hasZones){localStorage.removeItem(AUTOSAVE_KEY);return false;}
    const eigar=proj._eigar||null;
    // Feil bygg: la kopien liggje. Han er ikkje søppel — han høyrer berre
    // heime ein annan stad, og vert tilbydd der.
    if(o.byggId!=null&&String((eigar&&eigar.byggId)||'')!==String(o.byggId))return false;
    // Fila vi alt har er like ny eller nyare ⇒ kopien har ingenting å tilføre.
    // Marginen dekkjer ei lagring som var undervegs då sida vart lukka.
    if(o.nyareEnn){
      const t=new Date(proj.savedAt).getTime(),h=new Date(o.nyareEnn).getTime();
      if(!(t>h+5000)){slettAutolagring();return false;}
    }
    const savedAt=new Date(proj.savedAt);
    const mins=Math.round((Date.now()-savedAt)/60000);
    const label=mins<2?'akkurat no':mins<60?mins+' min sidan':Math.round(mins/60)+' t sidan';
    // Utanfor EntroPi kan kopien likevel komme frå eit bygg. Då seier vi kva
    // bygg — å halde arbeidet tilbake i stillheit ville vore verre.
    const frå=(o.byggId==null&&eigar&&eigar.byggNamn)?' · '+eigar.byggNamn:'';
    const tekst=(o.tekst||'Autolaga prosjekt frå '+label)+(o.tekst?' · '+label:frå);

    // Show non-intrusive toast instead of confirm()
    const toast=document.createElement('div');
    toast.id='autosave-toast';
    toast.style.cssText=`
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);
      background:#1e293b;color:#f8fafc;border-radius:10px;padding:12px 18px;
      display:flex;align-items:center;gap:12px;z-index:800;
      box-shadow:0 8px 32px rgba(0,0,0,.25);font-family:inherit;font-size:13px;
      opacity:0;transition:all .3s ease;max-width:90vw;white-space:nowrap
    `;
    toast.innerHTML=`
      <span style="font-size:16px">💾</span>
      <span style="color:var(--dm-t3,#94a3b8);font-size:12px">${tekst}</span>
      <button id="toast-restore" style="padding:5px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;white-space:nowrap">${o.knapp||'Gjenopprett'}</button>
      <button id="toast-dismiss" style="padding:5px 10px;background:rgba(255,255,255,.1);color:var(--dm-t3,#94a3b8);border:none;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px">Ignorer</button>
    `;
    document.body.appendChild(toast);
    // Animate in
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)';
    }));

    const hide=()=>{
      toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(20px)';
      setTimeout(()=>toast.remove(),300);
    };
    const dismiss=()=>{
      hide();
      localStorage.removeItem(AUTOSAVE_KEY);
    };

    document.getElementById('toast-restore').onclick=async()=>{
      toast.remove();
      try{
        await lastProsjekt(proj,{fit:false});
        if(o.etterpaa)o.etterpaa();
        else hintText.textContent='Autolaga prosjekt gjenoppretta.';
      }catch(e){
        hintText.textContent='Kunne ikkje gjenopprette autolagringa: '+e.message;
      }
      localStorage.removeItem(AUTOSAVE_KEY);
    };
    document.getElementById('toast-dismiss').onclick=dismiss;
    // Auto-lukk etter 12 s utan handling — men BEHALD backupen (berre eksplisitt «Ignorer» slettar)
    setTimeout(()=>{if(document.getElementById('autosave-toast'))hide();},12000);
    return true;
  }catch(e){return false;}
}

// Lagrar brua til bygget av seg sjølv, eig ho dette — dei kan ikkje køyre side
// om side: autosave() kallar markClean(), så den lokale lagringa ville nulla
// isDirty før lagringa til bygget fekk sjå han, og bygget ville aldri blitt
// oppdatert. Har verten slått autolagringa av, held vi fram som før, slik at
// det ikkje står heilt utan.
setInterval(()=>{
  if(isDirty&&!(window.EntroHost&&window.EntroHost.autosaves()))autosave();
},AUTOSAVE_INTERVAL);
// Also autosave when user leaves. Her tek vi lokalkopien uansett — også i
// EntroPi: dette er siste sjanse, og ein postMessage rekk ikkje fram når
// iframen forsvinn. Kopien er stempla med bygget (_autolagringEigar), så brua
// kan tilby han att på rett bygg neste gong. Den lokale lagringa er altså
// ikkje eit sidespor i EntroPi, men eit nett under lagringa til bygget:
// han vert skriven berre når noko er ulagra, og sletta straks bygget har fått
// det (sxi:save-result).
window.addEventListener('pagehide',()=>{if(isDirty)autosave();});
// Restore on load (after a short delay so DOM is ready).
// I EntroPi eig brua heile tilbodet: han er den einaste som veit kva bygg vi
// står på, og ein lokalkopi frå eit ANNA bygg skal aldri tilbydast her. Difor
// held vi oss heilt unna når verten har bede om innbygd modus (?embed=1) —
// også når bygget ikkje har noko prosjekt frå før. Elles ville eit seint
// sxi:init tapt kappløpet mot dette tidsavbrotet, og brukaren fått tilbod om
// arbeid frå eit heilt anna bygg.
setTimeout(()=>{
  const H=window.EntroHost;
  if(H&&H.framed&&(H.embedRequested()||H.willLoadProject()))return;
  // Sikra at alle soner har korrekt zoneConnections-format før autolagring
  ensureAllZoneConnectionsMaps();
  restoreAutosave();
// Brua vert definert lenger ned i fila, så «er vi i ein iframe» vert rekna
// direkte her — window.EntroHost finst ikkje enno på dette tidspunktet.
},(window.parent&&window.parent!==window)||window.opener?1500:300);

// ── 2a. Kopier etasje mellom prosjekt ────────────────────────
// Ein heil etasje — bakgrunnsteikning, kalibrering, soner, vindauge, mål — kan
// hentast frå eitt prosjekt inn i eit anna. Inne i EntroPi ligg prosjekta på
// kvart sitt bygg og kan ikkje vere opne samstundes, så det må gå gjennom eit
// lager som lever mellom to sideopningar. Difor to vegar, som begge endar i
// importerEtasjar():
//
//   Klippbord    IndexedDB på vårt eige origin: kopier i eitt prosjekt, lim inn
//                i det neste. Nettlesaren partisjonerer lageret på toppnivå-
//                sida (EntroPi), ikkje på kvar iframe-URL, så det same
//                klippbordet gjeld frå bygg til bygg. localStorage duger ikkje:
//                ei PDF-side på ~48 Mpx sprengjer 5 MB-kvoten, og eit JPEG-
//                mellomsteg ville blassa ut dei tynne strekane linjesnappinga
//                leitar etter. IndexedDB tek imot ein PNG-Blob direkte.
//   Prosjektfil  Vel ei .entro-fil og hent etasjar ut av ho. Einaste vegen
//                mellom to maskiner eller to nettlesarar — i EntroPi lastar ein
//                først ned ein .entro-kopi (Ctrl+Shift+S) frå det andre bygget.
const KLIPP_DB='sxiEtasjeKlipp',KLIPP_STORE='klipp',KLIPP_KEY='etasje';

function _klippDb(){
  return new Promise((res,rej)=>{
    if(!window.indexedDB){rej(new Error('IndexedDB er ikkje tilgjengeleg'));return;}
    let r;
    try{r=indexedDB.open(KLIPP_DB,1);}catch(e){rej(e);return;}
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(KLIPP_STORE))db.createObjectStore(KLIPP_STORE);
    };
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error||new Error('kunne ikkje opne klippbordet'));
    r.onblocked=()=>rej(new Error('klippbordet er i bruk i ei anna fane'));
  });
}
async function _klippTx(mode,fn){
  const db=await _klippDb();
  try{
    return await new Promise((res,rej)=>{
      const tx=db.transaction(KLIPP_STORE,mode);
      const req=fn(tx.objectStore(KLIPP_STORE));
      tx.oncomplete=()=>res(req?req.result:undefined);
      tx.onerror=()=>rej(tx.error||new Error('klippbord-feil'));
      tx.onabort=()=>rej(tx.error||new Error('klippbordet vart avbrote'));
    });
  } finally { try{db.close();}catch(e){} }
}
const klippSkriv=o=>_klippTx('readwrite',st=>st.put(o,KLIPP_KEY));
const klippLes=()=>_klippTx('readonly',st=>st.get(KLIPP_KEY));
const klippSlett=()=>_klippTx('readwrite',st=>st.delete(KLIPP_KEY));

// Namn som ikkje kolliderer med noko som alt finst. Same mønster som
// uniqueWinName: «Etasje 2» → «Etasje 2 (2)».
function _unikNamn(namn,tatt){
  const base=String(namn||'').trim()||'Utan namn';
  if(!tatt.has(base))return base;
  const rot=base.replace(/\s*\((\d+)\)$/,'');
  let n=2;
  while(tatt.has(rot+' ('+n+')'))n++;
  return rot+' ('+n+')';
}

// Kva bygg ein etasje kjem frå, og kva bygg vi står på no. Tekniske system
// peikar på system-ID-ar PÅ eit bestemt bygg, og ventilasjonstala som ligg
// lagra på sona går rett inn i SXI-en. Kan vi ikkje stadfeste at det er same
// bygget, må dei bort — elles ville energimerket blitt rekna med luftmengder
// frå ein heilt annan bygning.
function _sameBygg(kjeldeByggId){
  if(!kjeldeByggId||!inPi())return false;
  const her=window.EntroHost.byggId();
  return !!her&&String(her)===String(kjeldeByggId);
}
function _tellSystem(serFloors){
  let n=0;
  serFloors.forEach(f=>(f.zones||[]).forEach(z=>{
    if(Array.isArray(z.tekniskeSystem))n+=z.tekniskeSystem.length;
  }));
  return n;
}

// Hentar serialiserte etasjar inn i det opne prosjektet.
//   meta.globalMpp    den globale kalibreringa i KJELDEprosjektet
//   meta.globalNorth  nord i kjeldeprosjektet (berre til varsling)
//   meta.byggId       bygget etasjen vart kopiert frå, '' om ukjent
// Returnerer eit samandrag til meldinga til brukaren.
async function importerEtasjar(serFloors,meta){
  const m=meta||{};
  if(!serFloors||!serFloors.length)return null;
  saveFloorState();
  snapshot();                     // markDirty følgjer med (patcha snapshot)

  const tatteEtg=new Set(floors.map(f=>f.name));
  const tatteSoner=new Set(floors.flatMap(f=>f.zones.map(z=>z.name)));
  const beholdSystem=_sameBygg(m.byggId);
  // Eit heilt tomt startprosjekt skal ikkje sitje att med ei blank «Etasje 1»
  // framfor den importerte.
  const tomStart=floors.length===1&&!floors[0].bgImg&&!floors[0].zones.length
                 &&!(floors[0].measurements||[]).length;

  // groupId er berre meiningsfull innanfor eitt prosjekt. Ei kopling som ligg
  // heilt inne i importen vert med (under nye id-ar); peikar ho ut av det vi
  // hentar, fell ho bort — som ved sletting av ei etasje.
  const gidTal={};
  serFloors.forEach(f=>(f.zones||[]).forEach(z=>{
    if(z.groupId)gidTal[z.groupId]=(gidTal[z.groupId]||0)+1;
  }));
  const gidNy={};

  let utanSystem=0,egenKal=0;
  const nye=[];
  // Delplanar: id-ane vert nye, så delAv må følgje med. Kjem ikkje
  // hovudetasjen med i importen, vert delplanen ei eiga etasje.
  const idNy=new Map();
  for(const sf of serFloors){
    const fl=await deserialiserEtasje(sf);
    fl.id=_nextFloorId++;
    if(sf.id!=null)idNy.set(sf.id,fl.id);
    fl.name=_unikNamn(sf.name,tatteEtg);tatteEtg.add(fl.name);
    // Kalibreringa som GJALDT for etasjen i kjeldeprosjektet er den einaste som
    // gir rette mål. Er ho ulik den globale her, må etasjen ha eiga
    // kalibrering — elles ville alle areala endra seg i det han vart henta inn.
    const srcMpp=sf.ownCal?sf.mmPerImgPx:(m.globalMpp??sf.mmPerImgPx);
    if(srcMpp==null){fl.ownCal=false;fl.mmPerImgPx=null;}
    else if(globalMmPerImgPx!=null&&Math.abs(srcMpp-globalMmPerImgPx)<=1e-9*Math.abs(srcMpp)){
      fl.ownCal=false;fl.mmPerImgPx=srcMpp;
    } else {fl.ownCal=true;fl.mmPerImgPx=srcMpp;egenKal++;}
    fl.zones.forEach(z=>{
      z.name=_unikNamn(z.name,tatteSoner);tatteSoner.add(z.name);
      // Heiter sona «Sone 12», må teljaren forbi 12 — elles gir neste nye sone
      // same namnet.
      const mn=/^Sone\s+(\d+)$/.exec(z.name);
      if(mn)_nextZoneId=Math.max(_nextZoneId,+mn[1]);
      const g=z.groupId;
      if(g&&gidTal[g]>1)z.groupId=gidNy[g]||(gidNy[g]='g'+(++_nextGroupId));
      else delete z.groupId;
      if(!beholdSystem&&Array.isArray(z.tekniskeSystem)&&z.tekniskeSystem.length){
        utanSystem+=z.tekniskeSystem.length;
        delete z.tekniskeSystem;
      }
    });
    nye.push(fl);
  }

  nye.forEach(fl=>{
    fl.delAv=(fl.delAv!=null&&idNy.has(fl.delAv))?idNy.get(fl.delAv):null;
    if(fl.plassAnker)fl.plassAnker=idNy.has(fl.plassAnker.til)?{...fl.plassAnker,til:idNy.get(fl.plassAnker.til)}:null;
  });
  nye.forEach(fl=>floors.push(fl));
  activeFloor=floors.length-nye.length;
  if(tomStart){floors.splice(0,1);activeFloor--;}
  _ordneDelplanar();
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();
  if(bgImg)fitImage();else draw();
  return {n:nye.length,namn:nye.map(f=>f.name),utanSystem,egenKal,
    // Nord er globalt per prosjekt. Var det noko anna i kjeldeprosjektet, står
    // fasadane no mot andre himmelretningar enn dei gjorde der.
    nordAvvik:(m.globalNorth!=null&&Math.round(m.globalNorth)!==Math.round(globalNorth))
              ?Math.round(m.globalNorth):null};
}

function _meldImport(r,kjelde){
  if(!r)return;
  const d=['✓ Henta '+(r.n===1?'«'+r.namn[0]+'»':r.n+' etasjar')+' frå '+kjelde];
  if(r.egenKal)d.push(r.egenKal===1?'etasjen har eiga kalibrering (annan skala enn den globale her)'
                                   :r.egenKal+' etasjar har eiga kalibrering');
  if(r.utanSystem)d.push(r.utanSystem+' tekniske system vart ikkje med (annan bygning)');
  if(r.nordAvvik!=null)d.push('nord var '+r.nordAvvik+'° i kjeldeprosjektet, '+Math.round(globalNorth)+'° her — sjekk kompasset');
  hintText.textContent=d.join(' · ');
}

// ── Klippbordet ──
async function kopierEtasjeTilKlippbord(f){
  saveFloorState();   // bgImg/zoom/mål for den aktive etasjen bur i variablane
  const pakke={
    v:1,lagraTid:new Date().toISOString(),
    // Bakgrunnen ligg ved som PNG-Blob i staden for dataURL: klippbordet skal
    // tåle ei PDF-side på 48 Mpx utan tapt strekkvalitet.
    etasje:serialiserEtasje(f,{utanBilete:true}),bgBlob:null,
    globalMpp:globalMmPerImgPx,globalNorth:globalNorth,
    byggId:(inPi()&&window.EntroHost.byggId())||'',
    kjelde:(inPi()&&window.EntroHost.byggNamn())||prosjektAdresse||''
  };
  if(f.bgImg){
    pakke.bgBlob=await new Promise(res=>{
      try{
        const c=document.createElement('canvas');
        c.width=f.bgImg.width;c.height=f.bgImg.height;
        c.getContext('2d').drawImage(f.bgImg,0,0);
        if(c.toBlob)c.toBlob(b=>res(b),'image/png');else res(null);
      }catch(e){res(null);}   // tainted canvas — etasjen går utan bilete
    });
  }
  await klippSkriv(pakke);
  return pakke;
}

async function limInnEtasjeFraKlippbord(){
  let p=null;
  try{p=await klippLes();}
  catch(e){
    hintText.textContent='Klippbordet er ikkje tilgjengeleg ('+e.message+') — bruk «Hent etasje frå prosjektfil» i staden.';
    return;
  }
  if(!p||!p.etasje){
    hintText.textContent='Klippbordet er tomt. Høgreklikk på ei etasjefane i det andre prosjektet og vel «Kopier etasje» først.';
    return;
  }
  const sf={...p.etasje};
  if(p.bgBlob)sf.bgBlob=p.bgBlob;
  const r=await importerEtasjar([sf],{globalMpp:p.globalMpp,globalNorth:p.globalNorth,byggId:p.byggId});
  _meldImport(r,'klippbordet'+(p.kjelde?' ('+p.kjelde+')':''));
}

// Kva som ligg på klippbordet, til menyteksten. Feil eller tomt lager gir null.
async function klippbordInfo(){
  try{
    const p=await klippLes();
    if(!p||!p.etasje)return null;
    const soner=(p.etasje.zones||[]).length;
    const min=Math.round((Date.now()-new Date(p.lagraTid).getTime())/60000);
    const alder=!isFinite(min)?'':min<2?'akkurat no':min<60?min+' min sidan':
                min<1440?Math.round(min/60)+' t sidan':Math.round(min/1440)+' d sidan';
    return {namn:p.etasje.name||'Etasje',soner,alder,kjelde:p.kjelde||''};
  }catch(e){return null;}
}

// ── Frå ei .entro-fil ──
function _velProsjektfil(){
  return new Promise(res=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='.entro,application/json';
    inp.onchange=()=>res(inp.files[0]||null);
    inp.click();
  });
}
async function hentEtasjeFraFil(){
  const file=await _velProsjektfil();
  if(!file)return;
  let proj=null;
  try{proj=JSON.parse(await file.text());}
  catch(e){alert('Kunne ikkje lese prosjektfila: '+e.message);return;}
  if(!proj||!Array.isArray(proj.floors)||!proj.floors.length){
    alert('Fila inneheld ingen etasjar.');return;
  }
  const meta={globalMpp:proj.globalMmPerImgPx??null,globalNorth:proj.globalNorth??null,
    byggId:(proj._eigar&&proj._eigar.byggId)||''};
  const valde=await velEtasjarDialog(proj.floors,file.name,meta);
  if(!valde||!valde.length)return;
  const r=await importerEtasjar(valde.map(i=>proj.floors[i]),meta);
  _meldImport(r,'«'+file.name+'»');
}

// Vel kva etasjar som skal hentast. Klikk på ei rad hentar den eine; knappen
// under hentar alle. Returnerer ei liste med indeksar.
function velEtasjarDialog(serFloors,filnamn,meta){
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.4);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
    const box=document.createElement('div');
    box.style.cssText='background:var(--surface);border-radius:14px;padding:24px;width:380px;max-height:82vh;overflow:auto;box-shadow:0 12px 40px rgba(13,27,42,.15)';
    const h=document.createElement('div');
    h.style.cssText='font-size:15px;font-weight:700;color:var(--text);margin-bottom:3px';
    h.textContent='Hent etasje frå prosjektfil';
    const sub=document.createElement('div');
    sub.style.cssText='font-size:12px;color:var(--text3);margin-bottom:16px;word-break:break-all';
    sub.textContent=filnamn||'';
    box.appendChild(h);box.appendChild(sub);

    const lukk=svar=>{document.body.removeChild(overlay);resolve(svar);};
    serFloors.forEach((sf,i)=>{
      const mpp=sf.ownCal?sf.mmPerImgPx:((meta&&meta.globalMpp)??sf.mmPerImgPx);
      const zs=sf.zones||[];
      const areal=zs.reduce((a,z)=>a+(z.areaOverride!=null?z.areaOverride:(calcAreaM2(z.pts||[],mpp)||0)),0);
      const vindauge=zs.reduce((a,z)=>a+((z.windows||[]).length),0);
      const detalj=[zs.length+(zs.length===1?' sone':' soner')]
        .concat(areal>0?[areal.toFixed(1).replace('.',',')+' m²']:[])
        .concat(vindauge?[vindauge+' vindauge/dør']:[])
        .concat(sf.bgImgData?[]:['utan teikning']).join(' · ');
      const btn=document.createElement('button');
      btn.style.cssText='width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer;text-align:left;margin-bottom:8px;font-family:inherit;transition:all .12s';
      btn.innerHTML='<span style="font-size:18px;width:24px;text-align:center">⬓</span><div style="min-width:0"><div style="font-size:13px;font-weight:600;color:var(--text)"></div><div style="font-size:12px;color:var(--text3);margin-top:1px"></div></div>';
      btn.children[1].children[0].textContent=sf.name||('Etasje '+(i+1));
      btn.children[1].children[1].textContent=detalj;
      btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
      btn.onmouseleave=()=>{btn.style.borderColor='var(--border)';btn.style.background='var(--surface)';};
      btn.onclick=()=>lukk([i]);
      box.appendChild(btn);
    });

    if(_tellSystem(serFloors)&&!_sameBygg(meta&&meta.byggId)){
      const adv=document.createElement('div');
      adv.style.cssText='font-size:11px;color:var(--text3);margin:2px 0 12px;line-height:1.45';
      adv.textContent='Tekniske system frå EntroPi vert ikkje med — dei høyrer til bygget dei vart henta på.';
      box.appendChild(adv);
    }
    if(serFloors.length>1){
      const alle=document.createElement('button');
      alle.textContent='Hent alle '+serFloors.length+' etasjane';
      alle.style.cssText='width:100%;padding:9px;border:1px solid var(--accent);border-radius:8px;background:var(--accent-dim);color:var(--accent);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:8px';
      alle.onclick=()=>lukk(serFloors.map((_,i)=>i));
      box.appendChild(alle);
    }
    const avbryt=document.createElement('button');
    avbryt.textContent='Avbryt';
    avbryt.style.cssText='width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;background:transparent;color:var(--text3);cursor:pointer;font-family:inherit;font-size:13px';
    avbryt.onclick=()=>lukk(null);
    box.appendChild(avbryt);
    overlay.appendChild(box);
    overlay.addEventListener('click',e=>{if(e.target===overlay)lukk(null);});
    document.body.appendChild(overlay);
  });
}

// ── Kontekstmeny på etasjefana ──
async function showFloorContextMenu(clientX,clientY,f){
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
  _ensureCtxStyle();
  const info=await klippbordInfo();
  const menu=document.createElement('div');
  menu.className='ctx-menu';
  menu.style.cssText='left:'+clientX+'px;top:'+clientY+'px;min-width:240px';
  const close=()=>{menu.remove();document.removeEventListener('mousedown',utanfor);};
  const utanfor=ev=>{if(!menu.contains(ev.target))close();};
  const mkItem=(icon,label,under,action)=>{
    const btn=document.createElement('button');
    btn.className='ctx-menu-item';
    btn.style.alignItems='flex-start';
    btn.innerHTML='<span class="ctx-ik">'+ctxIkon(icon)+'</span><span></span>';
    const t=btn.children[1];
    t.textContent=label;
    if(under){
      const u=document.createElement('div');
      u.style.cssText='font-size:11px;color:var(--text3);margin-top:1px;white-space:normal';
      u.textContent=under;
      t.appendChild(u);
    }
    if(action)btn.onclick=()=>{close();action();};
    else {btn.style.opacity='.45';btn.style.cursor='default';}
    return btn;
  };
  const hdr=document.createElement('div');
  hdr.className='ctx-menu-header';
  hdr.textContent=arkNamn(f)+' · '+f.zones.length+' soner';
  menu.appendChild(hdr);
  const sep=document.createElement('div');sep.className='ctx-menu-sep';menu.appendChild(sep);
  menu.appendChild(mkItem('✎','Gi nytt namn','Eller dobbeltklikk på fana',()=>{
    if(floors.indexOf(f)!==activeFloor)switchFloor(floors.indexOf(f));
    startRenameFloor(f);
  }));

  // Delplanar — fleire teikningar for same etasje
  if(!iFasade()){
    const h=hovudEtasje(f);
    menu.appendChild(mkItem('▣','Ny delplan i «'+h.name+'»…','Ei teikning til for same etasje — t.d. ein annan fløy',()=>leggTilDelplan(h)));
    if(erDelplan(f)){
      menu.appendChild(mkItem('⇱','Gjer til eiga etasje','Får eiga høgd og vert stabla i 3D som før',()=>gjerTilEigaEtasje(f)));
    } else {
      floors.filter(x=>!erDelplan(x)&&x!==f).forEach(x=>{
        const n=etasjeArk(f).length;
        menu.appendChild(mkItem('⇲','Legg under «'+x.name+'» som delplan',
          (n>1?'Alle '+n+' teikningane i «'+f.name+'» vert med · ':'')+'Høgda og nivået vert «'+x.name+'» sitt; plasseringa står',
          ()=>gjerTilDelplan(f,x)));
      });
    }
    const sep2=document.createElement('div');sep2.className='ctx-menu-sep';menu.appendChild(sep2);
  }
  if(!iFasade()&&floors.length>1)
    menu.appendChild(mkItem('🗑','Slett fleire etasjar…','Kryss av og slett i eitt — kan angrast',()=>slettEtasjarDialog()));
  menu.appendChild(mkItem('⧉','Kopier etasje','Til klippbordet — kan hentast inn i eit anna prosjekt',async()=>{
    hintText.textContent='Kopierer «'+f.name+'»…';
    try{
      await kopierEtasjeTilKlippbord(f);
      hintText.textContent='✓ «'+f.name+'» ligg på klippbordet. Opne det andre prosjektet og vel «+ Etasje» → «Lim inn kopiert etasje».';
    }catch(e){
      hintText.textContent='Kunne ikkje kopiere etasjen: '+e.message+' — last ned prosjektet som .entro-fil og hent etasjen derifrå i staden.';
    }
  }));
  menu.appendChild(mkItem('⧈','Lim inn kopiert etasje',
    info?('«'+info.namn+'», '+info.soner+' soner'+(info.kjelde?' · '+info.kjelde:'')+(info.alder?' · '+info.alder:''))
        :'Klippbordet er tomt',
    info?(()=>limInnEtasjeFraKlippbord()):null));
  menu.appendChild(mkItem('↧','Hent etasje frå prosjektfil…','Vel ei .entro-fil og plukk etasje',()=>hentEtasjeFraFil()));

  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  if(rect.right>window.innerWidth)menu.style.left=Math.max(4,clientX-rect.width)+'px';
  if(rect.bottom>window.innerHeight)menu.style.top=Math.max(4,clientY-rect.height)+'px';
  setTimeout(()=>document.addEventListener('mousedown',utanfor),10);
}

// ── 2b. EntroPi-bru — lagre prosjektet rett på bygget ────────
// Programmet kan køyre som verktøy i ein iframe inne i EntroPi. Då skal
// «Lagre» leggje .entro-prosjektet på bygget i staden for å laste ned ei fil,
// og prosjektet som alt ligg på bygget kjem inn med ei sxi:init-melding.
// Utanfor ein iframe er brua heilt passiv og endrar ingenting.
// Protokollen er dokumentert i docs/entropi-integrasjon.md.
(function(){
  const PROTOCOL=1;
  // Kva opphav brua snakkar med. Dette er den einaste lista som avgjer kven
  // som får sende oss eit prosjekt og ta imot prosjektdata — utvid ved nye miljø.
  const ALLOWED=[
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/([a-z0-9-]+\.)*entro\.no$/,
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/
  ];
  const hostWin=(window.parent&&window.parent!==window)?window.parent:(window.opener||null);
  const framed=!!hostWin;
  const embedRequested=framed&&new URLSearchParams(location.search).has('embed');
  let hostOrigin=null;              // sett fyrst når ei godkjend melding har kome
  let bygg=null,wantsSxi=false,saveLabel='Lagre på bygget';
  let hasProject=false,autosaveTimer=null,inited=false;
  let pending=null,saveSeq=0,lastDirty=null;
  // Autolagring til bygget står på som standard — i EntroPi er fila på bygget
  // den einaste kopien, og den lokale autolagringa står ned (sjå setInterval
  // ved AUTOSAVE_INTERVAL). Verten kan overstyre med autosaveMs, eller slå det
  // av med 0.
  const AUTOSAVE_MS_STD=120000;   // 2 min — kvar lagring er ei ny fil på bygget
  const AUTOSAVE_MS_MIN=30000;    // vern mot at verten ber om lagring i eit kjør
  const FIRST_SAVE_MS=10000;      // fyrste endringa skal ikkje vente eit heilt intervall
  let firstSaveTimer=null,firstSaveDone=false;
  // sxi:request-save som kom medan ei lagring alt gjekk. Verten ventar på sin
  // requestId — får han aldri svar, står «Lagre og gå ut» og heng. Difor vert
  // førespurnaden lagd i kø og send på nytt så snart den fyrste er ferdig.
  let queuedReq=null;
  // Tekniske system på bygget (beta). Lista er verten sin — brua cachar henne
  // berre, slik at vindauget kan opnast utan å vente på ein ny rundtur.
  const SYS_TIMEOUT_MS=12000;     // ein vert som ikkje kan meldinga skal ikkje henge oss
  let sysCache=null,sysReq=null,sysSeq=0;
  const sysListeners=[];

  // Brua er berre «aktiv» etter ei sxi:init — ein vert som ikkje har sagt at
  // han handterer lagring skal ikkje stele lagreknappen frå nedlastinga.
  const active=()=>!!(framed&&hostOrigin&&inited);
  const appVersion=()=>{const el=document.getElementById('appVer');return el?el.textContent.trim():'';};
  const okOrigin=o=>ALLOWED.some(re=>re.test(o));
  const hint=t=>{try{hintText.textContent=t;}catch(e){}};

  function post(m){
    if(!active())return;
    try{hostWin.postMessage(Object.assign({source:'sxi-generator',protocol:PROTOCOL},m),hostOrigin);}
    catch(e){console.warn('EntroPi-bru: kunne ikkje sende '+m.type,e);}
  }
  // sxi:ready inneheld ingen prosjektdata, så han kan gå til '*' før vi veit
  // kven verten er. Alt anna går til eit kontrollert opphav.
  function announce(){
    if(!framed||hostOrigin)return;
    try{hostWin.postMessage({source:'sxi-generator',protocol:PROTOCOL,type:'sxi:ready',version:appVersion()},'*');}catch(e){}
  }

  // ── UI i innbygd modus ──
  function labelEl(){
    const sb=document.getElementById('saveBtn');
    if(!sb)return null;
    let s=sb.querySelector('.host-lbl');
    if(!s){s=document.createElement('span');s.className='host-lbl';s.style.marginLeft='5px';sb.appendChild(s);}
    return s;
  }
  function applyEmbedUI(){
    // Éin flagg styrer all vising: .embed-only vert synleg, .local-only skjult.
    // Difor dukkar nedlastingsknappen (#dlBtn) opp av seg sjølv her — «Lagre»
    // går til bygget, så utan han kunne ein ikkje ta ein .entro-kopi ut.
    document.documentElement.dataset.embed='1';
    const sb=document.getElementById('saveBtn');
    if(sb){
      sb.classList.add('teal');
      sb.title=saveLabel+' (Ctrl+S)';
      const s=labelEl();if(s)s.textContent=saveLabel;
    }
    const ub=document.getElementById('upBtn');
    if(ub)ub.title='Last opp planteikningar (PDF eller bilete) eller opne ei .entro-fil frå maskina (Ctrl+O)';
    if(bygg&&(bygg.namn||bygg.adresse)){
      let c=document.getElementById('hostChip');
      if(!c){
        const anchor=document.getElementById('saveBtn');
        if(anchor&&anchor.parentNode){
          c=document.createElement('span');
          c.id='hostChip';c.className='lbl';
          c.style.cssText='margin-left:6px;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
          anchor.parentNode.appendChild(c);
        }
      }
      if(c){
        const t=bygg.namn||bygg.adresse;
        c.textContent='⌂ '+t;
        c.title='Prosjektet vert lagra på '+t+' i EntroPi';
      }
    }
  }
  function setBusy(busy,silent){
    const sb=document.getElementById('saveBtn');
    if(!sb)return;
    sb.disabled=!!busy;
    sb.style.opacity=busy?'.6':'';
    if(silent)return;
    const s=labelEl();if(s)s.textContent=busy?'Lagrar…':saveLabel;
  }
  function hideToast(){
    const el=document.getElementById('autosave-toast');
    if(el)el.remove();
  }

  // ── Tekniske system frå bygget (beta) ──
  // Verten eig lista. Vi normaliserer henne her, slik at resten av programmet
  // slepp å vite om EntroPi skriv nynorsk, bokmål eller engelsk i feltnamna.
  function normSystems(raw){
    if(!Array.isArray(raw))return null;
    const out=[],seen=new Set();
    raw.forEach(x=>{
      if(!x||typeof x!=='object')return;
      const namn=String(x.namn||x.name||'').trim();
      const kat=String(x.kategori||x.category||'').trim()||'Ukategorisert';
      const id=String(x.id||x.systemId||(kat+'/'+namn)).trim();
      if(!id||(!namn&&!x.id)||seen.has(id))return;   // same id ⇒ same system
      seen.add(id);
      out.push({id:id,namn:namn||id,kategori:kat,
        undertittel:String(x.undertittel||x.subtitle||'').trim(),
        ikon:String(x.ikon||'').trim().slice(0,3),
        luft:sysLuft(x),gjenvinning:sysGjenvinning(x),sfp:sysSfp(x)});
    });
    return out;
  }
  // Tala som SXI-eksporten kan bruke. Dei vert leste defensivt: eit vrøvltal
  // frå verten ville elles gått rett inn i energiberekninga utan at nokon såg
  // det. Utanfor grensene her fell verktøyet tilbake på normverdiane sine.
  const sysNum=v=>{
    if(v==null||v==='')return null;
    const n=parseFloat(String(v).replace(',','.'));
    return isFinite(n)?n:null;
  };
  function sysLuft(x){
    const til=sysNum(x.tilluft!=null?x.tilluft:(x.supplyAir!=null?x.supplyAir:x.luftmengde));
    const fra=sysNum(x.avtrekk!=null?x.avtrekk:(x.extractAir!=null?x.extractAir:x.luftmengde));
    if((til==null||til<=0)&&(fra==null||fra<=0))return null;
    // Verten kan sende total m³/h eller ferdig spesifikk m³/(h·m²) — vi må
    // vite kva, elles vert luftmengda feil med ein faktor på arealet.
    const e=String(x.luftEining||x.airflowUnit||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    // Luftmengd utanfor drift. 0 er ein gyldig verdi (anlegget står heilt av),
    // så han må skiljast frå «ikkje oppgitt» — same eining som resten.
    const rT=sysNum(x.tilluftRedusert!=null?x.tilluftRedusert:x.supplyAirReduced);
    const rF=sysNum(x.avtrekkRedusert!=null?x.avtrekkRedusert:x.extractAirReduced);
    return {til:(til>0?til:null),fra:(fra>0?fra:null),per:e.indexOf('m2')>=0,
            redTil:(rT!=null&&rT>=0?rT:null),redFra:(rF!=null&&rF>=0?rF:null)};
  }
  function sysGjenvinning(x){
    let g=sysNum(x.gjenvinning!=null?x.gjenvinning
              :(x.gjenvinningsgrad!=null?x.gjenvinningsgrad:x.heatRecovery));
    if(g==null)return null;
    if(g>1)g=g/100;                       // 80 og 0,80 tyder det same
    return (g>=0&&g<=1)?g:null;
  }
  function sysSfp(x){
    const s=sysNum(x.sfp!=null?x.sfp:x.sfpKw);
    // SFP i kW/(m³/s). Over 20 er ikkje eit aggregat, det er ein skrivefeil.
    return (s!=null&&s>=0&&s<=20)?s:null;
  }

  // Éin førespurnad om gongen — fleire klikk på knappen skal ikkje gi fleire
  // rundturar. Lovnaden vert alltid innfridd: svarar ikkje verten (t.d. fordi
  // han ikkje kan denne meldinga enno), kjem ok:false etter tidsavbrotet.
  function requestSystems(){
    if(!active())return Promise.resolve({ok:false,systems:sysCache,message:'Ikkje kopla til EntroPi.'});
    if(sysReq)return sysReq.promise;
    const id='sys'+(++sysSeq);
    let done;
    const promise=new Promise(r=>{done=r;});
    sysReq={id:id,promise:promise,timer:setTimeout(()=>{
      sysReq=null;
      done({ok:false,systems:sysCache,
        message:'EntroPi svarte ikkje — vertssida må svare på sxi:request-systems.'});
    },SYS_TIMEOUT_MS),resolve:done};
    post({type:'sxi:request-systems',requestId:id});
    return promise;
  }

  // ── KI-oppteikning (beta) ──
  // Verktøyet har ingen API-nøkkel. Prompt, bilete og JSON-skjema går til
  // verten, som kallar Claude og svarar med det tolka resultatet. Verten må
  // stadfeste med sxi:ai-ack med ein gong — ein analyse kan ta minutt, og
  // utan stadfestinga kunne vi ikkje skilje ein treig analyse frå ein vert
  // som ikkje kan meldinga.
  const KI_ACK_MS=15000,KI_SVAR_MS=360000;
  let kiSeq=0;
  const kiReq=new Map();
  function askAi(o){
    if(!active())return Promise.resolve({ok:false,message:'Ikkje kopla til EntroPi.'});
    const id='ki'+(++kiSeq);
    return new Promise(res=>{
      const ferdig=r=>{const q=kiReq.get(id);if(!q)return;clearTimeout(q.timer);kiReq.delete(id);res(r);};
      kiReq.set(id,{ferdig,timer:setTimeout(()=>ferdig({ok:false,
        message:'EntroPi svarte ikkje — vertssida må svare på sxi:ai-request.'}),KI_ACK_MS)});
      post({type:'sxi:ai-request',requestId:id,oppgave:o.oppgave,prompt:o.prompt,
        images:o.images,schema:o.schema,maxTokens:o.maxTokens||16000,meta:o.meta||{}});
    });
  }

  // ── Lagring til verten ──
  // Send ein førespurnad som stod i kø. Kvar sxi:request-save skal ende i ein
  // sxi:save, elles ventar verten for alltid på svaret sitt.
  function flushQueuedReq(){
    if(!queuedReq)return;
    const q=queuedReq;queuedReq=null;
    saveToHost({auto:q.auto,requestId:q.requestId});
  }
  function saveToHost(o){
    o=o||{};
    if(!active())return false;
    if(pending)return false;                 // ei lagring går alt
    let blob,meta,fname;
    try{
      // PNG som i den manuelle lagringa: lagringa på bygget er den einaste
      // kopien, og JPEG ville tapt kvalitet på nytt for kvar opne-lagre-runde.
      const proj=serialiserProsjekt();
      blob=new Blob([JSON.stringify(proj)],{type:'application/json'});
      fname=foreslaaFilnamn();
      meta={
        floors:floors.length,
        zones:floors.reduce((s,f)=>s+f.zones.length,0),
        braM2:Math.round(floors.flatMap(f=>f.zones).reduce((s,z)=>s+(getAreaM2(z)||0),0)*10)/10,
        adresse:prosjektAdresse||'',
        savedAt:proj.savedAt,
        appVersion:appVersion()
      };
    }catch(e){
      hint('Kunne ikkje lage prosjektfila: '+e.message);
      return false;
    }
    const id=o.requestId||('s'+(++saveSeq));
    setBusy(true,!!o.auto);
    post({type:'sxi:save',requestId:id,auto:!!o.auto,filename:fname,bytes:blob.size,blob,meta});
    pending={id:id,auto:!!o.auto,timer:setTimeout(()=>{
      pending=null;setBusy(false);
      if(!o.auto)hint('Ingen respons frå EntroPi. Prøv igjen, eller lagre som fil lokalt.');
      flushQueuedReq();   // verten skal få svar på førespurnaden sin uansett
    },45000)};
    return true;
  }

  async function toProj(p){
    if(!p)return null;
    if(typeof Blob!=='undefined'&&p instanceof Blob)p=await p.text();
    else if(p instanceof ArrayBuffer)p=new TextDecoder().decode(p);
    else if(p&&p.buffer instanceof ArrayBuffer)p=new TextDecoder().decode(p);
    if(typeof p==='string')return JSON.parse(p);
    if(typeof p==='object')return p;
    return null;
  }
  async function loadFromHost(payload,silent){
    const proj=await toProj(payload);
    if(!proj)throw new Error('tomt prosjekt');
    await lastProsjekt(proj,{fit:true});
    markClean();
    if(!silent)hint('Prosjektet er henta frå '+((bygg&&(bygg.namn||bygg.adresse))||'EntroPi')+'.');
    return proj;
  }

  const byggId=()=>bygg?String(bygg.id||''):'';

  // Lokalkopien er eit nett for det som ikkje rakk fram til bygget — han vert
  // sletta så snart bygget har fått lagringa (sjå sxi:save-result). Ligg det
  // likevel ein kopi her når vi opnar, betyr det at førre økta enda utan at
  // arbeidet nådde fram: nettlesaren vart lukka, fana krasja, eller EntroPi
  // fjerna iframen mellom to autolagringar. Då tilbyr vi han att — men berre
  // for DETTE bygget, og berre om han er nyare enn fila som låg der.
  // «Hent inn att» markerer prosjektet skittent, så det går vidare til bygget
  // ved neste autolagring i staden for å bli liggjande lokalt igjen.
  function tilbyLokalKopi(hostSavedAt){
    if(!active())return;
    restoreAutosave({
      byggId:byggId(),
      nyareEnn:hostSavedAt||null,
      tekst:'Ulagra arbeid som ikkje nådde bygget',
      knapp:'Hent inn att',
      etterpaa(){
        markDirty();   // kallar notifyDirty() sjølv ⇒ går til bygget herfrå
        hint('Arbeidet er henta inn att, og vert lagra på '
          +((bygg&&(bygg.namn||bygg.adresse))||'bygget')+'.');
      }
    });
  }

  // ── Meldingar frå verten ──
  window.addEventListener('message',async ev=>{
    if(!framed||ev.source!==hostWin)return;
    const d=ev.data;
    if(!d||typeof d!=='object'||typeof d.type!=='string'||d.type.indexOf('sxi:')!==0)return;
    if(!okOrigin(ev.origin)){console.warn('EntroPi-bru: avviste melding frå '+ev.origin);return;}
    if(hostOrigin&&ev.origin!==hostOrigin)return;   // berre éin vert per sesjon

    if(d.type==='sxi:hello'){                        // verten kobla seg på seint
      hostOrigin=ev.origin;
      try{hostWin.postMessage({source:'sxi-generator',protocol:PROTOCOL,type:'sxi:ready',version:appVersion()},hostOrigin);}catch(e){}
      return;
    }
    // Mørk/lys modus i EntroPi er bytt medan verktøyet er ope
    if(d.type==='sxi:theme'){setTema(d.theme);return;}
    if(d.type==='sxi:init'){
      hostOrigin=ev.origin;
      inited=true;
      if(d.theme)setTema(d.theme);   // før UI-et vert bygt om, så det ikkje blinkar
      bygg=d.bygg||null;
      wantsSxi=!!d.wantsSxi;
      if(d.saveLabel)saveLabel=String(d.saveLabel);
      applyEmbedUI();
      // Verdiane EntroPi alt har på bygget. Brua er einaste skrivar til piBygg;
      // _fyllFraPi() avgjer kva som faktisk vert fylt inn, og han vert kalla
      // igjen frå lastProsjekt() for prosjektet som kjem under her.
      const _by=bygg?parseInt(bygg.byggeaar):NaN;
      piBygg={adresse:(bygg&&bygg.adresse)?String(bygg.adresse):'',
              // eit vrøvltal ville gitt feil standard-U-verdiar utan at nokon såg det
              byggeaar:(_by>=1800&&_by<=2100)?_by:null};
      piBrukar={namn:(d.brukar&&d.brukar.namn)?String(d.brukar.namn).trim():''};
      // Utan prosjekt teiknar vi sjølve; med prosjekt gjer lastProsjekt() det.
      if(_fyllFraPi()&&!d.project){updateResults();renderTable();}
      // Eit tilbod som kom opp før init må vekk uansett: det var reist utan å
      // vite kva bygg vi står på. Rett tilbod kjem frå tilbyLokalKopi() under.
      hideToast();
      let hostSavedAt=null;
      if(d.project){
        hasProject=true;
        try{const hp=await loadFromHost(d.project,true);hostSavedAt=hp&&hp.savedAt;}
        catch(e){hint('Kunne ikkje opne prosjektet frå EntroPi: '+e.message);}
      }
      // Utelate autosaveMs ⇒ standardintervallet. Eksplisitt 0 ⇒ av.
      // Alt anna vert løfta til minimumet, slik at ein feilskriven verdi
      // ikkje lagrar i eit kjør på bygget.
      const ms=(d.autosaveMs==null)?AUTOSAVE_MS_STD
              :(Number(d.autosaveMs)>0?Math.max(AUTOSAVE_MS_MIN,Number(d.autosaveMs)):0);
      if(ms&&!autosaveTimer){
        autosaveTimer=setInterval(()=>{if(isDirty&&active()&&!pending)saveToHost({auto:true});},ms);
      }
      lastDirty=isDirty;
      post({type:'sxi:state',dirty:isDirty,ready:true,version:appVersion()});
      tilbyLokalKopi(hostSavedAt);
      return;
    }
    if(!hostOrigin)return;                           // init må komme fyrst
    if(d.type==='sxi:load'){
      hasProject=true;hideToast();
      try{
        const hp=await loadFromHost(d.project);
        tilbyLokalKopi(hp&&hp.savedAt);
      }
      catch(e){hint('Kunne ikkje opne prosjektet frå EntroPi: '+e.message);}
      return;
    }
    if(d.type==='sxi:request-save'){
      if(!saveToHost({auto:!!d.auto,requestId:d.requestId})&&pending&&d.requestId){
        queuedReq={requestId:d.requestId,auto:!!d.auto};   // send når den fyrste er ferdig
      }
      return;
    }
    if(d.type==='sxi:save-result'){
      if(pending&&d.requestId&&d.requestId!==pending.id)return;
      const auto=pending?pending.auto:false;
      if(pending&&pending.timer)clearTimeout(pending.timer);
      pending=null;setBusy(false);
      if(d.ok){
        markClean();
        // Bygget har fila no. Lèt vi lokalkopien liggje, ville han bli tilbydd
        // som «ulagra arbeid» ved neste opning sjølv om alt låg trygt der.
        slettAutolagring();
        if(!auto)hint(d.message||('Lagra på '+((bygg&&(bygg.namn||bygg.adresse))||'bygget')+'.'));
      }else{
        hint('EntroPi kunne ikkje lagre: '+(d.message||'ukjend feil'));
      }
      flushQueuedReq();
      return;
    }
    if(d.type==='sxi:systems'){
      const list=normSystems(d.systems);
      if(list)sysCache=list;
      if(sysReq&&(!d.requestId||d.requestId===sysReq.id)){
        const r=sysReq;sysReq=null;clearTimeout(r.timer);
        r.resolve({ok:d.ok!==false&&!!list,systems:sysCache,
          message:d.message||(list?'':'EntroPi sende inga liste.')});
      }
      // Verten kan sende lista uoppmoda — t.d. når han er ferdig med å laste
      // henne, eller når nokon har lagt inn eit nytt system i EntroPi.
      sysListeners.forEach(f=>{try{f(sysCache);}catch(e){}});
      return;
    }
    if(d.type==='sxi:ai-ack'){
      const q=kiReq.get(d.requestId);
      if(!q)return;
      clearTimeout(q.timer);
      q.timer=setTimeout(()=>q.ferdig({ok:false,message:'KI-analysen svarte ikkje innan '
        +Math.round(KI_SVAR_MS/60000)+' min.'}),KI_SVAR_MS);
      return;
    }
    if(d.type==='sxi:ai-result'){
      const q=kiReq.get(d.requestId);
      if(!q)return;
      let r=d.result;
      if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){r=null;}}
      q.ferdig((d.ok!==false&&r&&typeof r==='object')
        ?{ok:true,result:r}
        :{ok:false,message:d.message||'KI-analysen gav ikkje noko svar som kunne lesast.'});
      return;
    }
  });

  window.EntroHost={
    framed:framed,
    active:active,
    willLoadProject:()=>hasProject,
    // Har verten bede om innbygd modus? Sann alt før sxi:init, i motsetnad til
    // active() — oppstartsstien treng å vite at brua kjem til å ta over
    // tilbodet om lokalkopien, ikkje at ho alt har gjort det.
    embedRequested:()=>embedRequested,
    // Bygget lagringa går til. Stemplar lokalkopien, slik at han berre vert
    // tilbydd att på det same bygget.
    byggId:byggId,
    // Lagrar vi til bygget av oss sjølve? Den lokale autolagringa står ned då.
    autosaves:()=>!!(active()&&autosaveTimer),
    // Lèt verten vise ulagra-endringar før modalen vert lukka
    notifyDirty(){
      if(!active()||lastDirty===isDirty)return;
      lastDirty=isDirty;
      post({type:'sxi:state',dirty:isDirty});
      // Den fyrste endringa i økta skal på bygget med ein gong, ikkje etter
      // eit heilt intervall. Berre éin gong: elles ville kvar lagring gjere
      // prosjektet reint, neste endring skulle straks lagrast, og
      // intervallet vart i praksis FIRST_SAVE_MS for resten av økta.
      if(isDirty&&!firstSaveDone&&autosaveTimer&&!firstSaveTimer&&!pending){
        firstSaveDone=true;
        firstSaveTimer=setTimeout(()=>{
          firstSaveTimer=null;
          if(isDirty&&active()&&!pending)saveToHost({auto:true});
        },FIRST_SAVE_MS);
      }
    },
    saveToHost:saveToHost,
    // Namnet på bygget lagringa går til — til byggbrikka i systemvindauget
    byggNamn:()=>bygg?String(bygg.namn||bygg.adresse||''):'',
    // ── Tekniske system (beta) ──
    systems:()=>sysCache,
    requestSystems:requestSystems,
    onSystems(f){if(typeof f==='function')sysListeners.push(f);},
    // ── KI-oppteikning (beta) ── {oppgave,prompt,images,schema,maxTokens,meta}
    askAi:askAi,
    // SXI-fila går også til verten om han har bede om det (wantsSxi)
    sendSxi(xml,filename,meta){
      if(!active()||!wantsSxi)return;
      post({type:'sxi:export-sxi',filename:filename,bytes:xml.length,
        blob:new Blob([xml],{type:'application/xml'}),meta:meta||{}});
    }
  };

  // Handtrykket vert berre kringkasta når verten har bede om det med ?embed=1.
  // Utan det ligg brua heilt stille — ingen meldingar ut, ingen UI-endring —
  // men lyttaren står klar, så ein vert kan òg opne samtalen med sxi:hello.
  if(embedRequested){
    // ?theme= er alt lagt på i <head>; setTema tek over så 'system' følgjer
    // operativsystemet vidare og sxi:theme kan byte seinare.
    const _qt=new URLSearchParams(location.search).get('theme');
    if(_qt)setTema(_qt);
    // Verten kan montere lyttaren sin etter at iframen er lasta — prøv fleire gonger
    [0,250,750,2000,5000].forEach(ms=>setTimeout(announce,ms));
  }
})();

// ── 2c. Tekniske system frå EntroPi (beta) ───────────────────
// Eige vindauge der dei tekniske systema som ligg på bygget i EntroPi kan
// dragast over på sonene i energimerkinga. Koplinga vert lagra på sona som
// z.tekniskeSystem=[{id,namn,kategori}] og følgjer prosjektfila; ho påverkar
// ikkje geometri, areal eller SXI-eksporten.
//
// Lista over system er verten sin (sxi:request-systems → sxi:systems), men
// koplinga er vår. Difor lagrar vi namn og kategori saman med id-en: eit
// system som vert sletta i EntroPi skal framleis vere leseleg i prosjektet.
//
// Knappen er .embed-only, så heile funksjonen finst berre inne i EntroPi.
(function(){
  const overlay=document.getElementById('sysOverlay');
  const btn=document.getElementById('sysBtn');
  if(!overlay||!btn)return;
  const srcEl=document.getElementById('sysSrc');
  const zoneEl=document.getElementById('sysZones');
  const statusEl=document.getElementById('sysStatus');
  // Kategoriikona er berre pynt. Verten kan sende sitt eige teikn i `ikon`.
  const CAT_ICO={ventilasjon:'❋',varme:'▲',kjøling:'❄',kjoling:'❄',gatevarme:'≋',
    belysning:'☀',automasjon:'⚙',energi:'⚡',vatn:'≈',vann:'≈',sanitær:'≈',
    brann:'▲',heis:'⇅',solceller:'☀'};
  // Berre ventilasjon, varme og kjøling påverkar energimerkinga. Verten sender
  // heile lista si (belysning, automasjon, gatevarme …), og vi siler her i
  // staden for å krevje at EntroPi filtrerer — då held protokollen seg enkel,
  // og ein ny kategori på verten dukkar ikkje uventa opp i verktøyet.
  const REL_KAT=['ventilasjon','varme','kjoling'];
  const relevant=s=>{
    const k=String(s.kategori||'').toLowerCase().replace(/ø/g,'o');
    return REL_KAT.some(r=>k.indexOf(r)===0);   // «Varmepumpe» ja, «Gatevarme» nei
  };
  let alle=[];         // alt verten sende — til å sjå om ei kopling framleis finst
  let systems=[];      // dei relevante, dei som kan dragast — tom til han har svart
  let picked=null;     // system valt med klikk (vegen utan drag — touch, tastatur)
  let dragId=null;     // dataTransfer kan ikkje lesast under dragover
  let hentar=false;

  const ope=()=>overlay.classList.contains('show');
  const status=t=>{statusEl.textContent=t||'';};
  const catIco=s=>s.ikon||CAT_ICO[(s.kategori||'').toLowerCase()]||'⚙';
  // Feltet kan komme frå ei gammal fil eller frå ein handredigert JSON — les
  // det defensivt, elles ville éin rar verdi velte heile vindauget.
  const sysOf=z=>Array.isArray(z.tekniskeSystem)?z.tekniskeSystem:[];

  // Kopla soner (groupId) er éi sone for brukaren — same regelen som
  // SXI-eksporten brukar. Vi tek den fyrste instansen som anker og lèt alle
  // endringar gå til heile gruppa via getLinkedZones().
  function logiskeSoner(){
    const out=[],seenGrp=new Set();
    floors.forEach(f=>{
      f.zones.forEach(z=>{
        if(!z.pts||z.pts.length<3)return;
        if(z.groupId){
          if(seenGrp.has(z.groupId))return;
          seenGrp.add(z.groupId);
        }
        const inst=getLinkedZones(z);
        out.push({z:z,inst:inst,
          etasjar:[...new Set(inst.map(etasjeNamn).filter(Boolean))],
          areal:inst.reduce((sum,x)=>sum+(getAreaM2(x)||0),0)});
      });
    });
    return out;
  }
  function etasjeNamn(z){
    const f=floors.find(fl=>fl.zones.indexOf(z)>=0);
    return f?f.name:'';
  }

  // ── Endringar ──
  function leggTil(sys,o){
    if(o.inst.every(z=>sysOf(z).some(x=>x.id===sys.id))){
      status('«'+sys.namn+'» ligg alt på '+(o.z.name||'sona')+'.');
      picked=null;render();return;
    }
    snapshot();                                  // markDirty følgjer med
    o.inst.forEach(z=>{
      if(!Array.isArray(z.tekniskeSystem))z.tekniskeSystem=[];
      if(!z.tekniskeSystem.some(x=>x.id===sys.id))
        z.tekniskeSystem.push(kopi(sys));
    });
    picked=null;
    status('«'+sys.namn+'» lagt på '+(o.z.name||'sona')
      +(o.inst.length>1?' ('+o.inst.length+' kopla soner)':'')+'.');
    render();
  }
  function fjern(id,o){
    snapshot();
    o.inst.forEach(z=>{
      if(Array.isArray(z.tekniskeSystem))
        z.tekniskeSystem=z.tekniskeSystem.filter(x=>x.id!==id);
    });
    status('Fjerna frå '+(o.z.name||'sona')+'.');
    render();
  }

  // ── Vising: systema i EntroPi ──
  function renderSrc(){
    srcEl.innerHTML='';
    if(!systems.length){
      const d=document.createElement('div');
      d.className='sys-empty';
      d.textContent=hentar?'Hentar tekniske systemer frå EntroPi…'
        :'Ingen tekniske systemer henta. Trykk «↻ Hent på nytt».';
      srcEl.appendChild(d);return;
    }
    // Kor mange soner kvart system ligg på — så ein ser kva som er plassert
    const bruk={};
    logiskeSoner().forEach(o=>sysOf(o.z).forEach(x=>{bruk[x.id]=(bruk[x.id]||0)+1;}));
    const kats=[];
    systems.forEach(x=>{if(kats.indexOf(x.kategori)<0)kats.push(x.kategori);});
    kats.forEach(kat=>{
      const h=document.createElement('div');
      h.className='sys-cat';h.textContent=kat;
      srcEl.appendChild(h);
      systems.filter(x=>x.kategori===kat)
        .forEach(x=>srcEl.appendChild(itemEl(x,bruk[x.id]||0)));
    });
    // Sil aldri i stillheit — elles ser det ut som system manglar i EntroPi
    const skjult=alle.length-systems.length;
    if(skjult>0){
      const n=document.createElement('div');
      n.className='sys-empty';
      n.style.marginTop='12px';
      n.textContent=skjult+(skjult===1?' system i ein annan kategori er ikkje vist'
        :' system i andre kategoriar er ikkje viste')
        +' — berre ventilasjon, varme og kjøling påverkar energimerkinga.';
      srcEl.appendChild(n);
    }
  }
  function itemEl(sys,n){
    const el=document.createElement('div');
    el.className='sys-item'+(picked&&picked.id===sys.id?' picked':'');
    el.draggable=true;
    el.title=sys.namn+(sys.undertittel?' — '+sys.undertittel:'')+' · '+sys.kategori;
    const ico=document.createElement('span');
    ico.className='sys-ico';ico.textContent=catIco(sys);
    const txt=document.createElement('span');
    txt.className='sys-txt';
    const nm=document.createElement('span');
    nm.className='sys-nm';nm.textContent=sys.namn;
    const meta=document.createElement('span');
    meta.className='sys-meta';meta.textContent=sysMeta(sys);
    txt.appendChild(nm);txt.appendChild(meta);
    el.appendChild(ico);el.appendChild(txt);
    if(n){
      const b=document.createElement('span');
      b.className='sys-count';b.textContent=n+(n===1?' sone':' soner');
      el.appendChild(b);
    }
    el.addEventListener('dragstart',e=>{
      dragId=sys.id;el.classList.add('dragging');
      try{e.dataTransfer.setData('text/plain',sys.id);e.dataTransfer.effectAllowed='copy';}catch(_){}
    });
    el.addEventListener('dragend',()=>{dragId=null;el.classList.remove('dragging');});
    el.onclick=()=>{
      picked=(picked&&picked.id===sys.id)?null:sys;
      status(picked?'Klikk på ei sone for å leggje «'+sys.namn+'» der.':'');
      render();
    };
    return el;
  }

  // ── Vising: sonene ──
  function renderZones(){
    zoneEl.innerHTML='';
    const list=logiskeSoner();
    if(!list.length){
      const d=document.createElement('div');
      d.className='sys-empty';
      d.textContent='Ingen soner enno — teikn soner på planteikninga først.';
      zoneEl.appendChild(d);return;
    }
    list.forEach(o=>zoneEl.appendChild(zoneCard(o)));
  }
  function zoneCard(o){
    const card=document.createElement('div');
    card.className='sys-zone';

    const hd=document.createElement('div');
    hd.className='sys-zone-hd';
    const nm=document.createElement('span');
    nm.textContent='⬡ '+(o.z.name||'Sone');
    hd.appendChild(nm);
    if(o.inst.length>1){
      const lb=document.createElement('span');
      lb.className='sys-linked';
      lb.textContent='KOPLA · '+o.inst.length+' SONER';
      lb.title='Kopla soner er éi sone i SIMIEN — systema vert lagde på alle.';
      hd.appendChild(lb);
    }
    card.appendChild(hd);

    const sub=document.createElement('div');
    sub.className='sys-zone-sub';
    sub.textContent=(o.etasjar.length?o.etasjar.join(' + ')+' · ':'')
      +(o.areal?fmtM2(o.areal):'areal ikkje kalibrert');
    card.appendChild(sub);

    const chips=document.createElement('div');
    chips.className='sys-chips';
    const lst=sysOf(o.z);
    if(!lst.length){
      const e=document.createElement('span');
      e.className='sys-empty';
      e.textContent=picked?'Klikk her for «'+picked.namn+'»':'Slepp eit system her';
      chips.appendChild(e);
    }
    lst.forEach(x=>chips.appendChild(chipEl(x,o)));
    card.appendChild(chips);

    card.addEventListener('dragover',e=>{
      if(!dragId)return;
      e.preventDefault();
      try{e.dataTransfer.dropEffect='copy';}catch(_){}
      card.classList.add('over');
    });
    card.addEventListener('dragleave',()=>card.classList.remove('over'));
    card.addEventListener('drop',e=>{
      e.preventDefault();card.classList.remove('over');
      let id=dragId;
      if(!id){try{id=e.dataTransfer.getData('text/plain');}catch(_){}}
      const sys=systems.find(x=>x.id===id);
      if(sys)leggTil(sys,o);
    });
    card.onclick=()=>{if(picked)leggTil(picked,o);};
    return card;
  }
  function chipEl(x,o){
    const finst=alle.some(s=>s.id===x.id);
    const chip=document.createElement('span');
    // Systema kan vere sletta i EntroPi etter at koplinga vart gjord — då står
    // ho att med stipla kant i staden for å forsvinne stille frå prosjektet.
    chip.className='sys-chip'+(alle.length&&!finst?' gone':'');
    chip.title=finst?((x.kategori||'')+(sysMeta(x)?' · '+sysMeta(x):''))
                    :'Dette systemet finst ikkje i EntroPi lenger';
    const t=document.createElement('span');
    t.textContent=x.namn||x.id;
    const b=document.createElement('button');
    b.type='button';b.textContent='×';b.title='Fjern frå sona';
    b.onclick=e=>{e.stopPropagation();fjern(x.id,o);};
    chip.appendChild(t);chip.appendChild(b);
    return chip;
  }

  function render(){renderSrc();renderZones();}

  // Det som vert lagra på sona. Tala er med fordi SXI-eksporten må kunne
  // køyre utan EntroPi — frå ei .entro-fil, i ei anna økt, på ein annan maskin.
  const kopi=s=>{
    const l=s.luft;
    return {id:s.id,namn:s.namn,kategori:s.kategori,
      luft:l?{til:l.til||null,fra:l.fra||null,per:!!l.per,redTil:l.redTil||null,redFra:l.redFra||null}:null,
      gjenvinning:s.gjenvinning!=null?s.gjenvinning:null,
      sfp:s.sfp!=null?s.sfp:null};
  };

  // Tala kan ha endra seg i EntroPi sidan koplinga vart gjord. Vi oppdaterer
  // dei lagra kopiane, men lagar ikkje eit angre-steg av det — brukaren gjorde
  // ingenting. Endringa vert markert som ulagra, så ho kjem med til bygget.
  function oppdaterLagra(){
    if(!alle.length)return 0;
    let n=0;
    floors.forEach(f=>f.zones.forEach(z=>{
      const l=Array.isArray(z.tekniskeSystem)?z.tekniskeSystem:[];
      l.forEach((s,i)=>{
        const fersk=alle.find(x=>x.id===s.id);
        if(!fersk)return;
        const ny=kopi(fersk);
        if(JSON.stringify(ny)!==JSON.stringify(s)){l[i]=ny;n++;}
      });
    }));
    if(n)markDirty();
    return n;
  }

  // Tala slik dei står i vindauget. Tom streng = ingenting å vise.
  const nf=v=>String(Math.round(v*100)/100).replace('.',',');
  function sysMeta(s){
    const d=[];
    if(s.luft){
      const e=s.luft.per?' m³/(h·m²)':' m³/h';
      const t=s.luft.til,f=s.luft.fra;
      if(t!=null&&f!=null&&t!==f)d.push(nf(t)+'/'+nf(f)+e);
      else if(t!=null||f!=null)d.push(nf(t!=null?t:f)+e);
      const r=s.luft.redTil!=null?s.luft.redTil:s.luft.redFra;
      if(r!=null)d.push('redusert '+nf(r));
    }
    if(s.gjenvinning!=null)d.push(Math.round(s.gjenvinning*100)+' % gjenvinning');
    if(s.sfp!=null)d.push('SFP '+nf(s.sfp));
    if(d.length)return d.join(' · ');
    // Ver tydeleg på kva som skjer i SXI-en når tala manglar
    return erVent(s)?'ingen tal frå EntroPi — normverdiar i SXI':'ikkje i SXI enno';
  }
  const erVent=s=>String(s.kategori||'').toLowerCase().replace(/ø/g,'o').indexOf('ventilasjon')===0;

  // Éin stad som held dei to listene i takt
  function setSystems(list){
    alle=Array.isArray(list)?list:[];
    systems=alle.filter(relevant);
  }

  // ── Henting frå verten ──
  async function hent(){
    const H=window.EntroHost;
    if(!H||!H.active()){status('Ikkje kopla til EntroPi.');return;}
    hentar=true;status('Hentar tekniske systemer…');renderSrc();
    const r=await H.requestSystems();
    hentar=false;
    if(r&&Array.isArray(r.systems))setSystems(r.systems);
    const oppd=oppdaterLagra();
    if(r&&r.ok){
      const bn=H.byggNamn?H.byggNamn():'';
      const skjult=alle.length-systems.length;
      status(systems.length
        ?('Fann '+systems.length+' system'+(bn?' på '+bn:'')
          +(skjult>0?' ('+skjult+' i andre kategoriar)':'')+'.'
          +(oppd?' Oppdaterte tal for '+oppd+(oppd===1?' kopling.':' koplingar.'):''))
        :(alle.length?'Ingen system i ventilasjon, varme eller kjøling på bygget.'
                     :'Bygget har ingen tekniske systemer i EntroPi.'));
    }else status((r&&r.message)||'Kunne ikkje hente tekniske systemer.');
    render();
  }

  function opne(){
    // floors[activeFloor].zones må vere same array som `zones`, elles ser
    // vindauget ein gammal kopi av den aktive etasjen.
    saveFloorState();
    const H=window.EntroHost;
    const cache=H&&H.systems?H.systems():null;
    if(Array.isArray(cache))setSystems(cache);
    const bn=H&&H.byggNamn?H.byggNamn():'';
    const chip=document.getElementById('sysBygg');
    if(chip){chip.style.display=bn?'inline-flex':'none';chip.textContent='⌂ '+bn;}
    picked=null;status('');
    overlay.classList.add('show');
    render();
    hent();
  }
  function lukk(){overlay.classList.remove('show');picked=null;dragId=null;}

  btn.onclick=opne;
  document.getElementById('sysClose').onclick=lukk;
  document.getElementById('sysReload').onclick=hent;
  overlay.addEventListener('click',e=>{if(e.target===overlay)lukk();});
  // Esc må stoppast før modus-handteraren under, elles byter han verktøy òg
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&ope()){e.stopPropagation();lukk();}
  },true);

  // Verten kan sende lista uoppmoda — då oppdaterer vi eit ope vindauge
  if(window.EntroHost&&window.EntroHost.onSystems)window.EntroHost.onSystems(list=>{
    if(Array.isArray(list))setSystems(list);
    if(ope())render();
  });
  // Angre byter ut soneobjekta, så eit ope vindauge peikar på gamle soner
  const _origApplyHist=applyHistoryState;
  window.applyHistoryState=applyHistoryState=function(p){
    _origApplyHist(p);
    if(ope())render();
  };
})();

// ── 2d. 3D-skann (MatterPak) → soner ─────────────────────────
// Ein MatterPak frå Matterport har ein OBJ-mesh i meter med Z opp. Vi les
// berre geometrien (v/f-linjene) — teksturane, punktskya og fargeplanane står
// att. Ut kjem eitt ark per etasje med ei teikning rendra frå meshen, rett
// kalibrert, og soner langs golvflata. Brukaren skal ikkje måtte teikne noko;
// alt som vert laga er vanlege etasjar og soner, så resten av programmet
// (redigering, 3D, SXI) ser ingen skilnad.
//
// Metoden, i kort form:
//  - Etasjane er toppar i arealet av flater som vender OPP (golv), med minst
//    2,2 m imellom. Bord og stolsete gir òg toppar, men ligg for nær golvet.
//  - Fotavtrykket er golvflatene i eit rutenett på 5 cm, lukka (0,3 m) så
//    møblar og skuggar fell bort, og med hòl fylte. Det som vart fylt utan å
//    vere skanna vert meldt — det kan vere vegger, sjakter eller rom ingen
//    gjekk inn i.
//  - Himlingshøgda er den lågaste flata som vender NED over kvar rute.
//  - Bakgrunnen er ei høgdeskuggelagd ovanfrå-rendring, skoren ved 1,5 m, så
//    veggane står som mørke strekar (imgLineSnap finn dei).
const MP_RUTE=0.05;          // m per rute i fotavtrykket
const MP_PX=0.025;           // m per bildepiksel i bakgrunnen (2 px per rute)
const MP_MARG=1.0;           // m luft rundt bygget
const MP_MIN_SONE=4;         // m² — mindre bitar er støy (spill gjennom vindauge)
const MP_GLATT_M2=0.4;       // m² — hjørne som flyttar mindre areal enn dette fell bort

// Teksturkoordinatane (vt) og materialet per flate vert lesne med, sidan
// vindauga berre let seg finne i teksturane (sjå mpFinnVindauge).
function mpLesObj(txt){
  const V=[],F=[],T=[],FT=[],FM=[],mat=[];
  let cur=-1;
  const n=txt.length;let i=0;
  while(i<n){
    let e=txt.indexOf('\n',i);if(e<0)e=n;
    const c0=txt.charCodeAt(i),c1=txt.charCodeAt(i+1);
    if(c0===118&&(c1===32||c1===9)){          // 'v '
      const p=txt.substring(i+2,e).trim().split(/\s+/);
      V.push(+p[0],+p[1],+p[2]);
    }else if(c0===118&&c1===116){              // 'vt'
      const p=txt.substring(i+3,e).trim().split(/\s+/);
      T.push(+p[0],+p[1]);
    }else if(c0===102&&(c1===32||c1===9)){    // 'f '
      const p=txt.substring(i+2,e).trim().split(/\s+/);
      const nv=V.length/3,nt=T.length/2;
      const idx=[],tdx=[];
      for(const t of p){
        const s=t.split('/');
        const k=parseInt(s[0],10);idx.push(k<0?nv+k:k-1);
        const q=s.length>1&&s[1]!==''?parseInt(s[1],10):0;tdx.push(q<0?nt+q:q-1);
      }
      for(let k=1;k+1<idx.length;k++){
        F.push(idx[0],idx[k],idx[k+1]);FT.push(tdx[0],tdx[k],tdx[k+1]);FM.push(cur);
      }
    }else if(txt.startsWith('usemtl',i)){
      const nm=txt.substring(i+6,e).trim();
      cur=mat.indexOf(nm);if(cur<0){mat.push(nm);cur=mat.length-1;}
    }
    i=e+1;
  }
  return {V:new Float32Array(V),F:new Uint32Array(F),T:new Float32Array(T),FT:new Int32Array(FT),FM:new Int16Array(FM),mat};
}
// Skannet som sist vart importert. Lever berre i økta (mesh + teksturar er
// fleire hundre MB og vert ikkje lagra i prosjektet); lastProsjekt() nullar
// det, så eit anna prosjekt aldri får eit framandt skann i 3D.
let mpSkann=null;
async function mpByggSkann3D(framdrift){
  const S=mpSkann;if(!S||S.gruppe)return;
  const {V,F,T,FT,FM,mat}=S;
  const nTri=F.length/3,tal=new Int32Array(mat.length+1);
  for(let t=0;t<nTri;t++)tal[FM[t]+1]++;
  const pos=[],uv=[],fyll=new Int32Array(mat.length+1);
  for(let m=0;m<=mat.length;m++){pos.push(new Float32Array(tal[m]*9));uv.push(new Float32Array(tal[m]*6));}
  for(let t=0;t<nTri;t++){
    const m=FM[t]+1,i=fyll[m]++,P=pos[m],U=uv[m];
    for(let j=0;j<3;j++){
      const a=F[3*t+j]*3,q=FT[3*t+j];
      P[i*9+j*3]=V[a]-S.ox;P[i*9+j*3+1]=V[a+2];P[i*9+j*3+2]=S.oy-V[a+1];
      if(q>=0){U[i*6+j*2]=T[2*q];U[i*6+j*2+1]=T[2*q+1];}
    }
  }
  const g=new THREE.Group();g.userData._skann=true;
  const TS=512;
  // Matterport vender flatene inn i romma. Med speglinga (z = oy−Y) er det
  // FrontSide som viser dei (verifisert: BackSide viste taket ovanfrå) — eit
  // tak sett ovanfrå fell då bort, og ein ser ned i romma som eit dukkehus.
  const SIDE=THREE.FrontSide;
  for(let m=0;m<=mat.length;m++){
    if(!tal[m])continue;
    if(m%20===1){framdrift('📷 Lastar bilete '+Math.round(100*m/(mat.length+1))+' %');await new Promise(r=>setTimeout(r,0));}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos[m],3));
    geo.setAttribute('uv',new THREE.BufferAttribute(uv[m],2));
    let mtl;
    const fil=m>0?S.teksturar.get((S.mtlMap[mat[m-1]]||mat[m-1]).toLowerCase()):null;
    if(fil){
      try{
        // Teksturane til 512 px: 361 stk i full storleik ville vore ~6 GB
        // på grafikkortet. ImageBitmap vert ikkje snudd av WebGL, så det
        // gjer vi ved dekodinga.
        const bm=await createImageBitmap(fil,{resizeWidth:TS,resizeHeight:TS,imageOrientation:'flipY'});
        const tx=new THREE.Texture(bm);tx.flipY=false;tx.needsUpdate=true;
        mtl=new THREE.MeshBasicMaterial({map:tx,side:SIDE});
      }catch(e){}
    }
    if(!mtl)mtl=new THREE.MeshBasicMaterial({color:0xb8b8b8,side:SIDE});
    g.add(new THREE.Mesh(geo,mtl));
  }
  if(mpSkann===S)S.gruppe=g;
}
function mpFjernSkann(){
  if(mpSkann&&mpSkann.gruppe){
    mpSkann.gruppe.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map)o.material.map.dispose();o.material.dispose();}});
    if(mpSkann.gruppe.parent)mpSkann.gruppe.parent.remove(mpSkann.gruppe);
  }
  mpSkann=null;
}
function mpLesMtl(txt){              // materialnamn → filnamnet til map_Kd
  const ut={};let cur=null;
  for(const l of txt.split(/\r?\n/)){
    const s=l.trim();
    if(s.startsWith('newmtl '))cur=s.slice(7).trim();
    else if(cur&&s.startsWith('map_Kd '))ut[cur]=s.slice(7).trim().split(/[\\/]/).pop();
  }
  return ut;
}
function mpTriStats(V,F){
  const m=F.length/3;
  const area=new Float32Array(m),nz=new Float32Array(m),zc=new Float32Array(m),zmin=new Float32Array(m),zmax=new Float32Array(m);
  for(let t=0;t<m;t++){
    const a=F[3*t]*3,b=F[3*t+1]*3,c=F[3*t+2]*3;
    const ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2];
    const vx=V[c]-V[a],vy=V[c+1]-V[a+1],vz=V[c+2]-V[a+2];
    const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
    const l=Math.hypot(cx,cy,cz);area[t]=l/2;nz[t]=l>0?cz/l:0;
    const z1=V[a+2],z2=V[b+2],z3=V[c+2];
    zc[t]=(z1+z2+z3)/3;zmin[t]=Math.min(z1,z2,z3);zmax[t]=Math.max(z1,z2,z3);
  }
  return {m,area,nz,zc,zmin,zmax};
}
// Golvnivå: toppar i arealet av flater som vender opp, 5 cm-klassar glatta
// over ±5 cm. Ein topp må ha minst 20 m² og 4 % av den største, og liggje
// minst 2,2 m frå ein som alt er teken.
function mpFinnEtasjar(S){
  const B=0.05;let lo=Infinity,hi=-Infinity;
  for(let t=0;t<S.m;t++){if(S.zc[t]<lo)lo=S.zc[t];if(S.zc[t]>hi)hi=S.zc[t];}
  const nb=Math.ceil((hi-lo)/B)+2,h=new Float64Array(nb);
  for(let t=0;t<S.m;t++)if(S.nz[t]>0.95)h[Math.floor((S.zc[t]-lo)/B)]+=S.area[t];
  const s=new Float64Array(nb);
  for(let i=0;i<nb;i++)s[i]=h[i]+(h[i-1]||0)+(h[i+1]||0);
  const topp=[];
  for(let i=0;i<nb;i++)if(s[i]>0&&s[i]>=(s[i-1]||0)&&s[i]>(s[i+1]||0))topp.push({z:lo+(i+0.5)*B,a:s[i]});
  if(!topp.length)return [];
  topp.sort((p,q)=>q.a-p.a);
  const grense=Math.max(20,0.04*topp[0].a),valt=[];
  for(const p of topp){if(p.a<grense)break;if(valt.every(q=>Math.abs(q.z-p.z)>2.2))valt.push(p);}
  return valt.sort((p,q)=>p.z-q.z).map(p=>p.z);
}
function mpTri(ax,ay,bx,by,cx,cy,W,H,cb){
  const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(W-1,Math.ceil(Math.max(ax,bx,cx)));
  const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(H-1,Math.ceil(Math.max(ay,by,cy)));
  const d=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);if(Math.abs(d)<1e-9)return;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const px=x+0.5,py=y+0.5;
    const w1=((px-ax)*(cy-ay)-(cx-ax)*(py-ay))/d,w2=((bx-ax)*(py-ay)-(px-ax)*(by-ay))/d,w0=1-w1-w2;
    if(w0>=-1e-6&&w1>=-1e-6&&w2>=-1e-6)cb(x,y,w0,w1,w2);
  }
}
// Kvadratisk utviding/erosjon med radius r ruter (to separable pass)
function mpDilate(g,W,H,r){
  const t=new Uint8Array(W*H),o=new Uint8Array(W*H);
  for(let y=0;y<H;y++){const b=y*W;let s=-1e9;
    for(let x=0;x<W;x++){if(g[b+x])s=x;if(x-s<=r)t[b+x]=1;}
    s=1e9;for(let x=W-1;x>=0;x--){if(g[b+x])s=x;if(s-x<=r)t[b+x]=1;}}
  for(let x=0;x<W;x++){let s=-1e9;
    for(let y=0;y<H;y++){if(t[y*W+x])s=y;if(y-s<=r)o[y*W+x]=1;}
    s=1e9;for(let y=H-1;y>=0;y--){if(t[y*W+x])s=y;if(s-y<=r)o[y*W+x]=1;}}
  return o;
}
function mpErode(g,W,H,r){
  const inv=new Uint8Array(W*H);for(let i=0;i<W*H;i++)inv[i]=g[i]?0:1;
  const d=mpDilate(inv,W,H,r);for(let i=0;i<W*H;i++)d[i]=d[i]?0:1;return d;
}
function mpFyllHol(g,W,H){
  const ut=new Uint8Array(W*H).fill(1),st=[];
  const push=k=>{if(!g[k]&&ut[k]){ut[k]=0;st.push(k);}};
  for(let x=0;x<W;x++){push(x);push((H-1)*W+x);}
  for(let y=0;y<H;y++){push(y*W);push(y*W+W-1);}
  while(st.length){const k=st.pop(),x=k%W;
    if(x>0)push(k-1);if(x<W-1)push(k+1);if(k>=W)push(k-W);if(k<W*(H-1))push(k+W);}
  return ut;
}
function mpMerk(g,W,H){            // 4-samanhengande komponentar
  const L=new Int32Array(W*H),storl=[0],st=[];let n=0;
  for(let i=0;i<W*H;i++)if(g[i]&&!L[i]){
    n++;let s=0;L[i]=n;st.push(i);
    while(st.length){const k=st.pop(),x=k%W;s++;
      const nb=[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W];
      for(const j of nb)if(j>=0&&j<W*H&&g[j]&&!L[j]){L[j]=n;st.push(j);}}
    storl.push(s);
  }
  return {L,n,storl};
}
// Ytterkanten av éin fylt komponent, langs rutehjørna, med klokka på skjermen
function mpKontur(m,W,H){
  const inn=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&m[y*W+x]===1;
  let sx=-1,sy=-1;for(let k=0;k<W*H;k++)if(m[k]){sx=k%W;sy=(k-sx)/W;break;}
  if(sx<0)return [];
  const DX=[1,0,-1,0],DY=[0,1,0,-1];
  // ruta til høgre og venstre for kanten framfor oss, per retning
  const hoR=(x,y,d)=>[[x,y],[x-1,y],[x-1,y-1],[x,y-1]][d];
  const veR=(x,y,d)=>[[x,y-1],[x,y],[x-1,y],[x-1,y-1]][d];
  let x=sx,y=sy,d=0,vakt=0;const pts=[];
  do{
    for(let k=0;k<4;k++){
      const v=veR(x,y,d),h=hoR(x,y,d);
      if(inn(v[0],v[1]))d=(d+3)%4;          // venstre er inne: sving venstre
      else if(!inn(h[0],h[1]))d=(d+1)%4;    // ingenting framfor: sving høgre
      else break;
    }
    pts.push([x,y]);x+=DX[d];y+=DY[d];
  }while((x!==sx||y!==sy)&&++vakt<1e7);
  return pts;
}
function mpForenkle(pts,tol){       // Douglas–Peucker på ein lukka ring
  if(pts.length<4)return pts;
  let far=0,fd=-1;
  for(let i=1;i<pts.length;i++){const d=(pts[i][0]-pts[0][0])**2+(pts[i][1]-pts[0][1])**2;if(d>fd){fd=d;far=i;}}
  const N=pts.length,ut=[];
  const rek=(a,b)=>{
    const A=pts[a],B=pts[b%N],lx=B[0]-A[0],ly=B[1]-A[1],ll=Math.hypot(lx,ly)||1e-9;
    let mi=-1,md=tol;
    for(let i=a+1;i<b;i++){const P=pts[i];const dd=Math.abs((P[0]-A[0])*ly-(P[1]-A[1])*lx)/ll;if(dd>md){md=dd;mi=i;}}
    if(mi<0){ut.push(A);return;}
    rek(a,mi);rek(mi,b);
  };
  rek(0,far);rek(far,N);
  return ut;
}
// Visvalingam: fjern hjørnet med minst trekantareal så lenge det er under
// `minA` (ruter²). Douglas–Peucker åleine let små hakk stå (vindaugsnisjar,
// listverk) — kvart av dei vert ein eigen fasade i SIMIEN.
function mpGlatt(pts,minA){
  const p=pts.slice();
  const tri=i=>{const a=p[(i-1+p.length)%p.length],b=p[i],c=p[(i+1)%p.length];
    return Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2;};
  while(p.length>4){
    let mi=-1,ma=minA;
    for(let i=0;i<p.length;i++){const a=tri(i);if(a<ma){ma=a;mi=i;}}
    if(mi<0)break;
    p.splice(mi,1);
  }
  return p;
}

// Hovudanalysen. Returnerer etasjar med bakgrunnsbilete (canvas) og soner i
// bildepikslar, og det vi skal melde til brukaren.
function mpAnalyser(V,F){
  const S=mpTriStats(V,F);
  const niva=mpFinnEtasjar(S);
  if(!niva.length)throw new Error('Fann ingen golvflater i modellen.');
  let mnx=Infinity,mny=Infinity,mxx=-Infinity,mxy=-Infinity;
  for(let i=0;i<V.length;i+=3){
    if(V[i]<mnx)mnx=V[i];if(V[i]>mxx)mxx=V[i];if(V[i+1]<mny)mny=V[i+1];if(V[i+1]>mxy)mxy=V[i+1];
  }
  const ox=mnx-MP_MARG,oy=mxy+MP_MARG;                  // verda → øvre venstre hjørne
  const W=Math.ceil((mxx-mnx+2*MP_MARG)/MP_RUTE),H=Math.ceil((mxy-mny+2*MP_MARG)/MP_RUTE);
  const K=Math.round(MP_RUTE/MP_PX);                     // bildepikslar per rute
  const GX=x=>(x-ox)/MP_RUTE,GY=y=>(oy-y)/MP_RUTE;
  const N=W*H;
  const rutTri=(t,cb)=>{const a=F[3*t]*3,b=F[3*t+1]*3,c=F[3*t+2]*3;
    mpTri(GX(V[a]),GY(V[a+1]),GX(V[b]),GY(V[b+1]),GX(V[c]),GY(V[c+1]),W,H,cb);};

  const etasjar=niva.map((fz,ei)=>{
    const neste=niva[ei+1];
    // 1. Golvflater i bandet rundt golvnivået (podium og låge trinn kjem med)
    const g=new Uint8Array(N);
    for(let t=0;t<S.m;t++){
      if(S.nz[t]<0.9||S.zc[t]<fz-0.2||S.zc[t]>fz+0.6)continue;
      rutTri(t,(x,y)=>{g[y*W+x]=1;});
    }
    const lukka=mpErode(mpDilate(g,W,H,6),W,H,6);
    let fot=mpFyllHol(lukka,W,H);
    fot=mpDilate(mpErode(fot,W,H,4),W,H,4);             // tynne utstikkarar (spill) vekk
    // 2. Himling: lågaste nedovervendte flate over 1,8 m
    const him=new Float32Array(N).fill(Infinity);
    for(let t=0;t<S.m;t++){
      if(S.nz[t]>-0.9||S.zc[t]<fz+1.8||S.zc[t]>fz+12)continue;
      const z=S.zc[t];
      rutTri(t,(x,y)=>{const k=y*W+x;if(z<him[k])him[k]=z;});
    }
    // 3. Soner: kvar samanhengande golvflate
    const lab=mpMerk(fot,W,H);
    const soner=[];
    for(let k=1;k<=lab.n;k++){
      const aM2=lab.storl[k]*MP_RUTE*MP_RUTE;
      if(aM2<MP_MIN_SONE)continue;
      const m=new Uint8Array(N);for(let i=0;i<N;i++)if(lab.L[i]===k)m[i]=1;
      const ring=mpGlatt(mpForenkle(mpKontur(m,W,H),0.15/MP_RUTE),MP_GLATT_M2/(MP_RUTE*MP_RUTE));
      if(ring.length<3)continue;
      // himling over flata (snitt — volumet) og langs kanten (fasadehøgda)
      const kjerne=mpErode(m,W,H,6);
      let sA=0,nA=0,sK=0,nK=0,fylt=0;
      for(let i=0;i<N;i++){
        if(!m[i])continue;
        if(!lukka[i])fylt++;
        const h=him[i];if(!isFinite(h))continue;
        sA+=h-fz;nA++;if(!kjerne[i]){sK+=h-fz;nK++;}
      }
      soner.push({
        pts:ring.map(p=>({x:p[0]*K,y:p[1]*K})),
        // arealet av polygonet som faktisk vert sona, ikkje av rutene
        maske:m,aM2:Math.abs(ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2*MP_RUTE*MP_RUTE,
        himling:nA>lab.storl[k]*0.3?sA/nA:null,
        kantHoyde:nK>0?sK/nK:null,
        fyltM2:fylt*MP_RUTE*MP_RUTE
      });
    }
    return {z:fz,neste,soner,fot};
  });

  // Golv mot oppvarma sone når sona ligg over fotavtrykket til etasjen under,
  // og omvendt: kor mykje av taket som har ei etasje rett over seg.
  etasjar.forEach((e,ei)=>{
    const under=etasjar[ei-1],over=etasjar[ei+1];
    e.soner.forEach(s=>{
      let n=0,u=0,o=0;
      for(let i=0;i<N;i++)if(s.maske[i]){n++;if(under&&under.fot[i])u++;if(over&&over.fot[i])o++;}
      s.overUnder=n?u/n:0;
      s.underOverM2=o*MP_RUTE*MP_RUTE;
    });
  });

  // 4. Bakgrunn: ovanfrå, høgaste flate under kuttet, skuggelagd etter høgd
  const IW=W*K,IH=H*K;
  const PX=x=>(x-ox)/MP_PX,PY=y=>(oy-y)/MP_PX;
  etasjar.forEach(e=>{
    const fz=e.z,kutt=Math.min(fz+1.5,(e.neste??Infinity)-0.2);
    const zb=new Float32Array(IW*IH).fill(-Infinity);
    const sett=(x,y,z)=>{if(x<0||y<0||x>=IW||y>=IH)return;const k=y*IW+x;if(z>zb[k])zb[k]=z;};
    const strek=(x1,y1,x2,y2,z)=>{const n=Math.ceil(Math.hypot(x2-x1,y2-y1))+1;
      for(let i=0;i<=n;i++){const s=i/n;sett(Math.floor(x1+(x2-x1)*s),Math.floor(y1+(y2-y1)*s),z);}};
    for(let t=0;t<S.m;t++){
      if(S.zmax[t]<fz-0.3||S.zmin[t]>kutt)continue;
      const a=F[3*t]*3,b=F[3*t+1]*3,c=F[3*t+2]*3;
      const ax=PX(V[a]),ay=PY(V[a+1]),bx=PX(V[b]),by=PY(V[b+1]),cx=PX(V[c]),cy=PY(V[c+1]);
      if(Math.abs(S.nz[t])<0.5){
        // (nesten) loddrett: projeksjonen er ein strek — teikn kantane
        const z=Math.min(S.zmax[t],kutt);
        strek(ax,ay,bx,by,z);strek(bx,by,cx,cy,z);strek(cx,cy,ax,ay,z);
      }else{
        const za=V[a+2],zb2=V[b+2],zc=V[c+2];
        mpTri(ax,ay,bx,by,cx,cy,IW,IH,(x,y,w0,w1,w2)=>{
          const z=w0*za+w1*zb2+w2*zc;if(z<=kutt)sett(x,y,z);
        });
      }
    }
    const cv=document.createElement('canvas');cv.width=IW;cv.height=IH;
    const ctx=cv.getContext('2d'),id=ctx.createImageData(IW,IH),d=id.data;
    const spenn=Math.max(0.2,kutt-fz-0.08);
    for(let k=0;k<IW*IH;k++){
      const z=zb[k];let r,gg,bb;
      if(z===-Infinity){r=gg=bb=255;}
      else if(z>=kutt-0.02){r=gg=bb=30;}               // vegg gjennom kuttet
      else if(z-fz<0.08){r=238;gg=233;bb=222;}         // golv, litt varmt
      else{const v=Math.round(205-Math.min(1,(z-fz-0.08)/spenn)*130);r=gg=bb=v;}
      d[4*k]=r;d[4*k+1]=gg;d[4*k+2]=bb;d[4*k+3]=255;
    }
    ctx.putImageData(id,0,0);
    e.canvas=cv;
  });
  etasjar.forEach(e=>{e.soner.forEach(s=>{delete s.maske;});delete e.fot;});
  return {etasjar,mmPerPx:MP_PX*1000,trekant:S.m,ox,oy};
}

// ── Vindauge frå teksturane ──
// Geometrien åleine seier ingenting: Matterport lukkar vindaugsopningane med
// flate trekantar som ser ut som vegg, og ein slett vegg er like grov-
// triangulert. Teksturen skil dei derimot klart: glas viser persienner,
// karmar og utsikt (høg lokal variasjon), ein måla vegg er jamn. Difor:
//  1. For kvart veggsegment i kvar sone vert eit oppriss bygt i 4 cm-ruter
//     frå dei loddrette flatene innanfor 0,6 m av segmentet, parallelle med det.
//  2. Teksturane vert dekoda ÉIN gong kvar (1024 px), berre dei som trengst.
//  3. Ei rute er glas når standardavviket i lysstyrke over 28×28 cm er > 28.
//     Hòl i meshen tel verken for eller mot (opningar til uskanna rom og
//     glas som ikkje vart skanna ser like ut).
//  4. Kolonnar der meir enn 45 % av bandet 0,9–2,0 m er glas vert eit
//     vindaugsfelt; felt med under 0,4 m imellom vert slegne saman (karmar).
// Terskelen er stilt mot prøvefila: alle glasfelta treffer, ingen slette
// veggar gir utslag. Tette dører og vindauge utan tekstur vert IKKJE funne —
// det seier rapporten frå om.
const MP_EL=0.04;            // m per rute i opprisset
const MP_GLAS_SD=28;         // lysstyrke-standardavvik som tel som glas
const MP_GLAS_SNITT=138;     // snittlysstyrke i treffbandet (teksturane skalerte til 1024 px)
const MP_GLAS_LYST=0.01;     // del av rutene som er utbrente (> 215)
const MP_PERSIENNE=1.8;      // loddrett/vassrett variasjon som tyder persienner
async function mpFinnVindauge(M,R,teksturar,mtlMap,soner,framdrift){
  const {V,F,T,FT,FM,mat}=M;
  const S=mpTriStats(V,F);
  // Loddrette flater med horisontal normal, ein gong
  const vert=[];const nxA=new Float32Array(S.m),nyA=new Float32Array(S.m);
  for(let t=0;t<S.m;t++){
    if(Math.abs(S.nz[t])>0.3||FM[t]<0)continue;
    const a=F[3*t]*3,b=F[3*t+1]*3,c=F[3*t+2]*3;
    const ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],vx=V[c]-V[a],vy=V[c+1]-V[a+1],vz=V[c+2]-V[a+2];
    const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,l=Math.hypot(cx,cy)||1;
    nxA[t]=cx/l;nyA[t]=cy/l;vert.push(t);
  }
  // 1. Oppriss per segment
  const opp=[];
  for(const so of soner){
    const P=so.z.pts.map(p=>[R.ox+p.x*MP_PX,R.oy-p.y*MP_PX]);
    const zLo=so.fz,zHi=so.fz+so.hM;
    const kand=vert.filter(t=>S.zmax[t]>zLo&&S.zmin[t]<zHi);
    for(let i=0;i<P.length;i++){
      const A=P[i],B=P[(i+1)%P.length],L=Math.hypot(B[0]-A[0],B[1]-A[1]);
      if(L<1.0)continue;
      const ex=(B[0]-A[0])/L,ey=(B[1]-A[1])/L;
      const NU=Math.ceil(L/MP_EL),NH=Math.ceil(so.hM/MP_EL);
      const mt=new Int16Array(NU*NH).fill(-1),tu=new Float32Array(NU*NH),tv=new Float32Array(NU*NH),best=new Float32Array(NU*NH).fill(Infinity);
      for(const t of kand){
        if(Math.abs(nxA[t]*-ey+nyA[t]*ex)<0.7)continue;            // ikkje parallell
        const a=F[3*t]*3,b=F[3*t+1]*3,c=F[3*t+2]*3;
        const mx=(V[a]+V[b]+V[c])/3-A[0],my=(V[a+1]+V[b+1]+V[c+1])/3-A[1];
        const du=mx*ex+my*ey,dn=Math.abs(-mx*ey+my*ex);
        if(dn>0.6||du<-0.3||du>L+0.3)continue;
        const q=k=>[((V[k]-A[0])*ex+(V[k+1]-A[1])*ey)/MP_EL,(V[k+2]-zLo)/MP_EL];
        const [p0,p1,p2]=[q(a),q(b),q(c)];
        const ta=FT[3*t],tb=FT[3*t+1],tc=FT[3*t+2];
        if(ta<0||tb<0||tc<0)continue;
        mpTri(p0[0],p0[1],p1[0],p1[1],p2[0],p2[1],NU,NH,(x,y,w0,w1,w2)=>{
          const k=y*NU+x;if(dn>=best[k])return;
          best[k]=dn;mt[k]=FM[t];
          tu[k]=w0*T[2*ta]+w1*T[2*tb]+w2*T[2*tc];tv[k]=w0*T[2*ta+1]+w1*T[2*tb+1]+w2*T[2*tc+1];
        });
      }
      opp.push({so,i,L,NU,NH,mt,tu,tv,djup:best,lum:new Float32Array(NU*NH).fill(NaN)});
    }
  }
  // 2. Teksturane, éin gong kvar
  const trengs=new Map();
  opp.forEach((o,oi)=>{for(let k=0;k<o.mt.length;k++)if(o.mt[k]>=0){
    let l=trengs.get(o.mt[k]);if(!l)trengs.set(o.mt[k],l=[]);l.push(oi,k);}});
  const TS=1024,cv=document.createElement('canvas');cv.width=cv.height=TS;
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  let nr=0,mangla=0;
  for(const [mi,l] of trengs){
    nr++;
    if(nr%10===1){framdrift('Les teksturar '+nr+'/'+trengs.size+' …');await new Promise(r=>setTimeout(r,0));}
    const fil=teksturar.get((mtlMap[mat[mi]]||mat[mi]).toLowerCase());
    if(!fil){mangla++;continue;}
    let bm;
    try{bm=await createImageBitmap(fil,{resizeWidth:TS,resizeHeight:TS,resizeQuality:'medium'});}
    catch(e){mangla++;continue;}
    ctx.drawImage(bm,0,0);bm.close&&bm.close();
    const d=ctx.getImageData(0,0,TS,TS).data;
    for(let j=0;j<l.length;j+=2){
      const o=opp[l[j]],k=l[j+1];
      let u=o.tu[k]%1,v=o.tv[k]%1;if(u<0)u+=1;if(v<0)v+=1;
      const p=4*(Math.min(TS-1,Math.floor((1-v)*TS))*TS+Math.min(TS-1,Math.floor(u*TS)));
      o.lum[k]=0.3*d[p]+0.59*d[p+1]+0.11*d[p+2];
    }
  }
  // 3–4. Glas → vindaugsfelt
  const funne=[];
  for(const o of opp){
    const {NU,NH,lum}=o,W1=NU+1;
    const sI=new Float64Array(W1*(NH+1)),qI=new Float64Array(W1*(NH+1)),cI=new Float64Array(W1*(NH+1));
    for(let y=0;y<NH;y++)for(let x=0;x<NU;x++){
      const v=lum[y*NU+x],ok=v===v,k=(y+1)*W1+x+1;
      sI[k]=(ok?v:0)+sI[k-1]+sI[k-W1]-sI[k-W1-1];
      qI[k]=(ok?v*v:0)+qI[k-1]+qI[k-W1]-qI[k-W1-1];
      cI[k]=(ok?1:0)+cI[k-1]+cI[k-W1]-cI[k-W1-1];
    }
    const box=(A,x0,y0,x1,y1)=>A[y1*W1+x1]-A[y0*W1+x1]-A[y1*W1+x0]+A[y0*W1+x0];
    const g=new Int8Array(NU*NH);      // 1 glas, 0 vegg, -1 ukjent
    for(let y=0;y<NH;y++)for(let x=0;x<NU;x++){
      const x0=Math.max(0,x-3),x1=Math.min(NU,x+4),y0=Math.max(0,y-3),y1=Math.min(NH,y+4);
      const n=box(cI,x0,y0,x1,y1);
      if(n<10){g[y*NU+x]=-1;continue;}
      const m=box(sI,x0,y0,x1,y1)/n,va=box(qI,x0,y0,x1,y1)/n-m*m;
      g[y*NU+x]=Math.sqrt(Math.max(0,va))>MP_GLAS_SD?1:0;
    }
    const b0=Math.round(0.9/MP_EL),b1=Math.min(NH,Math.round(2.0/MP_EL));
    if(b1-b0<5)continue;
    const kol=new Float32Array(NU);
    for(let x=0;x<NU;x++){let gl=0,ok=0;for(let y=b0;y<b1;y++){const v=g[y*NU+x];if(v>=0){ok++;gl+=v;}}
      kol[x]=ok>=0.3*(b1-b0)?gl/ok:0;}
    const felt=[];
    for(let x=0;x<NU;){
      if(kol[x]>0.45){const s=x;while(x<NU&&kol[x]>0.45)x++;
        if(felt.length&&s-felt[felt.length-1][1]<=Math.round(0.4/MP_EL))felt[felt.length-1][1]=x;else felt.push([s,x]);}
      else x++;
    }
    // Utstrekninga: glas ELLER lyst (persienner og utbrent dagslys er jamne,
    // så variasjonen åleine gir for låge vindauge)
    const g2=new Int8Array(NU*NH);
    for(let k=0;k<NU*NH;k++)g2[k]=g[k]<0?-1:(g[k]===1||lum[k]>200?1:0);
    const andel=(G,x0,x1,y0,y1)=>{let gl=0,ok=0;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<x1;x++){const v=G[y*NU+x];if(v>=0){ok++;gl+=v;}}return ok?gl/ok:0;};
    for(let [s,e] of felt){
      if((e-s)*MP_EL<0.4)continue;
      // Dagslys: glas mot det fri er lyst og har utbrente parti. Perforerte
      // akustikkplater, rack, skilt og glasdører inn til uskanna rom har like
      // mykje variasjon, men er mørkare — dei fall bort på prøvefila.
      // Rekna på treffbandet, ikkje det utvida feltet (karmar og brystning
      // under persienner trekkjer elles snittet ned).
      // Persienner er unnataket: dei skjuler dagslyset, men gir sterke
      // vassrette striper (mykje meir variasjon loddrett enn vassrett).
      // Akustikkplater og rack er like i begge retningar.
      let sum=0,n=0,lyst=0,gv=0,nv=0,gh=0,nh=0;
      for(let y=b0;y<b1;y++)for(let x=s;x<e;x++){
        const v=lum[y*NU+x];if(v!==v)continue;
        sum+=v;n++;if(v>215)lyst++;
        const vo=lum[(y+1)*NU+x],vh=x+1<e?lum[y*NU+x+1]:NaN;
        if(y+1<NH&&vo===vo){gv+=Math.abs(vo-v);nv++;}
        if(vh===vh){gh+=Math.abs(vh-v);nh++;}
      }
      const persienner=n&&nv&&nh&&sum/n>=110&&(gv/nv)>MP_PERSIENNE*(gh/nh);
      if(!persienner&&(!n||sum/n<MP_GLAS_SNITT||lyst/n<MP_GLAS_LYST))continue;
      // Djupna: ligg glaset i eit anna plan enn veggen (nisje, karm), følgjer
      // vi det planet opp og ned. Persienner og utbrent glas er jamne i
      // teksturen, så utan dette vart vindauga for låge. Står glas og vegg i
      // same plan, seier djupna ingenting, og då står teksturkriteriet åleine.
      const G=g2.slice();
      const med=a=>{if(!a.length)return NaN;a.sort((p,q)=>p-q);return a[a.length>>1];};
      const dB=[],dV=[];
      for(let y=b0;y<b1;y++)for(let x=s;x<e;x++){const k=y*NU+x;if(g[k]>=0&&isFinite(o.djup[k]))dB.push(o.djup[k]);}
      for(let k=0;k<NU*NH;k++)if(g[k]===0&&isFinite(o.djup[k])&&(k%NU<s||k%NU>=e))dV.push(o.djup[k]);
      const dGlas=med(dB),dVegg=med(dV);
      if(dGlas===dGlas&&(dVegg!==dVegg||Math.abs(dGlas-dVegg)>0.05))
        for(let k=0;k<NU*NH;k++)if(G[k]===0&&Math.abs(o.djup[k]-dGlas)<0.04)G[k]=1;
      let midt=b0;for(let y=b0;y<b1;y++)if(andel(g,s,e,y,y)>andel(g,s,e,midt,midt))midt=y;
      let lo=midt,hi=midt;
      while(lo>0&&andel(G,s,e,lo-1,lo-1)>0.5)lo--;
      while(hi<NH-1&&andel(G,s,e,hi+1,hi+1)>0.5)hi++;
      while(s>0&&andel(G,s-1,s,lo,hi)>0.6)s--;
      while(e<NU&&andel(G,e,e+1,lo,hi)>0.6)e++;
      // Smale stripar og små flekkar (lamper, skilt) er ikkje vindauge
      if((hi+1-lo)*MP_EL<0.4||(e-s)*MP_EL<0.5||(hi+1-lo)*(e-s)*MP_EL*MP_EL<0.5)continue;
      const u0=s*MP_EL,u1=Math.min(o.L,e*MP_EL);
      // Utvida felt kan ha vakse inn i førre felt på same vegg — slå saman
      const f0=funne[funne.length-1];
      if(f0&&f0.so===o.so&&f0.segIdx===o.i&&u0<=f0.t1*o.L+0.01){
        f0.t1=Math.max(f0.t1,u1/o.L);f0.breddeM=(f0.t1-f0.t0)*o.L;
        f0.botM=Math.min(f0.botM,lo*MP_EL);f0.topM=Math.max(f0.topM,(hi+1)*MP_EL);
        continue;
      }
      funne.push({so:o.so,segIdx:o.i,t0:u0/o.L,t1:u1/o.L,breddeM:u1-u0,botM:lo*MP_EL,topM:(hi+1)*MP_EL});
    }
  }
  return {funne,mangla,teksturar:trengs.size};
}

// Les filene, analyser og bygg eit prosjekt som går gjennom lastProsjekt() —
// same vegen som «Opne prosjekt», så alle globalar vert nullstilte rett.
// `filer` er det brukaren valde: OBJ-fila, og helst .mtl og teksturane (.jpg)
// — utan teksturane vert det soner, men ingen vindauge.
async function importerMatterpak(filer){
  filer=Array.from(filer);
  const fil=filer.find(f=>/\.obj$/i.test(f.name));
  if(!fil){alert('Fann inga .obj-fil i mappa. Vel den utpakka MatterPak-mappa (der .obj-, .mtl- og .jpg-filene ligg).');return;}
  const teksturar=new Map(filer.filter(f=>/\.(jpe?g|png)$/i.test(f.name)).map(f=>[f.name.toLowerCase(),f]));
  const mtlFil=filer.find(f=>/\.mtl$/i.test(f.name));
  const harInnhald=floors.some(f=>f.bgImg||f.zones.length||(f.measurements||[]).length)||fasadar.length;
  if(harInnhald&&!confirm('Importen erstattar heile prosjektet som er ope (etasjar, soner og fasadeark).\n\nKan angrast med Ctrl+Z. Halde fram?'))return;
  hintText.textContent='Les 3D-modellen «'+fil.name+'» …';
  await new Promise(r=>setTimeout(r,30));               // la hintlinja teikne seg
  const t0=performance.now();
  let R,M;
  try{
    M=mpLesObj(await fil.text());
    const {V,F}=M;
    if(!F.length)throw new Error('Fila har ingen flater (f-linjer). Er det ein OBJ-mesh?');
    hintText.textContent='Finn etasjar og golvflater i '+(F.length/3).toLocaleString('nb-NO')+' trekantar …';
    await new Promise(r=>setTimeout(r,30));
    R=mpAnalyser(V,F);
  }catch(e){
    hintText.textContent='';
    alert('Kunne ikkje lese 3D-skannet: '+e.message);
    return;
  }
  const r1=v=>v==null?null:Math.round(v*10)/10;
  const r2=v=>v==null?null:Math.round(v*100)/100;
  let sNr=_nextZoneId,fyltSum=0;
  const soneInfo=[];                 // {z,fz,hM,linjer} — til vindaugssøket og rapporten
  const etgLinjer=[];
  const serFloors=R.etasjar.map((e,ei)=>{
    // Etasjehøgd = avstanden til neste golv; øvste: himlinga langs kanten
    const kant=e.soner.map(s=>s.kantHoyde).filter(v=>v!=null);
    const etgH=r2(e.neste!=null?e.neste-e.z:(kant.length?Math.max(...kant):3.0));
    const zones=e.soner.map(s=>{
      const z={name:'Sone '+(++sNr),pts:s.pts,windows:[],skillevegg:[],zoneConnections:[],
        takflater:[],gulvflater:[],gavlflater:[]};
      // Fasadehøgda frå himlinga langs ytterkanten, volumet frå snittet over flata
      const kh=r1(s.kantHoyde);
      if(kh!=null&&Math.abs(kh-etgH)>0.05)z.hoyde=kh;
      const hm=r2(s.himling);
      if(hm!=null&&Math.abs(hm-(z.hoyde??etgH))>0.05)z.himling=hm;
      if(s.overUnder>=0.8)z.gulvtype='Gulv mot oppvarma sone';
      if(piBygg.byggeaar)z.byggeaar=piBygg.byggeaar;
      fyltSum+=s.fyltM2;
      let l='  '+z.name+': '+s.aM2.toFixed(1)+' m²';
      if(s.himling!=null)l+=', himling snitt '+s.himling.toFixed(2)+' m';
      if(s.kantHoyde!=null)l+=', ved ytterveggen '+s.kantHoyde.toFixed(2)+' m';
      if(z.gulvtype)l+=', golv mot oppvarma sone';
      const linjer=[l];
      if(s.overUnder>0.05&&s.overUnder<0.8)linjer.push('    ⚠ '+Math.round(s.overUnder*100)+' % av golvet ligg over etasjen under — golvtypen står som golv på grunn.');
      if(s.underOverM2>=MP_MIN_SONE)linjer.push('    ⚠ '+s.underOverM2.toFixed(0)+' m² av taket ligg under etasjen over — del taket (✂) og set himling mot varm sone der.');
      if(s.himling==null)linjer.push('    ⚠ Fann ikkje himlinga over nok av flata — høgda står som etasjehøgda.');
      // Opprisset går opp til den høgaste av fasadehøgda og etasjehøgda
      soneInfo.push({z,fz:e.z,hM:Math.min(8,Math.max(z.hoyde??etgH,etgH)+0.1),linjer});
      return z;
    });
    etgLinjer.push('Etasje '+(ei+1)+' — golv på kote '+e.z.toFixed(2)+' m, etasjehøgd '+etgH.toFixed(2)+' m');
    return {
      id:ei+1,name:'Etasje '+(ei+1),
      mmPerImgPx:R.mmPerPx,ownCal:false,defaultHoyde:etgH,
      sc:1,offX:0,offY:0,floorDxImg:0,floorDyImg:0,delAv:null,plassAnker:null,
      pdfPage:1,totalPages:1,paperWMm:null,paperHMm:null,paperSource:null,
      measurements:[],zones,
      bgImgData:e.canvas.toDataURL('image/png')
    };
  });
  const mtlMap=mtlFil?mpLesMtl(await mtlFil.text()):{};
  // Vindauge — berre når teksturane er med
  let vinMeld;
  if(!teksturar.size){
    vinMeld='⚠ Mappa hadde ingen teksturar (.jpg) ved sida av OBJ-fila, så vindauge er ikkje leita etter.';
  }else{
    try{
      const VR=await mpFinnVindauge(M,R,teksturar,mtlMap,soneInfo,t=>{hintText.textContent=t;});
      for(const f of VR.funne){
        const z=f.so.z;
        const nr=z.windows.filter(w=>w.type!=='dor').length+1;
        z.windows.push({segIdx:f.segIdx,dir:'',t0:f.t0,t1:f.t1,
          breddeMm:Math.round(f.breddeM*1000),hoyMm:Math.round((f.topM-f.botM)*1000),
          antal:1,type:'vindauge',name:'Vindauge '+nr,brystningMm:Math.round(f.botM*1000),posT:null});
      }
      soneInfo.forEach(si=>{
        const n=si.z.windows.length;if(!n)return;
        const a=si.z.windows.reduce((s,w)=>s+w.breddeMm*w.hoyMm/1e6,0);
        si.linjer[0]+=', '+n+' vindaugsfelt ('+a.toFixed(1)+' m² glas)';
      });
      vinMeld=VR.funne.length+' vindaugsfelt funne i teksturane på ytterveggane. Dei er framlegg: '
        +'glasfelt med karmar imellom er slegne saman, og glasdører kjem med som vindauge.'
        +(VR.mangla?' ⚠ '+VR.mangla+' av '+VR.teksturar+' teksturar mangla eller kunne ikkje lesast — veggane der er ikkje sjekka.':'');
    }catch(e){
      vinMeld='⚠ Vindaugssøket feila ('+e.message+') — sonene er laga utan vindauge.';
    }
  }
  const rapport=[];
  serFloors.forEach((f,ei)=>{
    rapport.push(etgLinjer[ei]);
    f.zones.forEach(z=>rapport.push(...soneInfo.find(si=>si.z===z).linjer));
  });
  const proj={version:1,activeFloor:0,globalNorth:0,globalMmPerImgPx:R.mmPerPx,
    prosjektAdresse,_nextFloorId:serFloors.length+1,_nextGroupId:1,_nextZoneId:sNr,
    fasadar:[],activeFasade:0,_nextFasadeId:1,floors:serFloors};
  snapshot();
  await lastProsjekt(proj,{fit:true});
  // Etter lastProsjekt, som nullar skannet frå førre prosjekt
  mpSkann={...M,teksturar,mtlMap,ox:R.ox,oy:R.oy,z0:R.etasjar[0].z,gruppe:null};
  // Himmelretninga på vindauga kjem frå segmentet (og nordpila)
  floors.forEach(fl=>fl.zones.forEach(z=>{
    if(!z.windows.length)return;
    const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z));
    z.windows.forEach(w=>{w.dir=segs[w.segIdx]?.dir||'';});
  }));
  updateResults();renderTable();draw();
  markDirty();
  const sek=((performance.now()-t0)/1000).toFixed(1);
  const nSoner=serFloors.reduce((s,f)=>s+f.zones.length,0);
  const nVin=serFloors.reduce((s,f)=>s+f.zones.reduce((t,z)=>t+z.windows.length,0),0);
  hintText.textContent='3D-skann importert: '+serFloors.length+' etasjar, '+nSoner+' soner, '+nVin+' vindauge ('+sek+' s). Kontroller før du eksporterer SXI.';
  alert('3D-skannet er lese inn ('+R.trekant.toLocaleString('nb-NO')+' trekantar, '+sek+' s).\n\n'
    +rapport.join('\n')
    +(fyltSum>=1?'\n\n'+fyltSum.toFixed(0)+' m² innanfor ytterkanten var ikkje skanna (vegger, sjakter eller rom ingen gjekk inn i) og er rekna med i sonene.':'')
    +'\n\n'+vinMeld
    +'\n\nIkkje henta frå skannet — må setjast før SXI-eksport:\n'
    +'  • Tette dører (dei ser ut som vegg i teksturen)\n  • Nordretning (kompasset)\n  • Bygningskategori, byggeår og U-verdiar\n'
    +'  • Skiljeveggar mot naboar');
}
document.getElementById('scanBtn').onclick=()=>document.getElementById('scanFi').click();
document.getElementById('scanFi').onchange=async function(){
  const f=Array.from(this.files);this.value='';
  if(f.length)await importerMatterpak(f);
};

