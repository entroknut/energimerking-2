// ── Results / sidebar ─────────────────────────────────────────
// Ankeret for scroll-posisjonen i sonelista: ELEMENTET brukaren arbeider med
// (fokus, eller det som sist vart klikka) om det er synleg, elles det øvste
// synlege kortet. Elementet — ikkje toppen av kortet — fordi ei endring ofte
// gjer rader over i same kort høgare (SK-rader får «Slå saman»-knappar).
// Elementet vert funne att i det nybygde kortet via stien av barneindeksar.
let _zlistSist=null;   // {key, path}
// Stabil nøkkel per sone for all tilstand i sidepanelet: samanslegne kort,
// tak/golv-seksjonar, vindaugslister, rulleankeret og korthøgdene. Indeksen
// (`z_${fi}_${zi}`) dugde ikkje — slett eller del ei sone, og tilstanden flytta
// seg til kortet under; lista hoppa fordi ankeret og høgdene høyrde til feil kort.
// Følgjer med i angre-historikken (spread), men vert ikkje lagra i fila
// (serialiserEtasje fjernar han). Kopiar arvar nøkkelen — updateResults gir
// difor duplikat ein ny.
let _zukN=0;
function _zuk(z){if(!z._uk)z._uk='u'+Date.now().toString(36)+'_'+(++_zukN);return z._uk;}
function _zlistSti(card,el){
  const p=[];
  while(el&&el!==card){const par=el.parentElement;if(!par)return null;p.unshift([...par.children].indexOf(el));el=par;}
  return el===card?p:null;
}
function _zlistFrSti(card,p){
  let el=card;
  for(const i of p||[]){const n=el.children[i];if(!n)return el;el=n;}
  return el;
}
document.addEventListener('pointerdown',e=>{
  const c=e.target.closest&&e.target.closest('.zcard');
  if(c)_zlistSist={key:c.dataset.zkey,path:_zlistSti(c,e.target)};
},true);
// Billeg innhaldssignatur for eit sonekort — berre DOM, ingen layout.
// Endrar ho seg, kan høgda ha endra seg, og den lagra høgda er ikkje til å stole på.
function _zcardSig(c){return c.getElementsByTagName('*').length+':'+c.textContent.length;}
function _zlistAnker(sp){
  const pr=sp.getBoundingClientRect();
  const synleg=el=>{const r=el.getBoundingClientRect();return r.bottom>pr.top&&r.top<pr.bottom;};
  const kort=[...zlist.querySelectorAll('.zcard')];
  const mk=(c,el)=>({key:c.dataset.zkey,path:el?_zlistSti(c,el):[],dy:(el||c).getBoundingClientRect().top-pr.top});
  const ae=document.activeElement;
  const ac=ae&&ae.closest?ae.closest('.zcard'):null;
  if(ac&&synleg(ae))return mk(ac,ae);
  if(_zlistSist){
    const c=kort.find(k=>k.dataset.zkey===_zlistSist.key);
    const el=c&&_zlistFrSti(c,_zlistSist.path);
    if(el&&synleg(el))return mk(c,el);
    if(c&&synleg(c))return mk(c,null);
  }
  const c=kort.find(k=>k.getBoundingClientRect().bottom>pr.top);
  return c?mk(c,null):null;
}
// Set scrollTop slik at ankeret står der det stod — no, og så kvar gong eit
// kort endrar storleik dei neste 400 ms. Nybygde kort får fyrst ekte storleik
// når nettlesaren teiknar dei (content-visibility), og ResizeObserver fyrer
// etter layout men FØR skjermen vert oppdatert, så rettinga syner aldri som
// eit hopp. Rullar brukaren sjølv, sluttar vi straks.
let _zlistRO=null;
function _zlistTilAnker(sp,a){
  if(_zlistRO){_zlistRO.stopp();_zlistRO=null;}
  if(!a)return;
  const juster=()=>{
    const c=zlist.querySelector('.zcard[data-zkey="'+a.key+'"]');
    if(!c)return;
    const el=_zlistFrSti(c,a.path);
    const d=el.getBoundingClientRect().top-sp.getBoundingClientRect().top-a.dy;
    if(Math.abs(d)>=0.5)sp.scrollTop+=d;
  };
  juster();
  if(typeof ResizeObserver==='undefined')return;
  const ro=new ResizeObserver(()=>juster());
  zlist.querySelectorAll('.zcard').forEach(c=>ro.observe(c));
  const brukar=()=>stopp();
  const hend=['wheel','touchstart','keydown','mousedown'];
  const stopp=()=>{
    ro.disconnect();clearTimeout(t);
    hend.forEach(h=>sp.removeEventListener(h,brukar,true));
    if(_zlistRO&&_zlistRO.stopp===stopp)_zlistRO=null;
  };
  hend.forEach(h=>sp.addEventListener(h,brukar,true));
  const t=setTimeout(stopp,400);
  _zlistRO={stopp};
}
// ── Finn sonekortet att ──
// På store bygg er sonelista lang. Tre ting hjelper: klikk på ei sone i
// teikninga får kortet fram (visSonekort), musa over sona eller kortet merkjer
// det andre, og lista kan filtrerast på etasje og namn. Filteret er berre
// visning — tabell, BRA og eksport ser alle soner — og vert ikkje lagra.
// Det seier alltid frå kor mange kort det gøymer.
let zlistBerreEtg=false;
let zlistSok='';
let _kortHover=null;   // sona musa er over i sonelista → utheva i teikninga
let _kortHoverSegs=null;   // {k, segs:Set} — konstruksjonsrada musa er over (veggane i _kortHover)
let _planHoverZ=null;  // sona musa er over i teikninga → ramme på kortet
function _fleireEtasjar(){return floors.filter(f=>!erDelplan(f)).length>1;}
function _iSonelista(f,z){
  // Delplanane høyrer til same etasje — «denne etasjen» er heile arkgruppa
  if(zlistBerreEtg&&_fleireEtasjar()&&!etasjeArk(curFloor()).includes(f))return false;
  const q=zlistSok.trim().toLowerCase();
  if(q&&!(z.name||'').toLowerCase().includes(q))return false;
  return true;
}
function _nullstillSonefilter(){
  zlistBerreEtg=false;zlistSok='';
  const s=document.getElementById('zlistSok');if(s)s.value='';
}
function _kortFor(z){return zlist.querySelector('.zcard[data-zkey="z_'+_zuk(z)+'"]');}
function _markerKort(z){
  if(z===_planHoverZ)return;
  if(_planHoverZ){const c=_kortFor(_planHoverZ);if(c)c.classList.remove('planhover');}
  _planHoverZ=z||null;
  if(_planHoverZ){const c=_kortFor(_planHoverZ);if(c)c.classList.add('planhover');}
}
// Rull fram kortet til sona, opne det og la det blinke.
function visSonekort(z){
  const fl=floors.find(f=>f.zones.includes(z));
  if(!fl)return;
  const tab=document.querySelector('.stab[data-tab="zones"]');
  if(tab&&!tab.classList.contains('on'))tab.click();
  let melding='';
  // Nullstill berre det filteret som gøymer kortet
  if(zlistSok&&!(z.name||'').toLowerCase().includes(zlistSok.trim().toLowerCase())){
    zlistSok='';const s=document.getElementById('zlistSok');if(s)s.value='';
    melding=' — søket i sonelista er tømt';
  }
  if(!_iSonelista(fl,z)){zlistBerreEtg=false;melding=' — «Berre denne etasjen» er slått av';}
  const key='z_'+_zuk(z);
  if(!window._zcardCollapsed)window._zcardCollapsed={};
  window._zcardCollapsed[key]=false;
  updateResults();
  const card=_kortFor(z);
  const sp=document.getElementById('spanel');
  if(!card||!sp)return;
  // Kortet er sist klikka: rulleankeret held det i ro ved neste ombygging
  _zlistSist={key,path:[]};
  if(_zlistRO){_zlistRO.stopp();_zlistRO=null;}
  // Korta over har gjetta høgder (content-visibility) som vert rette fyrst
  // når dei er teikna. Difor same rullinga nokre gonger dei fyrste framene.
  const filt=document.getElementById('zlistFilter');
  const rull=()=>{
    // Under den faste filterraden, ikkje bak henne
    const topp=filt&&filt.offsetHeight?filt.getBoundingClientRect().bottom:sp.getBoundingClientRect().top;
    const d=card.getBoundingClientRect().top-topp-8;
    if(Math.abs(d)>=1)sp.scrollTop+=d;
  };
  rull();
  requestAnimationFrame(()=>{rull();requestAnimationFrame(rull);});
  setTimeout(rull,120);
  card.classList.remove('blink');void card.offsetWidth;card.classList.add('blink');
  setTimeout(()=>card.classList.remove('blink'),1400);
  if(melding)hintText.textContent='Viser sonekortet til «'+z.name+'»'+melding;
}
(()=>{
  const sok=document.getElementById('zlistSok');
  const etg=document.getElementById('zlistEtgBtn');
  let t=null;
  sok.addEventListener('input',()=>{
    clearTimeout(t);
    t=setTimeout(()=>{zlistSok=sok.value;updateResults();},120);
  });
  sok.addEventListener('keydown',e=>{
    e.stopPropagation();   // Ctrl+Z/C/V i feltet skal ikkje treffe teikninga
    if(e.key==='Escape'){sok.value='';zlistSok='';updateResults();sok.blur();}
    if(e.key==='Enter'){
      // Enter: zoom til det fyrste treffet
      const c=zlist.querySelector('.zcard');
      if(c&&c._z){const fi=floors.findIndex(f=>f.zones.includes(c._z));
        if(fi>=0&&fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();updateResults();}
        zoomToZone(c._z);}
    }
  });
  etg.addEventListener('click',()=>{zlistBerreEtg=!zlistBerreEtg;updateResults();});
  // Musa over eit kort → sona vert utheva i teikninga. Delegert på lista, sidan
  // korta vert bygde på nytt heile tida.
  zlist.addEventListener('mouseover',e=>{
    const c=e.target.closest&&e.target.closest('.zcard');
    const z=c?c._z||null:null;
    // Rad i Konstruksjonar → berre dei veggane, ikkje heile sona
    const r=c&&e.target.closest('[data-hsegs]');
    const hs=r?r.dataset.hsegs:null;
    if(z!==_kortHover||hs!==(_kortHoverSegs?.k??null)){
      _kortHover=z;
      _kortHoverSegs=hs?{k:hs,segs:new Set(hs.split(',').map(Number))}:null;
      draw();
    }
  });
  zlist.addEventListener('mouseleave',()=>{if(_kortHover||_kortHoverSegs){_kortHover=null;_kortHoverSegs=null;draw();}});
})();
// Namn + tal for ei samla rad i Konstruksjonar (SK samla, YV samla,
// sonekopling): to linjer som kuttar med «…» i staden for å bryte ord for ord.
function _kgrpTekst(nameTag,statsSpan){
  const t=document.createElement('div');t.className='kgrp-t';
  t.appendChild(nameTag);t.appendChild(statsSpan);
  return t;
}
function updateResults(){
  const allZones=floors.flatMap((f,fi)=>f.zones.map((z,zi)=>({z,zi,fi,f})));
  const hasZones=allZones.length>0;
  emptyEl.style.display=hasZones?'none':'block';
  const _toolbar=document.getElementById('zlistToolbar');
  if(_toolbar)_toolbar.style.display=hasZones?'flex':'none';
  const _filterRad=document.getElementById('zlistFilter');
  if(_filterRad){
    _filterRad.style.display=hasZones?'flex':'none';
    const eb=document.getElementById('zlistEtgBtn');
    eb.style.display=_fleireEtasjar()?'':'none';
    eb.classList.toggle('on',zlistBerreEtg);
  }
  let _filtrerte=0;
  // Bevar scroll-posisjonen: forankra på eit kort, ikkje på scrollTop åleine.
  // Korta over kan endre høgd (avrunding, content-visibility som fyrst får
  // storleik i neste frame), og då glei lista under brukaren for kvar endring.
  const _spanel=document.getElementById('spanel');
  const _savedScroll=_spanel?_spanel.scrollTop:0;
  const _anker=_spanel?_zlistAnker(_spanel):null;
  // Høgda på kvart kort frå førre runde, så content-visibility kan reservere
  // rett plass til dei nybygde korta og lista ikkje hoppar under rullinga.
  // Eit kort som var hoppa over rapporterer den reserverte høgda, altså det
  // same talet som sist — verdien held seg sjølv ved like.
  if(!window._zcardH)window._zcardH={};
  if(!window._zcardEkte)window._zcardEkte=new Set();
  if(!window._zcardSig)window._zcardSig={};
  zlist.querySelectorAll('.zcard').forEach(c=>{
    const k=c.dataset.zkey;
    // Brøkdelen må med: avrunda høgder hopar seg opp over alle korta over.
    // contain-intrinsic-size er innhaldshøgda UTAN kantlinja (1 px topp og
    // botn) — med kantlinja vart kvart nybygd kort 2 px for høgt til det
    // vart teikna, og lista glei etter eit par frames.
    const h=c.getBoundingClientRect().height-2*c.clientTop;
    // Eit kort som er hoppa over rapporterer berre plasshaldaren. Lagra vi
    // den som fasit, såg kortet «kjent» ut og vart aldri målt. Difor tel
    // høgda som ekte berre når ho skil seg frå plasshaldaren kortet hadde
    // (då er kortet teikna, eller nettlesaren hugsar ein teikna storleik).
    if(!k||!h)return;
    const ph=parseFloat((c.style.getPropertyValue('contain-intrinsic-size')||'').replace('auto',''))||320;
    if(Math.abs(h-ph)>0.5){window._zcardH[k]=h;window._zcardEkte.add(k);window._zcardSig[k]=_zcardSig(c);}
  });
  zlist.innerHTML='';
  {const sett=new Set();
   floors.forEach(f=>f.zones.forEach(z=>{if(z._uk&&sett.has(z._uk))delete z._uk;sett.add(_zuk(z));}));}
  // Sonekorta vert bygde utanfor dokumentet og sette inn i éin operasjon.
  // Å leggje dei inn eitt for eitt i live DOM tvingar fram omrekning av
  // layout for kvart kort, og det dominerer kostnaden ved mange soner.
  const _zfrag=document.createDocumentFragment();


  // BRA-sammendrag i etasjefane-baren
  const braEl=document.getElementById('braSummary');
  if(braEl&&mmPerImgPx){
    const floorBRA=curFloor().zones.reduce((s,z)=>{const a=getAreaM2(z);return s+(a||0);},0);
    const totalBRA=floors.flatMap(f=>f.zones).reduce((s,z)=>{const a=getAreaM2(z);return s+(a||0);},0);
    braEl.innerHTML=`<span title="BRA i aktiv etasje" style="color:var(--accent);font-weight:600">${floorBRA.toFixed(1)} m²</span><span style="color:var(--border2)">|</span><span title="Totalt BRA alle etasjar">Σ ${totalBRA.toFixed(1)} m²</span>`;
  } else if(braEl){
    braEl.innerHTML='';
  }

  const BYGG_KAT=['Småhus','Boligblokker','Barnehager','Kontorbygg',
    'Skolebygg','Universitets- og høgskolebygg','Sykehus','Sykehjem',
    'Hoteller','Idrettsbygg','Forretningsbygg','Kulturbygg','Lett industri, verksteder'];

  floors.forEach((f,fi)=>{
    if(!f.zones.length)return;
    f.zones.forEach((z,zi)=>{
      if(!_iSonelista(f,z)){_filtrerte++;return;}
      // Grupperte soner: alle i gruppa brukar fargen til den fyrste i gruppa (global indeks)
      const linked=getLinkedZones(z);
      const isGrouped=linked.length>1;
      let ci;
      if(isGrouped&&z.groupId){
        // Finn den globale zone-indeksen til den FYRSTE sona i gruppa
        const allZF=floors.flatMap((fl,fli2)=>fl.zones.map((zz,zzi)=>({z:zz,fli:fli2,zi:zzi})));
        const firstInGroup=allZF.find(({z:zz})=>zz.groupId===z.groupId);
        ci=firstInGroup?(floors.slice(0,firstInGroup.fli).reduce((s,fl)=>s+fl.zones.length,0)+firstInGroup.zi)%COLORS.length:zi%COLORS.length;
      } else {
        // Global fargeindeks: sum av alle soner på tidlegare etasjar + zi
        ci=(floors.slice(0,fi).reduce((s,fl)=>s+fl.zones.length,0)+zi)%COLORS.length;
      }
      const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z));
      // Areal og volum alltid per sone — kopla soner summeres berre i SXI/SIMIEN
      const dispArea=getAreaM2(z);
      const dispVolum=getVolum(z);
      const std=entroStandard(z.byggeaar);

      const zoneKey=`z_${_zuk(z)}`;
      if(!window._zcardCollapsed)window._zcardCollapsed={};
      const isCollapsed=!!window._zcardCollapsed[zoneKey];

      const card=document.createElement('div');
      card.className='zcard'+(mode==='edit'&&fi===activeFloor&&editZoneIdx===zi?' editing':'')+(isCollapsed?' collapsed':'')+(z.skjult?' skjult':'');
      card.style.setProperty('--zcard-color', COLORS[ci]);
      card.dataset.zkey=zoneKey;
      card._z=z;
      if(z===_planHoverZ)card.classList.add('planhover');
      // Utan kjend høgd: eit samanslege kort er berre headeren (~40 px), så
      // 320 px-standarden ville gjort rullelista fleire hundre px for lang.
      const _hHint=window._zcardH[zoneKey]||(isCollapsed?40:0);
      if(_hHint)card.style.setProperty('contain-intrinsic-size','auto '+_hHint+'px');

      // ── Klikkbar header ──
      const cardHeader=document.createElement('div');cardHeader.className='zcard-header';
      const dot=document.createElement('div');dot.className='zdot';dot.style.cssText=`background:${COLORS[ci]};flex-shrink:0;cursor:pointer`;
      dot.title='Klikk for å gå til sona i teikninga';
      // Namnet tek det meste av headeren. Som skrivefelt heile tida stal det
      // klikket, og berre ein smal stripe var att til å navigere med. Difor:
      // klikk = gå til sona (som resten av headeren), dobbeltklikk = endre namn.
      const inp=document.createElement('input');inp.className='zname-input';inp.value=z.name;
      inp.readOnly=true;
      const _redigerNamn=()=>{inp.readOnly=false;inp.focus();inp.select();};
      inp.onchange=()=>{z.name=inp.value.trim()||z.name;draw();renderTable();markDirty();};
      inp.onkeydown=e=>{
        if(inp.readOnly){if(e.key==='Enter'||e.key==='F2'){e.preventDefault();_redigerNamn();}return;}
        if(e.key==='Enter')inp.blur();
        if(e.key==='Escape'){inp.value=z.name;inp.blur();}
      };
      inp.onblur=()=>{inp.readOnly=true;};
      inp.onmousedown=e=>{if(inp.readOnly)e.preventDefault();};   // ingen markør/markering ved klikk
      inp.onclick=e=>{if(!inp.readOnly)e.stopPropagation();};
      inp.ondblclick=e=>{e.stopPropagation();_redigerNamn();};
      inp.title='Klikk for å gå til sona i teikninga · dobbeltklikk for å endre namnet';
      cardHeader.appendChild(dot);cardHeader.appendChild(inp);
      if(floors.length>1){
        const ftag=document.createElement('span');
        ftag.style.cssText='font-size:10px;color:var(--text3);white-space:nowrap;flex-shrink:0';
        ftag.textContent=arkNamn(f);
        cardHeader.appendChild(ftag);
      }
      const areaPreview=document.createElement('span');
      areaPreview.className='zc-areaprev';areaPreview.style.cssText=`font-size:11px;color:var(--text3);font-family:inherit;white-space:nowrap;flex-shrink:0;display:${isCollapsed?'inline':'none'}`;
      areaPreview.textContent=dispArea!=null?dispArea.toFixed(1)+' m²':'—';
      cardHeader.appendChild(areaPreview);
      const eye=document.createElement('button');
      eye.className='zeye';eye.type='button';
      const _syncEye=()=>{
        eye.innerHTML=z.skjult?EYE_OFF_SVG:EYE_SVG;
        eye.title=z.skjult?'Sona er skjult i planteikninga og modellen — klikk for å vise':'Skjul sona i planteikninga og modellen';
      };
      _syncEye();
      eye.onclick=e=>{
        e.stopPropagation();
        setSkjult(z,fi,zi,!z.skjult);
        card.classList.toggle('skjult',!!z.skjult);
        _syncEye();_updateSkjulAllBtn();
        markDirty();draw();_rebuild3DDebounced();
      };
      cardHeader.appendChild(eye);
      const chevron=document.createElement('div');chevron.className='zcard-chevron';
      chevron.innerHTML=`<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,4 6,8 10,4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      cardHeader.appendChild(chevron);
      // Enkelt klikk på chevron/kant = toggle kollaps
      // Enkelt klikk på hovuddelen = zoom til sona
      cardHeader._zoomTarget=()=>{
        if(fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
        zoomToZone(z);
      };
      chevron.onclick=e=>{
        e.stopPropagation();
        window._zcardCollapsed[zoneKey]=!window._zcardCollapsed[zoneKey];
        card.classList.toggle('collapsed');
        if(!card.classList.contains('collapsed')&&card._buildBody){card._buildBody();card._buildBody=null;}
        areaPreview.style.display=card.classList.contains('collapsed')?'inline':'none';
        _updateCollapseAllBtn();
      };
      cardHeader.onclick=e=>{
        if(e.target===chevron||chevron.contains(e.target)||(e.target===inp&&!inp.readOnly))return;
        cardHeader._zoomTarget();
      };
      card.appendChild(cardHeader);

      // ── Body ──
      const cardBody=document.createElement('div');cardBody.className='zcard-body';
      card.appendChild(cardBody);
      // nameRow alias — all vidare kode append til cardBody
      const nameRow=cardBody;
      // Sjølve innhaldet i kortet er det dyre: ~130 av dei ~5300 nodene i
      // panelet ved 36 soner ligg her, og eit samanslege kort viser dei aldri
      // (`.zcard.collapsed .zcard-body{display:none}`). Difor byggjer vi berre
      // opne kort no, og lagrar byggjaren på kortet til brukaren opnar det.
      // Chevron-handlaren over og `_toggleAllZcards` kallar han.
      const _buildBody=()=>{

      // ── Grouped zone badge + breakdown ──
      if(isGrouped){
        // Éi linje med tal og sum; lista bak ein chevron. Store grupper (ti-
        // tals soner over mange etasjar) startar samanlagde, og ei open liste
        // rullar i staden for å strekkje kortet. Klikk på ei rad viser kortet.
        const kpKey=`kp_${_zuk(z)}`;
        if(!window._koplaCollapsed)window._koplaCollapsed={};
        if(window._koplaCollapsed[kpKey]===undefined)
          window._koplaCollapsed[kpKey]=linked.length>KOPLA_AUTO_COLLAPSE;
        const breakdown=document.createElement('div');
        breakdown.className='kp-box'+(window._koplaCollapsed[kpKey]?' collapsed':'');
        const totalA=getTotalAreaM2(z);
        const bHdr=document.createElement('div');bHdr.className='kp-hdr';
        bHdr.title='Klikk for å vise/skjule dei kopla sonene';
        bHdr.innerHTML='<span class="sub-chevron"><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,4 6,8 10,4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
          +'<span class="kp-tit"></span><span class="kp-sum"></span>';
        bHdr.querySelector('.kp-tit').textContent='Kopla med '+(linked.length-1)+' andre';
        bHdr.querySelector('.kp-sum').textContent='Σ '+(totalA!=null?totalA.toFixed(1)+' m²':'—');
        bHdr.onclick=()=>{
          const ny=!window._koplaCollapsed[kpKey];
          window._koplaCollapsed[kpKey]=ny;
          breakdown.classList.toggle('collapsed',ny);
        };
        breakdown.appendChild(bHdr);
        const kl=document.createElement('div');kl.className='kp-liste';
        linked.forEach(lz=>{
          const lf=floors.find(fl=>fl.zones.includes(lz));
          const la=getAreaM2(lz);
          const row=document.createElement('div');
          row.className='kp-rad'+(lz===z?' cur':'');
          const n=document.createElement('span');n.className='kp-namn';n.textContent=lz.name;
          if(lf&&floors.length>1){const e=document.createElement('span');e.className='kp-etg';e.textContent=arkNamn(lf);n.appendChild(e);}
          const a=document.createElement('span');a.className='kp-a';a.textContent=la!=null?la.toFixed(1)+' m²':'—';
          row.appendChild(n);row.appendChild(a);
          if(lz!==z){row.title='Vis sonekortet';row.onclick=()=>visSonekort(lz);}
          kl.appendChild(row);
        });
        breakdown.appendChild(kl);
        cardBody.appendChild(breakdown);
      }

      // ── Key metrics: 2-col grid ──
      const grid=document.createElement('div');
      grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px';
      const mkStat=(label,value,sub)=>{
        const el=document.createElement('div');
        el.style.cssText='background:var(--surface2);border-radius:6px;padding:6px 8px';
        el.innerHTML=`<div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${label}</div>`
          +`<div style="font-size:13px;font-weight:700;color:var(--text);font-family:inherit;line-height:1.2">${value}</div>`
          +(sub?`<div style="font-size:10px;color:var(--text3)">${sub}</div>`:'');
        return el;
      };
      const areaDisp=dispArea!=null?dispArea.toFixed(1)+' m²':'—';
      const volDisp=dispVolum!=null?dispVolum.toFixed(0)+' m³':'—';
      grid.appendChild(mkStat('Areal',areaDisp,z.areaOverride!=null?'✎ manuelt':null));
      grid.appendChild(mkStat('Volum',volDisp));
      // Skrått takareal — summen over delflatene når taket er delt opp
      if(harFlater(z,'tak')){
        let flatT=0,skraaT=0,maxV=0,nTak=0;
        flateListe(z,'tak').forEach(fl=>{
          if(flateType(z,'tak',fl)!=='Tak')return;
          const fa=flateAreaM2(z,fl),v=Math.max(0,fl.vinkel||0);
          flatT+=fa;skraaT+=v>0?fa/Math.cos(v*Math.PI/180):fa;
          if(v>maxV)maxV=v;nTak++;
        });
        if(nTak&&skraaT-flatT>0.05){
          grid.appendChild(mkStat('Tak skrått',skraaT.toFixed(1)+' m²',nTak+' flate'+(nTak>1?'r':'')+' · opptil '+maxV+'°'));
          grid.appendChild(mkStat('Takareal flat',flatT.toFixed(1)+' m²','Horisontalt'));
        }
      } else {
        const tvDeg=getTakvinkel(z);
        if(tvDeg>0&&(z.taktype||'Tak')==='Tak'){
          const skraaA=getTakAreal(z);
          const skraaDisp=skraaA!=null?skraaA.toFixed(1)+' m²':'—';
          const pitchMult=(1/Math.cos(tvDeg*Math.PI/180));
          grid.appendChild(mkStat('Tak skrått',skraaDisp,'∠'+tvDeg+'° → ×'+pitchMult.toFixed(3)));
          grid.appendChild(mkStat('Takareal flat',dispArea!=null?dispArea.toFixed(1)+' m²':'—','Horisontalt'));
        }
      }
      cardBody.appendChild(grid);

      // ── Settings: kategori, byggeår, høyde ──
      const settings=document.createElement('div');
      settings.style.cssText='display:flex;flex-direction:column;gap:4px';

      const mkRow=(label, content)=>{
        const r=document.createElement('div');
        r.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px';
        const l=document.createElement('span');
        l.style.cssText='font-size:11px;color:var(--text3);white-space:nowrap;min-width:72px';
        l.textContent=label;
        r.appendChild(l);r.appendChild(content);
        return r;
      };

      // Bygningskategori
      const bkSel=document.createElement('select');bkSel.className='zone-select';bkSel.style.cssText='padding:3px 6px;font-size:11px;flex:1';
      BYGG_KAT.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;if(k===(z.bygkat||'Kontorbygg'))o.selected=true;bkSel.appendChild(o);});
      bkSel.onchange=()=>{z.bygkat=bkSel.value;renderTable();};
      settings.appendChild(mkRow('Kategori',bkSel));

      // Byggeår + apply-all
      const byWrap=document.createElement('div');byWrap.style.cssText='display:flex;align-items:center;gap:5px;flex:1';
      const byInp=document.createElement('input');byInp.type='number';byInp.min='1800';byInp.max='2030';byInp.placeholder='t.d. 1985';byInp.value=z.byggeaar||'';
      byInp.style.cssText="width:70px;padding:3px 6px;font-size:11px;border:1px solid var(--border2);border-radius:4px;text-align:right;background:var(--surface);font-family:inherit";
      byInp.title=(piBygg.byggeaar&&z.byggeaar===piBygg.byggeaar)
        ?'Byggeår frå EntroPi ('+piBygg.byggeaar+') — skriv over for å endre'
        :'Byggeår for denne sona';
      const allBtn=document.createElement('button');
      allBtn.textContent='Alle';
      allBtn.title='Kopier dette byggeåret til alle soner';
      allBtn.style.cssText='padding:2px 7px;font-size:11px;border:1px solid var(--border2);border-radius:4px;background:var(--surface2);color:var(--text3);cursor:pointer;font-family:inherit;white-space:nowrap';
      allBtn.onmouseenter=()=>{allBtn.style.borderColor='var(--accent)';allBtn.style.color='var(--accent)';};
      allBtn.onmouseleave=()=>{allBtn.style.borderColor='var(--border2)';allBtn.style.color='var(--text3)';};
      byInp.onchange=()=>{
        const yr=parseInt(byInp.value)||null;
        z.byggeaar=yr;
        updateResults();renderTable();
      };
      allBtn.onclick=()=>{
        const yr=parseInt(byInp.value)||null;
        if(!yr){byInp.focus();return;}
        floors.forEach(fl=>fl.zones.forEach(oz=>{oz.byggeaar=yr;}));
        updateResults();renderTable();
      };
      byWrap.appendChild(byInp);byWrap.appendChild(allBtn);
      settings.appendChild(mkRow('Byggeår',byWrap));

      // Etasjehøyde + himlingshøgde
      const hWrap=document.createElement('div');hWrap.style.cssText='display:flex;align-items:center;gap:4px;flex:1';
      const hInp=document.createElement('input');hInp.type='number';hInp.min='0.1';hInp.step='0.1';hInp.value=getHoyde(z);
      hInp.style.cssText="width:60px;padding:3px 6px;font-size:11px;border:1px solid var(--border2);border-radius:4px;text-align:right;background:var(--surface);font-family:inherit";
      const hU=document.createElement('span');hU.style.cssText='font-size:11px;color:var(--text3)';hU.textContent='m';
      hInp.onchange=()=>{const v=parseFloat(hInp.value);z.hoyde=(isNaN(v)||v<=0)?null:v;updateResults();renderTable();draw();};
      hWrap.appendChild(hInp);hWrap.appendChild(hU);
      settings.appendChild(mkRow('Etg.høyde',hWrap));

      // Himlingshøgde (valfri — kun volum)
      const himWrap=document.createElement('div');himWrap.style.cssText='display:flex;align-items:center;gap:5px;flex:1';
      const himCb=document.createElement('input');himCb.type='checkbox';himCb.style.cssText='cursor:pointer;accent-color:var(--accent)';himCb.checked=z.himling!=null;
      const himCbLbl=document.createElement('span');himCbLbl.style.cssText='font-size:11px;color:var(--text3)';himCbLbl.textContent='Eigen himlingshøgde';
      const himInp=document.createElement('input');himInp.type='number';himInp.min='0.1';himInp.step='0.1';himInp.value=z.himling!=null?z.himling:getHoyde(z);
      himInp.style.cssText=`width:52px;padding:3px 6px;font-size:11px;border:1px solid var(--border2);border-radius:4px;text-align:right;background:var(--surface);font-family:inherit;display:${z.himling!=null?'block':'none'}`;
      const himU=document.createElement('span');himU.style.cssText=`font-size:11px;color:var(--text3);display:${z.himling!=null?'inline':'none'}`;himU.textContent='m';
      himCb.onchange=()=>{
        if(himCb.checked){himInp.style.display='block';himU.style.display='inline';himInp.value=getHoyde(z);z.himling=getHoyde(z);}
        else{himInp.style.display='none';himU.style.display='none';z.himling=null;}
        updateResults();renderTable();
      };
      himInp.onchange=()=>{const v=parseFloat(himInp.value);z.himling=(isNaN(v)||v<=0)?null:v;updateResults();renderTable();};
      himWrap.appendChild(himCb);himWrap.appendChild(himCbLbl);himWrap.appendChild(himInp);himWrap.appendChild(himU);
      settings.appendChild(mkRow('Himling',himWrap));

      // ── Tak og golv ──────────────────────────────────────
      // Begge laga kan delast opp i fleire flater med kvar sin
      // konstruksjonstype. byggFlateSeksjon byggjer begge.
      byggFlateSeksjon(z,'gulv',fi,zi,settings);
      byggFlateSeksjon(z,'tak',fi,zi,settings);

      // Standard U-verdiar badge
      if(std){
        const uBadge=document.createElement('div');
        uBadge.style.cssText='margin-top:2px;padding:5px 8px;background:var(--accent-dim);border-radius:6px;font-size:11px;color:var(--accent);cursor:pointer;display:flex;justify-content:space-between;align-items:center';
        const uvManuell=[z.uVegg,z.uTak,z.uGulv,z.uVindu,z.n50].filter(v=>v!=null).length;
        uBadge.innerHTML=`<span style="font-weight:600">U-verdiar: standard ${z.byggeaar}</span><span style="opacity:.7;font-size:10px">${uvManuell?uvManuell+' manuelt':'→ sjå tabell'}</span>`;
        uBadge.title='U-verdiar og n50 redigerast i Tabell-fana';
        uBadge.onclick=()=>{
          document.querySelector('.stab[data-tab="table"]').click();
        };
        settings.appendChild(uBadge);
      }

      cardBody.appendChild(settings);

      // Vindauge, dører og gavlflater står under konstruksjonane, ikkje rett
      // over knapperada — der såg knappane ut til å høyre til vindaugslista.
      const _etterKonstr=document.createDocumentFragment();

      // ── Fasadar kompakt (kun YV med vindauge) ──
      if(segs&&(z.windows||[]).length>0){
        const winSummary=document.createElement('div');
        winSummary.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid var(--border)';

        // Kollapsbar liste — ei sone kan ha titals vindauge, og då sprengjer
        // kortet sidepanelet. Lange lister startar samanslegne; valet til
        // brukaren vert hugsa per sone på tvers av dei hyppige rebuildane.
        const winKey=`w_${_zuk(z)}`;
        if(!window._winlistCollapsed)window._winlistCollapsed={};
        const nWin=z.windows.length;
        if(window._winlistCollapsed[winKey]===undefined)
          window._winlistCollapsed[winKey]=nWin>WINLIST_AUTO_COLLAPSE;
        const winCollapsed=!!window._winlistCollapsed[winKey];
        winSummary.className='sub-sec'+(winCollapsed?' collapsed':'');

        const winHdr=document.createElement('div');
        winHdr.className='sub-hdr';
        winHdr.title='Klikk for å slå saman/utvide lista';
        const winChev=document.createElement('span');winChev.className='sub-chevron';
        winChev.innerHTML='<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,4 6,8 10,4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const winTxt=document.createElement('span');winTxt.textContent='Vindauge og dører';
        const winCnt=document.createElement('span');winCnt.className='sub-count';
        const _nStk=z.windows.reduce((s,w)=>s+(w.antal||1),0);
        winCnt.textContent=nWin+(_nStk!==nWin?' · '+_nStk+' stk':'');
        winHdr.appendChild(winChev);winHdr.appendChild(winTxt);winHdr.appendChild(winCnt);
        winHdr.onclick=()=>{
          const nyState=!window._winlistCollapsed[winKey];
          window._winlistCollapsed[winKey]=nyState;
          winSummary.classList.toggle('collapsed',nyState);
        };
        winSummary.appendChild(winHdr);
        // Opningar større enn fasaden: synleg òg når lista er samanslegen,
        // for SXI-eksporten stoppar på dette.
        const _forStore=fasadarMedForStoreOpningar(z);
        if(_forStore.length){
          winCnt.style.background='var(--dm-red-bg,#fef0ef)';winCnt.style.color='var(--dm-red-tx,#c0302a)';
          winCnt.textContent='⚠ '+winCnt.textContent;
          const varsel=document.createElement('div');
          varsel.style.cssText='margin:4px 0 2px;padding:5px 8px;background:var(--dm-red-bg,#fef0ef);border:1px solid var(--dm-red-bd,#f2b8b5);border-radius:6px;font-size:11px;color:var(--dm-red-tx,#c0302a);line-height:1.45';
          varsel.textContent=_forStore.map(f=>'⚠ '+f.namn+': '+f.opn.toFixed(2)+' m² opningar på '
            +f.area.toFixed(2)+' m² fasade').join('\n')+'\nSXI-eksporten stoppar til dette er retta.';
          varsel.style.whiteSpace='pre-line';
          winSummary.appendChild(varsel);
        }
        const _forStoreSeg=new Set(_forStore.flatMap(f=>[...f.segs]));
        const wl=document.createElement('div');wl.className='win-list sub-body';
        z.windows.forEach((w,wi)=>{
          const wc=document.createElement('div');wc.className='win-card';
          const dir=segs?segs[w.segIdx]?.dir||w.dir:w.dir;
          const _wlbl=w.name||(w.type==='dor'?'Dør':'Vindauge');
          const info=document.createElement('div');info.className='win-card-info';
          const icon=w.type==='dor'?'🚪':'▭';
          const _plassert=(winCount(w)>1&&winHasPos(w))?' · plassert':'';
          const _wg=winCount(w)>1?winGeom(z,w):null;
          const _trongt=(_wg&&_wg.mpp&&winForTrongt(w,_wg.width,_wg.segLen))
            ?' <span style="color:var(--dm-red-tx,#c0302a);font-weight:600" title="Gruppa er breiare enn veggen, så stykka overlappar. Sjekk breidda eller antalet.">⚠ breiare enn veggen</span>':'';
          const _forStorFas=_forStoreSeg.has(w.segIdx)
            ?' <span style="color:var(--dm-red-tx,#c0302a);font-weight:600" title="Vindauga og dørene på denne fasaden har større areal enn fasaden. SXI-eksporten stoppar til det er retta.">⚠ større enn fasaden</span>':'';
          info.innerHTML=`<strong style="color:var(--text)">${icon} ${_wlbl}</strong> <span style="color:var(--text3)">${dir} · ${w.breddeMm}×${w.hoyMm}mm · ${w.antal} stk${_plassert}</span>${_trongt}${_forStorFas}`;
          const cpW=document.createElement('button');cpW.className='win-card-del';cpW.title='Kopier';cpW.textContent='⎘';
          cpW.style.cssText='background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:0 2px;transition:color .1s';
          cpW.onmouseenter=()=>{cpW.style.color='var(--accent)';};cpW.onmouseleave=()=>{cpW.style.color='var(--text3)';};
          cpW.onclick=()=>showCopyWindowMenu(w,z,zi,f,fi);
          const del=document.createElement('button');del.className='win-card-del';del.textContent='✕';
          del.onclick=()=>{snapshot();const ix=z.windows.indexOf(w);if(ix>=0)z.windows.splice(ix,1);updateResults();renderTable();draw();};
          wc.appendChild(info);wc.appendChild(cpW);wc.appendChild(del);wl.appendChild(wc);
        });
        winSummary.appendChild(wl);
        _etterKonstr.appendChild(winSummary);
      }

      // ── Gavlflater-oversikt (om dei er berekna) ──
      if((z.gavlflater||[]).length>0){
        const gavlSum=document.createElement('div');
        gavlSum.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid var(--border)';
        const gavlSumHdr=document.createElement('div');
        gavlSumHdr.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:5px';
        gavlSumHdr.innerHTML=`<span style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Gavlflater</span><span style="font-size:10px;font-family:inherit;color:var(--accent)">${z.gavlflater.reduce((s,g)=>s+g.area,0).toFixed(2)} m² tot.</span>`;
        gavlSum.appendChild(gavlSumHdr);
        const gavlList=document.createElement('div');gavlList.className='win-list';
        z.gavlflater.forEach((gf,gfi)=>{
          const gc=document.createElement('div');gc.className='win-card';
          const gInfo=document.createElement('div');gInfo.className='win-card-info';
          gInfo.innerHTML=`<strong style="color:var(--text)">⊿ ${gf.dir||'Gavl'}</strong> <span style="color:var(--text3)">${gf.lenM?.toFixed(1)||'?'} m · ${gf.area.toFixed(2)} m²</span>`;
          const gDel=document.createElement('button');gDel.className='win-card-del';gDel.textContent='✕';
          gDel.onclick=()=>{snapshot();z.gavlflater.splice(gfi,1);updateResults();renderTable();draw();};
          gc.appendChild(gInfo);gc.appendChild(gDel);gavlList.appendChild(gc);
        });
        gavlSum.appendChild(gavlList);
        _etterKonstr.appendChild(gavlSum);
      }

      // ── Action buttons ──
      const btnRow=document.createElement('div');btnRow.className='card-btns';
      const _kb=(btn,ik,txt,title)=>{btn.innerHTML=ikonSvg(ik)+(txt?'<span></span>':'');if(txt)btn.lastChild.textContent=txt;if(title)btn.title=title;};
      const eb=document.createElement('button');eb.className='card-btn';_kb(eb,'geometri','Rediger','Rediger geometrien — dra hjørne, høgreklikk for å slette eit punkt');
      eb.onclick=()=>{
        if(fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
        setMode('edit');editZoneIdx=zi;draw();
      };
      const db=document.createElement('button');db.className='card-btn danger ik';_kb(db,'slett','','Slett sona (kan angrast)');
      db.onclick=()=>{
        snapshot();
        // Konvertera sonekopling til skiljevegg i nabosonar når denne sona blir sletta
        if(z.zoneConnections){
          z.zoneConnections.forEach((zcData,segIdx)=>{
            const facingZoneIdx=zcData.facingZoneIdx;
            if(typeof facingZoneIdx==='number' && facingZoneIdx>=0 && facingZoneIdx<f.zones.length){
              const opposingZone=f.zones[facingZoneIdx];
              if(opposingZone){
                ensureZoneConnectionsMap(opposingZone);
                opposingZone.zoneConnections.delete(segIdx);
                if(!opposingZone.skillevegg)opposingZone.skillevegg=new Set();
                opposingZone.skillevegg.add(segIdx);
              }
            }
          });
        }
        f.zones.splice(zi,1);
        if(fi===activeFloor&&editZoneIdx===zi)editZoneIdx=null;
        zones=curFloor().zones;
        renderFloorTabs();updateResults();renderTable();draw();
      };

      // Kopier sone — opnar kopier-meny
      const cpBtn=document.createElement('button');cpBtn.className='card-btn';
      _kb(cpBtn,'kopier','Kopier','Kopier sona — til same eller ein annan etasje');
      cpBtn.onclick=()=>showCopyZoneMenu(z,zi,f,fi);

      // Del sone — teikn ei klippelinje tvers gjennom
      const splitBtn=document.createElement('button');splitBtn.className='card-btn';
      _kb(splitBtn,'klipp','Del','Del sona i to med ei klippelinje — linja vert skiljekonstruksjon i begge');
      splitBtn.onclick=()=>{
        if(z.pts.length<3){hintText.textContent='Sona har for få punkt til å delast.';return;}
        if(fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
        delSoneTarget={z,zi};delSonePts=[];delSoneSnap=null;
        setMode('del-sone');
        hintText.textContent='Teikn ei linje tvers gjennom «'+z.name+'» · Shift for 90°/45° · Enter for å dele';
        draw();
      };

      btnRow.appendChild(eb);btnRow.appendChild(splitBtn);btnRow.appendChild(cpBtn);
      // Koble soner — alltid synleg, viser status
      const lnBtn=document.createElement('button');
      lnBtn.className='card-btn';
      if(z.groupId){
        const nLinked=floors.flatMap(fl=>fl.zones).filter(x=>x.groupId===z.groupId).length;
        lnBtn.classList.add('kopla');
        _kb(lnBtn,'kople','Kopla','Sona er kopla med '+(nLinked-1)+' andre — klikk for å endre');
        const _n=document.createElement('span');_n.className='cb-n';_n.textContent=nLinked;lnBtn.appendChild(_n);
      } else {
        _kb(lnBtn,'kople','Kople','Kople sona med soner i same eller andre etasjar (same bygningskategori)');
      }
      lnBtn.onclick=()=>showLinkZoneMenu(z,f,fi);
      btnRow.appendChild(lnBtn);
      btnRow.appendChild(db);   // slett heilt til høgre, berre ikon
      // SK merge er no handtert per nabo-gruppe direkte i fasade-seksjonen
      cardBody.appendChild(btnRow);

      // ── Fasade-radar (SK-toggle, segment) ──
      if(segs){
        // Kollapsbar som vindaugslista: ei stor sone kan ha 20–30 veggar.
        // Overskrifta ligg utanfor facSection, som er kroppen — fleire stader
        // under tømmer facSection før dei byggjer panelet på nytt.
        const konstrKey=`k_${_zuk(z)}`;
        if(!window._konstrCollapsed)window._konstrCollapsed={};
        if(window._konstrCollapsed[konstrKey]===undefined)
          window._konstrCollapsed[konstrKey]=segs.length>KONSTR_AUTO_COLLAPSE;
        const facWrap=document.createElement('div');
        facWrap.className='sub-sec'+(window._konstrCollapsed[konstrKey]?' collapsed':'');
        facWrap.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid var(--border)';
        const facHdr=document.createElement('div');facHdr.className='sub-hdr';
        facHdr.title='Klikk for å slå saman/utvide lista · Alt+klikk: alle soner';
        const facChev=document.createElement('span');facChev.className='sub-chevron';
        facChev.innerHTML='<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,4 6,8 10,4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        const facTxt=document.createElement('span');facTxt.textContent='Konstruksjonar';
        const facCnt=document.createElement('span');facCnt.className='sub-count';
        const _nSk=segs.filter((_,i)=>(z.skillevegg||new Set()).has(i)).length;
        facCnt.textContent=segs.length+(_nSk?' · '+_nSk+' SK':'');
        facHdr.appendChild(facChev);facHdr.appendChild(facTxt);facHdr.appendChild(facCnt);
        facHdr.onclick=e=>{
          const ny=!window._konstrCollapsed[konstrKey];
          if(e.altKey){
            // Same tilstand på alle soner
            floors.forEach(fl=>fl.zones.forEach(zz=>{window._konstrCollapsed[`k_${_zuk(zz)}`]=ny;}));
            updateResults();return;
          }
          window._konstrCollapsed[konstrKey]=ny;
          facWrap.classList.toggle('collapsed',ny);
        };
        facWrap.appendChild(facHdr);
        const facSection=document.createElement('div');facSection.className='sub-body';
        facSection.style.paddingTop='3px';
        facWrap.appendChild(facSection);

        if(!z.skillevegg)z.skillevegg=new Set();
        if(!z.skMergedGroups)z.skMergedGroups=[];
        if(!z.yvMergedGroups)z.yvMergedGroups=[];
        const labels2=getFacadeLabels(z,segs);

        // Finn nabo-grupper av SK
        const skGroups=getSkAdjacentGroups(z,segs);

        // Finn kva gruppe eit segment høyrer til
        const segGroupIdx=(segIdx)=>{
          for(let gi=0;gi<skGroups.length;gi++){
            if(skGroups[gi].some(s=>s.idx===segIdx))return gi;
          }
          return -1;
        };

        // ── SK-samanslåing ──
        // Ei samanslåing er ei fri liste med segmentindeksar — ikkje nødvendigvis
        // heile nabogruppa. Difor slår vi opp på MEDLEMSKAP, ikkje på gruppenøkkel,
        // og ei nabogruppe kan innehalde fleire samanslåingar side om side.
        const getMergedFor=segIdx=>(z.skMergedGroups||[]).find(g=>g.segs.includes(segIdx))||null;
        const skGroupKey=g=>g.segs.slice().sort((a,b)=>a-b).join(',');
        // Namn med eige prefiks: fasadelappane heiter alt SK1, SK2 … og etter at
        // ei samanslåing kan dekkje berre delar av gruppa, ligg dei side om side.
        const renumberSk=()=>{z.skMergedGroups.forEach((g,i)=>{g.name='SK samla '+(i+1);});};
        // Ledige SK-segment i ei nabogruppe — dei som ikkje alt ligg i ei samanslåing
        const freeSegsIn=gi=>(gi<0||gi>=skGroups.length)?[]:skGroups[gi].filter(s=>!getMergedFor(s.idx));
        const mergeSegs=idxs=>{
          if(!z.skMergedGroups)z.skMergedGroups=[];
          if(idxs.length<2)return;
          // Eit segment kan berre liggje i éi samanslåing
          z.skMergedGroups=z.skMergedGroups.filter(g=>{
            g.segs=g.segs.filter(i=>!idxs.includes(i));
            return g.segs.length>=2;
          });
          z.skMergedGroups.push({segs:[...idxs].sort((a,b)=>a-b),name:''});
          renumberSk();
          updateResults();renderTable();draw();
        };
        const unmergeSegs=segIdx=>{
          if(!z.skMergedGroups)return;
          z.skMergedGroups=z.skMergedGroups.filter(g=>!g.segs.includes(segIdx));
          renumberSk();
          updateResults();renderTable();draw();
        };

        // Plukk-modus — vel kva SK-veggar i nabogruppa som skal slåast saman.
        // Alt skjer i DOM-en som alt står her; ingen full sidepanel-bygging før
        // sjølve samanslåinga, så det kostar ingenting å opne og lukke.
        const groupRows={};
        let pickTeardown=null;
        const exitPick=()=>{if(pickTeardown){const t=pickTeardown;pickTeardown=null;t();}};
        const enterPick=(gi,preselect)=>{
          exitPick();
          const rows=(groupRows[gi]||[]).filter(r=>!getMergedFor(r.seg.idx));
          if(rows.length<2)return;
          const sel=new Set(preselect!=null?[preselect]:[]);
          const boxes=[];
          const bar=document.createElement('div');
          bar.style.cssText='display:flex;align-items:center;gap:6px;padding:5px 8px;margin:2px 0;border-radius:6px;background:var(--dm-amb-bg,#fffbeb);border:1px dashed #d97706';
          const info=document.createElement('span');info.style.cssText='font-size:11px;color:var(--dm-amb-tx,#92400e);flex:1';
          const allBtn=document.createElement('button');
          allBtn.style.cssText='font-size:10px;padding:2px 6px;border:1px solid #d97706;border-radius:4px;background:var(--surface);color:var(--dm-amb-tx,#92400e);cursor:pointer;font-family:inherit;white-space:nowrap';
          const cancelBtn=document.createElement('button');
          cancelBtn.style.cssText='font-size:10px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--surface);color:var(--dm-t3,#6b7280);cursor:pointer;font-family:inherit;white-space:nowrap';
          cancelBtn.textContent='Avbryt';
          const okBtn=document.createElement('button');
          okBtn.style.cssText='font-size:10px;font-weight:600;padding:2px 8px;border:1px solid #d97706;border-radius:4px;background:#d97706;color:#fff;cursor:pointer;font-family:inherit;white-space:nowrap';
          const sync=()=>{
            info.textContent=sel.size<2?'Vel minst to veggar':(sel.size+' av '+rows.length+' valde');
            okBtn.textContent='Slå saman ('+sel.size+')';
            okBtn.disabled=sel.size<2;
            okBtn.style.opacity=sel.size<2?'.45':'1';
            okBtn.style.cursor=sel.size<2?'default':'pointer';
            allBtn.textContent=sel.size===rows.length?'Ingen':'Alle';
            boxes.forEach(b=>{b.cb.checked=sel.has(b.r.seg.idx);b.r.row.style.boxShadow=b.cb.checked?'inset 0 0 0 2px #d97706':'none';});
          };
          rows.forEach(r=>{
            const cb=document.createElement('input');cb.type='checkbox';
            cb.style.cssText='margin:0;width:13px;height:13px;accent-color:#d97706;cursor:pointer;flex:none';
            cb.onclick=e=>{e.stopPropagation();if(cb.checked)sel.add(r.seg.idx);else sel.delete(r.seg.idx);sync();};
            r.left.insertBefore(cb,r.left.firstChild);
            r.row._pickToggle=()=>{if(sel.has(r.seg.idx))sel.delete(r.seg.idx);else sel.add(r.seg.idx);sync();};
            boxes.push({cb,r});
          });
          allBtn.onclick=()=>{if(sel.size===rows.length)sel.clear();else rows.forEach(r=>sel.add(r.seg.idx));sync();};
          cancelBtn.onclick=()=>exitPick();
          okBtn.onclick=()=>{if(sel.size<2)return;const list=[...sel];exitPick();mergeSegs(list);};
          bar.appendChild(info);bar.appendChild(allBtn);bar.appendChild(cancelBtn);bar.appendChild(okBtn);
          const lastRow=rows[rows.length-1].row;
          facSection.insertBefore(bar,lastRow.nextSibling);
          pickTeardown=()=>{
            bar.remove();
            boxes.forEach(b=>{b.cb.remove();b.r.row._pickToggle=null;b.r.row.style.boxShadow='none';});
          };
          sync();
        };

        // YV-samanslåing
        // Slegne saman på tvers av kopla soner: grupperingane per sone gjeld ikkje
        const _koplaFas=koplaFasadarSaman(z);
        if(_koplaFas){
          const kn=document.createElement('div');
          kn.style.cssText='font-size:11px;color:var(--dm-lil-tx,#5b21b6);background:var(--dm-lil-bg,#f5f3ff);border:1px solid var(--dm-lil-bd,#c4b5fd);border-radius:6px;padding:4px 8px;margin:0 0 4px;line-height:1.4';
          kn.textContent='⊞ Ytterveggane vert slegne saman med dei kopla sonene i SXI — éin fasade per himmelretning.';
          facSection.appendChild(kn);
        }
        const getYvMergedGroup=segIdx=>_koplaFas?null:((z.yvMergedGroups||[]).find(g=>g.segs.includes(segIdx))||null);
        const yvGroupKey=g=>g.segs.slice().sort((a,b)=>a-b).join(',');
        // «Del opp»: fjern gruppa veggane ligg i (medlemskap, ikkje nøkkel)
        const toggleYvMerge=(dir,dirSegObjs)=>{
          snapshot();
          const idxs=dirSegObjs.map(s=>s.idx);
          z.yvMergedGroups=(z.yvMergedGroups||[]).filter(g=>!g.segs.some(i=>idxs.includes(i)));
          updateResults();renderTable();
        };

        const shownMergedGroups=new Set();
        const shownMergedYvGroups=new Set();
        const shownZoneConnections=new Set();  // Track zone connection pairs already shown
        segs.forEach((seg,si)=>{
          const isSK=z.skillevegg.has(seg.idx);
          const nm=labels2[si];
          const gi=segGroupIdx(seg.idx);
          const mergedObj=isSK?getMergedFor(seg.idx):null;

          // Viss fleire SK-veggar er slått saman — vis berre éin rad for heile settet
          if(mergedObj){
            const mkey=skGroupKey(mergedObj);
            if(shownMergedGroups.has(mkey))return;
            shownMergedGroups.add(mkey);
            const grpSegs=segs.filter(s2=>mergedObj.segs.includes(s2.idx));
            const totalLenM=grpSegs.reduce((s,s2)=>s+(s2.lenM||0),0);
            const totalA=grpSegs.reduce((s,s2)=>s+(s2.areaM2||0),0);
            const row=document.createElement('div');
            row.className='kgrp';row.style.cssText='background:var(--dm-amb-bg,#fef3c7);border-color:#d97706';
            const nameTag=document.createElement('span');nameTag.className='kgrp-n';nameTag.style.color='var(--dm-amb-tx,#92400e)';
            nameTag.textContent=mergedObj?.name||'SK';
            const statsSpan=document.createElement('span');statsSpan.className='kgrp-s';
            statsSpan.textContent=`${grpSegs.length} ${grpSegs.length===1?"vegg":"veggar"} · ${mmPerImgPx?fmtM(totalLenM):'—'} · ${mmPerImgPx?fmtM2(totalA):'—'}`;
            row.title='Eitt element i SIMIEN, sett saman av: '+grpSegs.map(s2=>labels2[segs.indexOf(s2)]).join(', ');
            const unmergeBtn=document.createElement('button');
            unmergeBtn.style.cssText='font-size:10px;padding:2px 6px;border:1px solid #d97706;border-radius:4px;background:var(--surface);color:var(--dm-amb-tx,#92400e);cursor:pointer;font-family:inherit;white-space:nowrap';
            unmergeBtn.textContent='Del opp';
            unmergeBtn.onclick=()=>unmergeSegs(grpSegs[0]?grpSegs[0].idx:seg.idx);
            row.appendChild(_kgrpTekst(nameTag,statsSpan));row.appendChild(unmergeBtn);
            row.dataset.hsegs=grpSegs.map(s2=>s2.idx).join(',');
            facSection.appendChild(row);
            return;
          }

          // Viss SK-segment er markert som sonekobling — gruppera alle segment med same nabosone
          if(isSK&&!mergedObj){
            ensureZoneConnectionsMap(z);
            if(z.zoneConnections?.has(seg.idx)){
              const zcData=z.zoneConnections.get(seg.idx);
              const facingZoneIdx=zcData.facingZoneIdx;
              if(typeof facingZoneIdx==='number' && facingZoneIdx>=0){
                const myIdx=zones.indexOf(z);
                const zcKey=`${Math.min(myIdx,facingZoneIdx)},${Math.max(myIdx,facingZoneIdx)}`;
                if(!shownZoneConnections.has(zcKey)){
                  shownZoneConnections.add(zcKey);
                  // Finn alle segment i denne sona som er kobla til same zone
                  const zcSegs=segs.filter(s=>z.zoneConnections?.has(s.idx)&&z.zoneConnections.get(s.idx).facingZoneIdx===facingZoneIdx);
                  const totalLenM=zcSegs.reduce((s,s2)=>s+(s2.lenM||0),0);
                  const totalA=zcSegs.reduce((s,s2)=>s+(s2.areaM2||0),0);
                  const opposingZone=facingZoneIdx<zones.length?zones[facingZoneIdx]:null;
                  const grpName=(zcData.name||'Sonekobling');
                  const row=document.createElement('div');
                  row.className='kgrp';row.style.cssText='background:var(--dm-gr-bg,#d1fae5);border-color:#10b981';
                  // Namnet er «Sonekobling <denne> og <nabo>» — sona vi står i er
                  // openberr, så lappen seier berre kven koplinga går mot
                  const nameTag=document.createElement('span');nameTag.className='kgrp-n';nameTag.style.color='var(--dm-gr-tx,#047857)';
                  nameTag.textContent=opposingZone?'Sonekobling mot '+opposingZone.name:grpName;
                  const statsSpan=document.createElement('span');statsSpan.className='kgrp-s';
                  statsSpan.textContent=`${zcSegs.length} ${zcSegs.length===1?"vegg":"veggar"} · ${mmPerImgPx?fmtM(totalLenM):'—'} · ${mmPerImgPx?fmtM2(totalA):'—'}`;
                  row.title=grpName+' — eitt <zone_connection>-element i SXI-fila: '+zcSegs.map((s2,i)=>labels2[segs.indexOf(s2)]).join(', ');
                  const remBtn=document.createElement('button');
                  remBtn.style.cssText='font-size:10px;padding:2px 5px;border:1px solid #10b981;border-radius:3px;background:var(--surface);color:var(--dm-gr-tx,#047857);cursor:pointer;font-family:inherit;white-space:nowrap';
                  remBtn.textContent='Fjern';
                  remBtn.onclick=()=>{
                    if(!confirm('Fjern sonekoplinga? Det kan ikkje reversast — det blir vanlege skiljekostruksjonar i begge sonane.')){return;}
                    snapshot();
                    // Konvertera sonekobling til vanleg skiljevegg
                    zcSegs.forEach(s=>{
                      // Fjern frå denne sona
                      z.zoneConnections.delete(s.idx);
                      if(!z.skillevegg)z.skillevegg=new Set();
                      z.skillevegg.add(s.idx);

                      // Fjern frå nabosona òg
                      if(opposingZone){
                        ensureZoneConnectionsMap(opposingZone);
                        opposingZone.zoneConnections.delete(s.idx);
                        if(!opposingZone.skillevegg)opposingZone.skillevegg=new Set();
                        opposingZone.skillevegg.add(s.idx);
                      }
                    });
                    facSection.textContent='';
                    markDirty();
                    updateResults();renderTable();draw();
                  };
                  row.appendChild(_kgrpTekst(nameTag,statsSpan));
                  row.appendChild(remBtn);
                  row.dataset.hsegs=zcSegs.map(s2=>s2.idx).join(',');

                  // Høgreklikk-meny for å fjerne eller endra sonekobling
                  // row.oncontextmenu=e=>{ // DISABLA medan eg arbeiter med feilretting
                  if(false){ /*
                    e.preventDefault();
                    const menuEl=document.createElement('div');
                    menuEl.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:var(--surface);border:1px solid var(--dm-bd2,#d1d5db);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;min-width:200px';

                    const item1=document.createElement('button');
                    item1.style.cssText='display:block;width:100%;padding:8px 12px;text-align:left;border:none;background:none;cursor:pointer;font-family:inherit;font-size:13px';
                    item1.textContent='Fjern sonekobling';
                    item1.onmouseover=()=>item1.style.background='var(--dm-s2,#f3f4f6)';
                    item1.onmouseout=()=>item1.style.background='none';
                    item1.onclick=()=>{
                      // Fjern sonekobling frå båda sonene
                      zcSegs.forEach(seg=>{
                        // Finn nabosona frå skillevegg (same som normal SK-handling)
                        let nabozOne=null;
                        for(const otherZone of zones){
                          if(otherZone===z)continue;
                          if(otherZone.skillevegg?.has(seg.idx)){
                            nabozOne=otherZone;
                            break;
                          }
                        }

                        // Fjern frå denne sona
                        z.zoneConnections.delete(seg.idx);
                        if(!z.skillevegg)z.skillevegg=new Set();
                        z.skillevegg.add(seg.idx);

                        // Fjern frå nabosona òg
                        if(nabozOne){
                          ensureZoneConnectionsMap(nabozOne);
                          nabozOne.zoneConnections.delete(seg.idx);
                          if(!nabozOne.skillevegg)nabozOne.skillevegg=new Set();
                          nabozOne.skillevegg.add(seg.idx);
                        }
                      });
                      facSection.textContent='';
                      document.body.removeChild(menuEl);
                      snapshot();
                      markDirty();
                      updateResults();renderTable();draw();
                      hintText.textContent='Fjerna sonekobling på båda sonene.';
                    };
                    menuEl.appendChild(item1);
                    document.body.appendChild(menuEl);
                    setTimeout(()=>{if(menuEl.parentNode)document.body.removeChild(menuEl);},5000);
                  */ } // End DISABLA

                  facSection.appendChild(row);
                  return;
                } else {
                  return;  // Allereie vist, hoppa over
                }
              }
            }
          }

          // Viss YV-fasade er slått saman med same himmelretning — vis berre éin rad
          if(!isSK){
            const yvMerged=getYvMergedGroup(seg.idx);
            if(yvMerged){
              const gk=yvGroupKey(yvMerged);
              if(shownMergedYvGroups.has(gk))return;
              shownMergedYvGroups.add(gk);
              const grpSegs=segs.filter(s=>yvMerged.segs.includes(s.idx));
              const totalLenM=grpSegs.reduce((s,s2)=>s+(s2.lenM||0),0);
              const totalGrossA=grpSegs.reduce((s,s2)=>s+(s2.areaM2||0),0);
              const _mpp=mppForZone(z);
              const meanAz=Math.round(circularMeanAz(grpSegs.map(s=>s.normalAz)));
              const row=document.createElement('div');
              row.className='kgrp';row.style.cssText='background:var(--dm-bl-bg,#dbeafe);border-color:#3b82f6';
              const nameTag=document.createElement('span');nameTag.className='kgrp-n';nameTag.style.color='var(--dm-bl-tx,#1e40af)';
              nameTag.textContent=yvMerged.name;
              const statsSpan=document.createElement('span');statsSpan.className='kgrp-s';
              statsSpan.textContent=`${grpSegs.length} fasadar · ${_mpp?fmtM(totalLenM):'—'} · ${_mpp?fmtM2(totalGrossA):'—'} · ${meanAz}°`;
              const unmergeBtn=document.createElement('button');
              unmergeBtn.style.cssText='font-size:10px;padding:2px 6px;border:1px solid #3b82f6;border-radius:4px;background:var(--surface);color:var(--dm-bl-tx,#1e40af);cursor:pointer;font-family:inherit;white-space:nowrap';
              unmergeBtn.textContent='Del opp';
              unmergeBtn.onclick=()=>toggleYvMerge(yvMerged.name,grpSegs);
              row.appendChild(_kgrpTekst(nameTag,statsSpan));row.appendChild(unmergeBtn);
              row.dataset.hsegs=grpSegs.map(s2=>s2.idx).join(',');
              facSection.appendChild(row);
              return;
            }
          }

          // Rolle: SK / KJ / YV. KJ finst berre i kjellersoner, og då syklar
          // klikket gjennom alle tre i staden for berre YV↔SK.
          const kjZone=isKjeller(z);
          const rolle=segRolle(z,seg.idx);
          const isKJ=rolle==='KJ';
          ensureZoneConnectionsMap(z);
          const isZoneConn=isSK&&z.zoneConnections?.has(seg.idx);
          const ROLLE_FARGE={
            // var(--dm-x,#lys): mørk modus har eigne fargar, lys modus er uendra
            SK:{bg:'var(--dm-amb-bg,#fef3c7)',hov:'var(--dm-amb-hov,#fde68a)',kant:'#d97706',tekst:'var(--dm-amb-tx,#92400e)',pill:'#d97706',pillTekst:'#fff'},
            KJ:{bg:'var(--dm-kj-bg,#f3ece0)',hov:'var(--dm-kj-hov,#e8ddc9)',kant:'#8a6a3b',tekst:'var(--dm-kj-tx,#5f4520)',pill:'#8a6a3b',pillTekst:'#fff'},
            YV:{bg:'var(--dm-s2,#f8fafb)',hov:'var(--dm-hov,#eef1f4)',kant:'var(--dm-bd,#e5e7eb)',tekst:'var(--accent)',pill:'var(--dm-bd2,#e5e7eb)',pillTekst:'var(--dm-t2,#6b7280)'},
            ZC:{bg:'var(--dm-gr-bg,#d1fae5)',hov:'var(--dm-gr-hov,#a7f3d0)',kant:'#10b981',tekst:'var(--dm-gr-tx,#047857)',pill:'#10b981',pillTekst:'#fff'}
          };
          let fg=ROLLE_FARGE[rolle];
          if(isZoneConn)fg=ROLLE_FARGE.ZC;
          const row=document.createElement('div');
          row.style.cssText=`display:flex;align-items:center;justify-content:space-between;padding:5px 8px;margin:2px 0;border-radius:6px;cursor:pointer;background:${fg.bg};border:1px solid ${fg.kant};transition:all .15s`;
          row.title=kjZone
            ?'Klikk for å sykle: KJ (del av kjellerelementet) → YV (yttervegg over terreng) → SK (skillekonstruksjon)'
            :'Klikk for å endre mellom yttervegg (YV) og skillekonstruksjon (SK)';
          const left=document.createElement('div');left.style.cssText='display:flex;align-items:center;gap:7px;min-width:0;flex:1';
          const dirBadge=document.createElement('span');dirBadge.style.cssText=`font-size:11px;font-weight:700;color:${fg.tekst};white-space:nowrap`;dirBadge.textContent=nm;
          const lenSpan=document.createElement('span');lenSpan.style.cssText="font-size:11px;color:var(--dm-t3,#6b7280);font-family:inherit";lenSpan.textContent=seg.lenM!==null?fmtM(seg.lenM):'—';
          left.appendChild(dirBadge);left.appendChild(lenSpan);
          const right=document.createElement('div');right.style.cssText='display:flex;align-items:center;gap:4px';
          if(!isSK&&!isKJ){
            const areaSpan=document.createElement('span');areaSpan.style.cssText="font-size:11px;color:var(--dm-t2,#374151);font-family:inherit";
            // Bruttoareal (inkl. vindauge/dører) — same tal som går til SIMIEN
            areaSpan.textContent=seg.areaM2!=null?fmtM2(seg.areaM2):'—';
            right.appendChild(areaSpan);
          }
          const typePill=document.createElement('span');
          typePill.style.cssText=`font-size:10px;font-weight:600;padding:2px 6px;border-radius:8px;background:${fg.pill};color:${fg.pillTekst}`;
          typePill.textContent=isZoneConn?'SK (Kobling)':rolle;
          typePill.title=isZoneConn?'Sonekobling — vert <zone_connection> i SXI-fila':isKJ?'Med i kjellerelementet — vert ikkje eigen fasade i SXI-fila':'';
          right.appendChild(typePill);
          // Om SK og fleire ledige nabo-SK — vis samanslå-knappane
          const freeHere=isSK?freeSegsIn(gi):[];
          if(isSK&&gi>=0&&freeHere.length>1){
            const mergeBtn2=document.createElement('button');
            mergeBtn2.style.cssText='font-size:10px;padding:2px 6px;border:1px solid #d97706;border-radius:4px;background:var(--dm-amb-bg,#fef3c7);color:var(--dm-amb-tx,#92400e);cursor:pointer;font-family:inherit;white-space:nowrap';
            mergeBtn2.textContent='Slå saman';
            mergeBtn2.title='Slå saman alle ledige SK-veggar i denne gruppa til eitt element ('+freeHere.length+' stk.)';
            mergeBtn2.onclick=e=>{e.stopPropagation();mergeSegs(freeSegsIn(gi).map(s2=>s2.idx));};
            right.appendChild(mergeBtn2);
            const pickBtn=document.createElement('button');
            pickBtn.style.cssText='font-size:10px;padding:2px 5px;border:1px solid #d97706;border-radius:4px;background:var(--surface);color:var(--dm-amb-tx,#92400e);cursor:pointer;font-family:inherit;white-space:nowrap';
            pickBtn.textContent='Vel…';
            pickBtn.title='Vel sjølv kva av SK-veggane som skal bli eitt element';
            pickBtn.onclick=e=>{e.stopPropagation();enterPick(gi,seg.idx);};
            right.appendChild(pickBtn);
          }
          row.appendChild(left);row.appendChild(right);
          row.dataset.hsegs=seg.idx;   // musa over rada → veggen vert utheva i teikninga
          if(isSK&&gi>=0)(groupRows[gi]=groupRows[gi]||[]).push({seg,row,left});

          // Høgreklikk-meny for sonekoblingar (berre SK)
          if(isSK){
            row.oncontextmenu=e=>{
              e.preventDefault();
              ensureZoneConnectionsMap(z);
              const isZoneConn=z.zoneConnections?.has(seg.idx);
              const menuEl=document.createElement('div');
              menuEl.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:var(--surface);border:1px solid var(--dm-bd2,#d1d5db);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;min-width:200px';

              const item1=document.createElement('button');
              item1.style.cssText='display:block;width:100%;padding:8px 12px;text-align:left;border:none;background:none;cursor:pointer;font-family:inherit;font-size:13px';
              item1.textContent=isZoneConn?'Fjern sonekobling':'Marker som sonekobling';
              item1.onmouseover=()=>item1.style.background='var(--dm-s2,#f3f4f6)';
              item1.onmouseout=()=>item1.style.background='none';
              item1.onclick=()=>{
                // Finn sona på den andre sida av skiljevegg-segmentet
                let opposingZone=null;
                for(const otherZone of zones){
                  if(otherZone===z)continue;
                  if(otherZone.skillevegg?.has(seg.idx)){
                    opposingZone=otherZone;
                    break;
                  }
                }
                if(!opposingZone){
                  hintText.textContent='Fann ikkje nabosone. Sonekobling krev at two soner ligg inntil kvarandre på denne veggen.';
                  document.body.removeChild(menuEl);
                  return;
                }
                toggleZoneConnection(z,seg.idx,opposingZone);
                facSection.textContent='';
                document.body.removeChild(menuEl);
                updateResults();renderTable();draw();
              };
              menuEl.appendChild(item1);
              document.body.appendChild(menuEl);

              setTimeout(()=>{if(menuEl.parentNode)document.body.removeChild(menuEl);},5000);
            };
          }

          row.onmouseenter=()=>{row.style.background=fg.hov;};
          row.onmouseleave=()=>{row.style.background=fg.bg;};
          row.onclick=()=>{
            if(row._pickToggle){row._pickToggle();return;}
            // Sjekk om dette er ein sonekobling — då kan brukaren trykka for å endra det til SK eller YV
            ensureZoneConnectionsMap(z);
            if(z.zoneConnections.has(seg.idx)){
              // Toggle mellom sonekobling og skiljevegg — gjer på båda sonene
              const zcData=z.zoneConnections.get(seg.idx);
              const facingZoneIdx=zcData.facingZoneIdx;
              const opposingZone=facingZoneIdx>=0&&facingZoneIdx<zones.length?zones[facingZoneIdx]:null;
              // Fjern frå båda sonene
              z.zoneConnections.delete(seg.idx);
              if(!z.skillevegg)z.skillevegg=new Set();
              z.skillevegg.add(seg.idx);
              if(opposingZone){
                ensureZoneConnectionsMap(opposingZone);
                opposingZone.zoneConnections.delete(seg.idx);
                if(!opposingZone.skillevegg)opposingZone.skillevegg=new Set();
                opposingZone.skillevegg.add(seg.idx);
              }
              snapshot();
              markDirty();
              updateResults();renderTable();draw();
              hintText.textContent='Endra frå sonekobling til skiljevegg i begge sonene.';
              return;
            }
            if(!z.skillevegg)z.skillevegg=new Set();
            const uttaKj=()=>{
              // Ta segmentet ut av kjellerelementet — materialiser lista først,
              // elles betyr «undefined» framleis at alle er med.
              ensureKjellerveggar(z,segs);
              z.kjellerveggar=z.kjellerveggar.filter(i=>i!==seg.idx);
            };
            const gjerTilYv=()=>{
              z.skillevegg.delete(seg.idx);
              // Berre dette segmentet forlet samanslåinga — resten står
              if(z.skMergedGroups){
                z.skMergedGroups=z.skMergedGroups.filter(g=>{
                  g.segs=g.segs.filter(idx=>z.skillevegg.has(idx));
                  return g.segs.length>=2;
                });
                renumberSk();
              }
            };
            const gjerTilSk=()=>{
              z.skillevegg.add(seg.idx);
              // Fjern frå YV-samanslåingsgrupper når fasaden vert SK
              if(z.yvMergedGroups)z.yvMergedGroups=z.yvMergedGroups.filter(g=>!g.segs.includes(seg.idx));
            };
            if(kjZone){
              // KJ → YV → SK → KJ
              if(rolle==='KJ'){uttaKj();}
              else if(rolle==='YV'){gjerTilSk();}
              else{gjerTilYv();ensureKjellerveggar(z,segs);if(!z.kjellerveggar.includes(seg.idx))z.kjellerveggar.push(seg.idx);}
            } else {
              if(isSK)gjerTilYv();else gjerTilSk();
            }
            updateResults();renderTable();draw();
          };
          facSection.appendChild(row);
        });
        cardBody.appendChild(facWrap);
      }
      cardBody.appendChild(_etterKonstr);
      };
      if(isCollapsed)card._buildBody=_buildBody;else _buildBody();

      _zfrag.appendChild(card);
    });
  });
  // Filteret gøymer aldri kort i stillheit
  if(_filtrerte){
    const n=document.createElement('div');n.className='zlist-filtrert';
    const vist=allZones.length-_filtrerte;
    n.textContent=(vist?'Filteret gøymer '+_filtrerte+' av '+allZones.length+' soner · ':'Ingen soner passar filteret · ');
    const b=document.createElement('button');b.type='button';b.textContent='Vis alle';
    b.onclick=()=>{_nullstillSonefilter();updateResults();};
    n.appendChild(b);
    _zfrag.appendChild(n);
  }
  zlist.appendChild(_zfrag);
  // Eit nybygd kort får høgda frå førre runde som plasshaldar, og vert
  // fyrst teikna i neste frame. Har det aldri vore målt (200–500 px feil),
  // eller har innhaldet endra seg sidan (t.d. nabosona når ein vegg vert SK),
  // veks eller krympar det då — og alt under hoppar. Mål slike kort med ekte
  // layout no. Berre korta OVER ankeret: endrar eit kort under seg, flyttar
  // det ingenting av det brukaren ser på.
  if(_anker){
    const ukjende=[];
    for(const c of zlist.children){
      if(c.dataset.zkey===_anker.key)break;
      if(!c.classList.contains('zcard'))continue;
      const k=c.dataset.zkey;
      if(!window._zcardEkte.has(k)||window._zcardSig[k]!==_zcardSig(c))ukjende.push(c);
    }
    if(ukjende.length){
      ukjende.forEach(c=>c.style.contentVisibility='visible');
      const hs=ukjende.map(c=>c.getBoundingClientRect().height-2*c.clientTop);
      ukjende.forEach((c,i)=>{
        window._zcardH[c.dataset.zkey]=hs[i];
        window._zcardEkte.add(c.dataset.zkey);
        window._zcardSig[c.dataset.zkey]=_zcardSig(c);
        c.style.setProperty('contain-intrinsic-size','auto '+hs[i]+'px');
        c.style.contentVisibility='';
      });
    }
  }
  // Gjenopprett scroll-posisjon
  if(_spanel){_spanel.scrollTop=_savedScroll;_zlistTilAnker(_spanel,_anker);}
  // Oppdater collapse-all knapp
  _updateCollapseAllBtn();
  _updateSkjulAllBtn();
  // Live 3D-oppdatering om overlay er open
  _rebuild3DDebounced();
}

window._toggleAllZcards=function(){
  if(!window._zcardCollapsed)window._zcardCollapsed={};
  const cards=document.querySelectorAll('#zlist .zcard');
  const allCollapsed=[...cards].every(c=>c.classList.contains('collapsed'));
  // Toggle: viss alle er collapsed → vis alle, elles → slå saman alle
  cards.forEach(c=>{
    if(allCollapsed){c.classList.remove('collapsed');if(c._buildBody){c._buildBody();c._buildBody=null;}}
    else c.classList.add('collapsed');
    // Sync areaPreview
    const ap=c.querySelector('.zcard-header .zc-areaprev');
    if(ap)ap.style.display=c.classList.contains('collapsed')?'inline':'none';
  });
  // Lagre state for KVART kort, ikkje berre nøklane som alt finst — eit kort
  // som aldri er klikka på einskild har ingen nøkkel, og sprett elles opp att
  // ved neste updateResults() (t.d. etter ein takklipp).
  const collapsed=!allCollapsed;
  cards.forEach(c=>{if(c.dataset.zkey)window._zcardCollapsed[c.dataset.zkey]=collapsed;});
  _updateCollapseAllBtn();
};

function _updateCollapseAllBtn(){
  const btn=document.getElementById('collapseAllBtn');
  if(!btn)return;
  const cards=document.querySelectorAll('#zlist .zcard');
  if(!cards.length)return;
  const allCollapsed=[...cards].every(c=>c.classList.contains('collapsed'));
  btn.textContent=allCollapsed?'Vis alle ▲':'Slå saman alle ▾';
}

// ── Skjul soner ──────────────────────────────────────────────
// `z.skjult` tek sona ut av planteikninga, 3D-modellen og kartet — og av
// snapping, hover og treff-testing, elles ville brukaren treft ei sone han
// ikkje ser. Tabellen, BRA-summane og SXI-eksporten er urørte: å skjule er
// eit visingsval, ikkje ei sletting. Feltet vert med i lagring og angre av
// seg sjølv (soner vert serialiserte med spread overalt), og som dei andre
// felta i sonekortet lagar det ikkje eit eige angre-steg.
const EYE_SVG='<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1.2 8S3.6 3.8 8 3.8 14.8 8 14.8 8 12.4 12.2 8 12.2 1.2 8 1.2 8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.9" stroke="currentColor" stroke-width="1.3"/></svg>';
const EYE_OFF_SVG='<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1.2 8S3.6 3.8 8 3.8 14.8 8 14.8 8 12.4 12.2 8 12.2 1.2 8 1.2 8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.9" stroke="currentColor" stroke-width="1.3"/><path d="M2.4 13.6 13.6 2.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function tellSoner(){return floors.reduce((s,f)=>s+f.zones.length,0);}
function tellSkjulte(){return floors.reduce((s,f)=>s+f.zones.filter(z=>z.skjult).length,0);}

function setSkjult(z,fi,zi,verdi){
  z.skjult=!!verdi;
  // Ei skjult sone kan ikkje redigerast — hjørna er ikkje å sjå.
  if(z.skjult&&mode==='edit'&&fi===activeFloor&&editZoneIdx===zi){editZoneIdx=null;setMode('navigate');}
}

function _updateSkjulAllBtn(){
  const btn=document.getElementById('skjulAllBtn');
  if(!btn)return;
  const n=tellSkjulte(),tot=tellSoner();
  btn.textContent=(n>0&&n>=tot)?'Vis alle soner':(n>0?'Vis alle ('+n+' skjulte)':'Skjul alle soner');
  btn.style.color=n>0?'var(--accent)':'var(--text3)';
  btn.style.borderColor=n>0?'var(--accent)':'var(--border2)';
}

window._toggleAllSkjul=function(){
  // Noko synleg att ⇒ skjul alt. Alt skjult ⇒ vis alt.
  const skjulNo=tellSkjulte()<tellSoner();
  floors.forEach((f,fi)=>f.zones.forEach((z,zi)=>setSkjult(z,fi,zi,skjulNo)));
  markDirty();
  updateResults();renderTable();draw();
  hintText.textContent=skjulNo?'Alle soner er skjulte i teikninga og modellen — tal og eksport er uendra.':'Alle soner er synlege igjen.';
};

// ── Copy/link zone to other floor ────────────────────────────
function showCopyZoneMenu(z, zi, f, fi){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.4);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  const box=document.createElement('div');
  box.style.cssText='background:var(--surface);border-radius:14px;padding:22px;width:360px;max-height:85vh;overflow-y:auto;box-shadow:0 12px 40px rgba(13,27,42,.15)';
  box.innerHTML=`<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">⬡ Kopier «${z.name}»</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:14px;line-height:1.6">Vel kvar kopien skal plasserast. Kopien er ein friståande uavhengig sone — bruk «Koble soner» etterpå om sonene skal slåast saman i SIMIEN.</div>`;

  floors.forEach((tf,tfi)=>{
    const isCurrentFloor=(tfi===fi);
    const flHdr=document.createElement('div');
    flHdr.style.cssText='font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin:10px 0 6px';
    flHdr.textContent=isCurrentFloor?`${tf.name} (denne etasjen)`:tf.name;
    box.appendChild(flHdr);

    const btn=document.createElement('button');
    btn.style.cssText='width:100%;padding:10px 13px;border:1.5px solid var(--border2);border-radius:8px;background:var(--surface);cursor:pointer;text-align:left;font-family:inherit;margin-bottom:6px;display:flex;align-items:center;gap:10px;transition:all .12s';
    btn.innerHTML=`<span style="font-size:18px">⬡</span><div><div style="font-size:12px;font-weight:600;color:var(--text)">Kopier til ${tf.name}</div><div style="font-size:11px;color:var(--text3);margin-top:1px">Ny friståande sone med same geometri og innstillingar</div></div>`;
    btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
    btn.onmouseleave=()=>{btn.style.borderColor='var(--border2)';btn.style.background='var(--surface)';};
    btn.onclick=()=>{
      overlay.remove();
      snapshot();
      const copy=JSON.parse(JSON.stringify(z));
      copy.name='Sone '+(++_nextZoneId);
      copy.skillevegg=new Set(z.skillevegg||[]);
      copy.zoneConnections=new Map();
      delete copy.groupId;
      _adjustPtsForFloorOffset(copy, f, tf);
      tf.zones.push(copy);
      renderFloorTabs();updateResults();renderTable();draw();
      hintText.textContent=`Kopierte «${z.name}» → «${copy.name}» i ${tf.name}`;
    };
    box.appendChild(btn);
  });

  const cancel=document.createElement('button');
  cancel.textContent='Avbryt';
  cancel.style.cssText='width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;background:transparent;color:var(--text3);cursor:pointer;font-family:inherit;font-size:13px;margin-top:4px';
  cancel.onclick=()=>overlay.remove();
  box.appendChild(cancel);
  overlay.appendChild(box);document.body.appendChild(overlay);
}

// ── Copy window/door to another segment ──────────────────────
function showCopyWindowMenu(w, srcZone, srcZi, srcFloor, srcFi){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.4);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  const box=document.createElement('div');
  box.style.cssText='background:var(--surface);border-radius:14px;padding:22px;width:380px;max-height:85vh;overflow-y:auto;box-shadow:0 12px 40px rgba(13,27,42,.15)';
  const wLabel=w.name||(w.type==='dor'?'Dør':'Vindauge');
  const icon=w.type==='dor'?'🚪':'▭';

  // Antal input
  const antalWrap=document.createElement('div');
  antalWrap.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)';
  antalWrap.innerHTML=`<span style="font-size:12px;color:var(--text3);flex:1">Antal stk ved kopiering:</span>`;
  const antalInp=document.createElement('input');
  antalInp.type='number';antalInp.min='1';antalInp.max='999';antalInp.value=w.antal||1;
  antalInp.style.cssText="width:56px;padding:4px 8px;font-size:13px;border:1px solid var(--border2);border-radius:6px;text-align:right;font-family:inherit;background:var(--surface)";
  antalWrap.appendChild(antalInp);

  box.innerHTML=`<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px">${icon} Kopier "${wLabel}"</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${w.breddeMm}×${w.hoyMm} mm · vel fasade å kopiere til:</div>`;
  box.appendChild(antalWrap);

  let added=0;
  floors.forEach((fl,fli)=>{
    fl.zones.forEach((tz,tzi)=>{
      const tsegs=calcSegments(tz.pts,getHoyde(tz),mppForZone(tz))||[];
      if(!tsegs.length)return;
      const tsk=tz.skillevegg||new Set();
      const yvSegs=tsegs.filter(s=>!tsk.has(s.idx));
      if(!yvSegs.length)return;
      const isCurrentZone=(fli===srcFi&&tzi===srcZi);
      const tlabels=getFacadeLabels(tz,tsegs);
      const zhdr=document.createElement('div');
      zhdr.style.cssText='font-size:11px;font-weight:700;color:var(--text3);margin:8px 0 4px;text-transform:uppercase;letter-spacing:.05em';
      zhdr.textContent=(fl.name!==floors[srcFi].name?fl.name+' — ':'')+tz.name+(isCurrentZone?' (denne)':'');
      box.appendChild(zhdr);
      tsegs.forEach((seg,si)=>{
        if(tsk.has(seg.idx))return; // skip SK
        const isSameSeg=(isCurrentZone&&seg.idx===w.segIdx);
        const nm=tlabels[si];
        const btn=document.createElement('button');
        btn.style.cssText=`width:100%;padding:7px 12px;border:1px solid var(--border2);border-radius:6px;background:var(--surface);cursor:pointer;text-align:left;font-family:inherit;font-size:12px;color:var(--text);margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;transition:all .12s`;
        const lenStr=seg.lenM!=null?seg.lenM.toFixed(1)+' m':'—';
        btn.innerHTML=`<span style="font-weight:600">${nm}</span><span style="color:var(--text3);font-size:11px">${lenStr}</span>${isSameSeg?'<span style="font-size:10px;color:var(--accent);font-weight:600">kjelda</span>':''}`;
        btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
        btn.onmouseleave=()=>{btn.style.borderColor='var(--border2)';btn.style.background='var(--surface)';};
        btn.onclick=()=>{
          snapshot();
          if(!tz.windows)tz.windows=[];
          const antal=Math.max(1,parseInt(antalInp.value)||1);
          const typeL=w.type==='dor'?'Dør':'Vindauge';
          if(!tz.windows)tz.windows=[];
          const baseName=w.name||typeL;
          // Plasser på same relative senter som kjelda, med breidda frå
          // breddeMm — målfasaden kan ha heilt annan lengd og skala
          const _cSpan=winSpanPx(w,seg.lenPx,mppForZone(tz));
          tz.windows.push({
            segIdx:seg.idx,dir:seg.dir,
            t0:_cSpan.t0,t1:_cSpan.t1,
            breddeMm:w.breddeMm,hoyMm:w.hoyMm,antal,
            type:w.type,name:uniqueWinName(baseName,tz.windows),
            uVerdi:w.uVerdi,brystningMm:w.brystningMm
          });
          overlay.remove();
          updateResults();renderTable();draw();
        };
        box.appendChild(btn);
        added++;
      });
    });
  });
  if(!added){
    const noFac=document.createElement('div');
    noFac.style.cssText='font-size:12px;color:var(--text3);text-align:center;padding:16px';
    noFac.textContent='Ingen fasadar tilgjengeleg';
    box.appendChild(noFac);
  }
  const cancel=document.createElement('button');
  cancel.textContent='Avbryt';
  cancel.style.cssText='width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;background:transparent;color:var(--text3);cursor:pointer;font-family:inherit;font-size:13px;margin-top:10px';
  cancel.onclick=()=>document.body.removeChild(overlay);
  box.appendChild(cancel);
  overlay.appendChild(box);document.body.appendChild(overlay);
}

// ── Link existing zones across floors ────────────────────────
// Avkryssing i staden for eitt klikk per sone: brukaren vel heile gruppa og
// lagrar éin gong (eitt angre-steg). Soner i ein annan kategori vert ikkje
// viste — kopla soner må ha same bygningskategori. Ei sone som alt ligg i ei
// anna gruppe vert flytt hit; ei gruppe som då står att med éi sone fell bort.
function showLinkZoneMenu(z, srcFloor, srcFi){
  saveFloorState();
  const kat=x=>x.bygkat||'Kontorbygg';
  const srcBygkat=kat(z);
  const alle=[];
  floors.forEach((fl,fli)=>fl.zones.forEach((zz,zi)=>alle.push({z:zz,fl,fli,zi})));
  const gNamn=gid=>alle.filter(e=>e.z.groupId===gid).map(e=>e.z.name);
  // Kandidatar: same kategori, eller alt i gruppa (ei gammal kopling på tvers
  // av kategoriar skal kunne løysast opp, ikkje gøymast).
  const kand=alle.filter(e=>e.z!==z&&(kat(e.z)===srcBygkat||(z.groupId&&e.z.groupId===z.groupId)));
  const valt=new Set(kand.filter(e=>z.groupId&&e.z.groupId===z.groupId).map(e=>e.z));

  const overlay=document.createElement('div');overlay.className='kz-ov';
  const box=document.createElement('div');box.className='kz-box';
  overlay.appendChild(box);
  const tast=e=>{
    if(e.key==='Escape'){e.stopPropagation();lukk();}
    // Angre byter ut soneobjekta, så dialogen ville vist ei sone som ikkje finst
    if((e.ctrlKey||e.metaKey)&&/^[zy]$/i.test(e.key))lukk();
  };
  const lukk=()=>{overlay.remove();document.removeEventListener('keydown',tast,true);};
  document.addEventListener('keydown',tast,true);
  overlay.onmousedown=e=>{if(e.target===overlay)lukk();};

  const lagre=()=>{
    snapshot();
    const gamle=new Set();
    // Soner som var i gruppa, men ikkje er valde lenger
    if(z.groupId)alle.forEach(e=>{if(e.z!==z&&e.z.groupId===z.groupId&&!valt.has(e.z))delete e.z.groupId;});
    if(!valt.size){
      if(z.groupId)gamle.add(z.groupId);
      delete z.groupId;
    } else {
      const gid=z.groupId||('g'+(++_nextGroupId));
      z.groupId=gid;
      valt.forEach(x=>{if(x.groupId&&x.groupId!==gid)gamle.add(x.groupId);x.groupId=gid;});
      gamle.add(gid);
    }
    // Ei gruppe med berre éi sone att er inga kopling
    gamle.forEach(g=>{const l=alle.filter(e=>e.z.groupId===g);if(l.length===1)delete l[0].z.groupId;});
    updateResults();renderTable();draw();
    const n=getLinkedZones(z).length;
    hintText.textContent=z.groupId?'«'+z.name+'» er kopla med '+(n-1)+' andre soner — éi sone i SIMIEN.':'«'+z.name+'» er ikkje kopla med nokon.';
    lukk();
  };

  const sameKat=kand.filter(e=>kat(e.z)===srcBygkat);
  const ci=zoneColorIdx(srcFi,srcFloor.zones.indexOf(z),z);

  const teikn=()=>{
    box.innerHTML='';
    const hdr=document.createElement('div');hdr.className='kz-hdr';
    hdr.innerHTML='<div class="kz-tit"><span class="kz-ik">'+ikonSvg('kople')+'</span>Kople soner</div>'
      +'<div class="kz-sub">Kopla soner vert éi felles sone i SIMIEN. Geometri og areal vert framleis rekna per sone. Berre soner i same kategori kan koplast.</div>';
    box.appendChild(hdr);

    // Sona vi står på — alltid med
    const src=document.createElement('div');src.className='kz-src';
    src.innerHTML='<span class="kz-dot" style="background:'+COLORS[ci]+'"></span><div class="kz-namn"><b></b><span></span></div><span class="kz-chip">Denne sona</span>';
    src.querySelector('b').textContent=z.name;
    const za=getAreaM2(z);
    src.querySelector('.kz-namn span').textContent=arkNamn(srcFloor)+' · '+srcBygkat+(za!=null?' · '+za.toFixed(1)+' m²':'');
    box.appendChild(src);

    if(!kand.length){
      const tom=document.createElement('div');tom.className='kz-tom';
      tom.textContent='Ingen andre soner med kategori «'+srcBygkat+'» finst i prosjektet.';
      box.appendChild(tom);
    } else {
      // Snarvegar
      const sn=document.createElement('div');sn.className='kz-snar';
      const kb=document.createElement('button');kb.className='kz-btn kz-prim';
      kb.innerHTML=ikonSvg('kople')+'<span></span>';
      kb.lastChild.textContent='Kople alle '+(sameKat.length+1)+' soner i «'+srcBygkat+'»';
      kb.title='Kryssar av alle soner i kategorien og lagrar med ein gong';
      kb.disabled=!sameKat.length||(!!z.groupId&&sameKat.every(e=>e.z.groupId===z.groupId));
      kb.onclick=()=>{sameKat.forEach(e=>valt.add(e.z));lagre();};
      sn.appendChild(kb);
      const ingen=document.createElement('button');ingen.className='kz-btn';ingen.textContent='Fjern alle kryss';
      ingen.disabled=!valt.size;
      ingen.onclick=()=>{valt.clear();teikn();};
      sn.appendChild(ingen);
      box.appendChild(sn);

      const liste=document.createElement('div');liste.className='kz-liste';
      // Per ark, i same rekkjefølgje som floors (delplanar under hovudetasjen)
      floors.forEach(fl=>{
        const her=kand.filter(e=>e.fl===fl);
        if(!her.length)return;
        const eh=document.createElement('label');eh.className='kz-etg';
        const ecb=document.createElement('input');ecb.type='checkbox';
        const nv=her.filter(e=>valt.has(e.z)).length;
        ecb.checked=nv===her.length;ecb.indeterminate=nv>0&&nv<her.length;
        ecb.title='Vel alle i '+arkNamn(fl);
        ecb.onchange=()=>{her.forEach(e=>ecb.checked?valt.add(e.z):valt.delete(e.z));teikn();};
        const et=document.createElement('span');et.textContent=arkNamn(fl);
        const en=document.createElement('span');en.className='kz-etg-n';en.textContent=nv+' / '+her.length;
        eh.appendChild(ecb);eh.appendChild(et);eh.appendChild(en);
        liste.appendChild(eh);
        her.forEach(e=>{
          const r=document.createElement('label');r.className='kz-rad'+(valt.has(e.z)?' on':'');
          const cb=document.createElement('input');cb.type='checkbox';cb.checked=valt.has(e.z);
          cb.onchange=()=>{cb.checked?valt.add(e.z):valt.delete(e.z);teikn();};
          const dot=document.createElement('span');dot.className='kz-dot';
          dot.style.background=COLORS[zoneColorIdx(e.fli,e.zi,e.z)];
          const nm=document.createElement('div');nm.className='kz-namn';
          const b=document.createElement('b');b.textContent=e.z.name;
          const s=document.createElement('span');
          const a=getAreaM2(e.z);
          s.textContent=[a!=null?a.toFixed(1)+' m²':null,e.z.byggeaar?'byggeår '+e.z.byggeaar:null].filter(Boolean).join(' · ');
          nm.appendChild(b);nm.appendChild(s);
          r.appendChild(cb);r.appendChild(dot);r.appendChild(nm);
          // Status: i denne gruppa, i ei anna gruppe, eller annan kategori
          const chip=document.createElement('span');chip.className='kz-chip';
          if(kat(e.z)!==srcBygkat){chip.classList.add('varsel');chip.textContent=kat(e.z);chip.title='Annan kategori — kan berre koplast frå';}
          else if(z.groupId&&e.z.groupId===z.groupId){chip.classList.add('kopla');chip.textContent='Kopla';}
          else if(e.z.groupId){
            chip.textContent='I anna gruppe';
            chip.title='Kopla med '+gNamn(e.z.groupId).filter(n=>n!==e.z.name).join(', ')+' — vert flytt hit om du kryssar av';
          }
          if(chip.textContent)r.appendChild(chip);
          liste.appendChild(r);
        });
      });
      box.appendChild(liste);
    }

    // Samandrag og knappar
    const fot=document.createElement('div');fot.className='kz-fot';
    const sum=document.createElement('div');sum.className='kz-sum';
    const valde=[z,...valt];
    const sa=valde.reduce((s,x)=>s+(getAreaM2(x)||0),0);
    const flytt=[...valt].filter(x=>x.groupId&&x.groupId!==z.groupId).length;
    sum.textContent=valt.size
      ?valde.length+' soner vert éi SIMIEN-sone · '+sa.toFixed(1)+' m²'+(flytt?' · '+flytt+' vert flytt frå ei anna gruppe':'')
      :'Ingen soner valde — sona står for seg sjølv.';
    fot.appendChild(sum);
    const knr=document.createElement('div');knr.className='kz-knr';
    if(z.groupId){
      const ul=document.createElement('button');ul.className='kz-btn kz-fare';ul.textContent='Frikople alle';
      ul.title='Løys opp heile gruppa';
      ul.onclick=()=>{valt.clear();lagre();};
      knr.appendChild(ul);
    }
    const sp=document.createElement('span');sp.style.flex='1';knr.appendChild(sp);
    const av=document.createElement('button');av.className='kz-btn';av.textContent='Avbryt';av.onclick=lukk;
    const ok=document.createElement('button');ok.className='kz-btn kz-prim';ok.textContent='Lagre';ok.onclick=lagre;
    knr.appendChild(av);knr.appendChild(ok);
    fot.appendChild(knr);
    box.appendChild(fot);
  };
  teikn();
  document.body.appendChild(overlay);
}

// ── Kople soner — oversikt over heile prosjektet ─────────────
// Same reglar som showLinkZoneMenu, men utan å starte frå eit sonekort: alle
// soner gruppert på kategori, dei eksisterande gruppene synlege, og
// «Kople alle» per kategori. Kvar handling er eitt angre-steg og dialogen
// står open, så ein kan rydde heile bygget i éin omgang.
function _ryddEinsameGrupper(){
  const n={};
  floors.forEach(f=>f.zones.forEach(z=>{if(z.groupId)n[z.groupId]=(n[z.groupId]||0)+1;}));
  floors.forEach(f=>f.zones.forEach(z=>{if(z.groupId&&n[z.groupId]<2)delete z.groupId;}));
}
// Alle i lista får same groupId — ein gruppe-id som alt finst blant dei vert
// gjenbrukt, så ei eksisterande gruppe veks i staden for å få ny id.
function _kopleSoner(list){
  if(list.length<2)return;
  const gid=(list.find(x=>x.groupId)||{}).groupId||('g'+(++_nextGroupId));
  list.forEach(x=>{x.groupId=gid;});
  _ryddEinsameGrupper();
}
function showKoplingsoversikt(){
  saveFloorState();
  const kat=x=>x.bygkat||'Kontorbygg';
  const valt=new Set();
  let sok='';
  const overlay=document.createElement('div');overlay.className='kz-ov';
  const box=document.createElement('div');box.className='kz-box kz-stor';
  overlay.appendChild(box);
  const tast=e=>{
    if(e.key==='Escape'&&e.target.tagName!=='INPUT'){e.stopPropagation();lukk();}
    // Angre byter ut soneobjekta — teikn oversikta på nytt frå floors etterpå
    if((e.ctrlKey||e.metaKey)&&/^[zy]$/i.test(e.key))setTimeout(()=>{valt.clear();teikn();},0);
  };
  const lukk=()=>{overlay.remove();document.removeEventListener('keydown',tast,true);};
  document.addEventListener('keydown',tast,true);
  overlay.onmousedown=e=>{if(e.target===overlay)lukk();};
  const endre=(fn,melding)=>{
    snapshot();fn();valt.clear();
    updateResults();renderTable();draw();
    hintText.textContent=melding;
    teikn();
  };

  // Søkefeltet står utanfor det som vert teikna på nytt, så fokus står
  const hdr=document.createElement('div');hdr.className='kz-hdr';
  hdr.innerHTML='<div class="kz-tit"><span class="kz-ik">'+ikonSvg('kople')+'</span>Kople soner</div>'
    +'<div class="kz-sub">Kopla soner vert éi felles sone i SIMIEN. Geometri og areal vert framleis rekna per sone. Berre soner i same kategori kan koplast.</div>';
  const sokInp=document.createElement('input');sokInp.type='search';sokInp.className='kz-sok';
  sokInp.placeholder='Søk etter sone…';
  sokInp.oninput=()=>{sok=sokInp.value.trim().toLowerCase();teikn();};
  sokInp.onkeydown=e=>{if(e.key==='Escape'&&sokInp.value){e.stopPropagation();sokInp.value='';sok='';teikn();}};
  hdr.appendChild(sokInp);
  box.appendChild(hdr);
  const liste=document.createElement('div');liste.className='kz-liste';
  box.appendChild(liste);
  const fot=document.createElement('div');fot.className='kz-fot';
  box.appendChild(fot);

  const teikn=()=>{
    const sTop=liste.scrollTop;
    liste.innerHTML='';fot.innerHTML='';
    const alle=[];
    floors.forEach((fl,fli)=>fl.zones.forEach((z,zi)=>alle.push({z,fl,fli,zi})));
    // Fast nummerering av gruppene i dialogen, i rekkjefølgja dei fyrst står
    const gNr={};let nNr=0;
    alle.forEach(e=>{if(e.z.groupId&&gNr[e.z.groupId]==null)gNr[e.z.groupId]=++nNr;});
    const kategoriar=[...new Set(alle.map(e=>kat(e.z)))];
    if(!alle.length){
      const t=document.createElement('div');t.className='kz-tom';t.textContent='Prosjektet har ingen soner enno.';
      liste.appendChild(t);
    }
    let vist=0;
    kategoriar.forEach(k=>{
      const iKat=alle.filter(e=>kat(e.z)===k);
      const her=iKat.filter(e=>!sok||(e.z.name||'').toLowerCase().includes(sok));
      if(!her.length)return;
      vist+=her.length;
      const sek=document.createElement('div');sek.className='kz-kat';
      const kh=document.createElement('div');kh.className='kz-kat-hdr';
      const kn=document.createElement('span');kn.className='kz-kat-namn';kn.textContent=k;
      const kc=document.createElement('span');kc.className='kz-etg-n';kc.textContent=iKat.length+' soner';
      const ka=document.createElement('button');ka.className='kz-btn kz-mini';
      ka.innerHTML=ikonSvg('kople')+'<span>Kople alle</span>';
      const eiGruppe=iKat[0].z.groupId&&iKat.every(e=>e.z.groupId===iKat[0].z.groupId);
      ka.disabled=iKat.length<2||eiGruppe;
      ka.title=eiGruppe?'Alle sonene i kategorien er alt éi gruppe':'Kople alle '+iKat.length+' soner i «'+k+'» til éi SIMIEN-sone';
      ka.onclick=()=>endre(()=>_kopleSoner(iKat.map(e=>e.z)),'Alle '+iKat.length+' soner i «'+k+'» er kopla til éi SIMIEN-sone.');
      kh.appendChild(kn);kh.appendChild(kc);kh.appendChild(ka);
      sek.appendChild(kh);

      // Eksisterande grupper i kategorien
      const gidar=[...new Set(iKat.map(e=>e.z.groupId).filter(Boolean))];
      gidar.forEach(g=>{
        const medl=alle.filter(e=>e.z.groupId===g);
        const andreKat=medl.filter(e=>kat(e.z)!==k).length;
        const gr=document.createElement('div');gr.className='kz-grp';
        const f0=medl[0];
        gr.style.setProperty('--g',COLORS[zoneColorIdx(f0.fli,f0.zi,f0.z)]);
        const gt=document.createElement('div');gt.className='kz-namn';
        const gb=document.createElement('b');gb.textContent='Gruppe '+gNr[g]+' · '+medl.length+' soner';
        const gs=document.createElement('span');
        const etg=[...new Set(medl.map(e=>arkNamn(e.fl)))];
        const ga=medl.reduce((s,e)=>s+(getAreaM2(e.z)||0),0);
        gs.textContent=ga.toFixed(1)+' m² · '+etg.join(', ');
        gt.appendChild(gb);gt.appendChild(gs);
        gr.appendChild(gt);
        if(andreKat){
          const w=document.createElement('span');w.className='kz-chip varsel';w.textContent='Blanda kategoriar';
          w.title=andreKat+' sone(r) i gruppa har ein annan kategori — kopla soner skal ha same kategori';
          gr.appendChild(w);
        }
        const vg=document.createElement('button');vg.className='kz-btn kz-mini';vg.textContent='Vel';
        vg.title='Kryss av sonene i gruppa — legg til fleire og trykk «Kople valde»';
        vg.onclick=()=>{medl.filter(e=>kat(e.z)===k).forEach(e=>valt.add(e.z));teikn();};
        const fr=document.createElement('button');fr.className='kz-btn kz-mini kz-fare';fr.textContent='Frikople';
        fr.onclick=()=>endre(()=>medl.forEach(e=>delete e.z.groupId),'Gruppe '+gNr[g]+' er løyst opp.');
        gr.appendChild(vg);gr.appendChild(fr);
        sek.appendChild(gr);
      });

      her.forEach(e=>{
        const r=document.createElement('label');r.className='kz-rad'+(valt.has(e.z)?' on':'');
        const cb=document.createElement('input');cb.type='checkbox';cb.checked=valt.has(e.z);
        cb.onchange=()=>{cb.checked?valt.add(e.z):valt.delete(e.z);teikn();};
        const dot=document.createElement('span');dot.className='kz-dot';
        dot.style.background=COLORS[zoneColorIdx(e.fli,e.zi,e.z)];
        const nm=document.createElement('div');nm.className='kz-namn';
        const b=document.createElement('b');b.textContent=e.z.name;
        const s=document.createElement('span');
        const a=getAreaM2(e.z);
        s.textContent=[arkNamn(e.fl),a!=null?a.toFixed(1)+' m²':null,e.z.byggeaar?'byggeår '+e.z.byggeaar:null].filter(Boolean).join(' · ');
        nm.appendChild(b);nm.appendChild(s);
        r.appendChild(cb);r.appendChild(dot);r.appendChild(nm);
        if(e.z.groupId){
          const c=document.createElement('span');c.className='kz-chip kopla';c.textContent='Gruppe '+gNr[e.z.groupId];
          r.appendChild(c);
        }
        sek.appendChild(r);
      });
      liste.appendChild(sek);
    });
    if(alle.length&&!vist){
      const t=document.createElement('div');t.className='kz-tom';t.textContent='Ingen soner passar søket.';
      liste.appendChild(t);
    }
    liste.scrollTop=sTop;

    // Samandrag og handlingar for valet
    const v=[...valt];
    const kv=[...new Set(v.map(kat))];
    const sum=document.createElement('div');sum.className='kz-sum';
    const nGr=alle.filter(e=>e.z.groupId).length?Object.keys(gNr).length:0;
    if(!v.length)sum.textContent='Kryss av soner for å kople dei saman. Prosjektet har '+nGr+' gruppe'+(nGr===1?'':'r')+' no.';
    else if(kv.length>1){sum.textContent='Dei valde sonene har ulik kategori ('+kv.join(', ')+') — berre soner i same kategori kan koplast.';sum.classList.add('feil');}
    else{
      const sa=v.reduce((s,x)=>s+(getAreaM2(x)||0),0);
      const gm=[...new Set(v.map(x=>x.groupId).filter(Boolean))];
      sum.textContent=v.length+' soner valde · '+sa.toFixed(1)+' m²'
        +(gm.length?' · vert lagde i Gruppe '+gNr[gm[0]]+(gm.length>1?' (andre grupper misser dei valde sonene)':''):'');
    }
    fot.appendChild(sum);
    const knr=document.createElement('div');knr.className='kz-knr';
    const tom=document.createElement('button');tom.className='kz-btn';tom.textContent='Fjern kryss';
    tom.disabled=!v.length;tom.onclick=()=>{valt.clear();teikn();};
    const fk=document.createElement('button');fk.className='kz-btn kz-fare';fk.textContent='Frikople valde';
    fk.disabled=!v.some(x=>x.groupId);
    fk.onclick=()=>endre(()=>{v.forEach(x=>delete x.groupId);_ryddEinsameGrupper();},v.length+' soner er tekne ut av gruppene sine.');
    const sp=document.createElement('span');sp.style.flex='1';
    const ok=document.createElement('button');ok.className='kz-btn kz-prim';
    ok.innerHTML=ikonSvg('kople')+'<span></span>';ok.lastChild.textContent='Kople valde'+(v.length?' ('+v.length+')':'');
    ok.disabled=v.length<2||kv.length>1;
    ok.onclick=()=>endre(()=>_kopleSoner(v),v.length+' soner er kopla til éi SIMIEN-sone.');
    const lk=document.createElement('button');lk.className='kz-btn';lk.textContent='Lukk';lk.onclick=lukk;
    knr.appendChild(tom);knr.appendChild(fk);knr.appendChild(sp);knr.appendChild(lk);knr.appendChild(ok);
    fot.appendChild(knr);
  };
  teikn();
  document.body.appendChild(overlay);
  sokInp.focus();
}

// ── Table panel ───────────────────────────────────────────────
function renderTable(){
  const wrap=document.getElementById('tableWrap');
  // Tabellfana er skjult som standard, og tabellen er den største DOM-en i
  // programmet. Å byggje han på nytt ved kvar redigering — for noko ingen
  // ser — dominerte kostnaden. Fanebytet kallar renderTable() på nytt, så
  // innhaldet er alltid ferskt når du faktisk opnar fana.
  if(document.getElementById('tablePanel')?.style.display==='none')return;
  if(!zones.length){wrap.innerHTML='<div class="empty"><div class="empty-icon">⬡</div>Ingen soner enno</div>';return;}
  let html='';

  // Soner
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">';
  html+='<div class="ttitle" style="margin:0">Soner</div>';
  html+='<div style="font-size:10px;color:var(--dm-amb-tx,#92400e);display:flex;align-items:center;gap:5px">';
  html+='<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#d97706"></span>';
  html+='Manuelt justert</div></div>';
  html+='<table class="dtbl"><thead><tr><th>Namn</th><th>Kategori</th><th>Areal m²</th><th>Volum m³</th><th>Perim. m</th><th>Etg.høyde m</th><th>Himling m</th><th>Gulv</th><th>Tak</th></tr></thead><tbody>';
  const BYGG_KAT2=['Småhus','Boligblokker','Barnehager','Kontorbygg','Skolebygg','Universitets- og høgskolebygg','Sykehus','Sykehjem','Hoteller','Idrettsbygg','Forretningsbygg','Kulturbygg','Lett industri, verksteder'];
  const mkOpts=(opts,val)=>opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('');
  // Er laget delt opp, styrer kvar delflate sin eigen type — då er éin select
  // for heile sona ei løgn, og cella peikar i staden til sonekortet.
  const mkTypeCelle=(z,kind,dattr)=>{
    const F=FLATE[kind];
    const n=flateListe(z,kind).length;
    if(!n)return `<select class="tbl-input" ${dattr} style="width:100%">${mkOpts(F.typar,z[F.zoneFelt]||F.std)}</select>`;
    return `<span style="font-size:11px;color:var(--accent);font-weight:600" title="${F.eining[0].toUpperCase()+F.eining.slice(1)} er delt i ${n} flater — sjå sonekortet">Oppdelt · ${n} flater</span>`;
  };
  floors.forEach((fl,fli)=>{fl.zones.forEach((z,zi)=>{
    const _zm=mppForFloor(fl);
    const area=calcAreaM2(z.pts,_zm);
    const perim=calcPerimM(z.pts,_zm);
    const fh=getHoyde(z);
    const areaVal=z.areaOverride!=null?z.areaOverride:(area?area.toFixed(2):'');
    const perimVal=z.perimOverride!=null?z.perimOverride:(perim?perim.toFixed(2):'');
    const _flLabel=floors.length>1?` <span style="font-size:10px;color:var(--text3);font-weight:400">${arkNamn(fl)}</span>`:'';  
    html+=`<tr>
      <td><div style="display:flex;align-items:center;gap:4px"><input class="tbl-input" data-zname="${fli},${zi}" value="${z.name.replace(/"/g,'&quot;')}">${_flLabel}</div></td>
      <td><select class="tbl-input" data-zbygkat="${fli},${zi}" style="width:100%">${mkOpts(BYGG_KAT2,z.bygkat||'Kontorbygg')}</select></td>
      <td class="${z.areaOverride!=null?'cell-overridden':''}"><input class="tbl-input${z.areaOverride!=null?' overridden':''}" data-zarea="${fli},${zi}" value="${areaVal}" style="width:70px" placeholder="auto" title="${z.areaOverride!=null?'Manuelt justert — slett for å tilbakestille':'Endre for å overstyre. Blank = automatisk.'}"></td>
      <td style="color:var(--dm-t3,#64748b);font-weight:500">${getVolum(z)!=null?getVolum(z).toFixed(1):"—"}</td>
      <td class="${z.perimOverride!=null?'cell-overridden':''}"><input class="tbl-input${z.perimOverride!=null?' overridden':''}" data-zperim="${fli},${zi}" value="${perimVal}" style="width:60px" placeholder="auto" title="${z.perimOverride!=null?'Manuelt justert — slett for å tilbakestille':'Endre for å overstyre. Blank = automatisk.'}"></td>
      <td><input class="tbl-input" data-zhoyde="${fli},${zi}" value="${getHoyde(z)}" style="width:50px" title="Etasjehøyde — styrer fasadeareal"></td>
      <td class="${z.himling!=null?'cell-overridden':''}"><input class="tbl-input${z.himling!=null?' overridden':''}" data-zhimling="${fli},${zi}" value="${z.himling!=null?z.himling:''}" placeholder="${getHoyde(z)}" style="width:50px" title="Himlingshøgde — styrer berre volum. Blank = same som etg.høyde."></td>
      <td>${mkTypeCelle(z,'gulv',`data-zgulv="${fli},${zi}"`)}</td>
      <td>${mkTypeCelle(z,'tak',`data-ztak="${fli},${zi}"`)}</td>
    </tr>`;
  });});
  html+='</tbody></table>';

  // Tak og gulv
  html+='<div class="ttitle">Tak og gulv</div>';
  html+='<table class="dtbl"><thead><tr><th>Sone</th><th>Type</th><th>Konstruksjon</th><th>Flatareal m²</th><th>Takvinkel °</th><th title="Skrått areal etter vinkelkorrigering">Skrå m²</th><th>Utv. perimeter m</th></tr></thead><tbody>';
  floors.forEach((fl,fli)=>{fl.zones.forEach((z,zi)=>{
    const utvOmk=getUtvOmkrets(z);
    const _fltag=floors.length>1?` (${arkNamn(fl)})`:'';
    const _sk=z.skillevegg||new Set();
    // Éi rad per flate. Udelt lag gir nøyaktig éi rad med redigerbar type, som før.
    const flateRader=(kind,dattr)=>{
      const F=FLATE[kind];
      const delt=flateListe(z,kind).length>0;
      eksportFlater(z,kind).forEach(({fl:flate,type,navn,area},fi2)=>{
        const typeCelle=delt
          ?`<select class="tbl-input" data-tflate="${fli},${zi},${kind},${fi2}" style="width:100%">`
            +F.typar.map(o=>`<option${o===type?' selected':''}>${o}</option>`).join('')+'</select>'
          :`<select class="tbl-input" ${dattr} style="width:100%">`
            +F.typar.map(o=>`<option${o===type?' selected':''}>${o}</option>`).join('')+'</select>';
        const radNamn=delt?`${z.name}${_fltag} <span style="color:var(--text3)">· ${navn}</span>`:`${z.name}${_fltag}`;
        // Vinkel og skrått areal er berre meiningsfulle på tak mot det fri
        const erTak=kind==='tak'&&type==='Tak';
        const tvDeg=erTak?(flate?Math.max(0,flate.vinkel||0):getTakvinkel(z)):0;
        const skraaA=erTak?(flate?(tvDeg>0?area/Math.cos(tvDeg*Math.PI/180):area):(getTakAreal(z)??0)):null;
        const tvCelle=erTak
          ?(delt
            ?`<span style="font-family:inherit;color:${tvDeg>0?'var(--accent)':'var(--text3)'}">${tvDeg.toFixed(0)}</span>`
            :`<input class="tbl-input" data-ztakvinkel="${fli},${zi}" value="${tvDeg||''}" placeholder="0" style="width:46px" title="Takvinkel i grader (0=flatt). Arealet vert korrigert med 1/cos(vinkel).">`)
          :'<span style="color:var(--text3)">—</span>';
        // Perimeter: berre golv på grunn. Ei delflate har berre si eiga ytterkant.
        let perimCelle='<span style="color:var(--dm-t3,#94a3b8)">—</span>';
        if(kind==='gulv'){
          const pm=flate?flateKantLenM(z,flate,ix=>!_sk.has(ix)):utvOmk;
          perimCelle=pm!=null?`<span title="Utvendig omkrets (berre yttervegg, ikkje SK)">${pm.toFixed(2)} m</span>`:'—';
        }
        html+=`<tr><td style="color:var(--dm-t3,#64748b)">${radNamn}</td>`
          +`<td style="color:var(--dm-t3,#6b7280)">${kind==='tak'?'Tak':'Gulv'}</td>`
          +`<td>${typeCelle}</td>`
          +`<td style="font-weight:600">${area.toFixed(2)}</td>`
          +`<td>${tvCelle}</td>`
          +`<td ${erTak&&tvDeg>0?'style="color:var(--accent);font-weight:600"':'style="color:var(--text3)"'}>${skraaA!=null?skraaA.toFixed(2):'—'}</td>`
          +`<td style="color:var(--dm-t3,#64748b)">${perimCelle}</td></tr>`;
      });
      // Manglande eller overlappande dekning skal aldri passere i stillheit
      const avvik=flateAvvikM2(z,kind);
      if(delt&&Math.abs(avvik)>0.05){
        html+=`<tr><td colspan="7" style="color:var(--dm-amb-tx,#92400e);background:var(--dm-amb-bg,#fef3c7);font-size:11px">`
          +(avvik>0?`⚠ ${avvik.toFixed(2)} m² av ${F.eining} i ${z.name} er ikkje dekt av nokon flate`
                   :`⚠ Flatene på ${F.eining} i ${z.name} overlappar med ${(-avvik).toFixed(2)} m²`)
          +'</td></tr>';
      }
    };
    flateRader('gulv',`data-tgulv="${fli},${zi}"`);
    flateRader('tak',`data-ttak="${fli},${zi}"`);
  });});
  html+='</tbody></table>';

  // U-verdiar og n50 tabell
  html+='<div class="ttitle">U-verdiar og n50</div>';
  // Kjellerkolonnane er berre relevante når prosjektet har ei kjellersone
  const _harKjeller=floors.some(fl=>fl.zones.some(z=>isKjeller(z)));
  html+='<table class="dtbl"><thead><tr><th>Sone</th><th>Byggeår</th><th title="Yttervegg">U-vegg<br><small>W/m²K</small></th><th title="Tak">U-tak<br><small>W/m²K</small></th><th title="Gulv mot grunn">U-gulv<br><small>W/m²K</small></th>'
    +(_harKjeller?'<th title="Kjellervegg mot terreng">U-kj.vegg<br><small>W/m²K</small></th><th title="Kjellergulv mot grunn">U-kj.gulv<br><small>W/m²K</small></th>':'')
    +'<th title="Vindauge inkl. karm">U-vindu<br><small>W/m²K</small></th><th title="Lekkasjetall">n50<br><small>1/h</small></th><th title="Normalisert kuldebroverdi">Kuldebro<br><small>W/m²K</small></th></tr></thead><tbody>';
  // Check if all zones share same byggeår
  const _allBy=floors.flatMap(fl=>fl.zones).map(z=>z.byggeaar).filter(Boolean);
  const _sharedBy=_allBy.length>0&&_allBy.every(y=>y===_allBy[0]);
  floors.forEach((fl,fli)=>{fl.zones.forEach((z,zi)=>{
    const std=entroStandard(z.byggeaar);
    const _fltag=floors.length>1?` (${arkNamn(fl)})`:''
;    // Check if this zone's byggeår is inherited (same as first zone that set it)
    const _isInherited=_sharedBy&&floors[0].zones[0]!==z&&z.byggeaar===_allBy[0];
    const mkUCell=(field,stdVal,ovVal)=>{
      const isOv=ovVal!=null;
      const dispV=isOv?ovVal:stdVal;
      const bg=isOv?'var(--amber-dim)':stdVal?'':'var(--surface2)';
      const border=isOv?'var(--amber)':stdVal?'var(--border2)':'var(--border2)';
      const title=isOv?'Manuelt overstyrt':stdVal?'Standard':'Ikkje sett — legg inn byggeår';
      return `<td class="${isOv?'cell-overridden':''}"><input class="tbl-input${isOv?' overridden':''}" data-uval="${fli},${zi},${field}" value="${dispV!=null?dispV:''}" placeholder="${stdVal!=null?stdVal:'—'}" style="width:52px;font-family:inherit" title="${title}"></td>`;
    };
    html+=`<tr style="${_isInherited?'opacity:.7':''}">`
      +`<td style="font-weight:600;color:var(--text)">${z.name}${_fltag}</td>`
      +`<td style="font-family:inherit;color:${_isInherited?'var(--text3)':'var(--text)'}">${z.byggeaar||'—'}${_isInherited?' <small style="color:var(--text3)">(arva)</small>':''}</td>`
      +mkUCell('uVegg',std?.uVegg,z.uVegg)
      +mkUCell('uTak',std?.uTak,z.uTak)
      +mkUCell('uGulv',std?.uGulv,z.uGulv)
      +(_harKjeller?(isKjeller(z)
        ?mkUCell('uKjVegg',std?.uKjVegg,z.uKjVegg)+mkUCell('uKjGulv',std?.uKjGulv,z.uKjGulv)
        :'<td style="color:var(--text3)">—</td><td style="color:var(--text3)">—</td>'):'')
      +mkUCell('uVindu',std?.uVindu,z.uVindu)
      +mkUCell('n50',std?.n50,z.n50)
      +mkUCell('kuldebro',std?.kuldebro,z.kuldebro)
      +'</tr>';
  });});
  html+='</tbody></table>';

  // Fasadar — sone for sone med redigerbare celler
  html+='<div class="ttitle">Fasadar</div>';
  floors.forEach((fl,fli)=>{fl.zones.forEach((z,zi)=>{
    const segs=calcSegments(z.pts,getHoyde(z),mppForFloor(fl));
    if(!segs)return;
    const sk=z.skillevegg||new Set();
    const labels3=getFacadeLabels(z,segs);
    let skMergedTbl=false;
    const zColor=COLORS[zi%COLORS.length];
    if(!z.segOverrides)z.segOverrides={};
    const _flsuf=floors.length>1?` <span style="font-size:10px;font-weight:400;color:var(--text3)">${arkNamn(fl)}</span>`:'';
    html+=`<div style="margin-bottom:2px;padding:4px 0 2px;font-size:11px;font-weight:700;color:${zColor};border-bottom:2px solid ${zColor}22">${z.name}${_flsuf}</div>`;
    html+='<table class="dtbl" style="margin-bottom:10px"><thead><tr><th>Fasade</th><th>Type</th><th>Lengde m</th><th>Veggfl. m²</th><th>Vindauge m²</th><th>Netto m²</th><th>U-verdi W/m²K</th></tr></thead><tbody>';
    const stdZ=entroStandard(z.byggeaar);
    segs.forEach((seg,si)=>{
      const isSK=sk.has(seg.idx);
      const nm=labels3[si];
      // Merged SK row
      if(isSK&&z.skMerged){
        if(skMergedTbl)return;
        skMergedTbl=true;
        const allSK=segs.filter(s=>sk.has(s.idx));
        const ov=z.segOverrides['sk_merged']||{};
        const totalLen=ov.lenM!=null?ov.lenM:allSK.reduce((s,s2)=>s+(s2.lenM||0),0);
        const totalArea=ov.areaM2!=null?ov.areaM2:allSK.reduce((s,s2)=>s+(s2.areaM2||0),0);
        const skName=(z.segOverrides?.['sk_merged']?.name||'SK')+` (${allSK.length} seg)`;
        html+=`<tr style="background:var(--dm-amb-bg,#fef3c7)">
          <td style="color:#d97706;font-weight:700"><input class="tbl-input" data-fad-name="${fli},${zi},sk_merged" value="${skName}" style="width:120px;border:none;background:none;font-weight:700;color:#d97706;padding:0;font-size:inherit" title="Namn på skiljevegg-gruppe"></td>
          <td style="color:#d97706;font-weight:600">Skillevegg</td>
          <td class="${ov.lenM!=null?'cell-overridden':''}"><input class="tbl-input${ov.lenM!=null?' overridden':''}" data-segov="${fli},${zi},sk_merged,lenM" value="${totalLen.toFixed(2)}" style="width:60px" title="${ov.lenM!=null?'Manuelt justert — slett for å tilbakestille':''}"></td>
          <td class="${ov.areaM2!=null?'cell-overridden':''}"><input class="tbl-input${ov.areaM2!=null?' overridden':''}" data-segov="${fli},${zi},sk_merged,areaM2" value="${totalArea.toFixed(2)}" style="width:60px" title="${ov.areaM2!=null?'Manuelt justert — slett for å tilbakestille':''}"></td>
          <td>—</td>
          <td>—</td>
          <td style="color:var(--text3)">—</td>
        </tr>`;
        return;
      }
      const wins=(z.windows||[]).filter(w=>w.segIdx===seg.idx);
      const winA=wins.reduce((s,w)=>s+(w.breddeMm/1000)*(w.hoyMm/1000)*w.antal,0);
      const ov=z.segOverrides[seg.idx]||{};
      const lenVal=ov.lenM!=null?ov.lenM:seg.lenM;
      const areaVal2=ov.areaM2!=null?ov.areaM2:seg.areaM2;
      const nettoVal=ov.nettoM2!=null?ov.nettoM2:(areaVal2!=null?areaVal2-winA:null);
      const lenStr=lenVal!=null?lenVal.toFixed(2):'—';
      const areaStr2=areaVal2!=null?areaVal2.toFixed(2):'—';
      const nettoStr=isSK||nettoVal==null?'—':nettoVal.toFixed(2);
      const rowBg=isSK?'background:var(--dm-amb-bg,#fef3c7)':'';
      const displayName=ov.name??(isSK?'SK':'');
      const nameDisplay=displayName?`${displayName} · ${nm}`:`${nm}`;
      html+=`<tr style="${rowBg}">
        <td style="color:${zColor};font-weight:600"><input class="tbl-input" data-fad-name="${fli},${zi},${seg.idx}" value="${nameDisplay}" style="width:120px;border:none;background:none;font-weight:600;color:${zColor};padding:0;font-size:inherit" title="Namn på fasade${isSK?' eller skiljevegg':''}"></td>
        <td style="color:${isSK?'#d97706':'#94a3b8'};font-weight:${isSK?'600':'400'}">${isSK?'Skillevegg':'Yttervegg'}</td>
        <td class="${ov.lenM!=null?'cell-overridden':''}"><input class="tbl-input${ov.lenM!=null?' overridden':''}" data-segov="${fli},${zi},${seg.idx},lenM" value="${lenStr}" placeholder="—" style="width:60px" title="${ov.lenM!=null?'Manuelt justert — slett for å tilbakestille':''}"></td>
        <td class="${ov.areaM2!=null?'cell-overridden':''}"><input class="tbl-input${ov.areaM2!=null?' overridden':''}" data-segov="${fli},${zi},${seg.idx},areaM2" value="${areaStr2}" placeholder="—" style="width:60px" title="${ov.areaM2!=null?'Manuelt justert — slett for å tilbakestille':''}"></td>
        <td style="color:#0891b2">${isSK?'—':winA>0?winA.toFixed(2):'—'}</td>
        <td class="${!isSK&&ov.nettoM2!=null?'cell-overridden':''}">${isSK?'—':`<input class="tbl-input${ov.nettoM2!=null?' overridden':''}" data-segov="${fli},${zi},${seg.idx},nettoM2" value="${nettoStr}" placeholder="—" style="width:60px" title="${ov.nettoM2!=null?'Manuelt justert — slett for å tilbakestille':''}">`}</td>
        ${(()=>{
          if(isSK)return '<td style="color:var(--text3)">—</td>';
          const segKey='seg_'+seg.idx;
          const segU=z.uPerSeg?.[segKey];
          const isOv=segU!=null,isSoneOv=!isOv&&z.uVegg!=null;
          const effU=segU??z.uVegg??stdZ?.uVegg;
          const ph=z.uVegg??stdZ?.uVegg;
          const bc=isOv?'var(--amber)':isSoneOv?'var(--accent)':'var(--border2)';
          const bg=isOv?'var(--amber-dim)':isSoneOv?'var(--accent-dim)':'';
          const tt=isOv?'Fasade-spesifikk':isSoneOv?'Frå sone':stdZ?'Standard':'Legg inn byggeår';
          return `<td class="${isOv?'cell-overridden':''}"><input class="tbl-input${isOv?' overridden':''}" data-uvseg="${fli},${zi},${segKey}" value="${effU!=null?effU:''}" placeholder="${ph!=null?ph:''}" style="width:52px;font-family:inherit;border-color:${bc};background:${bg}" title="${tt}"></td>`;
        })()}
      </tr>`;
    });
    // Gavlflater — trekanta ytterveggar over veggtopp
    (z.gavlflater||[]).forEach(gf=>{
      if(!gf.area||gf.area<0.01)return;
      const gseg=segs.find(s=>s.idx===gf.segIdx);
      if(!gseg)return;
      const gavlNm=(gf.dir||gseg.dir||'Gavl')+' gavl';
      const effU=(z.uPerSeg?.['seg_'+gf.segIdx])??z.uVegg??stdZ?.uVegg;
      const lenStr=gf.lenM!=null?gf.lenM.toFixed(2):'—';
      html+=`<tr>
        <td style="color:${zColor};font-weight:600">${gavlNm}</td>
        <td style="color:var(--dm-t3,#94a3b8);font-weight:400">Yttervegg</td>
        <td>${lenStr}</td>
        <td>${gf.area.toFixed(2)}</td>
        <td>—</td>
        <td>${gf.area.toFixed(2)}</td>
        <td style="color:var(--text3)">${effU!=null?effU.toFixed(2):'—'}</td>
      </tr>`;
    });
    html+='</tbody></table>';
  });});

  // Vindauge og dører
  const allWins=[];
  floors.forEach((fl,fli)=>{fl.zones.forEach((z,zi)=>{
    const segs=calcSegments(z.pts,null,mppForFloor(fl))||[];
    (z.windows||[]).forEach((w,wi)=>{
      const dir=segs[w.segIdx]?.dir||w.dir;
      const _wfn=floors.length>1?` (${arkNamn(fl)})`:'';allWins.push({...w,zoneName:z.name+_wfn,zi,wi,dir,fl,fli});
    });
  });});
  if(allWins.length){
    html+='<div class="ttitle">Vindauge og dører</div>';
    html+='<table class="dtbl"><thead><tr><th>Sone</th><th>Fasade</th><th>Type</th><th>Breidd mm</th><th>Høgd mm</th><th>Tal</th><th>Areal m²</th><th>U-verdi W/m²K</th><th></th></tr></thead><tbody>';
    allWins.forEach(w=>{
      const totalA=((w.breddeMm/1000)*(w.hoyMm/1000)*w.antal).toFixed(2);
      html+=`<tr>
        <td style="color:var(--dm-t3,#64748b)">${w.zoneName}</td>
        <td style="color:${COLORS[w.zi%COLORS.length]};font-weight:600">${w.dir}</td>
        <td><strong>${w.name||(w.type==='dor'?'Dør':'Vindauge')}</strong></td>
        <td><input class="tbl-input" data-wb="${w.fli},${w.zi},${w.wi}" value="${w.breddeMm}" style="width:60px"></td>
        <td><input class="tbl-input" data-wh="${w.fli},${w.zi},${w.wi}" value="${w.hoyMm}" style="width:60px"></td>
        <td>${w.type==='dor'&&(w.antal||1)<=1?'<span style="color:var(--text3)">1</span>':`<input class="tbl-input" data-wn="${w.fli},${w.zi},${w.wi}" value="${w.antal}" style="width:40px">`}</td>
        <td style="color:#06b6d4">${totalA}</td>
        ${(()=>{
          const _wz=floors[w.fli].zones[w.zi];
          const _wstd=entroStandard(_wz.byggeaar);
          const _wOv=w.uVerdi!=null,_wSone=!_wOv&&_wz.uVindu!=null;
          const _wEff=w.uVerdi??_wz.uVindu??_wstd?.uVindu;
          const _wPh=_wz.uVindu??_wstd?.uVindu??'';
          const _wBc=_wOv?'var(--amber)':_wSone?'var(--accent)':'var(--border2)';
          const _wBg=_wOv?'var(--amber-dim)':_wSone?'var(--accent-dim)':'';
          return `<td class="${_wOv?'cell-overridden':''}"><input class="tbl-input${_wOv?' overridden':''}" data-wuv="${w.fli},${w.zi},${w.wi}" value="${_wEff??''}" placeholder="${_wPh}" style="width:52px;font-family:inherit;border-color:${_wBc};background:${_wBg}" title="${_wOv?'Vindauge-spesifikk':_wSone?'Frå sone':_wstd?'Standard':'Legg inn byggeår'}"></td>`;
        })()}
        <td><button onclick="floors[${w.fli}].zones[${w.zi}].windows.splice(${w.wi},1);updateResults();renderTable();draw();" style="background:none;border:none;color:#ef444499;cursor:pointer;font-size:12px">✕</button></td>
      </tr>`;
    });
    html+='</tbody></table>';
  }

  // Cross-floor grouped zones summary
  const allGroups={};
  floors.forEach((f,fi)=>{
    f.zones.forEach(z=>{
      if(!z.groupId)return;
      if(!allGroups[z.groupId])allGroups[z.groupId]=[];
      allGroups[z.groupId].push({z,fi,fname:arkNamn(f)});
    });
  });
  const groupKeys=Object.keys(allGroups).filter(k=>allGroups[k].length>1);
  if(groupKeys.length){
    html+='<div class="ttitle">Same sone — fleire etasjar</div>';
    html+='<table class="dtbl"><thead><tr><th>Gruppe</th><th>Etasje</th><th>Sone</th><th>Areal m²</th><th>Volum m³</th></tr></thead><tbody>';
    groupKeys.forEach(gk=>{
      const entries=allGroups[gk];
      const totalA=entries.reduce((s,e)=>{const a=getAreaM2(e.z);return s+(a||0);},0);
      const totalV=entries.reduce((s,e)=>{const v=getVolum(e.z);return s+(v||0);},0);
      entries.forEach((e,i)=>{
        const a=getAreaM2(e.z);const v=getVolum(e.z);
        html+=`<tr style="${i===0?'border-top:2px solid var(--accent-dim)':''}">
          <td style="color:var(--accent);font-weight:700">${i===0?gk:''}</td>
          <td style="color:var(--text3)">${e.fname}</td>
          <td style="color:var(--text)">${e.z.name}</td>
          <td style="font-family:inherit">${a!=null?a.toFixed(2):'—'}</td>
          <td style="font-family:inherit">${v!=null?v.toFixed(1):'—'}</td>
        </tr>`;
      });
      html+=`<tr style="background:var(--accent-dim)">
        <td colspan="3" style="font-weight:600;color:var(--accent);font-size:11px">Totalt</td>
        <td style="font-weight:700;font-family:inherit;color:var(--accent)">${totalA.toFixed(2)}</td>
        <td style="font-weight:700;font-family:inherit;color:var(--accent)">${totalV.toFixed(1)}</td>
      </tr>`;
    });
    html+='</tbody></table>';
  }

  wrap.innerHTML=html;

  // Wire up table inputs
  wrap.querySelectorAll('[data-zname]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.zname.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{_z.name=inp.value.trim()||_z.name;updateResults();draw();};
    inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();};
  });
  wrap.querySelectorAll('[data-zbygkat]').forEach(sel=>{
    const [_fi,_zi]=sel.dataset.zbygkat.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    sel.onchange=()=>{_z.bygkat=sel.value;};
  });
  wrap.querySelectorAll('[data-zarea]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.zarea.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{
      const v=inp.value.trim()===''?null:parseFloat(inp.value);
      _z.areaOverride=(v===null||isNaN(v))?null:v;
      updateResults();renderTable();draw();
    };
  });
  wrap.querySelectorAll('[data-zperim]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.zperim.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{
      const v=inp.value.trim()===''?null:parseFloat(inp.value);
      _z.perimOverride=(v===null||isNaN(v))?null:v;
      updateResults();renderTable();
    };
  });
  wrap.querySelectorAll('[data-ztakvinkel]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.ztakvinkel.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{
      const raw=inp.value.trim();
      const v=raw===''?null:parseFloat(inp.value);
      const ok=v!==null&&!isNaN(v)&&v>0&&v<90;
      _z.takvinkel=ok?v:null;
      if(!ok&&raw!=='')hintText.textContent='⚠ Takvinkel må vere mellom 1 og 89 grader — sett til flatt tak.';
      updateResults();renderTable();
    };
  });
  wrap.querySelectorAll('[data-zhoyde]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.zhoyde.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{
      const v=parseFloat(inp.value);
      _z.hoyde=isNaN(v)?null:v;
      updateResults();renderTable();draw();
    };
  });
  wrap.querySelectorAll('[data-zhimling]').forEach(inp=>{
    const [_fi,_zi]=inp.dataset.zhimling.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    inp.onchange=()=>{
      const v=inp.value.trim()===''?null:parseFloat(inp.value);
      _z.himling=(v===null||isNaN(v))?null:v;
      updateResults();renderTable();
    };
  });
  wrap.querySelectorAll('[data-zgulv]').forEach(sel=>{
    const [_fi,_zi]=sel.dataset.zgulv.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    sel.onchange=()=>{_z.gulvtype=sel.value;updateResults();renderTable();};
  });
  wrap.querySelectorAll('[data-ztak]').forEach(sel=>{
    const [_fi,_zi]=sel.dataset.ztak.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    sel.onchange=()=>{_z.taktype=sel.value;updateResults();renderTable();};
  });
  wrap.querySelectorAll('[data-tflate]').forEach(sel=>{
    const [_fi,_zi,_kind,_idx]=sel.dataset.tflate.split(',');
    const _z=floors[parseInt(_fi)]?.zones[parseInt(_zi)];
    const _fl=_z&&flateListe(_z,_kind)[parseInt(_idx)];
    if(!_fl)return;
    sel.onchange=()=>{
      snapshot();
      _fl.type=sel.value;
      if(_kind==='tak'){
        if(_fl.type==='Tak'){
          if(_fl.vinkel==null)_fl.vinkel=getTakvinkel(_z);
          if(_fl.retning==null)_fl.retning=_autoRetningForTakflate(_fl.pts,_z,calcSegments(_z.pts,getHoyde(_z),mppForZone(_z))||[]);
        }
        _z.gavlflater=[];
      }
      updateResults();renderTable();draw();
    };
  });
  wrap.querySelectorAll('[data-tgulv]').forEach(sel=>{
    const [_fi,_zi]=sel.dataset.tgulv.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    sel.onchange=()=>{_z.gulvtype=sel.value;updateResults();renderTable();};
  });
  wrap.querySelectorAll('[data-uvseg]').forEach(inp=>{
    const [_fi,_zi,segKey]=inp.dataset.uvseg.split(',');
    const _z=floors[parseInt(_fi)]?.zones[parseInt(_zi)];
    if(!_z)return;
    inp.onchange=()=>{const v=inp.value.trim();if(!_z.uPerSeg)_z.uPerSeg={};if(v==='')delete _z.uPerSeg[segKey];else _z.uPerSeg[segKey]=parseFloat(v);renderTable();};
  });
  wrap.querySelectorAll('[data-fad-name]').forEach(inp=>{
    const parts=inp.dataset.fadName.split(',');
    const [_fi,_zi,sidxRaw]=[parseInt(parts[0]),parseInt(parts[1]),parts[2]];
    const _z=floors[_fi]?.zones[_zi];
    if(!_z)return;
    const sidx=sidxRaw==='sk_merged'?'sk_merged':parseInt(sidxRaw);
    inp.onchange=()=>{
      const v=inp.value.trim();
      if(!_z.segOverrides)_z.segOverrides={};
      if(!_z.segOverrides[sidx])_z.segOverrides[sidx]={};
      if(v==='')delete _z.segOverrides[sidx].name;
      else _z.segOverrides[sidx].name=v;
      renderTable();
    };
  });
  wrap.querySelectorAll('[data-wuv]').forEach(inp=>{
    const [_fi,_zi,_wi]=inp.dataset.wuv.split(',').map(Number);
    const _w=floors[_fi]?.zones[_zi]?.windows[_wi];
    if(!_w)return;
    inp.onchange=()=>{const v=inp.value.trim();_w.uVerdi=v===''?null:parseFloat(v);renderTable();};
  });
  wrap.querySelectorAll('[data-uval]').forEach(inp=>{
    const [_fi,_zi,field]=inp.dataset.uval.split(',');
    const _z=floors[parseInt(_fi)]?.zones[parseInt(_zi)];
    if(!_z)return;
    inp.onchange=()=>{
      const v=inp.value.trim();
      _z[field]=(v==='')?null:parseFloat(v);
      updateResults();renderTable();
    };
  });
  wrap.querySelectorAll('[data-ttak]').forEach(sel=>{
    const [_fi,_zi]=sel.dataset.ttak.split(',').map(Number);
    const _z=floors[_fi].zones[_zi];
    sel.onchange=()=>{_z.taktype=sel.value;updateResults();renderTable();};
  });
  wrap.querySelectorAll('[data-segov]').forEach(inp=>{
    const parts=inp.dataset.segov.split(',');
    const [_sfi,_szi,sidxRaw,field]=[parseInt(parts[0]),parseInt(parts[1]),parts[2],parts[3]];
    const _sz=floors[_sfi]?.zones[_szi];
    if(!_sz)return;
    if(!_sz.segOverrides)_sz.segOverrides={};
    const sidx=sidxRaw==='sk_merged'?'sk_merged':parseInt(sidxRaw);
    inp.onchange=()=>{
      const raw=inp.value.trim();
      if(!_sz.segOverrides[sidx])_sz.segOverrides[sidx]={};
      if(raw===''||raw==='—'){delete _sz.segOverrides[sidx][field];if(!Object.keys(_sz.segOverrides[sidx]).length)delete _sz.segOverrides[sidx];}
      else _sz.segOverrides[sidx][field]=parseFloat(raw)||0;
      renderTable();
    };
  });
  wrap.querySelectorAll('[data-wb]').forEach(inp=>{
    const [_fi,_zi,_wi]=inp.dataset.wb.split(',').map(Number);
    inp.onchange=()=>{const w=floors[_fi].zones[_zi].windows[_wi];const v=parseInt(inp.value);w.breddeMm=v>0?v:w.breddeMm;updateResults();renderTable();draw();};
  });
  wrap.querySelectorAll('[data-wh]').forEach(inp=>{
    const [_fi,_zi,_wi]=inp.dataset.wh.split(',').map(Number);
    inp.onchange=()=>{const w=floors[_fi].zones[_zi].windows[_wi];const v=parseInt(inp.value);w.hoyMm=v>0?v:w.hoyMm;updateResults();renderTable();draw();};
  });
  wrap.querySelectorAll('[data-wn]').forEach(inp=>{
    const [_fi,_zi,_wi]=inp.dataset.wn.split(',').map(Number);
    inp.onchange=()=>{const z=floors[_fi].zones[_zi];const w=z.windows[_wi];let v=parseInt(inp.value);if(w.type==='dor')v=Math.min(v,winCount(w));const g=winGeom(z,w);winSetAntal(w,v>0?v:1,g.width,g.segLen,winOpptekne(z,w,g.segLen,g.mpp));updateResults();renderTable();draw();};
  });
}

