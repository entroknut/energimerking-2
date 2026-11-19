// ── Calibration dialog ────────────────────────────────────────
let calMode='length'; // 'length' or 'area'
let pendingCalAreaPx2=0; // area in image px² for area mode

function switchCalTab(tab){
  calMode=tab;
  document.getElementById('calModeLen').style.display=tab==='length'?'':'none';
  document.getElementById('calModeArea').style.display=tab==='area'?'':'none';
  document.getElementById('calTabLen').style.background=tab==='length'?'var(--accent)':'var(--surface)';
  document.getElementById('calTabLen').style.color=tab==='length'?'#fff':'var(--text2)';
  document.getElementById('calTabArea').style.background=tab==='area'?'var(--accent)':'var(--surface)';
  document.getElementById('calTabArea').style.color=tab==='area'?'#fff':'var(--text2)';
  if(tab==='area'&&!calOverlay.classList.contains('show')){
    // Reset area state when switching to area tab
    pendingCalAreaPx2=0;calPts=[];
    document.getElementById('calAreaDesc').textContent='Klikk på ei sone du kjenner arealet til for å kalibrere.';
    document.getElementById('calAreaHint').textContent='';
    hintText.textContent='Areal: klikk på ei sone du kjenner arealet til';
  }
}

function showCalStep1(){
  document.getElementById('calStep1').style.display='';
  document.getElementById('calStep2').style.display='none';
}
function showCalStep2(mode){
  document.getElementById('calStep1').style.display='none';
  document.getElementById('calStep2').style.display='';
  document.getElementById('calModeLen').style.display=mode==='length'?'':'none';
  document.getElementById('calModeArea').style.display=mode==='area'?'':'none';
  document.getElementById('calModeScale').style.display=mode==='scale'?'':'none';
}

// ── Kva kalibreringa gjeld for ──────────────────────────────
// Med fleire etasjar vel brukaren i dialogen om skalaen er global eller berre
// for denne etasjen. Valet vert fyrst brukt i calOk — Avbryt endrar ingenting.
let calScopeOwn=false;
// Fasadeark med teikning (det aktive inkludert)
const _calFasadeArk=()=>fasadar.filter(a=>a&&(a.bgImg||a===curFasade()));
// Same målestokk på eit anna ark: mm per piksel følgjer pikseltettleiken på
// papiret. Er papiret ukjent på eitt av dei, vert mm per piksel teke som han er
// (same regel som masseimporten).
function _mppSameMaalestokk(fra,fraW,mpp,til){
  const tilW=til.bgImg&&til.bgImg.width;
  if(fra&&fra.paperWMm&&til.paperWMm&&fraW&&tilW){
    const k=(til.paperWMm/tilW)/(fra.paperWMm/fraW);
    return{mpp:mpp*k,omrekna:Math.abs(k-1)>0.005};
  }
  return{mpp,omrekna:false};
}
function oppdaterCalScope(){
  const box=document.getElementById('calScope');
  const fa=iFasade(),fasArk=_calFasadeArk();
  // Planvisinga: avkryssing for fasadane, berre når det finst fasadeteikningar
  const rad=document.getElementById('calFasadeRad');
  const andreFa=fasArk.filter(a=>a.bgImg).length;
  rad.style.display=!fa&&andreFa?'':'none';
  document.getElementById('calFasadeOgTekst').textContent='Fasadeteikningane òg ('+andreFa+')';
  const vis=fa?fasArk.length>1:floors.length>1;
  box.style.display=vis?'':'none';
  if(!vis)return;
  document.getElementById('calScopeGlobalNamn').textContent=fa?'Alle fasadeteikningar':'Alle etasjar';
  document.getElementById('calScopeGlobalSub').textContent=fa?'Same målestokk':'Global skala';
  document.getElementById('calScopeOwnSub').textContent=fa?'Eiga skala':'Eigen skala';
  if(fa){
    const a=curFasade();
    document.getElementById('calScopeOwnNamn').textContent='Berre '+((a&&a.name)||'denne');
    [['calScopeGlobal',!calScopeOwn],['calScopeOwn',calScopeOwn]].forEach(([id,paa])=>{
      const b=document.getElementById(id);
      b.style.borderColor=paa?'var(--accent)':'var(--border2)';
      b.style.background=paa?'var(--accent-dim)':'var(--surface)';
    });
    document.getElementById('calScopeNote').textContent=calScopeOwn
      ?'Dei andre fasadeteikningane står urørte.'
      :'Gjeld alle '+fasArk.length+' fasadeteikningane. Planteikningane står urørte.';
    return;
  }
  const f=curFloor();
  document.getElementById('calScopeOwnNamn').textContent='Berre '+arkNamn(f);
  [['calScopeGlobal',!calScopeOwn],['calScopeOwn',calScopeOwn]].forEach(([id,paa])=>{
    const b=document.getElementById(id);
    b.style.borderColor=paa?'var(--accent)':'var(--border2)';
    b.style.background=paa?'var(--accent-dim)':'var(--surface)';
  });
  // Delplanar vert med (same målestokk); andre etasjar med eigen skala står
  const delpl=floors.filter(x=>x!==f&&x.ownCal&&erDelplan(x)&&x.bgImg).length;
  const andreEigne=floors.filter(x=>x!==f&&x.ownCal&&!(erDelplan(x)&&x.bgImg)).length;
  document.getElementById('calScopeNote').textContent=calScopeOwn
    ?'Dei andre etasjane står urørte.'
    :'Gjeld alle etasjar som brukar global skala'
      +(delpl?`, og ${delpl} delplan${delpl>1?'ar':''} med same målestokk`:'')
      +(andreEigne?`. ${andreEigne} etasje${andreEigne>1?'r':''} med eigen skala står urørt${andreEigne>1?'e':''}`:'')+'.';
}
document.getElementById('calScopeGlobal').onclick=()=>{calScopeOwn=false;oppdaterCalScope();};
document.getElementById('calScopeOwn').onclick=()=>{calScopeOwn=true;oppdaterCalScope();};

