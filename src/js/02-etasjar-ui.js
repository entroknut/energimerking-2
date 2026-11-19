// ── Floor UI ─────────────────────────────────────────────────
// Namnet på ei fane er berre tekst til brukaren ber om å endre det:
// dobbeltklikk, ✎ på den aktive fana, eller «Gi nytt namn» i høgreklikkmenyen.
// Då vert det eit tydeleg felt; Enter/klikk utanfor lagrar, Esc avbryt, og
// fana blinkar grønt når namnet er teke i bruk. Eit alltid-ope felt gjorde det
// uklart om ei endring var lagra.
let _faneKlikk={key:null,t:0};   // dobbeltklikk over ei omteikning av fanene
function _faneNamn(nameEl,getName,setName){
  nameEl.className='floor-tab-name';
  nameEl.textContent=getName();
  const start=()=>{
    if(nameEl.isContentEditable)return;
    nameEl.contentEditable='true';
    nameEl.classList.add('editing');
    nameEl.focus();
    const r=document.createRange();r.selectNodeContents(nameEl);
    const s=window.getSelection();s.removeAllRanges();s.addRange(r);
  };
  const ferdig=lagre=>{
    if(!nameEl.isContentEditable)return;
    nameEl.contentEditable='false';
    nameEl.classList.remove('editing');
    const n=nameEl.textContent.replace(/\s+/g,' ').trim();
    const endra=lagre&&n&&n!==getName();
    if(endra)setName(n);
    nameEl.textContent=getName();
    if(endra){
      const tab=nameEl.closest('.floor-tab');
      if(tab){tab.classList.remove('namn-lagra');void tab.offsetWidth;tab.classList.add('namn-lagra');}
    }
  };
  nameEl.onblur=()=>ferdig(true);
  nameEl.onkeydown=e=>{
    if(!nameEl.isContentEditable)return;
    if(e.key==='Enter'){e.preventDefault();ferdig(true);nameEl.blur();}
    else if(e.key==='Escape'){e.preventDefault();ferdig(false);nameEl.blur();}
    e.stopPropagation();
  };
  // Under redigering: ikkje start draging eller fanebyte frå teksten
  nameEl.addEventListener('mousedown',e=>{if(nameEl.isContentEditable)e.stopPropagation();});
  nameEl.addEventListener('click',e=>{if(nameEl.isContentEditable)e.stopPropagation();});
  nameEl._startRename=start;
  return start;
}
// Klikk på fana: byt til ho; andre klikket innan 400 ms gir namneredigering.
// Fanene vert teikna på nytt ved bytet, så dobbeltklikket vert halde på nøkkelen.
function _faneKlikkErDobbel(key){
  const now=performance.now();
  const dbl=_faneKlikk.key===key&&now-_faneKlikk.t<400;
  _faneKlikk=dbl?{key:null,t:0}:{key,t:now};
  return dbl;
}
function startRenameFloor(f){
  const el=document.querySelector('#floor-tabs .floor-tab[data-fid="'+f.id+'"] .floor-tab-name');
  if(el&&el._startRename)el._startRename();
}
function _faneRenKnapp(start){
  const b=document.createElement('button');
  b.className='floor-tab-ren';b.textContent='✎';b.title='Endre namn';
  b.addEventListener('mousedown',e=>e.stopPropagation());
  b.onclick=e=>{e.stopPropagation();start();};
  return b;
}
function renderFloorTabs(){
  const bar=document.getElementById('floor-tabs');
  bar.innerHTML='';
  let dragSrcIdx=null;

  if(typeof updateGhostUI==='function')updateGhostUI();
  // Ei etasje med delplanar står som éin gruppe: hovudteikninga fyrst, så
  // delplanane, og ein liten «+» til ei ny teikning for same etasje.
  let grp=null;
  const lukkGruppe=()=>{
    if(!grp)return;
    const h=grp._hov;
    const add=document.createElement('button');
    add.className='floor-grp-add';add.textContent='+';
    add.title='Ny delplan i «'+h.name+'» — ei teikning til for same etasje';
    add.onclick=e=>{e.stopPropagation();leggTilDelplan(h);};
    grp.appendChild(add);
    grp=null;
  };
  floors.forEach((f,fi)=>{
    const tab=document.createElement('button');
    const _del=erDelplan(f);
    if(!_del){
      lukkGruppe();
      if(etasjeArk(f).length>1){
        grp=document.createElement('div');grp.className='floor-group';grp._hov=f;
        grp.title='Éi etasje, fleire teikningar — same høgd og same nivå i 3D';
        bar.appendChild(grp);
      }
    }
    tab.className='floor-tab'+(fi===activeFloor?' active':'')+(_del?' delplan':'');
    tab.title=_del?'Delplan i «'+hovudEtasje(f).name+'» — høgreklikk for fleire val'
                  :'Høgreklikk: delplanar, kopier etasjen, eller hent ein inn frå eit anna prosjekt';
    tab.draggable=true;
    tab.style.cssText+='cursor:grab;';

    // ── Drag events ──
    tab.addEventListener('dragstart',e=>{
      dragSrcIdx=fi;
      tab.style.opacity='0.45';
      e.dataTransfer.effectAllowed='move';
    });
    tab.addEventListener('dragend',()=>{
      tab.style.opacity='';
      bar.querySelectorAll('.floor-tab').forEach(t=>t.classList.remove('drag-over'));
    });
    tab.addEventListener('dragover',e=>{
      e.preventDefault();e.dataTransfer.dropEffect='move';
      bar.querySelectorAll('.floor-tab').forEach(t=>t.classList.remove('drag-over'));
      if(dragSrcIdx!==fi)tab.classList.add('drag-over');
    });
    tab.addEventListener('dragleave',()=>tab.classList.remove('drag-over'));
    tab.addEventListener('drop',e=>{
      e.preventDefault();tab.classList.remove('drag-over');
      if(dragSrcIdx===null||dragSrcIdx===fi)return;
      // Reorder floors array
      saveFloorState();
      const moved=floors.splice(dragSrcIdx,1)[0];
      const newIdx=dragSrcIdx<fi?fi-1:fi; // adjust after splice
      floors.splice(newIdx,0,moved);
      // Keep activeFloor pointing at same floor object
      activeFloor=floors.indexOf(moved);
      _ordneDelplanar();   // delplanane følgjer hovudetasjen sin
      dragSrcIdx=null;
      syncFloorState();renderFloorTabs();updateResults();renderTable();draw();
    });

    tab.dataset.fid=f.id;
    const nameEl=document.createElement('span');
    const startRename=_faneNamn(nameEl,()=>f.name,n=>{
      snapshot();f.name=n;markDirty();
      updateResults();renderTable();   // arkNamn står i sonekort og tabell
    });
    tab.title+=' · Dobbeltklikk for å endre namn';
    tab.onclick=()=>{
      const dbl=_faneKlikkErDobbel('f'+f.id);
      if(fi!==activeFloor){switchFloor(fi);if(dbl)startRenameFloor(f);return;}
      if(dbl)startRename();
    };
    // Høgreklikk: kopier etasjen, eller hent ein inn frå eit anna prosjekt
    tab.oncontextmenu=e=>{
      e.preventDefault();e.stopPropagation();
      showFloorContextMenu(e.clientX,e.clientY,floors[fi]);
    };

    const badge=document.createElement('span');
    badge.className='floor-tab-badge';
    badge.textContent=f.zones.length+(_del?'':' soner');
    if(!_del&&etasjeArk(f).length>1){
      const tot=etasjeArk(f).reduce((s,x)=>s+x.zones.length,0);
      badge.textContent=f.zones.length+' / '+tot+' soner';
      badge.title=f.zones.length+' soner på denne teikninga, '+tot+' i heile etasjen';
    }

    tab.appendChild(nameEl);
    tab.appendChild(badge);
    if(fi===activeFloor)tab.appendChild(_faneRenKnapp(startRename));

    if(floors.length>1){
      const del=document.createElement('button');
      del.className='floor-tab-del';
      del.textContent='×';
      del.title=_del?'Slett delplanen':'Slett etasje';
      del.onclick=e=>{
        e.stopPropagation();
        const _ark=etasjeArk(f);
        const _arv=!_del&&_ark.length>1?_ark[1]:null;   // delplanen som tek over etasjen
        const _sp=_del?'Slett delplanen "'+f.name+'" og sonene på ho?\n\nResten av "'+hovudEtasje(f).name+'" står att.'
                 :_arv?'Slett teikninga "'+f.name+'" og sonene på ho?\n\n"'+_arv.name+'" vert hovudteikning for etasjen og tek over namnet "'+f.name+'".'
                 :'Slett "'+f.name+'" og alle sonene i denne etasjen?';
        if(!confirm(_sp+'\n\nKan angrast med Ctrl+Z.')){return;}
        snapshot();
        slettArk(f);
        etterSletting();
      };
      tab.appendChild(del);
    }
    (_del&&grp?grp:(grp&&grp._hov===f?grp:bar)).appendChild(tab);
  });
  lukkGruppe();
}

