// ── Mode management ───────────────────────────────────────────
const navBtn=document.getElementById('navBtn');
const drawBtn=document.getElementById('drawBtn');
const editBtn=document.getElementById('editBtn');
const winBtn=document.getElementById('winBtn');
const calBtn=document.getElementById('calBtn');

const HINTS={
  navigate:'Scroll for zoom · klikk+dra for å flytte rundt',
  draw:'Klikk hjørner · Shift for 90°/45° · scroll for zoom, midtknapp/Alt+dra for å flytte · dobbelklikk eller klikk startpunkt for å avslutte · Esc for å avbryte',
  edit:'Dra hjørner · Shift+dra inni sone = flytt sona · klikk + for å leggje til · høgreklikk for å slette · Esc for å avslutte',
  calibrate:'Lengde: klikk start → klikk slutt · Areal: klikk på ei sone · Shift for 90°/45° · scroll for zoom, midtknapp/Alt+dra for å flytte',
  window:'Klikk éin ende av vindauget/døra på fasaden, så den andre enden',
  measure:'Klikk startpunkt → klikk endepunkt for å kontrollmåle · Shift for 90°/45° · måla blir lagra · høgreklikk på eit mål for å slette · Esc for å avslutte',
  'tegn-takflate':'Klikk hjørner for å teikne takflate-polygon. Klikk på startpunktet for å lukke. Esc for å avbryte.',
  'klipp-takflate':'Klikk for å legge til punkt på klippelinja · Shift for 90°/45° · Enter eller dobbelklikk for å klippe · Esc for å avbryte',
  'del-sone':'Teikn ei linje tvers gjennom sona · Shift for 90°/45° · Enter eller dobbelklikk for å dele · Esc for å avbryte',
  'plasser-ark':'Klikk eit kjent punkt på DETTE arket (t.d. eit hjørne) · piltastar flyttar arket litt · Esc for å avbryte',
  'rett-ut':'Klikk punkta på teikninga · Backspace angrar siste punkt · Esc for å avbryte',
};
const MODELABELS={navigate:'Naviger',draw:'Tegn sone',edit:'Rediger',calibrate:'Kalibrer',window:'Vindauge/dør',measure:'Kontrollmål','tegn-takflate':'Teikn takflate','klipp-takflate':'Klipp flate','del-sone':'Del sone','plasser-ark':'Plasser delplan','rett-ut':'Rett ut'};

function setMode(m){
  if(m!=='plasser-ark')_avbrytPlassering();
  mode=m;drawSnap=null;calSnap=null;measureSnap=null;measureGeoSnap=null;
  if(m!=='del-sone'){delSonePts=[];delSoneTarget=null;delSoneSnap=null;}
  navBtn.classList.toggle('on',m==='navigate');
  drawBtn.classList.toggle('on',m==='draw');
  editBtn.classList.toggle('on',m==='edit');
  winBtn.classList.toggle('on',m==='window');
  calBtn.classList.toggle('on',m==='calibrate');
  measureBtn.classList.toggle('on',m==='measure');
  document.getElementById('rettBtn').classList.toggle('on',m==='rett-ut');
  if(m!=='rett-ut'){rettPts=[];rettSnap=null;}
  cv.style.cursor=m==='navigate'?'grab':m==='draw'||m==='calibrate'||m==='rett-ut'||m==='window'||m==='measure'||m==='tegn-takflate'||m==='klipp-takflate'||m==='del-sone'||m==='plasser-ark'?'crosshair':'default';
  modeLabel.textContent=MODELABELS[m]||m;
  hintText.textContent=HINTS[m]||'';
  if(m!=='measure')measurePts=[];
  if(typeof updateGhostUI==='function')updateGhostUI();
}

navBtn.onclick=()=>{setMode('navigate');editZoneIdx=null;curPts=[];calPts=[];draw();};
drawBtn.onclick=()=>{setMode('draw');editZoneIdx=null;curPts=[];calPts=[];draw();};
editBtn.onclick=()=>{
  if(!zones.length){hintText.textContent='Ingen soner å redigere på denne etasjen. Gå til riktig etasje eller klikk Rediger på ei sone i panelet.';return;}
  setMode('edit');curPts=[];if(editZoneIdx===null)editZoneIdx=0;draw();
};
winBtn.onclick=()=>{
  if(!zones.length){hintText.textContent='Teikn ei sone først.';return;}
  setMode('window');winPts=[];winSnapPreview=null;draw();
};
document.getElementById('snapBtn').onclick=function(){
  snapEnabled=!snapEnabled;
  this.classList.toggle('on',snapEnabled);
  drawSnap=null;calSnap=null;measureGeoSnap=null;
  hintText.textContent=snapEnabled?'Snap til hjørne er på.':'Snap til hjørne er av — punkta hamnar akkurat der du klikkar.';
  draw();
};
const measureBtn=document.getElementById('measureBtn');
measureBtn.onclick=()=>{
  if(!mmPerImgPx){hintText.textContent='Kalibrer skalaen først for å måle avstandar.';return;}
  setMode('measure');measurePts=[];showMeasurements=true;updateMeasureUI();draw();
};
// Vis/skjul lagra mål
document.getElementById('measShowBtn').onclick=()=>{
  showMeasurements=!showMeasurements;
  updateMeasureUI();
  hintText.textContent=showMeasurements?'Mål er synlege.':'Mål er skjulte — dei er framleis lagra.';
  draw();
};
function updateMeasureUI(){
  // Måltalet står både i fanebadgen og i sidepanelet på eit fasadeark, og
  // denne funksjonen er den eine staden alle måleendringar går gjennom.
  if(iFasade()){renderFasadeTabs();renderFasadePanel();}
  const b=document.getElementById('measShowBtn');if(!b)return;
  const cnt=(measureResults||[]).length;
  b.style.display=cnt?'':'none';
  b.classList.toggle('on',showMeasurements);
  const c=b.querySelector('.mcount');if(c)c.textContent=cnt;
  if(!cnt)hoveredMeasure=null;
}
// ── Listebasert redigering ────────────────────────────────────
// Inspirert av SIMIEN: éin tabell per elementtype, der verdiane kan endrast
// rett i cellene. Er rada vald og fleire rader er valde, gjeld endringa ALLE
// dei valde — det er vegen til å endre mange element på ein gong.
//
// Kvar endring er eitt angre-steg (snapshot fyrst). Reglane er dei same som
// sonekortet og vindaugsdialogen brukar, og står i set() per kolonne:
//  - antal går gjennom winSetAntal (plasseringa), aldri w.antal=n
//  - etasjehøgda gjeld heile delplangruppa (etasjeArk), og fhI for den aktive
//  - kategori på ei kopla sone gjeld alle instansane (kopla soner må ha same)
//  - tom celle i eit valfritt felt (U-verdi, høgd, brystning …) = standard
// Utrekna kolonnar (areal, effektiv U, U·A) er berre til lesing og følgjer
// dei same uttrykka som buildSXI.
const listeOverlay=document.getElementById('listeOverlay');
// Lista dekkjer heile vindauget, ikkje berre lerretet: flytt ho til <body>,
// ut av stablinga til #cwrap (isolation:isolate) — elles låg sidepanelet over
document.body.appendChild(listeOverlay);
let listeType='vindauge',listeSort=null,listeVal=new Set();