// ── Målestokk-kalibrering ───────────────────────────────────
const SKALA_VAL=[50,100,200,250,500,1000];
let valdSkala=100;
// Papirmål som skal brukast: oppdaga frå fila, eller overstyrt i nedtrekket
function gjeldandePapir(){
  const f=curArk();
  const sel=document.getElementById('calPaperSel').value;
  if(sel!=='auto'&&bgImg)return papirMaalFor(sel,bgImg.width,bgImg.height);
  if(f.paperWMm&&f.paperHMm)return{w:f.paperWMm,h:f.paperHMm};
  return null;
}
function oppdaterSkalaUI(){
  const f=curArk();
  const info=document.getElementById('calPaperInfo');
  const icon=document.getElementById('calPaperIcon');
  const res=document.getElementById('calScaleResult');
  const sel=document.getElementById('calPaperSel');
  // Papirinfo
  if(sel.value==='auto'){
    if(f.paperWMm&&f.paperHMm){
      const kjelde=f.paperSource==='pdf'?'lese frå PDF-sida':f.paperSource==='val'?'valt ved førre kalibrering':'lese frå biletet si DPI';
      info.textContent=papirFormatNamn(f.paperWMm,f.paperHMm)+' — '+kjelde;
      icon.textContent='📄';
    } else {
      info.textContent='Ukjent — vel format til høgre';
      icon.textContent='⚠️';
    }
  } else {
    const p=bgImg?papirMaalFor(sel.value,bgImg.width,bgImg.height):null;
    info.textContent=p?papirFormatNamn(p.w,p.h)+' — valt manuelt':'—';
    icon.textContent='📄';
  }
  // Knappane
  document.querySelectorAll('#calScaleBtns [data-skala]').forEach(b=>{
    const på=parseInt(b.dataset.skala)===valdSkala;
    b.style.background=på?'var(--accent)':'var(--surface)';
    b.style.color=på?'#fff':'var(--text2)';
    b.style.borderColor=på?'transparent':'var(--border2)';
    b.style.fontWeight=på?'700':'500';
  });
  // Resultat
  const papir=gjeldandePapir();
  if(!papir||!bgImg||!valdSkala||valdSkala<=0){
    res.textContent='Vel papirformat og målestokk for å sjå resultatet.';
    return;
  }
  const mmPerPx=(papir.w/bgImg.width)*valdSkala;
  const breiddeM=bgImg.width*mmPerPx/1000;
  const høgdeM=bgImg.height*mmPerPx/1000;
  res.innerHTML='<strong style="color:var(--accent)">1 : '+valdSkala+'</strong> på '+papirFormatNamn(papir.w,papir.h)
    +' → heile teikninga dekkjer <strong>'+breiddeM.toFixed(1)+' × '+høgdeM.toFixed(1)+' m</strong>';
}
// Bygg målestokk-knappane éin gong
(()=>{
  const wrap=document.getElementById('calScaleBtns');
  SKALA_VAL.forEach(s=>{
    const b=document.createElement('button');
    b.dataset.skala=s;b.textContent='1:'+s;
    b.style.cssText='padding:9px 4px;border:1.5px solid var(--border2);border-radius:8px;background:var(--surface);color:var(--text2);cursor:pointer;font-family:inherit;font-size:12px;transition:all .1s';
    b.onclick=()=>{valdSkala=s;document.getElementById('calScaleInput').value='';oppdaterSkalaUI();};
    wrap.appendChild(b);
  });
  document.getElementById('calScaleInput').oninput=function(){
    const v=parseInt(this.value);
    if(v>0)valdSkala=v;
    oppdaterSkalaUI();
  };
  document.getElementById('calPaperSel').onchange=oppdaterSkalaUI;
})();