function switchFloor(fi){
  if(mode==='plasser-ark')setMode('navigate');   // plasseringa gjeld arket vi går frå
  saveFloorState();
  activeFloor=fi;
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  updateResults();renderTable();renderFloorTabs();
  if(bgImg)fitImage();else draw();
  // KI-forslaget ligg per etasje — hent fram forslaget for etasjen vi kom til
  if(typeof kiEtterEtasjebyte==='function')kiEtterEtasjebyte();
}

document.getElementById('addFloorBtn').onclick=async()=>{
  // Show a small menu: blank floor, copy from PDF page, copy from file
  const choice=await showAddFloorMenu(await klippbordInfo());
  if(!choice)return;
  // Å hente ein etasje frå eit anna prosjekt byggjer ikkje ein tom etasje —
  // importerEtasjar() eig heile innsetjinga (og angre-steget).
  if(choice==='clip'){await limInnEtasjeFraKlippbord();return;}
  if(choice==='from-file'){await hentEtasjeFraFil();return;}
  if(choice==='delplan'){await leggTilDelplan(curFloor());return;}
  if(choice==='mass'){
    const l=await new Promise(res=>{const inp=document.createElement('input');inp.type='file';
      inp.accept='.pdf,image/*';inp.multiple=true;inp.onchange=()=>res([...inp.files]);inp.click();});
    if(l.length)await masseImport(l);
    return;
  }
  saveFloorState();
  // Inherit calibration from current floor
  const newFloor={
    id:_nextFloorId++,
    name:'Etasje '+(floors.filter(f=>!erDelplan(f)).length+1),
    bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,
    paperWMm:null,paperHMm:null,paperSource:null,
    mmPerImgPx:null,ownCal:false,defaultHoyde:parseFloat(fhI.value)||3.0,floorDxImg:0,floorDyImg:0,
    sc:1,offX:0,offY:0,zones:[],measurements:[]
  };
  if(choice==='pdf-page'&&pdfDoc){
    // Pick next page from current PDF
    const nextPg=curPage+1;
    if(nextPg<=totalPages){
      newFloor.pdfDoc=pdfDoc;newFloor.pdfPage=nextPg;newFloor.totalPages=totalPages;
      newFloor.bgImg=await loadPdfPage_with(pdfDoc,nextPg);
      newFloor.name='Etasje '+(floors.length+1)+' (s.'+nextPg+')';
      const pm=await pdfSidePapirMm(pdfDoc,nextPg);
      if(pm){newFloor.paperWMm=pm.w;newFloor.paperHMm=pm.h;newFloor.paperSource='pdf';}
    }
  } else if(choice==='file'){
    const img=await pickFile();
    if(img){
      newFloor.bgImg=img.bgImg;newFloor.pdfDoc=img.pdfDoc;newFloor.pdfPage=img.pdfPage;newFloor.totalPages=img.totalPages;
      newFloor.paperWMm=img.paperWMm;newFloor.paperHMm=img.paperHMm;newFloor.paperSource=img.paperSource;
    }
  }
  // choice==='blank': leave as-is
  floors.push(newFloor);
  activeFloor=floors.length-1;
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();
  if(bgImg)fitImage();else draw();
};


// ── Fasadeark: lerret-tilstand, faner og vis-veksling ────────
// Same rolle som saveFloorState/syncFloorState, men for eit fasadeark.
// Arket har inga ghost-forskyving, ingen etasjehøgde og inga global skala —
// berre bilete, zoom/pan, eiga kalibrering og måla sine.
function saveFasadeState(){
  const fa=curFasade();
  if(!fa)return;
  fa.bgImg=bgImg;fa.sc=sc;fa.offX=offX;fa.offY=offY;
  fa.mmPerImgPx=mmPerImgPx;
  fa.measurements=measureResults;
  fa.pdfDoc=pdfDoc;fa.pdfPage=curPage;fa.totalPages=totalPages;
}
function syncFasadeState(){
  const fa=curFasade();
  if(!fa){
    bgImg=null;pdfDoc=null;curPage=1;totalPages=1;
    sc=1;offX=0;offY=0;mmPerImgPx=null;measureResults=[];
  } else {
    bgImg=fa.bgImg;sc=fa.sc;offX=fa.offX;offY=fa.offY;
    mmPerImgPx=fa.mmPerImgPx??null;
    if(!fa.measurements)fa.measurements=[];
    measureResults=fa.measurements;   // alias — ikkje tildel [] seinare
    pdfDoc=fa.pdfDoc;curPage=fa.pdfPage||1;totalPages=fa.totalPages||1;
  }
  updatePdfSideUI();
  updateScaleBadge();
  hoveredMeasure=null;
  updateMeasureUI();
}

function nyFasade(opts){
  const o=opts||{};
  const fa={
    id:_nextFasadeId++,
    name:o.name||('Fasade '+(fasadar.length+1)),
    bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,
    paperWMm:null,paperHMm:null,paperSource:null,
    mmPerImgPx:null,sc:1,offX:0,offY:0,
    measurements:[]
  };
  fasadar.push(fa);
  activeFasade=fasadar.length-1;
  return fa;
}

function renderFasadeTabs(){
  const bar=document.getElementById('fasade-tabs');
  if(!bar)return;
  bar.innerHTML='';
  fasadar.forEach((fa,i)=>{
    const tab=document.createElement('button');
    tab.className='floor-tab'+(i===activeFasade?' active':'');
    tab.title='Fasadeark — berre oppmåling. Påverkar ikkje soner, 3D-modell eller SXI-eksport.';

    tab.dataset.faid=fa.id;
    tab.title+=' · Dobbeltklikk for å endre namn';
    const nameEl=document.createElement('span');
    const startRename=_faneNamn(nameEl,()=>fa.name,n=>{fa.name=n;markDirty();});
    tab.onclick=()=>{
      const dbl=_faneKlikkErDobbel('fa'+fa.id);
      if(i!==activeFasade){
        switchFasade(i);
        if(dbl){const el=document.querySelector('#fasade-tabs .floor-tab[data-faid="'+fa.id+'"] .floor-tab-name');if(el&&el._startRename)el._startRename();}
        return;
      }
      if(dbl)startRename();
    };

    const badge=document.createElement('span');
    badge.className='floor-tab-badge';
    const nm=(fa.measurements||[]).length;
    badge.textContent=fa.bgImg?(nm+' mål'):'tom';

    tab.appendChild(nameEl);
    tab.appendChild(badge);
    if(i===activeFasade)tab.appendChild(_faneRenKnapp(startRename));

    if(fasadar.length>1){
      const del=document.createElement('button');
      del.className='floor-tab-del';
      del.textContent='×';
      del.title='Slett fasadearket';
      del.onclick=e=>{
        e.stopPropagation();
        if(!confirm('Slett "'+fa.name+'" og alle måla på arket?\n\nKan angrast med Ctrl+Z.'))return;
        snapshot();
        saveFasadeState();
        fasadar.splice(i,1);
        if(i<activeFasade)activeFasade--;
        if(activeFasade>=fasadar.length)activeFasade=fasadar.length-1;
        syncFasadeState();renderFasadeTabs();
        if(bgImg)fitImage();else draw();
      };
      tab.appendChild(del);
    }
    bar.appendChild(tab);
  });
}