const _liNum=(v,d)=>v==null||v===''||isNaN(v)?'':(+v).toFixed(d);
const _liPos=(v,heil)=>{const n=heil?parseInt(v):parseFloat(String(v).replace(',','.'));return n>0?n:null;};
const _liStd=z=>entroStandard(z.byggeaar);
function _liFlOf(z){return floors.find(f=>f.zones.includes(z))||null;}
function _liU(z,k){const d={uVegg:0.26,uTak:0.18,uGulv:0.35,uVindu:1.60,uDor:2.00,n50:3.5};return z[k]??_liStd(z)?.[k]??d[k];}
function _liOpnA(w){const d=w.type==='dor';return Math.max(0.1,(w.hoyMm||(d?2100:1200))/1000)*Math.max(0.1,(w.breddeMm||(d?900:1200))/1000)*(w.antal||1);}

// Kolonne: {k, t (tittel), ein (eining), num, des (desimalar), get(r), set(r,v) — utan set er ho til lesing,
// opt (liste for nedtrekk), valfri (tom = standard), ph(r) (standardverdien som plasshaldar), heil,
// laast(r) (grunn til at feltet ikkje kan endrast for denne rada, elles null)}
const LISTE_TYPAR={
  vindauge:{namn:'Vindauge',rader:()=>_liOpningar('vindauge'),kol:()=>_liOpnKol(false)},
  dor:{namn:'Dører',rader:()=>_liOpningar('dor'),kol:()=>_liOpnKol(true)},
  golv:{namn:'Golv',rader:()=>_liFlater('gulv'),kol:()=>_liFlateKol('gulv')},
  tak:{namn:'Tak',rader:()=>_liFlater('tak'),kol:()=>_liFlateKol('tak')},
  vegg:{namn:'Ytterveggar (U-verdi fasadar)',rader:_liVeggar,kol:()=>[
    {k:'namn',t:'Namn',get:r=>r.namn},
    {k:'sone',t:'Sone',get:r=>r.z.name},
    {k:'etg',t:'Etasje',get:r=>r.etg},
    {k:'retn',t:'Retning',get:r=>r.seg.dir},
    {k:'areal',t:'Areal',ein:'m²',num:1,des:2,get:r=>r.areal},
    {k:'u',t:'U-verdi',ein:'W/m²K',num:1,des:2,valfri:1,ph:r=>_liU(r.z,'uVegg'),
      get:r=>r.z.uPerSeg?.['seg_'+r.seg.idx],
      set:(r,v)=>{if(!r.z.uPerSeg)r.z.uPerSeg={};if(v==null)delete r.z.uPerSeg['seg_'+r.seg.idx];else r.z.uPerSeg['seg_'+r.seg.idx]=v;}},
    {k:'ua',t:'Spesifikt varmetap',ein:'W/K',num:1,des:2,get:r=>r.areal*(r.z.uPerSeg?.['seg_'+r.seg.idx]??_liU(r.z,'uVegg'))},
  ]},
  sone:{namn:'Soner',rader:()=>floors.flatMap(f=>f.zones.map(z=>({key:z,z,etg:arkNamn(f),f}))),kol:()=>[
    {k:'namn',t:'Namn',txt:1,get:r=>r.z.name,set:(r,v)=>{r.z.name=String(v||'').trim()||r.z.name;}},
    {k:'etg',t:'Etasje',get:r=>r.etg},
    {k:'kat',t:'Kategori',opt:Object.keys(BYGKAT_SXI),get:r=>r.z.bygkat||'Kontorbygg',
      set:(r,v)=>{getLinkedZones(r.z).forEach(lz=>{lz.bygkat=v;});}},
    {k:'aar',t:'Byggeår',num:1,heil:1,valfri:1,get:r=>r.z.byggeaar,set:(r,v)=>{r.z.byggeaar=v;}},
    {k:'areal',t:'Areal',ein:'m²',num:1,des:1,get:r=>getAreaM2(r.z)},
    {k:'hoyde',t:'Høgd',ein:'m',num:1,des:2,valfri:1,ph:r=>{const f=r.f;return f?.defaultHoyde??(parseFloat(fhI.value)||3);},get:r=>r.z.hoyde,set:(r,v)=>{r.z.hoyde=v;}},
    {k:'him',t:'Himling',ein:'m',num:1,des:2,valfri:1,ph:r=>getHoyde(r.z),get:r=>r.z.himling,set:(r,v)=>{r.z.himling=v;}},
    {k:'vinkel',t:'Takvinkel',ein:'°',num:1,des:0,valfri:1,ph:()=>0,get:r=>r.z.takvinkel||null,set:(r,v)=>{r.z.takvinkel=v;}},
    ...[['uVegg','U-vegg'],['uTak','U-tak'],['uGulv','U-golv'],['uVindu','U-vindauge'],['uDor','U-dør'],['n50','n50']].map(([k,t])=>(
      {k,t,ein:k==='n50'?'1/h':'W/m²K',num:1,des:2,valfri:1,ph:r=>_liU({...r.z,[k]:null},k),get:r=>r.z[k],set:(r,v)=>{r.z[k]=v;}})),
  ]},
  etasje:{namn:'Etasjar',rader:()=>floors.filter(f=>!erDelplan(f)).map(f=>({key:f,f,etg:f.name})),kol:()=>[
    {k:'namn',t:'Namn',txt:1,get:r=>r.f.name,set:(r,v)=>{r.f.name=String(v||'').trim()||r.f.name;}},
    {k:'ark',t:'Teikningar',num:1,des:0,get:r=>etasjeArk(r.f).length},
    {k:'soner',t:'Soner',num:1,des:0,get:r=>etasjeArk(r.f).reduce((s,a)=>s+a.zones.length,0)},
    {k:'bra',t:'Areal',ein:'m²',num:1,des:1,get:r=>etasjeArk(r.f).reduce((s,a)=>s+a.zones.reduce((t,z)=>t+(getAreaM2(z)||0),0),0)},
    {k:'h',t:'Etasjehøgd',ein:'m',num:1,des:2,get:r=>r.f.defaultHoyde??(parseFloat(fhI.value)||3),
      set:(r,v)=>{if(v==null)return;etasjeArk(r.f).forEach(x=>{x.defaultHoyde=v;});
        if(etasjeArk(r.f).includes(curFloor()))fhI.value=v;}},
  ]},
};
// Golv og tak: éi rad per flate i ei oppdelt sone, elles éi rad for heile sona
// (fl=null — då er det sona sin gulvtype/taktype og uGulv/uTak som gjeld).
function _liFlater(kind){
  const ut=[];
  floors.forEach(f=>f.zones.forEach(z=>{
    const fl=flateListe(z,kind);
    if(!fl.length)ut.push({key:_zuk(z)+':'+kind,z,f,fl:null,etg:arkNamn(f)});
    else fl.forEach((x,i)=>ut.push({key:_zuk(z)+':'+kind+':'+(x.id??i),z,f,fl:x,etg:arkNamn(f)}));
  }));
  return ut;
}
// Kjellar kan verken veljast eller veljast bort her: han styrer rollene til
// veggane (KJ/YV/SK) og oppfyllinga, og det skal gjerast i sonekortet.
function _liFlateKol(kind){
  const F=FLATE[kind];
  const type=r=>flateType(r.z,kind,r.fl);
  const kjellar=r=>kind==='gulv'&&type(r)===KJELLER_GULV;
  return [
    {k:'namn',t:'Namn',get:r=>r.fl?(r.fl.name||F.lbl):'Heile '+F.eining},
    {k:'sone',t:'Sone',get:r=>r.z.name},
    {k:'etg',t:'Etasje',get:r=>r.etg},
    {k:'type',t:'Type',opt:F.typar.filter(t=>t!==KJELLER_GULV),get:type,
      laast:r=>kjellar(r)?'Kjellargolv kan berre endrast i sonekortet':null,
      set:(r,v)=>{
        if(!r.fl){r.z[F.zoneFelt]=v;if(kind==='tak')r.z.gavlflater=[];return;}
        r.fl.type=v;
        if(kind==='tak'){
          if(v==='Tak'){
            if(r.fl.vinkel==null)r.fl.vinkel=getTakvinkel(r.z);
            if(r.fl.retning==null)r.fl.retning=_autoRetningForTakflate(r.fl.pts,r.z,calcSegments(r.z.pts,getHoyde(r.z),mppForZone(r.z))||[]);
          }
          r.z.gavlflater=[];
        }
      }},
    {k:'areal',t:'Areal',ein:'m²',num:1,des:1,get:r=>r.fl?flateAreaM2(r.z,r.fl):(getAreaM2(r.z)||0)},
    {k:'u',t:'U-verdi',ein:'W/m²K',num:1,des:2,valfri:1,ph:r=>_liU(r.z,F.uFelt),
      laast:r=>r.fl&&kjellar(r)?'Kjellargolv har ingen eigen U-verdi per flate':null,
      get:r=>r.fl?r.fl.uverdi:r.z[F.uFelt],
      set:(r,v)=>{if(r.fl)r.fl.uverdi=v;else r.z[F.uFelt]=v;}},
  ];
}
function _liOpningar(type){
  const ut=[];
  floors.forEach(f=>f.zones.forEach(z=>(z.windows||[]).forEach(w=>{
    if((w.type==='dor')!==(type==='dor'))return;
    ut.push({key:w,w,z,f,etg:arkNamn(f)});
  })));
  return ut;
}
function _liOpnKol(dor){
  const uk=dor?'uDor':'uVindu';
  return [
    {k:'namn',t:'Namn',txt:1,get:r=>r.w.name||(dor?'Dør':'Vindauge'),set:(r,v)=>{r.w.name=String(v||'').trim()||r.w.name;}},
    {k:'sone',t:'Sone',get:r=>r.z.name},
    {k:'etg',t:'Etasje',get:r=>r.etg},
    {k:'b',t:'Breidd',ein:'mm',num:1,des:0,heil:1,get:r=>r.w.breddeMm,set:(r,v)=>{if(v!=null)r.w.breddeMm=v;}},
    {k:'h',t:'Høgd',ein:'mm',num:1,des:0,heil:1,get:r=>r.w.hoyMm,set:(r,v)=>{if(v!=null)r.w.hoyMm=v;}},
    ...(dor?[]:[{k:'bryst',t:'Brystning',ein:'mm',num:1,des:0,heil:1,valfri:1,ph:()=>'standard',get:r=>r.w.brystningMm,set:(r,v)=>{r.w.brystningMm=v;}}]),
    ...(dor?[]:[{k:'n',t:'Antal',num:1,des:0,heil:1,get:r=>winCount(r.w),
      set:(r,v)=>{if(v==null)return;const g=winGeom(r.z,r.w);winSetAntal(r.w,v,g.width,g.segLen,winOpptekne(r.z,r.w,g.segLen,g.mpp));}}]),
    {k:'u',t:'U-verdi',ein:'W/m²K',num:1,des:2,valfri:1,ph:r=>_liU(r.z,uk),get:r=>r.w.uVerdi,set:(r,v)=>{r.w.uVerdi=v==null?undefined:v;}},
    {k:'a',t:'Areal',ein:'m²',num:1,des:2,get:r=>_liOpnA(r.w)},
    {k:'ua',t:'Spesifikt varmetap',ein:'W/K',num:1,des:2,get:r=>_liOpnA(r.w)*(r.w.uVerdi??_liU(r.z,uk))},
  ];
}
function _liVeggar(){
  const ut=[];
  floors.forEach(f=>f.zones.forEach(z=>{
    const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z));
    if(!segs)return;
    const lbl=getFacadeLabels(z,segs),sk=z.skillevegg||new Set();
    segs.forEach((seg,si)=>{
      if(sk.has(seg.idx)||isKjellervegg(z,seg.idx))return;
      const ov=z.segOverrides?.[seg.idx]||{};
      const areal=(ov.areaM2??seg.areaM2??((ov.lenM??seg.lenM??0)*getHoyde(z)))??0;
      ut.push({key:_zuk(z)+':'+seg.idx,z,f,seg,namn:lbl[si],etg:arkNamn(f),areal});
    });
  }));
  return ut;
}