document.getElementById('calChooseScale').onclick=()=>{
  if(!bgImg){hintText.textContent='Last opp ei teikning først.';return;}
  calMode='scale';
  const f=curArk();
  // Føreslå format frå fila om vi kjenner det
  document.getElementById('calPaperSel').value='auto';
  if(!f.paperWMm&&bgImg){
    // Ukjent papir: gjett A3 som vanlegaste planteikningsformat
    document.getElementById('calPaperSel').value='A3';
  }
  document.getElementById('calScaleInput').value='';
  showCalStep2('scale');
  oppdaterSkalaUI();
};

calBtn.onclick=()=>{
  calPts=[];pendingCalAreaPx2=0;
  calMode='length';
  if(iFasade()){
    // Alle fasadeteikningar når nokon av dei andre manglar skala — elles
    // berre denne, så ei omkalibrering ikkje skriv over skalaane som står
    const a=curFasade();
    calScopeOwn=_calFasadeArk().filter(x=>x!==a).every(x=>x.mmPerImgPx);
  }else calScopeOwn=!!curFloor().ownCal;
  document.getElementById('calFasadeOg').checked=false;
  oppdaterCalScope();
  showCalStep1();
  calOverlay.classList.add('show');
};

// Hover-effekt på metodeval-knappane
['calChooseLen','calChooseArea','calChooseScale'].forEach(id=>{
  const btn=document.getElementById(id);
  btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
  btn.onmouseleave=()=>{btn.style.borderColor='var(--border2)';btn.style.background='var(--surface)';};
});

document.getElementById('calChooseLen').onclick=()=>{
  calMode='length';
  calOverlay.classList.remove('show');
  calPts=[];
  setMode('calibrate');
  hintText.textContent='Klikk startpunkt → klikk endepunkt på ei kjend lengde · Shift for 90°/45° · scroll for zoom, midtknapp/Alt+dra for å flytte';
  draw();
};

document.getElementById('calChooseArea').onclick=()=>{
  calMode='area';
  calOverlay.classList.remove('show');
  calPts=[];pendingCalAreaPx2=0;
  setMode('calibrate');
  hintText.textContent='Klikk på ei sone du kjenner arealet til';
  draw();
};

document.getElementById('calBack').onclick=()=>{
  showCalStep1();
  calPts=[];pendingCalAreaPx2=0;
};