// Sidepanelet i fasadevisinga. Sonelista og tabellen gjeld planteikninga og
// er skjulte (.plan-only), så her står det som faktisk gjeld arket: kva som
// manglar før ein kan måle, og alle måla med lengdene sine.
function renderFasadePanel(){
  const el=document.getElementById('fasadePanel');
  if(!el)return;
  el.innerHTML='';
  const fa=curFasade();
  const mk=(tag,css,txt)=>{const n=document.createElement(tag);if(css)n.style.cssText=css;if(txt!=null)n.textContent=txt;return n;};

  if(!fa){
    el.appendChild(mk('div','color:var(--text3);font-size:12px;line-height:1.9;text-align:center;padding:30px 10px',
      'Ingen fasadeark enno. Trykk «+ Fasade» over teikninga.'));
    return;
  }

  const head=mk('div','font-size:13px;font-weight:700;color:var(--text)',fa.name);
  el.appendChild(head);

  // Status: kva som står att før ein kan måle
  const st=mk('div','font-size:12px;line-height:1.8;color:var(--text3)');
  if(!fa.bgImg){
    st.textContent='Ingen teikning lasta opp. Klikk i slippsona, eller dra ei PDF/biletfil dit.';
  } else if(!fa.mmPerImgPx){
    st.textContent='Teikninga er ikkje kalibrert. Trykk ⊕ Kalibrer og bruk kjend lengde eller målestokk.';
  } else {
    st.textContent=Math.round(fa.bgImg.width)+'×'+Math.round(fa.bgImg.height)+' px · 1 px = '
      +fa.mmPerImgPx.toFixed(3)+' mm';
  }
  el.appendChild(st);

  // Måla
  const maal=fa.measurements||[];
  const lst=mk('div','display:flex;flex-direction:column;gap:4px;margin-top:2px');
  if(!maal.length){
    lst.appendChild(mk('div','font-size:12px;color:var(--text3)',
      fa.mmPerImgPx?'Ingen mål enno — trykk Mål og klikk to punkt.':''));
  } else {
    maal.forEach((m,i)=>{
      const row=mk('div','display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)');
      row.appendChild(mk('span','font-size:11px;color:var(--text3);min-width:26px','#'+(i+1)));
      const mm=measureLenMm(m);
      row.appendChild(mk('span','font-size:12px;font-weight:600;color:var(--text);flex:1',
        mm!=null?fmtMaal(mm):'—'));
      const del=mk('button','background:none;border:none;cursor:pointer;font-size:13px;color:var(--text3);padding:0 2px;line-height:1','×');
      del.title='Slett målet';
      del.onclick=()=>slettMaal(i);
      row.appendChild(del);
      // Peik ut målet i teikninga når musa er over rada
      row.onmouseenter=()=>{hoveredMeasure={m,idx:i};draw();};
      row.onmouseleave=()=>{hoveredMeasure=null;draw();};
      lst.appendChild(row);
    });
    const alle=mk('button','margin-top:4px;font-size:11px;padding:4px 9px;border:1px solid var(--border2);border-radius:5px;background:var(--surface2);color:var(--text3);cursor:pointer;font-family:inherit;align-self:flex-start','Slett alle mål');
    alle.onclick=()=>{if(confirm('Slett alle måla på «'+fa.name+'»?\n\nKan angrast med Ctrl+Z.'))slettAlleMaal();};
    lst.appendChild(alle);
  }
  el.appendChild(lst);

  el.appendChild(mk('div','margin-top:auto;padding-top:14px;font-size:11px;line-height:1.8;color:var(--text3);border-top:1px solid var(--border)',
    'Fasadeark er eit eige oppmålingslag. Dei har ingen soner og påverkar korkje 3D-modellen, kartet eller SXI-eksporten.'));
}

function switchFasade(i){
  saveFasadeState();
  activeFasade=i;
  syncFasadeState();
  measurePts=[];setMode('navigate');
  renderFasadeTabs();
  if(bgImg)fitImage();else draw();
}

// `data-view` på <html> styrer heile visinga — sjå .plan-only/.fasade-only i
// CSS-en. Ein ny fasade-berre kontroll er difor rein markup.
function applyViewUI(){
  document.documentElement.setAttribute('data-view',viewMode);
  applySplit();   // planruta byter element når visinga byter — breidda må følgje
  const pb=document.getElementById('viewPlanBtn'),fb=document.getElementById('viewFasadeBtn');
  if(pb)pb.classList.toggle('on',!iFasade());
  if(fb)fb.classList.toggle('on',iFasade());
  const dz=document.getElementById('dropz-text');
  if(dz)dz.innerHTML=iFasade()
    ? '<strong>Last opp fasadeteikningar</strong>Éi eller fleire — PDF eller bilete (PNG, JPG)<br><small>Klikk, eller dra filene hit</small>'
    : '<strong>Last opp planteikningar</strong>Éi eller fleire på ein gong — PDF, bilete eller prosjekt (.entro)<br><small>Klikk, eller dra filene hit. Kvar fil eller PDF-side vert ein etasje — du rettar namn og type før noko vert lagt inn.</small>';
}

function setViewMode(v){
  if(v===viewMode)return;
  // Lerret-globalane høyrer til arket vi går FRÅ — lagre dei først.
  if(iFasade())saveFasadeState();else saveFloorState();
  // Side om side: arket vi går frå flyttar over i sideruta med zoomen sin.
  if(sideBySide)_sideFit.add(curArk());
  viewMode=v;
  setMode('navigate');
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];calPts=[];measurePts=[];
  hoveredWin=null;hoveredZone=null;hoveredMeasure=null;dragWin=null;
  calOverlay.classList.remove('show');
  if(iFasade()){
    // Fyrste gongen: eit tomt ark, så slippsona står klar med ein gong.
    if(!fasadar.length)nyFasade();
    if(activeFasade>=fasadar.length)activeFasade=fasadar.length-1;
    syncFasadeState();renderFasadeTabs();
    hintText.textContent='Fasadeteikningar — eige lag berre for oppmåling. Soner, 3D-modell og SXI-eksport er upåverka.';
  } else {
    syncFloorState();renderFloorTabs();
    hintText.textContent='';
  }
  applyViewUI();
  updateResults();
  // Side om side: arket kjem frå sideruta, som er like stor som lerretet —
  // då står det der brukaren såg det, i staden for å hoppe til heilt bilete.
  if(bgImg&&!(sideBySide&&_sideFit.has(curArk())))fitImage();else draw();
}

document.getElementById('viewPlanBtn').onclick=()=>setViewMode('plan');
document.getElementById('viewFasadeBtn').onclick=()=>setViewMode('fasade');
document.getElementById('addFasadeBtn').onclick=()=>{
  snapshot();
  saveFasadeState();
  nyFasade();
  syncFasadeState();renderFasadeTabs();draw();
  hintText.textContent='Nytt fasadeark. Last opp PDF eller bilete, kalibrer skalaen og mål.';
};