function opneListe(){
  saveFloorState();   // floors[activeFloor].zones må vere den same som zones
  const sel=document.getElementById('listeType');
  sel.innerHTML='';
  Object.entries(LISTE_TYPAR).forEach(([k,t])=>{const o=document.createElement('option');o.value=k;o.textContent=t.namn;sel.appendChild(o);});
  sel.value=listeType;
  sel.onchange=()=>{listeType=sel.value;listeSort=null;listeVal.clear();renderListe();};
  document.getElementById('listeFilter').oninput=renderListe;
  listeOverlay.classList.add('show');
  renderListe();
}
function _liRader(){
  const T=LISTE_TYPAR[listeType],kol=T.kol();
  let rader=T.rader();
  const q=document.getElementById('listeFilter').value.trim().toLowerCase();
  if(q)rader=rader.filter(r=>kol.filter(c=>!c.num&&!c.opt).some(c=>String(c.get(r)??'').toLowerCase().includes(q)));
  if(listeSort){
    const c=kol.find(c=>c.k===listeSort.k);
    if(c)rader.sort((a,b)=>{
      const x=c.get(a)??(c.ph?c.ph(a):null),y=c.get(b)??(c.ph?c.ph(b):null);
      const r=(typeof x==='number'&&typeof y==='number')?x-y:String(x??'').localeCompare(String(y??''),'nb',{numeric:true});
      return r*listeSort.dir;
    });
  }
  return {kol,rader};
}
function renderListe(){
  const tab=document.getElementById('listeTab');
  const {kol,rader}=_liRader();
  // Valet held berre på rader som framleis finst (etter angre er objekta nye)
  const finst=new Set(LISTE_TYPAR[listeType].rader().map(r=>r.key));
  [...listeVal].forEach(k=>{if(!finst.has(k))listeVal.delete(k);});
  const nVal=rader.filter(r=>listeVal.has(r.key)).length;
  document.getElementById('listeHint').innerHTML=nVal
    ?'<b>'+nVal+' '+(nVal===1?'rad er vald':'rader er valde')+'.</b> Trykk «Rediger» for å endre verdiane — det du endrar, gjeld alle dei valde.'
    :'Vel radene du vil endre (klikk på rada eller avkryssingsboksen), og trykk «Rediger». Dobbeltklikk på ei rad for å redigere berre henne.';
  tab.innerHTML='';
  if(!rader.length){
    tab.innerHTML='<tbody><tr><td class="li-tom">'+(document.getElementById('listeFilter').value?'Ingen rader passar filteret.':'Det finst ingen '+LISTE_TYPAR[listeType].namn.toLowerCase()+' i prosjektet enno.')+'</td></tr></tbody>';
    return;
  }
  const thead=document.createElement('thead'),hr=document.createElement('tr');
  const th0=document.createElement('th');th0.style.width='28px';th0.style.cursor='default';hr.appendChild(th0);
  kol.forEach(c=>{
    const th=document.createElement('th');if(c.num)th.className='num';
    th.append(c.t);
    if(c.ein){const e=document.createElement('span');e.className='li-ein';e.textContent=' ['+c.ein+']';th.appendChild(e);}
    if(listeSort&&listeSort.k===c.k){const p=document.createElement('span');p.className='li-pil';p.textContent=listeSort.dir>0?'▲':'▼';th.appendChild(p);}
    th.onclick=()=>{listeSort=listeSort&&listeSort.k===c.k?{k:c.k,dir:-listeSort.dir}:{k:c.k,dir:1};renderListe();};
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  // «Vel alle»-rad med «Rediger», som i SIMIEN
  const ar=document.createElement('tr');ar.className='li-alle';
  const atd=document.createElement('td');atd.colSpan=kol.length+1;
  const acb=document.createElement('input');acb.type='checkbox';
  acb.checked=nVal===rader.length;acb.indeterminate=nVal>0&&nVal<rader.length;
  acb.onchange=()=>{rader.forEach(r=>{if(acb.checked)listeVal.add(r.key);else listeVal.delete(r.key);});renderListe();};
  const al=document.createElement('label');al.className='li-vel';
  al.append(acb,' Vel alle'+(nVal?'  ·  '+nVal+' av '+rader.length+' valde':'  ·  '+rader.length+' rader'));
  const red=document.createElement('button');red.className='li-red';red.disabled=!nVal;
  red.innerHTML='<span class="li-red-ik">'+ikonSvg('rediger')+'</span>Rediger'+(nVal?' ('+nVal+')':'');
  red.title=nVal?'Endre verdiane for dei valde radene':'Vel ei eller fleire rader fyrst';
  red.onclick=()=>_liRedigerValde();
  const ingen=document.createElement('button');ingen.className='li-red sek';ingen.textContent='Fjern valet';
  ingen.style.display=nVal?'':'none';
  ingen.onclick=()=>{listeVal.clear();renderListe();};
  atd.append(al,red,ingen);ar.appendChild(atd);thead.appendChild(ar);
  tab.appendChild(thead);

  const tb=document.createElement('tbody');
  rader.forEach(r=>{
    const tr=document.createElement('tr');if(listeVal.has(r.key))tr.className='vald';
    const veksle=()=>{if(listeVal.has(r.key))listeVal.delete(r.key);else listeVal.add(r.key);renderListe();};
    const td0=document.createElement('td');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=listeVal.has(r.key);
    cb.onclick=e=>e.stopPropagation();
    cb.onchange=veksle;
    td0.appendChild(cb);tr.appendChild(td0);
    // Klikk på rada vel henne; dobbeltklikk opnar redigeringa for berre denne
    tr.onclick=veksle;
    tr.ondblclick=()=>{listeVal.clear();listeVal.add(r.key);renderListe();_liRedigerValde();};
    kol.forEach(c=>{
      const td=document.createElement('td');if(c.num)td.className='num';
      const v=c.get(r);
      const laast=c.set&&c.laast?c.laast(r):null;
      if(!c.set||laast)td.classList.add('les');
      if(laast){td.classList.add('laast');td.title=laast;}
      if(c.set&&c.valfri&&(v==null||v==='')&&c.ph){
        // Standardverdien står grå, så det er tydeleg at han ikkje er sett for hand
        const p=c.ph(r);td.classList.add('std');
        td.textContent=typeof p==='number'?_liNum(p,c.des):p;
        if(!laast)td.title='Standardverdi';
      }else td.textContent=c.num?_liNum(v,c.des):(v??'');
      td.dataset.k=c.k;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  tab.appendChild(tb);

  // Sum for areal og varmetap
  const sumK=kol.filter(c=>c.num&&!c.set&&(c.k==='a'||c.k==='areal'||c.k==='ua'||c.k==='bra'||c.k==='soner'));
  if(sumK.length){
    const tf=document.createElement('tfoot'),ftr=document.createElement('tr');
    ftr.appendChild(document.createElement('td'));
    const sumRader=nVal?rader.filter(r=>listeVal.has(r.key)):rader;
    kol.forEach((c,i)=>{
      const td=document.createElement('td');if(c.num)td.className='num';
      if(i===0)td.textContent=nVal?'Sum (valde '+nVal+')':'Sum (alle '+rader.length+')';
      else if(sumK.includes(c))td.textContent=_liNum(sumRader.reduce((s,r)=>s+(+c.get(r)||0),0),c.des);
      ftr.appendChild(td);
    });
    tf.appendChild(ftr);tab.appendChild(tf);
  }
}

// «Rediger»: eitt vindauge med alle felta som kan endrast for dei valde radene.
// Har alle dei valde same verdi, står han i feltet; elles står feltet tomt
// med «ulike verdiar». Berre felt brukaren faktisk endrar vert lagra — eit
// felt som står urørt, endrar ingenting, same kva det inneheld.
function _liRedigerValde(){
  const T=LISTE_TYPAR[listeType],kol=T.kol().filter(c=>c.set);
  const maal=T.rader().filter(r=>listeVal.has(r.key));
  if(!maal.length)return;
  document.getElementById('liRedDlg')?.remove();
  const ov=document.createElement('div');ov.id='liRedDlg';
  const box=document.createElement('div');box.className='li-red-box';
  const tittel=document.createElement('h3');
  tittel.innerHTML='<span class="li-red-ik">'+ikonSvg('rediger')+'</span><span></span>';
  tittel.lastChild.textContent='Rediger '+(maal.length===1?'«'+String(T.kol()[0]?.get(maal[0])??'')+'»':maal.length+' '+T.namn.toLowerCase().replace(/ \(.*\)$/,''));
  const sub=document.createElement('div');sub.className='li-red-sub';
  sub.textContent=maal.length>1
    ?'Felt du endrar, vert sette på alle '+maal.length+'. Felt du ikkje rører, står som dei er.'
    :'Felt du ikkje rører, står som dei er.';
  box.append(tittel,sub);
  const grid=document.createElement('div');grid.className='li-red-grid';
  const endra=new Map();   // k → {c, inp, std:true|undefined}
  const fmt=(c,v)=>v==null||v===''?'':(c.num?_liNum(v,c.des):String(v));
  kol.forEach(c=>{
    // Låste rader vert verken viste i feltet eller endra
    const opne=c.laast?maal.filter(r=>!c.laast(r)):maal;
    const nLaast=maal.length-opne.length;
    const verdiar=(opne.length?opne:maal).map(r=>c.get(r));
    const lik=verdiar.every(v=>fmt(c,v)===fmt(c,verdiar[0]));
    const lab=document.createElement('label');lab.textContent=c.t+(c.ein?' ['+c.ein+']':'');
    if(!opne.length){
      const celle=document.createElement('div');celle.className='li-red-felt';
      const inp=document.createElement('input');inp.type='text';inp.disabled=true;
      inp.value=lik?fmt(c,verdiar[0]):'ulike verdiar';inp.title=c.laast(maal[0]);
      const m=document.createElement('span');m.className='li-laast-merk';m.textContent='låst';m.title=inp.title;
      celle.append(inp,m);grid.append(lab,celle);
      return;
    }
    let inp;
    if(c.opt){
      inp=document.createElement('select');
      if(!lik){const o=document.createElement('option');o.value='';o.textContent='— ulike verdiar —';inp.appendChild(o);}
      c.opt.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;inp.appendChild(op);});
      inp.value=lik?verdiar[0]:'';
    }else{
      inp=document.createElement('input');inp.type='text';
      if(c.num){inp.inputMode='decimal';inp.classList.add('num');}
      inp.value=lik?fmt(c,verdiar[0]):'';
      const ph=c.valfri&&c.ph?c.ph(opne[0]):null;
      inp.placeholder=!lik?'ulike verdiar':(c.valfri?(typeof ph==='number'?'standard ('+_liNum(ph,c.des)+')':'standard'):'');
    }
    const merk=()=>{endra.set(c.k,{c,inp,opne});lab.classList.add('endra');inp.classList.add('endra');};
    inp.addEventListener('input',merk);inp.addEventListener('change',merk);
    const celle=document.createElement('div');celle.className='li-red-felt';
    celle.appendChild(inp);
    if(nLaast){
      const m=document.createElement('span');m.className='li-laast-merk';
      m.textContent=nLaast+' låst';m.title=c.laast(maal.find(r=>c.laast(r)))+' — '+(nLaast===1?'denne står':'desse står')+' urørt.';
      celle.appendChild(m);
    }
    if(c.valfri&&!c.opt){
      const std=document.createElement('button');std.type='button';std.className='li-std';std.textContent='↺';
      std.title='Set standardverdien';
      std.onclick=()=>{inp.value='';merk();endra.get(c.k).std=true;inp.placeholder='standard';inp.focus();};
      celle.appendChild(std);
    }
    grid.append(lab,celle);
  });
  box.appendChild(grid);
  const feil=document.createElement('div');feil.className='li-red-feil';box.appendChild(feil);
  const knappar=document.createElement('div');knappar.className='dbtns';
  const avbryt=document.createElement('button');avbryt.className='dcancel';avbryt.textContent='Avbryt';
  const lagre=document.createElement('button');lagre.className='dok';lagre.textContent=maal.length>1?'Bruk på '+maal.length:'Lagre';
  knappar.append(avbryt,lagre);box.appendChild(knappar);
  ov.appendChild(box);document.body.appendChild(ov);
  const lukk=()=>ov.remove();
  avbryt.onclick=lukk;
  ov.onclick=e=>{if(e.target===ov)lukk();};
  ov.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();lukk();}if(e.key==='Enter'&&e.target.tagName!=='SELECT'){e.preventDefault();lagre.click();}};
  lagre.onclick=()=>{
    // Les og sjekk alle endra felt fyrst — anten vert alt lagra, eller ingenting
    const nye=[];
    for(const {c,inp,opne} of endra.values()){
      let v;
      if(c.opt){if(inp.value==='')continue;v=inp.value;}
      else if(c.num){
        if(inp.value.trim()===''){
          if(!c.valfri){feil.textContent=c.t+' kan ikkje stå tomt.';inp.focus();return;}
          v=null;
        }else{
          v=_liPos(inp.value,c.heil);
          if(v==null){feil.textContent=c.t+': må vere eit tal større enn 0.';inp.focus();return;}
        }
      }else{
        if(!inp.value.trim())continue;   // tomt namn = ingen endring
        v=inp.value;
      }
      nye.push({c,v,opne});
    }
    lukk();
    if(!nye.length){hintText.textContent='Ingen endringar.';return;}
    snapshot();
    nye.forEach(({c,v,opne})=>opne.forEach(r=>c.set(r,v)));
    markDirty();
    updateResults();renderTable();draw();
    renderListe();
    // Vis kva som vart endra
    const synlege=_liRader().rader;
    document.querySelectorAll('#listeTab tbody tr').forEach((tr,i)=>{
      if(!synlege[i])return;
      nye.forEach(({c,opne})=>{if(!opne.some(x=>x.key===synlege[i].key))return;
        const td=tr.querySelector('td[data-k="'+c.k+'"]');if(td)td.classList.add('endra');});
    });
    hintText.textContent=(maal.length>1?maal.length+' '+T.namn.toLowerCase().replace(/ \(.*\)$/,'')+' endra':'Endra')+': '
      +nye.map(({c})=>c.t.toLowerCase()).join(', ')+'. Ctrl+Z angrar.';
  };
  setTimeout(()=>{const f=box.querySelector('input,select');if(f){f.focus();if(f.select)f.select();}},30);
}
function _liTilTekst(){
  const {kol,rader}=_liRader();
  const ut=rader.some(r=>listeVal.has(r.key))?rader.filter(r=>listeVal.has(r.key)):rader;
  const fmt=(c,r)=>{const v=c.get(r)??(c.valfri&&c.ph&&typeof c.ph(r)==='number'?c.ph(r):null);return c.num?_liNum(v,c.des).replace('.',','):String(v??'');};
  return [kol.map(c=>c.t+(c.ein?' ['+c.ein+']':'')).join('\t'),...ut.map(r=>kol.map(c=>fmt(c,r)).join('\t'))].join('\n');
}
document.getElementById('listeBtn').onclick=opneListe;
document.getElementById('kopleBtn').onclick=()=>showKoplingsoversikt();
document.getElementById('listeLukk').onclick=()=>listeOverlay.classList.remove('show');
listeOverlay.addEventListener('click',e=>{if(e.target===listeOverlay)listeOverlay.classList.remove('show');});
document.getElementById('listeKopier').onclick=async()=>{
  try{await navigator.clipboard.writeText(_liTilTekst());hintText.textContent='Tabellen er kopiert — lim inn i Excel.';}
  catch(e){alert('Kunne ikkje kopiere til utklippstavla: '+e.message);}
};

// ── Slå saman fasadar — dialog ────────────────────────────────
// Éi side: samanslegne grupper øvst, så «etter himmelretning» (eitt klikk)
// og «vel sjølv». For kopla soner (groupId) finst i tillegg valet om å slå
// saman fasadane på TVERS av sonene — sjå koplaFasadarSaman().
// Kvar endring er eitt angre-steg (snapshot), og ein vegg ligg i høgst
// éi gruppe: medlemskap, aldri nøkkeloppslag på segmentlista.
const mergeBtn=document.getElementById('mergeBtn');
const mergeOverlay=document.getElementById('mergeOverlay');
let _mergeVal=null;   // {fi,zi} — sona dialogen viser

function buildMergeDialog(){
  saveFloorState();   // floors[activeFloor].zones må vere den same som zones
  const sel=document.getElementById('mergeZoneSel');
  sel.innerHTML='';
  const orderedFloors=[activeFloor,...floors.map((_,i)=>i).filter(i=>i!==activeFloor)];
  let defaultVal=null;
  orderedFloors.forEach(fi=>{
    const fl=floors[fi];
    if(!fl||!fl.zones.length)return;
    const og=document.createElement('optgroup');og.label=arkNamn(fl);
    fl.zones.forEach((z,zi)=>{
      const opt=document.createElement('option');
      opt.value=fi+','+zi;
      opt.textContent=z.name+(getLinkedZones(z).length>1?'  · kopla':'');
      og.appendChild(opt);
      if(defaultVal===null)defaultVal=fi+','+zi;
    });
    sel.appendChild(og);
  });
  // Hald på sona frå sist om ho framleis finst
  const sist=_mergeVal&&floors[_mergeVal.fi]?.zones[_mergeVal.zi]?_mergeVal.fi+','+_mergeVal.zi:null;
  if(sist||defaultVal)sel.value=sist||defaultVal;
  sel.onchange=renderMergeForZone;
  renderMergeForZone();
}

function _mergeSegA(z,gs){
  const ov=z.segOverrides?.[gs.idx]||{};
  return ov.areaM2??gs.areaM2??((ov.lenM??gs.lenM??0)*getHoyde(z))??0;
}
function _mergeOpnA(z,idxSet){
  return (z.windows||[]).filter(w=>idxSet.has(w.segIdx)).reduce((s,w)=>{
    const d=w.type==='dor';
    return s+Math.max(0.1,(w.hoyMm||(d?2100:1200))/1000)*Math.max(0.1,(w.breddeMm||(d?900:1200))/1000)*(w.antal||1);
  },0);
}
// Fjern veggane frå alle grupper dei ligg i; grupper med under to veggar fell bort
function _mergeFjernSegs(z,idxs){
  z.yvMergedGroups=(z.yvMergedGroups||[])
    .map(g=>({...g,segs:g.segs.filter(i=>!idxs.includes(i))}))
    .filter(g=>g.segs.length>1);
}
function _mergeEndra(fn){
  snapshot();
  fn();
  renderMergeForZone();updateResults();renderTable();draw();
}

function renderMergeForZone(){
  const val=document.getElementById('mergeZoneSel').value;
  const body=document.getElementById('mergeBody');
  body.innerHTML='';
  if(!val){body.innerHTML='<div class="mg-tom">Det finst ingen soner å slå saman fasadar i.</div>';return;}
  const [fi,zi]=val.split(',').map(Number);
  _mergeVal={fi,zi};
  const z=floors[fi]?.zones[zi];
  if(!z)return;
  if(!z.yvMergedGroups)z.yvMergedGroups=[];
  const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
  const labels=getFacadeLabels(z,segs);
  const lblOf=idx=>labels[segs.findIndex(s=>s.idx===idx)]||('Vegg '+(idx+1));
  const yv=segs.filter(s=>!(z.skillevegg||new Set()).has(s.idx)&&!isKjellervegg(z,s.idx));
  const harSkala=!!mppForZone(z);
  const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
  const tal=(area,opn)=>harSkala?fmtM2(area)+(opn?' · '+fmtM2(opn)+' opn.':''):'—';

  // ── Kopla soner: slå saman på tvers ──
  const linked=getLinkedZones(z);
  const kopla=linked.length>1&&koplaFasadarSaman(z);
  if(linked.length>1){
    const box=el('div','mg-kopla');
    const lab=el('label');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=kopla;
    cb.onchange=()=>_mergeEndra(()=>{linked.forEach(lz=>{if(cb.checked)lz.yvKoplaSaman=true;else delete lz.yvKoplaSaman;});});
    lab.append(cb,el('span',null,'Slå saman fasadane i dei '+linked.length+' kopla sonene — éin fasade per himmelretning'));
    box.appendChild(lab);
    const sub=el('div','mg-sub');
    sub.textContent=kopla
      ?'Ytterveggane i alle etasjane vert lagde saman etter himmelretning. Grupperingane per sone under gjeld ikkje så lenge dette er på.'
      :'Gjeld alle etasjane «'+z.name+'» ligg i. Gavlflater og skiljekonstruksjonar står for seg som før.';
    box.appendChild(sub);
    if(kopla){
      koplaFasadeGrupper(linked).forEach(g=>{
        const r=el('div','mg-rad kopla');
        r.append(el('span','mg-namn',g.dir),
          el('span','mg-info',g.segs.length+' fasadar i '+new Set(g.segs.map(x=>x.lz)).size+' etasjar'),
          el('span','mg-tal2',tal(g.area,g.opn)+' · '+g.az+'°'));
        box.appendChild(r);
      });
    }
    body.appendChild(box);
    if(kopla)return;
  }

  // ── Samanslegne grupper i sona ──
  const sekG=el('div','mg-sek');
  const hdrG=el('div','mg-hdr','Samanslegne');
  sekG.appendChild(hdrG);
  if(!z.yvMergedGroups.length)sekG.appendChild(el('div','mg-tom','Ingen fasadar er slegne saman i denne sona enno.'));
  z.yvMergedGroups.forEach((g,gi)=>{
    const grpSegs=segs.filter(s=>g.segs.includes(s.idx));
    const idx=new Set(g.segs);
    const area=grpSegs.reduce((a,gs)=>a+_mergeSegA(z,gs),0);
    const az=grpSegs.length?Math.round(circularMeanAz(grpSegs.map(s=>s.normalAz))):null;
    const r=el('div','mg-rad gruppe');
    const info=el('span','mg-info',g.segs.map(lblOf).join(', '));info.title=info.textContent;
    const b=el('button',null,'Del opp');
    b.onclick=()=>_mergeEndra(()=>{z.yvMergedGroups.splice(gi,1);});
    r.append(el('span','mg-namn',g.name),info,el('span','mg-tal2',tal(area,_mergeOpnA(z,idx))+(az!=null?' · '+az+'°':'')),b);
    sekG.appendChild(r);
  });
  if(z.yvMergedGroups.length>1){
    const alle=el('button','dcancel','Del opp alle');alle.style.cssText='font-size:11px;padding:3px 10px;margin-top:2px';
    alle.onclick=()=>_mergeEndra(()=>{z.yvMergedGroups=[];});
    sekG.appendChild(alle);
  }
  body.appendChild(sekG);

  // ── Etter himmelretning ──
  const iGruppe=new Set(z.yvMergedGroups.flatMap(g=>g.segs));
  const ledige=yv.filter(s=>!iGruppe.has(s.idx));
  const perRetn={};
  ledige.forEach(s=>{(perRetn[s.dir]=perRetn[s.dir]||[]).push(s);});
  const nyeAuto=Object.entries(perRetn).filter(([,a])=>a.length>1);
  const sekA=el('div','mg-sek');
  sekA.appendChild(el('div','mg-hdr','Etter himmelretning'));
  const bA=el('button','dok',nyeAuto.length
    ?'Slå saman etter himmelretning ('+nyeAuto.map(([d,a])=>d+' '+a.length).join(', ')+')'
    :'Ingen fleire fasadar med same himmelretning');
  bA.style.width='100%';bA.disabled=!nyeAuto.length;
  bA.onclick=()=>_mergeEndra(()=>{nyeAuto.forEach(([d,a])=>z.yvMergedGroups.push({segs:a.map(s=>s.idx),name:d}));});
  sekA.appendChild(bA);
  body.appendChild(sekA);

  // ── Vel sjølv ──
  const sekM=el('div','mg-sek');
  sekM.appendChild(el('div','mg-hdr','Vel sjølv'));
  const liste=el('div','mg-liste');
  const warn=el('div','mg-warn');warn.style.display='none';
  const namnI=document.createElement('input');namnI.type='text';namnI.className='big-input';namnI.placeholder='Namn (t.d. Nord)';
  const bM=el('button','dok','Slå saman valde');bM.disabled=true;
  const valde=()=>[...liste.querySelectorAll('input:checked')].map(c=>yv.find(s=>s.idx===+c.dataset.idx));
  const oppdater=()=>{
    const v=valde(),dirs=[...new Set(v.map(s=>s.dir))];
    bM.disabled=v.length<2;
    bM.textContent=v.length>1?'Slå saman '+v.length+' fasadar':'Slå saman valde';
    namnI.placeholder='Namn (t.d. '+(dirs[0]||'Nord')+')';
    warn.style.display=dirs.length>1?'':'none';
    warn.textContent='⚠ Ulike himmelretningar ('+dirs.join(', ')+'). SIMIEN får snittretninga — soltilskotet vert grovare.';
  };
  ['Nord','Nordøst','Øst','Sørøst','Sør','Sørvest','Vest','Nordvest'].forEach(d=>{
    const ds=yv.filter(s=>s.dir===d);
    if(!ds.length)return;
    liste.appendChild(el('div','mg-retn',d));
    ds.forEach(s=>{
      const lab=el('label','mg-val');
      const cb=document.createElement('input');cb.type='checkbox';cb.dataset.idx=s.idx;cb.onchange=oppdater;
      const g=z.yvMergedGroups.find(g=>g.segs.includes(s.idx));
      lab.append(cb,el('span',null,lblOf(s.idx)+(g?'  ·  i «'+g.name+'»':'')),el('span','mg-tal2',tal(_mergeSegA(z,s),_mergeOpnA(z,new Set([s.idx])))));
      liste.appendChild(lab);
    });
  });
  if(!yv.length)liste.appendChild(el('div','mg-tom','Sona har ingen ytterveggar å slå saman.'));
  bM.onclick=()=>{
    const v=valde();if(v.length<2)return;
    const idxs=v.map(s=>s.idx);
    const name=namnI.value.trim()||[...new Set(v.map(s=>s.dir))][0];
    // Ein vegg kan berre liggje i éi gruppe — flytt han frå den gamle
    _mergeEndra(()=>{_mergeFjernSegs(z,idxs);z.yvMergedGroups.push({segs:idxs,name});});
  };
  const btnRad=el('div','mg-btnrad');btnRad.append(namnI,bM);
  sekM.append(liste,warn,btnRad);
  body.appendChild(sekM);
}

mergeBtn.onclick=()=>{
  buildMergeDialog();
  mergeOverlay.classList.add('show');
};
document.getElementById('mergeDone').onclick=()=>mergeOverlay.classList.remove('show');
mergeOverlay.addEventListener('click',e=>{if(e.target===mergeOverlay)mergeOverlay.classList.remove('show');});