document.getElementById('calOk').onclick=()=>{
  let newMmPerImgPx=null;
  let _reskalert=0,_fasN=0,_fasOm=0,_delN=0,_delOm=0;
  if(calMode==='scale'){
    const papir=gjeldandePapir();
    if(papir&&bgImg&&valdSkala>0){
      newMmPerImgPx=(papir.w/bgImg.width)*valdSkala;
      // Eit papirformat valt her vert hugsa på arket, så målestokken kan
      // visast i skalabadgen etterpå (og føreslåast for delplanar)
      if(document.getElementById('calPaperSel').value!=='auto'){
        const _a=curArk();
        if(_a){_a.paperWMm=papir.w;_a.paperHMm=papir.h;_a.paperSource='val';}
      }
    }
  } else if(calMode==='length'){
    const mm=parseFloat(document.getElementById('calMmInput').value);
    if(!isNaN(mm)&&mm>0&&pendingCalImgPx>0) newMmPerImgPx=mm/pendingCalImgPx;
  } else {
    const m2=parseFloat(document.getElementById('calAreaInput').value);
    if(!isNaN(m2)&&m2>0&&pendingCalAreaPx2>0) newMmPerImgPx=Math.sqrt(m2/pendingCalAreaPx2)*1000;
  }
  if(newMmPerImgPx){
    snapshot('Kalibrering'+(iFasade()?' ('+((curFasade()||{}).name||'fasade')+')':' ('+arkNamn(curFloor())+')'));
    // ↑ angre-steg + markerer prosjektet som endra → autolagring
    // Fasadearket har si eiga skala og ingenting lagra i millimeter: måla
    // vert rekna frå biletpikslar ved kvar teikning, så ei omkalibrering slår
    // gjennom av seg sjølv. Ingen reskalering, og ingenting å gjere med
    // etasjane — arket er utanfor modellen.
    if(iFasade()){
      const fa=curFasade();
      if(fa)fa.mmPerImgPx=newMmPerImgPx;
      mmPerImgPx=newMmPerImgPx;
      // «Alle fasadeteikningar»: same målestokk på dei andre arka
      let n=0,om=0;
      if(!calScopeOwn&&_calFasadeArk().length>1){
        const fra=curArk(),fraW=bgImg&&bgImg.width;
        _calFasadeArk().forEach(a=>{
          if(a===fa||!a.bgImg)return;
          const s=_mppSameMaalestokk(fra,fraW,newMmPerImgPx,a);
          a.mmPerImgPx=s.mpp;n++;if(s.omrekna)om++;
        });
      }
      updateScaleBadge();renderFasadeTabs();renderFasadePanel();draw();
      calOverlay.classList.remove('show');
      calPts=[];setMode('navigate');
      if(n)loggAuto('Skalaen sett på '+n+' andre fasadeteikning'+(n>1?'ar':'')+(om?' ('+om+' rekna om etter papiret)':''));
      if(n)hintText.textContent='Skalaen gjeld '+(n+1)+' fasadeteikningar'
        +(om?' — '+om+' rekna om etter papirformatet':'')+'. Planteikningane står urørte. Ctrl+Z for å angre.';
      return;
    }
    // Planvisinga: fasadeteikningane òg, når det er kryssa av
    if(document.getElementById('calFasadeOg').checked){
      const fra=curArk(),fraW=bgImg&&bgImg.width;
      fasadar.forEach(a=>{
        if(!a||!a.bgImg)return;
        const s=_mppSameMaalestokk(fra,fraW,newMmPerImgPx,a);
        a.mmPerImgPx=s.mpp;_fasN++;if(s.omrekna)_fasOm++;
      });
      if(_fasN)renderFasadeTabs();
    }
    const f=curFloor();
    const _oldMpp=_snapshotMpp();   // MÅ tas før skalaen blir bytta
    // Med fleire etasjar avgjer valet i dialogen; med éin er det som før
    if(floors.length>1)f.ownCal=calScopeOwn;
    if(f.ownCal){
      // Kun aktiv etasje
      f.mmPerImgPx=newMmPerImgPx;
      mmPerImgPx=newMmPerImgPx;
    } else {
      // Global kalibrering — set på alle etasjar som ikkje har eigen
      globalMmPerImgPx=newMmPerImgPx;
      floors.forEach(fl=>{if(!fl.ownCal)fl.mmPerImgPx=newMmPerImgPx;});
      mmPerImgPx=newMmPerImgPx;
      // Delplanar har eigen skala frå fødselen av (ofte anna pikseltettleik),
      // men «alle etasjar» skal gjelde dei òg: same målestokk, rekna om
      // etter papirformatet. Dei held ownCal, så tettleiken kan vere ulik.
      const fra=curArk(),fraW=bgImg&&bgImg.width;
      floors.forEach(fl=>{
        if(fl===f||!fl.ownCal||!erDelplan(fl)||!fl.bgImg)return;
        const s=_mppSameMaalestokk(fra,fraW,newMmPerImgPx,fl);
        fl.mmPerImgPx=s.mpp;_delN++;if(s.omrekna)_delOm++;
      });
    }
    // Vindauge/dører er måla på planteikninga — dei må følgje bygget
    _reskalert=_reskalerAlleEtasjar(_oldMpp);
    updateScaleBadge();updateResults();renderTable();renderFloorTabs();draw();
  }
  calOverlay.classList.remove('show');
  calPts=[];setMode('navigate');
  // Etter setMode(), som sjølv skriv i hintText
  if(_reskalert>0)hintText.textContent='Ny skala — '+_reskalert+' vindauge/dør'+(_reskalert>1?'er':'')+' vart skalert med bygget. Ctrl+Z for å angre.';
  if(_delN)loggAuto(_delN+' delplan'+(_delN>1?'ar':'')+' fekk same målestokk'+(_delOm?' ('+_delOm+' rekna om etter papiret)':''));
  if(_fasN)loggAuto(_fasN+' fasadeteikning'+(_fasN>1?'ar':'')+' fekk same målestokk'+(_fasOm?' ('+_fasOm+' rekna om etter papiret)':''));
  if(_delN)hintText.textContent=(_reskalert>0?hintText.textContent+' ':'Ny skala. ')
    +_delN+' delplan'+(_delN>1?'ar':'')+' fekk same målestokk'+(_delOm?' ('+_delOm+' rekna om etter papirformatet)':'')+'.';
  if(_fasN)hintText.textContent=(_reskalert>0||_delN?hintText.textContent+' ':'Ny skala. ')
    +_fasN+' fasadeteikning'+(_fasN>1?'ar':'')+' fekk same målestokk'+(_fasOm?' ('+_fasOm+' rekna om etter papirformatet)':'')+'.';
};