// ── Side om side ─────────────────────────────────────────────
// Plan til venstre, fasade til høgre. Lerretet (#cv) er framleis det einaste
// ein arbeider i, og lerret-globalane høyrer til det — sideruta rører dei
// aldri. Ho viser det aktive arket i den ANDRE visinga (curFloor() medan
// fasaden er framme, curFasade() medan planen er framme) og les/skriv zoom
// og pan rett på arkobjektet (a.sc/offX/offY), som er der arket sin tilstand
// ligg når det ikkje er framme. Difor er bytet berre setViewMode(): arket vi
// går frå vert lagra med zoomen sin og står att i ruta, og arket vi hentar
// har alt ein zoom som passar lerretet. Det held same kor breie rutene er:
// planen står ALLTID i venstre rute og fasaden i høgre, så eit ark har same
// rute (same storleik og stad) anten det er framme eller ikkje.
const cv2=document.getElementById('cv2'),ctx2=cv2.getContext('2d');
const sidePane=document.getElementById('sidePane');
const sideSel=document.getElementById('sideSel');
function sideKind(){return iFasade()?'plan':'fasade';}
function sideArk(){return iFasade()?curFloor():curFasade();}
function fitSide(){
  const a=sideArk();
  if(!a||!a.bgImg)return;
  const r=sidePane.getBoundingClientRect();
  if(r.width<40||r.height<40)return;   // ikkje lagt ut enno — prøv ved neste teikning
  a.sc=Math.min((r.width-30)/a.bgImg.width,(r.height-30)/a.bgImg.height);
  a.offX=(r.width-a.bgImg.width*a.sc)/2;a.offY=(r.height-a.bgImg.height*a.sc)/2;
  _sideFit.add(a);
}
let _sideSelKey='';
function renderSideSel(){
  const plan=sideKind()==='plan';
  const liste=plan?floors:fasadar,akt=plan?activeFloor:activeFasade;
  const key=sideKind()+'|'+akt+'|'+liste.map(a=>a.name).join('\u0001');
  if(key===_sideSelKey)return;
  _sideSelKey=key;
  document.getElementById('sideKind').textContent=plan?'Plan':'Fasade';
  sideSel.innerHTML='';
  liste.forEach((a,i)=>{const o=document.createElement('option');o.value=i;o.textContent=a.name;if(i===akt)o.selected=true;sideSel.appendChild(o);});
  sideSel.style.display=liste.length?'':'none';
  document.getElementById('sideSwapBtn').textContent=liste.length?'✎ Arbeid her':(plan?'✎ Opne plan':'+ Fasade');
}
function drawSide(){
  if(!sideBySide)return;
  const r=sidePane.getBoundingClientRect();
  if(cv2.width!==Math.floor(r.width)||cv2.height!==Math.floor(r.height)){cv2.width=r.width;cv2.height=r.height;}
  renderSideSel();
  const a=sideArk(),plan=sideKind()==='plan';
  ctx2.clearRect(0,0,cv2.width,cv2.height);   // punktrutenettet på #sidePane syner gjennom
  const tom=document.getElementById('sideEmpty');
  const tomTekst=!a?'Ingen fasadeark enno. Trykk «+ Fasade» for å lage eitt.'
    :!a.bgImg?'Ingen teikning på «'+a.name+'».':'';
  tom.textContent=tomTekst;tom.style.display=tomTekst?'flex':'none';
  if(!a||!a.bgImg)return;
  if(!_sideFit.has(a))fitSide();
  const S=a.sc,d=plan?{x:a.floorDxImg||0,y:a.floorDyImg||0}:{x:0,y:0};
  const T=p=>({x:(p.x+d.x)*S+a.offX,y:(p.y+d.y)*S+a.offY});
  ctx2.drawImage(a.bgImg,a.offX+d.x*S,a.offY+d.y*S,a.bgImg.width*S,a.bgImg.height*S);
  if(plan){
    // `zones` er aliaset til den aktive etasjen òg i fasadevisinga —
    // floors[activeFloor].zones kan liggje att på ein eldre array.
    zones.forEach((z,zi)=>{
      if(z.pts.length<2||z.skjult)return;
      const ci=zoneColorIdx(activeFloor,zi,z);
      ctx2.beginPath();
      z.pts.forEach((p,i)=>{const s=T(p);if(i)ctx2.lineTo(s.x,s.y);else ctx2.moveTo(s.x,s.y);});
      ctx2.closePath();ctx2.fillStyle=FILLS[ci];ctx2.fill();
      ctx2.strokeStyle=COLORS[ci];ctx2.lineWidth=2;ctx2.stroke();
      if(z.pts.length<3)return;
      const c=T({x:z.pts.reduce((s,p)=>s+p.x,0)/z.pts.length,y:z.pts.reduce((s,p)=>s+p.y,0)/z.pts.length});
      ctx2.font='bold 11px Inter,sans-serif';
      const bw=ctx2.measureText(z.name).width+12;
      ctx2.fillStyle='rgba(255,255,255,.9)';
      ctx2.beginPath();ctx2.roundRect(c.x-bw/2,c.y-9,bw,18,5);ctx2.fill();
      ctx2.fillStyle=COLORS[ci];ctx2.textAlign='center';ctx2.textBaseline='middle';
      ctx2.fillText(z.name,c.x,c.y);
    });
  }
  const mpp=plan?mppForFloor(a):(a.mmPerImgPx||null);
  (a.measurements||[]).forEach(m=>{
    const mm=mpp?Math.hypot(m.p2.x-m.p1.x,m.p2.y-m.p1.y)*mpp:null;
    drawDimension(T(m.p1),T(m.p2),fmtMaal(mm),{ctx:ctx2});
  });
}
// draw() går på kvar musrørsle — sideruta vert teikna éin gong per frame.
let _sideRaf=0;
function drawSideSnart(){
  if(_sideRaf)return;
  _sideRaf=requestAnimationFrame(()=>{_sideRaf=0;drawSide();});
}
// Breidda på planruta (venstre) som del av heile flata. Vert lagt på som
// flex-grow, så rutene følgjer med når vindauget endrar storleik.
let sideFrac=0.5;
const SIDE_LUKK=0.08;   // slepp streken nærare kanten enn dette ⇒ ruta vert lukka
function applySplit(){
  const cw=document.getElementById('cwrap'),sp=document.getElementById('sidePane');
  // Flex-grow under 1 fyller berre ein del av plassen — utan side om side
  // må lerretet ha standardverdien att, elles står det på halv breidd.
  if(!sideBySide){cw.style.flex='';sp.style.flex='';return;}
  const planEl=iFasade()?sp:cw,fasEl=iFasade()?cw:sp;
  planEl.style.flex=sideFrac+' 1 0';
  fasEl.style.flex=(1-sideFrac)+' 1 0';
}
function setSideBySide(on){
  sideBySide=!!on;
  _sideFit=new WeakSet();
  applySplit();
  document.documentElement.toggleAttribute('data-side',sideBySide);
  document.getElementById('sideBySideBtn').classList.toggle('on',sideBySide);
  _sideSelKey='';
  // Lerretet endrar breidde — tilpass begge rutene til den nye storleiken.
  const r=cwrap.getBoundingClientRect();cv.width=r.width;cv.height=r.height;
  if(sideBySide)fitSide();
  if(bgImg)fitImage();else draw();
  if(sideBySide){
    drawSide();
    hintText.textContent='Side om side · du arbeider i '+(iFasade()?'fasaden (høgre)':'planen (venstre)')
      +'. Dobbeltklikk i den andre ruta, eller «✎ Arbeid her», for å byte.';
  } else hintText.textContent='';
}
function sideByt(){setViewMode(sideKind());}
document.getElementById('sideBySideBtn').onclick=()=>setSideBySide(!sideBySide);
document.getElementById('sideSwapBtn').onclick=sideByt;
cv2.addEventListener('dblclick',sideByt);
sideSel.onchange=()=>{
  const i=+sideSel.value;
  if(sideKind()==='plan'){
    // Fasaden er framme, så syncFloorState() rører berre zones-aliaset.
    floors[activeFloor].zones=zones;
    activeFloor=i;
    syncFloorState();renderFloorTabs();updateResults();
  } else {
    activeFasade=i;renderFasadeTabs();
  }
  drawSide();
};
cv2.addEventListener('wheel',e=>{
  const a=sideArk();
  if(!a||!a.bgImg)return;
  e.preventDefault();
  const r=cv2.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top,f=e.deltaY<0?1.1:1/1.1;
  a.offX=mx-(mx-a.offX)*f;a.offY=my-(my-a.offY)*f;a.sc*=f;
  _sideFit.add(a);drawSide();
},{passive:false});
let _sideDrag=null;
cv2.addEventListener('mousedown',e=>{
  if(e.button!==0&&e.button!==1)return;
  const a=sideArk();
  if(!a||!a.bgImg)return;
  e.preventDefault();
  _sideDrag={a,x:e.clientX,y:e.clientY};
  sidePane.style.cursor='grabbing';
});
window.addEventListener('mousemove',e=>{
  if(!_sideDrag)return;
  const g=_sideDrag;
  g.a.offX+=e.clientX-g.x;g.a.offY+=e.clientY-g.y;g.x=e.clientX;g.y=e.clientY;
  _sideFit.add(g.a);drawSideSnart();
});
window.addEventListener('mouseup',()=>{if(_sideDrag){_sideDrag=null;sidePane.style.cursor='';}});