// Snap-funksjon for klippeverktøyet: hjørner og kantmidtpunkt på alle flater i laget
function _snapKlippPt(sx,sy){
  if(!klippTakflateTarget)return null;
  const{z}=klippTakflateTarget;
  const _kind=klippTakflateTarget.kind||'tak';
  const THRESH=16; // skjermpikslar
  let best=null,bestD=THRESH;
  const check=(x,y,type)=>{
    const sp=i2s(x,y);
    const d=Math.hypot(sx-sp.x,sy-sp.y);
    if(d<bestD){bestD=d;best={x,y,sx:sp.x,sy:sp.y,type};}
  };
  // Startpunktet i den pågåande linja har høgst prioritet — det er slik ei
  // sløyfe vert lukka, og då klippar ein ut ein bit midt i flata
  if(klippTakflatePts.length>=3){
    const p0=klippTakflatePts[0];
    check(p0.x,p0.y,'lukk');
    if(best&&best.type==='lukk')return best;
  }
  flateListe(z,_kind).forEach(tf=>{
    const pts=tf.pts||[];
    // Hjørner
    pts.forEach(p=>check(p.x,p.y,'corner'));
    // Kantmidtpunkt
    for(let i=0;i<pts.length;i++){
      const p1=pts[i],p2=pts[(i+1)%pts.length];
      check((p1.x+p2.x)/2,(p1.y+p2.y)/2,'mid');
    }
  });
  // Snap også til sone-polygon-hjørner (for å starte/avslutte på ein kant)
  (z.pts||[]).forEach(p=>check(p.x,p.y,'zone'));
  return best;
}