document.getElementById('calCancel').onclick=()=>{
  calOverlay.classList.remove('show');calPts=[];pendingCalAreaPx2=0;setMode('navigate');
};
document.getElementById('calMmInput').addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('calOk').click();
  if(e.key==='Escape')document.getElementById('calCancel').click();
});
document.getElementById('calAreaInput').addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('calOk').click();
  if(e.key==='Escape')document.getElementById('calCancel').click();
});

// ── Automatisk skiljekonstruksjon mot nabosoner ───────────────
// Teiknar ein ei ny sone inntil ei eksisterande — typisk med snap til hjørne
// eller fasade — er den felles veggen ein skiljekonstruksjon, ikkje ein fasade
// i kvar sone. Ligg berre EIN DEL av naboveggen inntil, vert naboveggen delt
// så resten står att som fasade.
//
// Berre nyteikna soner utløyser dette, og vi berre SET skillevegg — aldri
// fjernar. Slår brukaren ein vegg tilbake til fasade, står det val fast.

function _naboTolPx(){
  const mpp=mppForFloor(curFloor());
  if(!mpp)return 2;
  return Math.min(5,Math.max(1,80/mpp));    // ~8 cm, men aldri under 1 px
}
function _naboMinOverlapPx(){
  const mpp=mppForFloor(curFloor());
  if(!mpp)return 5;
  return Math.max(3,250/mpp);               // kortare berøring enn 25 cm tel ikkje
}