// Skiljestreken. Under draginga vert brøken klipt til [0,02 – 0,98] så ruta
// aldri forsvinn heilt medan ein dreg; først når streken vert sleppt nær
// kanten, lukkar vi ruta — og er det ruta ein arbeider i, byter vi fyrst
// over til den andre, så det er den ein ser som vert ståande.
const sideSplit=document.getElementById('sideSplit');
let _splitDrag=null;
function _splitPaneFor(side){   // 'venstre' (plan) | 'hogre' (fasade) → elementet
  if(side==='venstre')return iFasade()?sidePane:cwrap;
  return iFasade()?cwrap:sidePane;
}
sideSplit.addEventListener('mousedown',e=>{
  if(e.button!==0)return;
  e.preventDefault();
  _splitDrag={row:document.getElementById('canvasRow').getBoundingClientRect()};
  sideSplit.classList.add('drag');
  document.body.style.cursor='col-resize';
});
window.addEventListener('mousemove',e=>{
  if(!_splitDrag)return;
  const r=_splitDrag.row,raw=(e.clientX-r.left)/r.width;
  sideFrac=Math.min(0.98,Math.max(0.02,raw));
  _splitDrag.raw=raw;
  applySplit();
  cwrap.classList.toggle('side-lukkar',false);sidePane.classList.toggle('side-lukkar',false);
  if(raw<SIDE_LUKK)_splitPaneFor('venstre').classList.add('side-lukkar');
  else if(raw>1-SIDE_LUKK)_splitPaneFor('hogre').classList.add('side-lukkar');
});
window.addEventListener('mouseup',()=>{
  if(!_splitDrag)return;
  const raw=_splitDrag.raw;
  _splitDrag=null;
  sideSplit.classList.remove('drag');
  document.body.style.cursor='';
  cwrap.classList.remove('side-lukkar');sidePane.classList.remove('side-lukkar');
  if(raw==null)return;
  const lukk=raw<SIDE_LUKK?'venstre':raw>1-SIDE_LUKK?'hogre':null;
  if(!lukk)return;
  // Ruta som lukkast er plan (venstre) eller fasade (høgre). Er det den vi
  // arbeider i, går vi over til den som vert ståande.
  const lukkPlan=lukk==='venstre';
  if(lukkPlan!==iFasade())setViewMode(lukkPlan?'fasade':'plan');
  sideFrac=0.5;
  setSideBySide(false);
});
sideSplit.addEventListener('dblclick',()=>{sideFrac=0.5;applySplit();});
if(window.ResizeObserver)new ResizeObserver(()=>{if(sideBySide)drawSide();}).observe(sidePane);

// ── Ghost-overlay og etasje-offset ─────────────────────────
function updateGhostUI(){
  // Ghost gjeld naboetasjar; delplan-knappane gjeld arka i same etasje
  const hasMulti=floors.filter(f=>!erDelplan(f)).length>1;
  const harDel=etasjeArk(curFloor()).length>1;
  const widget=document.getElementById('ghostWidget');
  const offsetBar=document.getElementById('floorOffsetBar');
  const ghostBtn=document.getElementById('ghostBtn');
  if(widget)widget.style.display=(hasMulti||harDel)?'flex':'none';
  if(offsetBar)offsetBar.style.display=((hasMulti&&ghostMode)||harDel)?'flex':'none';
  const pb=document.getElementById('plasserBtn');
  if(pb){
    const paa=mode==='plasser-ark';
    pb.style.display=harDel?'flex':'none';
    pb.style.background=paa?'rgba(234,88,12,.12)':'transparent';
    pb.style.color=paa?'rgb(194,65,12)':'var(--text3)';
  }
  if(ghostBtn){
    ghostBtn.style.display=hasMulti?'flex':'none';
    ghostBtn.style.background=ghostMode?'var(--accent-dim)':'transparent';
    ghostBtn.style.color=ghostMode?'var(--accent)':'var(--text3)';
  }
  updateOffsetDisplay();
}
function updateOffsetDisplay(){
  const el=document.getElementById('floorOffsetVal');
  if(!el)return;
  const f=curFloor();
  const dxi=f.floorDxImg||0,dyi=f.floorDyImg||0;
  if(mmPerImgPx){
    const dx=(dxi*mmPerImgPx).toFixed(1),dy=(dyi*mmPerImgPx).toFixed(1);
    el.textContent=`${dxi>0?"+":""}${dx}, ${dyi>0?"+":""}${dy} mm`;
  } else {
    const dx=Math.round(dxi),dy=Math.round(dyi);
    el.textContent=`${dxi>0?"+":""}${dx}, ${dyi>0?"+":""}${dy} img-px`;
  }
  el.style.color=(dxi===0&&dyi===0)?'var(--text3)':'var(--accent)';
}

const ghostBtn=document.getElementById('ghostBtn');
if(ghostBtn){
  ghostBtn.onclick=()=>{
    ghostMode=!ghostMode;
    updateGhostUI();draw();
    if(ghostMode)hintText.textContent='Ghost på · piltastar justerer aktiv etasje (Alt = 10px) · forskyving visast i kontrollfeltet';
    else hintText.textContent='';
  };
}
document.getElementById('floorOffsetReset').onclick=()=>{
  const f=curFloor();snapshot();f.floorDxImg=0;f.floorDyImg=0;
  f.plassAnker=null;_arkFlytta(f);   // ark plasserte mot dette følgjer med
  updateOffsetDisplay();draw();
  if(document.getElementById('model3dOverlay').style.display==='flex')window._rebuild3D&&window._rebuild3D();
};

// Etasje-offset med piltastar (når ghost er aktivt)
document.addEventListener('keydown',e=>{
  if(!ghostMode&&!(mode==='plasser-ark'&&!plass))return;
  if(iFasade())return;
  const KEYS=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
  if(!KEYS.includes(e.key))return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
  e.preventDefault();
  // step i biletpikslar — zoom-uavhengig justering
  const step=e.altKey?10:e.shiftKey?5:1;
  const f=curFloor();
  if(!f.floorDxImg)f.floorDxImg=0;
  if(!f.floorDyImg)f.floorDyImg=0;
  if(e.key==='ArrowLeft')f.floorDxImg-=step;
  if(e.key==='ArrowRight')f.floorDxImg+=step;
  if(e.key==='ArrowUp')f.floorDyImg-=step;
  if(e.key==='ArrowDown')f.floorDyImg+=step;
  _arkFlytta(f);markDirty();
  updateOffsetDisplay();draw();
  if(document.getElementById('model3dOverlay').style.display==='flex')window._rebuild3D&&window._rebuild3D();
},{capture:false});


// ── Plasser delplan: to klikk ─────────────────────────────────
// Klikk 1: eit kjent punkt på det aktive arket (snappar berre mot dette arket).
// Klikk 2: same punktet på eit systerark (snappar berre mot systerarka). Medan
// ein leitar etter punkt 2, følgjer heile det aktive arket musa, så ein ser
// teikningane leggje seg oppå kvarandre før ein slepp.
// Berre flytting — ikkje rotasjon. Delteikningar frå same prosjekt står i
// same retning; ei rotering ville dessutan måtte flytte alle punkta i sonene.
let plass=null;   // {p1, dx0, dy0, t, sp, ark} medan punkt 2 vert leita etter
function startPlasserArk(){
  if(iFasade())return;
  const A=curFloor(),syster=etasjeArk(A).filter(f=>f!==A);
  if(!syster.length){hintText.textContent='Arket har ingen delplanar å plassere seg mot.';return;}
  if(!syster.some(f=>f.bgImg||f.zones.length)){
    hintText.textContent='Dei andre arka i etasjen er tomme — last opp teikninga der fyrst.';return;
  }
  setMode('plasser-ark');
  plass=null;
  const u=mppForFloor(A)&&syster.every(f=>mppForFloor(f))?'':
    ' · NB: kalibrer arka — plasseringa vert halden når skalaen kjem på plass';
  hintText.textContent=HINTS['plasser-ark']+u;
  updateGhostUI();draw();
}
function _avbrytPlassering(){
  if(!plass)return;
  const A=curFloor();
  A.floorDxImg=plass.dx0;A.floorDyImg=plass.dy0;
  plass=null;
}
// Klikk 2: arket følgjer musa. Snappinga vert rekna med arket på den GAMLE
// staden, sidan det er der p1 er definert.
function _plasserForhand(){
  if(!plass){
    _snapKjelde='aktiv';
    drawSnap=unifiedSnap(mouse.x,mouse.y,null);
    _snapKjelde=null;
    return;
  }
  const A=curFloor();
  A.floorDxImg=plass.dx0;A.floorDyImg=plass.dy0;
  _snapKjelde='syster';
  const sn=unifiedSnap(mouse.x,mouse.y,null);
  _snapKjelde=null;
  let t=sn?{x:sn.x,y:sn.y}:s2i(mouse.x,mouse.y);
  if(!sn&&shiftHeld){   // lås til vassrett eller loddrett flytting
    if(Math.abs(t.x-plass.p1.x)>Math.abs(t.y-plass.p1.y))t={x:t.x,y:plass.p1.y};
    else t={x:plass.p1.x,y:t.y};
  }
  plass.t=t;plass.ark=sn?sn.ark:null;
  plass.sp=i2s(t.x,t.y);
  plass.snapType=sn?sn.type:null;
  A.floorDxImg=plass.dx0+(t.x-plass.p1.x);
  A.floorDyImg=plass.dy0+(t.y-plass.p1.y);
}
function _plasserKlikk(sx,sy){
  const A=curFloor();
  if(!plass){
    _snapKjelde='aktiv';
    const sn=unifiedSnap(sx,sy,null);
    _snapKjelde=null;
    const p1=sn?{x:sn.x,y:sn.y}:s2i(sx,sy);
    plass={p1,dx0:A.floorDxImg||0,dy0:A.floorDyImg||0,t:p1,sp:i2s(p1.x,p1.y),ark:null,snapType:null};
    drawSnap=null;
    const namn=etasjeArk(A).filter(f=>f!==A).map(f=>'«'+f.name+'»').join(' / ');
    hintText.textContent='Klikk same punktet på '+namn+' — arket følgjer musa · Shift låser til vassrett/loddrett · Esc for å avbryte';
    if(mouse)_plasserForhand();
    draw();return;
  }
  _plasserForhand();
  const fin={x:A.floorDxImg,y:A.floorDyImg};
  // Kva ark punkt 2 ligg på: det snappinga fann, elles det øvste arket som
  // dekkjer punktet, elles hovudetasjen.
  A.floorDxImg=plass.dx0;A.floorDyImg=plass.dy0;
  const syster=etasjeArk(A).filter(f=>f!==A);
  let til=plass.ark&&syster.includes(plass.ark)?plass.ark:null;
  if(!til)til=syster.slice().reverse().find(f=>{
    if(!f.bgImg)return false;
    const q=aktivTilArk(plass.t,f);
    return q.x>=0&&q.y>=0&&q.x<=f.bgImg.width&&q.y<=f.bgImg.height;
  })||(syster.includes(hovudEtasje(A))?hovudEtasje(A):syster[0]);
  const b=aktivTilArk(plass.t,til);
  const flytt=Math.hypot(fin.x-plass.dx0,fin.y-plass.dy0);
  snapshot();
  A.floorDxImg=fin.x;A.floorDyImg=fin.y;
  A.plassAnker={a:{x:plass.p1.x,y:plass.p1.y},til:til.id,b};
  plass=null;
  _brukAlleAnker();   // ark som er plasserte mot dette følgjer med
  setMode('navigate');
  updateOffsetDisplay();updateResults();renderTable();draw();
  if(document.getElementById('model3dOverlay').style.display==='flex')window._rebuild3D&&window._rebuild3D();
  hintText.textContent='✓ «'+A.name+'» er plassert mot «'+til.name+'»'+(flytt<0.5?' (stod alt der)':'')+
    '. Plasseringa vert halden om du kalibrerer på nytt · Ctrl+Z angrar.';
}
function _teiknPlassering(){
  ctx.save();
  if(!plass){
    if(drawSnap)drawSnapMarker(i2s(drawSnap.x,drawSnap.y),drawSnap.type,'rgb(234,88,12)');
  } else {
    // Omrisset av det aktive arket der det vil hamne
    if(bgImg){
      const d=_arkOffset();
      ctx.strokeStyle='rgba(234,88,12,0.9)';ctx.lineWidth=2;ctx.setLineDash([8,4]);
      ctx.strokeRect(offX+d.x*sc,offY+d.y*sc,bgImg.width*sc,bgImg.height*sc);
      ctx.setLineDash([]);
    }
    const sp=plass.sp;
    if(sp){
      if(plass.snapType)drawSnapMarker(sp,plass.snapType,'rgb(234,88,12)');
      ctx.strokeStyle='rgb(234,88,12)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(sp.x-14,sp.y);ctx.lineTo(sp.x+14,sp.y);ctx.moveTo(sp.x,sp.y-14);ctx.lineTo(sp.x,sp.y+14);ctx.stroke();
    }
  }
  ctx.restore();
}
document.getElementById('plasserBtn').onclick=()=>{
  if(mode==='plasser-ark'){setMode('navigate');updateGhostUI();draw();return;}
  startPlasserArk();
};