// Overlappet mellom to veggsegment som ligg på same linje.
// Returnerer {ta0,ta1,tb0,tb1} — overlappet uttrykt 0-1 langs kvart segment.
function _veggOverlapp(a1,a2,b1,b2,tol,minLen){
  const ax=a2.x-a1.x,ay=a2.y-a1.y,la=Math.hypot(ax,ay);
  const bx=b2.x-b1.x,by=b2.y-b1.y,lb=Math.hypot(bx,by);
  if(la<1e-6||lb<1e-6)return null;
  const ux=ax/la,uy=ay/la;
  // Begge endane av B må liggje på linja gjennom A — det dekkjer både
  // parallellitet og avstand i éin test.
  const perp=p=>Math.abs((p.x-a1.x)*uy-(p.y-a1.y)*ux);
  if(perp(b1)>tol||perp(b2)>tol)return null;
  let s0=(b1.x-a1.x)*ux+(b1.y-a1.y)*uy;
  let s1=(b2.x-a1.x)*ux+(b2.y-a1.y)*uy;
  if(s0>s1){const t=s0;s0=s1;s1=t;}
  const lo=Math.max(0,s0),hi=Math.min(la,s1);
  if(hi-lo<minLen)return null;
  const vx=bx/lb,vy=by/lb;
  const proj=q=>((q.x-b1.x)*vx+(q.y-b1.y)*vy)/lb;
  let r0=proj({x:a1.x+ux*lo,y:a1.y+uy*lo});
  let r1=proj({x:a1.x+ux*hi,y:a1.y+uy*hi});
  if(r0>r1){const t=r0;r0=r1;r1=t;}
  return{ta0:lo/la,ta1:hi/la,tb0:Math.max(0,r0),tb1:Math.min(1,r1)};
}

// Same vegg? Endepunkta må falle saman, uansett kva veg segmenta går.
function _sammeVegg(a1,a2,b1,b2,tol){
  const d=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
  return(d(a1,b1)<=tol&&d(a2,b2)<=tol)||(d(a1,b2)<=tol&&d(a2,b1)<=tol);
}

// Set inn punkt på segmenta i ei sone. cuts = Map(segIdx -> [t,...]), der t er
// langs det OPPHAVLEGE segmentet. Vi går bakfrå — både gjennom segmenta og
// langs kvart segment — så indeksane vi ikkje har kome til enno står i ro.
function _kuttSegment(z,cuts){
  [...cuts.keys()].sort((a,b)=>b-a).forEach(si=>{
    const ts=[...new Set(cuts.get(si))].sort((a,b)=>b-a);
    const p1=z.pts[si],p2=z.pts[(si+1)%z.pts.length];
    let hi=1;
    ts.forEach(t=>{
      z.pts.splice(si+1,0,{x:p1.x+(p2.x-p1.x)*t,y:p1.y+(p2.y-p1.y)*t});
      remapSegsAfterInsert(z,si,t/hi);   // lokal t på den delen som står att
      hi=t;
    });
  });
}