// ── Ny delplan ──
// Målestokken til eit ark, utleidd frå skalaen og papirformatet. Berre når
// han ligg nær ein vanleg målestokk — elles gjettar vi ikkje.
function _arkMaalestokk(f){
  const mpp=mppForFloor(f);
  if(!mpp||!f.bgImg||!f.paperWMm)return null;
  const m=mpp*f.bgImg.width/f.paperWMm;
  const std=[20,50,100,200,250,500,1000].find(v=>Math.abs(m-v)/v<0.02);
  return std||null;
}
async function leggTilDelplan(hf){
  if(iFasade())return;
  const h=hovudEtasje(hf||curFloor());
  const img=await pickFile();
  if(!img||!img.bgImg)return;
  saveFloorState();
  snapshot();
  const ark=etasjeArk(h);
  const tatt=new Set(floors.map(f=>f.name));
  let n=ark.length+1,namn='Del '+n;
  while(tatt.has(namn))namn='Del '+(++n);
  // Ei anna teikning har sjeldan same pikseltettleik — PDF-ane vert rendra
  // til om lag same tal pikslar uansett papirformat. Difor eiga kalibrering.
  // Har hovudteikninga ein vanleg målestokk og den nye sida eit kjent
  // papirformat, føreslår vi same målestokk — og seier det.
  const ny={
    id:_nextFloorId++,name:namn,delAv:h.id,plassAnker:null,
    bgImg:img.bgImg,pdfDoc:img.pdfDoc,pdfPage:img.pdfPage,totalPages:img.totalPages,
    paperWMm:img.paperWMm,paperHMm:img.paperHMm,paperSource:img.paperSource,
    mmPerImgPx:null,ownCal:true,defaultHoyde:h.defaultHoyde??3.0,floorDxImg:0,floorDyImg:0,
    sc:1,offX:0,offY:0,zones:[],measurements:[]
  };
  const ms=_arkMaalestokk(h);
  if(ms&&ny.paperWMm)ny.mmPerImgPx=ny.paperWMm/ny.bgImg.width*ms;
  // Start med øvre venstre hjørne oppå øvre venstre hjørne av hovudteikninga
  const mh=mppForFloor(h);
  const k=(ny.mmPerImgPx&&mh)?mh/ny.mmPerImgPx:1;
  ny.floorDxImg=(h.floorDxImg||0)*k;ny.floorDyImg=(h.floorDyImg||0)*k;
  floors.splice(floors.indexOf(ark[ark.length-1])+1,0,ny);
  activeFloor=floors.indexOf(ny);
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();
  fitImage();
  if(h.bgImg||h.zones.length)startPlasserArk();
  hintText.textContent='«'+namn+'» er lagd til i «'+h.name+'». '+
    (ny.mmPerImgPx?'Skalaen er sett til 1:'+ms+' som hovudteikninga — kontroller med eit kontrollmål. '
                  :'Kalibrer teikninga (eiga skala). ')+
    (mode==='plasser-ark'?'Plasser ho no: klikk eit kjent punkt her, så same punktet på «'+h.name+'».':'');
}
// Gjer eit eksisterande ark (og delplanane hans) til delplan(ar) av h.
// Dette er vegen frå den gamle omvegen med etasjehøgd 0 og ghost-forskyving:
// forskyvinga står, så arket ligg der det låg.
function gjerTilDelplan(f,h){
  if(!f||!h||f===h||erDelplan(h))return;
  saveFloorState();
  snapshot();
  etasjeArk(f).forEach(x=>{x.delAv=h.id;});
  _ordneDelplanar();
  syncFloorState();renderFloorTabs();updateResults();renderTable();draw();
  if(document.getElementById('model3dOverlay').style.display==='flex')window._rebuild3D&&window._rebuild3D();
  hintText.textContent='«'+f.name+'» er no ei delplan i «'+h.name+'» — same etasjehøgd ('+(h.defaultHoyde??3)+' m) og same nivå i 3D. '+
    'Bruk «⌖ Plasser» om teikningane ikkje ligg rett mot kvarandre.';
}
function gjerTilEigaEtasje(f){
  if(!erDelplan(f))return;
  saveFloorState();
  snapshot();
  f.delAv=null;f.plassAnker=null;
  _ordneDelplanar();
  syncFloorState();renderFloorTabs();updateResults();renderTable();draw();
  if(document.getElementById('model3dOverlay').style.display==='flex')window._rebuild3D&&window._rebuild3D();
  hintText.textContent='«'+f.name+'» er no ei eiga etasje.';
}

function showAddFloorMenu(klipp){
  return new Promise(resolve=>{
    // Etasjenamn og byggnamn er brukar-/vertsstyrt tekst, og går inn i innerHTML
    const hesc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.4);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
    const box=document.createElement('div');
    box.style.cssText='background:var(--surface);border-radius:14px;padding:24px;width:320px;box-shadow:0 12px 40px rgba(13,27,42,.15)';
    box.innerHTML=`<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px">Legg til etasje</div>`;
    const opts=[
      {key:'blank',icon:'⬡',label:'Tom etasje','desc':'Last opp teikning seinare'},
      {key:'file',icon:'↑',label:'Last opp fil','desc':'PDF eller bilete for ny etasje'},
      {key:'mass',icon:'⇶',label:'Legg inn mange teikningar','desc':'Fleire filer eller ei PDF med mange sider — kvar side vert ein etasje eller fasade'},
      {key:'pdf-page',icon:'⊕',label:'Neste side i same PDF','desc':pdfDoc?`Side ${curPage+1} av ${totalPages}`:'Ingen PDF lasta'},
      {key:'delplan',icon:'▣',label:'Ny delplan i «'+hovudEtasje(curFloor()).name+'»','desc':'Ei teikning til for same etasje — t.d. ein annan fløy'},
      {key:'clip',icon:'⧈',label:'Lim inn kopiert etasje',
        'desc':klipp?('«'+klipp.namn+'» · '+klipp.soner+' soner'
                      +(klipp.kjelde?' · '+klipp.kjelde:'')+(klipp.alder?' · '+klipp.alder:''))
                    :'Klippbordet er tomt'},
      {key:'from-file',icon:'↧',label:'Hent etasje frå prosjektfil','desc':'Vel ei .entro-fil og plukk etasje'},
    ];
    opts.forEach(o=>{
      const btn=document.createElement('button');
      btn.style.cssText='width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface);cursor:pointer;text-align:left;margin-bottom:8px;font-family:inherit;transition:all .12s';
      btn.innerHTML=`<span style="font-size:20px;width:28px;text-align:center">${o.icon}</span><div><div style="font-size:13px;font-weight:600;color:var(--text)">${hesc(o.label)}</div><div style="font-size:12px;color:var(--text3);margin-top:1px">${hesc(o.desc)}</div></div>`;
      btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
      btn.onmouseleave=()=>{btn.style.borderColor='var(--border)';btn.style.background='var(--surface)';};
      const av=(o.key==='pdf-page'&&(!pdfDoc||curPage>=totalPages))||(o.key==='clip'&&!klipp);
      if(av)btn.style.opacity='.4',btn.style.cursor='default',btn.onclick=null;
      else btn.onclick=()=>{document.body.removeChild(overlay);resolve(o.key);};
      box.appendChild(btn);
    });
    const cancel=document.createElement('button');
    cancel.textContent='Avbryt';
    cancel.style.cssText='width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;background:transparent;color:var(--text3);cursor:pointer;font-family:inherit;font-size:13px';
    cancel.onclick=()=>{document.body.removeChild(overlay);resolve(null);};
    box.appendChild(cancel);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  });
}

// ── Papirformat og målestokk-kalibrering ──────────────────────
// Ei PDF-side har fysisk storleik innebygd (punkt à 1/72"), så papirformatet
// er eksakt kjent. For rasterbilete prøver vi DPI frå metadata; elles må
// brukaren velje format sjølv.
const PAPIR_FORMAT=[
  {n:'A0',w:841,h:1189},{n:'A1',w:594,h:841},{n:'A2',w:420,h:594},
  {n:'A3',w:297,h:420},{n:'A4',w:210,h:297},{n:'A5',w:148,h:210},
  {n:'Letter',w:216,h:279},{n:'Legal',w:216,h:356},
];
function papirFormatNamn(wMm,hMm){
  if(!wMm||!hMm)return null;
  const a=Math.min(wMm,hMm),b=Math.max(wMm,hMm);
  for(const f of PAPIR_FORMAT){
    if(Math.abs(a-f.w)<=4&&Math.abs(b-f.h)<=4)return f.n+(wMm>hMm?' liggjande':' ståande');
  }
  return Math.round(wMm)+'×'+Math.round(hMm)+' mm';
}
// Papirmål for eit valt format, orientert etter biletet
function papirMaalFor(namn,imgW,imgH){
  const f=PAPIR_FORMAT.find(x=>x.n===namn);
  if(!f)return null;
  return (imgW>=imgH)?{w:f.h,h:f.w}:{w:f.w,h:f.h};
}
// Les fysisk oppløysing frå PNG (pHYs) eller JPEG (JFIF). Returnerer DPI eller null.
async function lesBiletDpi(file){
  try{
    const buf=new Uint8Array(await file.slice(0,65536).arrayBuffer());
    if(buf[0]===0x89&&buf[1]===0x50&&buf[2]===0x4E&&buf[3]===0x47){
      let p=8;
      while(p+12<=buf.length){
        const len=((buf[p]<<24)|(buf[p+1]<<16)|(buf[p+2]<<8)|buf[p+3])>>>0;
        const typ=String.fromCharCode(buf[p+4],buf[p+5],buf[p+6],buf[p+7]);
        if(typ==='pHYs'){
          const d=p+8;
          const ppuX=((buf[d]<<24)|(buf[d+1]<<16)|(buf[d+2]<<8)|buf[d+3])>>>0;
          return (buf[d+8]===1&&ppuX>0)?ppuX*0.0254:null; // pikslar per meter → DPI
        }
        if(typ==='IDAT'||typ==='IEND')return null;
        p+=12+len;
      }
      return null;
    }
    if(buf[0]===0xFF&&buf[1]===0xD8){
      let p=2;
      while(p+4<buf.length&&buf[p]===0xFF){
        const marker=buf[p+1],len=(buf[p+2]<<8)|buf[p+3];
        if(marker===0xE0){
          const d=p+4;
          if(String.fromCharCode(buf[d],buf[d+1],buf[d+2],buf[d+3])==='JFIF'){
            const unit=buf[d+7],xd=(buf[d+8]<<8)|buf[d+9];
            if(xd>0){if(unit===1)return xd;if(unit===2)return xd*2.54;}
          }
          return null;
        }
        if(marker===0xDA||marker===0xD9)return null;
        p+=2+len;
      }
    }
  }catch(e){}
  return null;
}
// Papirstorleik for ei PDF-side i mm (uavhengig av renderskala)
async function pdfSidePapirMm(doc,n){
  try{
    const pg=await doc.getPage(n);
    const vp=pg.getViewport({scale:1});
    return {w:vp.width*25.4/72,h:vp.height*25.4/72};
  }catch(e){return null;}
}

// Renderskala for PDF ────────────────────────────────
// Ein fast skala gir vilt ulik oppløysing avhengig av papirformatet: 4.0 er
// 288 DPI uansett, så ei A1-side får 6736×9536 px medan ei tett teikning
// pressa ned på 800×600 pt (≈A4+) berre får 3200×2400 px. Småformata
// arkitektteikningar vart då uleselege — strekbreidder rundt 0,07 pt hamnar
// under ein tredjedels piksel og canvas teiknar dei som blass gråtone.
// Vi siktar på eit pikselbudsjett i staden, så alle format får like mange
// pikslar å zoome i. PDF_MIN_SCALE = den gamle faste skalaen, slik at ingen
// storformatteikning blir dårlegare enn før.
const PDF_TARGET_PX=48e6;   // ~48 Mpx — same orden som A1 fekk med skala 4
const PDF_MAX_PX=124e6;     // hardt tak — Firefox nektar canvas over 124 Mpx
const PDF_MAX_SIDE=16000;   // under dimensjonstaket i alle nettlesarar
const PDF_MIN_SCALE=4.0;
const PDF_MAX_SCALE=10.0;
function pdfRenderScale(w1,h1,maalPx){
  const px=w1*h1;
  if(!(px>0))return PDF_MIN_SCALE;
  const budsjett=Math.sqrt((maalPx||PDF_TARGET_PX)/px);
  const tak=Math.min(PDF_MAX_SIDE/w1,PDF_MAX_SIDE/h1,Math.sqrt(PDF_MAX_PX/px));
  const s=Math.max(PDF_MIN_SCALE,Math.min(PDF_MAX_SCALE,budsjett));
  return Math.max(1,Math.min(s,tak));
}

// maalPx: lågare pikselbudsjett (masseimport av mange ark), elles PDF_TARGET_PX
async function loadPdfPage_with(doc,n,maalPx){
  const page=await doc.getPage(n);
  const vp1=page.getViewport({scale:1});
  const skala=pdfRenderScale(vp1.width,vp1.height,maalPx);
  const vp=page.getViewport({scale:skala});
  console.log('PDF s.'+n+': '+Math.round(vp1.width)+'×'+Math.round(vp1.height)+' pt → skala '
    +skala.toFixed(2)+' ('+Math.round(skala*72)+' DPI, '
    +Math.round(vp.width)+'×'+Math.round(vp.height)+' px)');
  const tmp=document.createElement('canvas');
  tmp.width=vp.width;tmp.height=vp.height;
  const ctx2d=tmp.getContext('2d',{alpha:false});
  ctx2d.fillStyle='#ffffff';ctx2d.fillRect(0,0,tmp.width,tmp.height);
  await page.render({canvasContext:ctx2d,viewport:vp}).promise;
  // Return as ImageBitmap for zero-copy drawing (no PNG roundtrip)
  if(typeof createImageBitmap!=='undefined'){
    const bmp=await createImageBitmap(tmp);
    // Wrap in an object that looks like an Image for drawImage compatibility
    bmp.naturalWidth=bmp.width;bmp.naturalHeight=bmp.height;
    return bmp;
  }
  // Fallback: PNG roundtrip for older browsers
  return new Promise(r=>{const img=new Image();img.onload=()=>r(img);img.src=tmp.toDataURL('image/png');});
}

async function pickFile(){
  return new Promise(resolve=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='.pdf,image/*';
    inp.onchange=async()=>{
      const f=inp.files[0];if(!f){resolve(null);return;}
      const result={bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,paperWMm:null,paperHMm:null,paperSource:null};
      if(f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf')){
        const ab=await f.arrayBuffer();
        result.pdfDoc=await opnePdf(ab);
        result.totalPages=result.pdfDoc.numPages;
        result.bgImg=await loadPdfPage_with(result.pdfDoc,1);
        const pm=await pdfSidePapirMm(result.pdfDoc,1);
        if(pm){result.paperWMm=pm.w;result.paperHMm=pm.h;result.paperSource='pdf';}
      } else {
        const url=URL.createObjectURL(f);
        await new Promise(r=>{const img=new Image();img.onload=()=>{result.bgImg=img;r();};img.src=url;});
        const dpi=await lesBiletDpi(f);
        if(dpi&&dpi>=50&&dpi<=2400&&result.bgImg){
          result.paperWMm=result.bgImg.width/dpi*25.4;
          result.paperHMm=result.bgImg.height/dpi*25.4;
          result.paperSource='dpi';
        }
      }
      resolve(result);
    };
    inp.click();
  });
}