// Returnerer talet på veggar som vart skiljekonstruksjon.
// Delplanar: sonene på dei andre arka i same etasje, med punkta omrekna til
// det aktive arket. Omrekninga er ein likeforma avbildning (skala + flytting),
// så ein t langs eit omrekna segment er same t langs originalen — kutta kan
// difor gå rett inn i den ekte sona. Skjulte soner er med, som på eige ark.
function _systerProxyar(){
  if(iFasade())return[];
  const A=curFloor();
  return etasjeArk(A).filter(f=>f!==A).flatMap(f=>f.zones
    .filter(z=>(z.pts||[]).length>=3)
    .map(z=>({z,f,pts:z.pts.map(p=>arkTilAktiv(p,f))})));
}
function autoSkilleveggForNySone(nz){
  const andre=zones.filter(z=>z!==nz&&(z.pts||[]).length>=3);
  let syster=_systerProxyar();
  if(!andre.length&&!syster.length)return 0;
  const tol=_naboTolPx(),minLen=_naboMinOverlapPx();

  // 1. Finn alle overlapp på opphavleg geometri og samle kutta per sone
  const cuts=new Map();
  const leggTil=(z,si,t)=>{
    if(!(t>1e-6)||!(t<1-1e-6))return;
    if(!cuts.has(z))cuts.set(z,new Map());
    const m=cuts.get(z);
    if(!m.has(si))m.set(si,[]);
    if(!m.get(si).some(v=>Math.abs(v-t)<1e-6))m.get(si).push(t);
  };
  const n=nz.pts.length;
  for(let i=0;i<n;i++){
    const a1=nz.pts[i],a2=nz.pts[(i+1)%n];
    andre.forEach(z=>{
      const m=z.pts.length;
      for(let j=0;j<m;j++){
        const o=_veggOverlapp(a1,a2,z.pts[j],z.pts[(j+1)%m],tol,minLen);
        if(!o)continue;
        leggTil(nz,i,o.ta0);leggTil(nz,i,o.ta1);
        leggTil(z,j,o.tb0);leggTil(z,j,o.tb1);
      }
    });
    syster.forEach(o=>{
      const m=o.pts.length;
      for(let j=0;j<m;j++){
        const ov=_veggOverlapp(a1,a2,o.pts[j],o.pts[(j+1)%m],tol,minLen);
        if(!ov)continue;
        leggTil(nz,i,ov.ta0);leggTil(nz,i,ov.ta1);
        leggTil(o.z,j,ov.tb0);leggTil(o.z,j,ov.tb1);
      }
    });
  }

  // 2. Del opp veggane, så eit felles stykke er eit heilt segment i begge soner
  cuts.forEach((m,z)=>_kuttSegment(z,m));

  // 3. Marker dei felles veggane som sonekoblingar
  const merk=(z,si,opposingZone)=>{
    ensureZoneConnectionsMap(z);
    if(z.zoneConnections.has(si))return false;
    const opposingZoneIdx=zones.indexOf(opposingZone);
    z.zoneConnections.set(si,{facingZoneIdx:opposingZoneIdx,name:`Sonekobling ${z.name} og ${opposingZone.name}`});
    // Marker òg som skiljevegg så det vises i sidepanelet
    if(!z.skillevegg)z.skillevegg=new Set();
    z.skillevegg.add(si);
    return true;
  };
  let tal=0;
  const nn=nz.pts.length;
  for(let i=0;i<nn;i++){
    const a1=nz.pts[i],a2=nz.pts[(i+1)%nn];
    andre.forEach(z=>{
      const m=z.pts.length;
      for(let j=0;j<m;j++){
        if(!_sammeVegg(a1,a2,z.pts[j],z.pts[(j+1)%m],tol))continue;
        const nyA=merk(nz,i,z),nyB=merk(z,j,nz);
        if(nyA||nyB)tal++;
      }
    });
  }
  // Mot soner på eit anna ark berre skiljekonstruksjon, ingen sonekobling:
  // zoneConnections peikar på ein indeks i SAME arket si soneliste.
  syster=_systerProxyar();   // punkta etter kutta
  const sk=(z,si)=>{
    if(!z.skillevegg)z.skillevegg=new Set();
    if(z.skillevegg.has(si))return false;
    z.skillevegg.add(si);return true;
  };
  for(let i=0;i<nn;i++){
    const a1=nz.pts[i],a2=nz.pts[(i+1)%nn];
    syster.forEach(o=>{
      const m=o.pts.length;
      for(let j=0;j<m;j++){
        if(!_sammeVegg(a1,a2,o.pts[j],o.pts[(j+1)%m],tol))continue;
        const nyA=sk(nz,i),nyB=sk(o.z,j);
        if(nyA||nyB)tal++;
      }
    });
  }

  // 4. Rydd opp i sonene vi endra geometrien på
  cuts.forEach((m,z)=>{sanitizeZoneSegRefs(z);_syncGavlflater(z);});
  if(tal)loggAuto(tal+' felles vegg'+(tal>1?'ar':'')+' gjort til skiljekonstruksjon («'+(nz.name||'ny sone')+'»)');
  return tal;
}

