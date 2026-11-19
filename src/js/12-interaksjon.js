// ── Ortho-snapping (Shift) ─────────────────────────────────────
let shiftHeld=false;
document.addEventListener('keydown',e=>{if(e.key==='Shift')shiftHeld=true;});
document.addEventListener('keyup',e=>{if(e.key==='Shift')shiftHeld=false;});

// Returner snappa skjermkoordinat ved ortho-modus (hald Shift)
// Låser retninga frå førre punkt til næraste 45°-akse (vassrett, loddrett
// eller diagonal). Punktet vert projisert på aksen slik at det held seg så
// nær musepeikaren som mogleg.
function orthoSnap(sx, sy, prevScreenPt){
  if(!shiftHeld||!prevScreenPt)return{x:sx,y:sy};
  const dx=sx-prevScreenPt.x, dy=sy-prevScreenPt.y;
  if(Math.hypot(dx,dy)<1)return{x:sx,y:sy};
  const step=Math.PI/4;
  const ang=Math.round(Math.atan2(dy,dx)/step)*step;
  const proj=Math.max(0,dx*Math.cos(ang)+dy*Math.sin(ang));
  return{x:prevScreenPt.x+Math.cos(ang)*proj,y:prevScreenPt.y+Math.sin(ang)*proj};
}
// Kva akse snappinga låser til, i grader mot vassrett (0/45/90/135) — for etikett
function orthoSnapAngle(sx, sy, prevScreenPt){
  if(!prevScreenPt)return null;
  const dx=sx-prevScreenPt.x, dy=sy-prevScreenPt.y;
  if(Math.hypot(dx,dy)<1)return null;
  const deg=Math.round(Math.atan2(dy,dx)*180/Math.PI/45)*45;
  return ((deg%180)+180)%180;
}

// Alle snap-utrekningane samla. Må kallast både ved musrørsle og ved zoom:
// zoom flyttar ikkje musa, så eit snap rekna ut før zoomen peikar på ein
// annan stad på teikninga etterpå — markøren lyg og klikket hamnar feil.
function oppdaterSnap(){
  if(!mouse)return;
  if(mode==='plasser-ark'){_plasserForhand();return;}
  // Live snap preview for window mode
  if(mode==='window'){
    winSnapPreview=snapScreenToSegment(mouse.x,mouse.y);
    cv.style.cursor=winSnapPreview.snap?'crosshair':'not-allowed';
  }
  // Snap to existing geometry in draw mode
  if(mode==='draw'){
    drawSnap=unifiedSnap(mouse.x,mouse.y,curPts);
    // Shift ortho override — snappar til 90°/45° frå førre punkt
    if(shiftHeld&&curPts.length>0&&!drawSnap){
      const prev=i2s(curPts[curPts.length-1].x,curPts[curPts.length-1].y);
      const snapped=orthoSnap(mouse.x,mouse.y,prev);
      drawSnap={x:s2i(snapped.x,snapped.y).x,y:s2i(snapped.x,snapped.y).y,_ortho:true};
    }
  }
  if(mode==='tegn-takflate'){
    drawSnap=unifiedSnap(mouse.x,mouse.y,takflatePts);
    if(shiftHeld&&takflatePts.length>0&&!drawSnap){
      const prev=i2s(takflatePts[takflatePts.length-1].x,takflatePts[takflatePts.length-1].y);
      const snapped=orthoSnap(mouse.x,mouse.y,prev);
      drawSnap={x:s2i(snapped.x,snapped.y).x,y:s2i(snapped.x,snapped.y).y,_ortho:true};
    }
  }
  if(mode==='rett-ut')rettSnap=rettPts.length<4?unifiedSnap(mouse.x,mouse.y,rettPts):null;
  if(mode==='calibrate'){
    calSnap=unifiedSnap(mouse.x,mouse.y,calPts);
    // Shift ortho for lengdemodus og arealmodus
    if(shiftHeld&&calPts.length>0&&!calSnap){
      const prevS=i2s(calPts[calPts.length-1].x,calPts[calPts.length-1].y);
      const snapped=orthoSnap(mouse.x,mouse.y,prevS);
      calSnap={x:s2i(snapped.x,snapped.y).x,y:s2i(snapped.x,snapped.y).y,_ortho:true};
    }
  }
  if(mode==='measure'){
    // Geometri-snap først; Shift låser til 90°/45° når ingen snap er nær
    measureSnap=null;measureGeoSnap=unifiedSnap(mouse.x,mouse.y,measurePts);
    if(measureGeoSnap)measureSnap={x:measureGeoSnap.x,y:measureGeoSnap.y};
    else if(shiftHeld&&measurePts.length>0){
      const prevS=i2s(measurePts[0].x,measurePts[0].y);
      const snapped=orthoSnap(mouse.x,mouse.y,prevS);
      measureSnap=s2i(snapped.x,snapped.y);
    }
  } else {measureSnap=null;measureGeoSnap=null;}
  if(mode==='klipp-takflate'){
    klippSnap=_snapKlippPt(mouse.x,mouse.y);
    // Shift låser til 90°/45° når ingen geometri-snap er nær
    if(shiftHeld&&klippTakflatePts.length>0&&!klippSnap){
      const prev=i2s(klippTakflatePts[klippTakflatePts.length-1].x,klippTakflatePts[klippTakflatePts.length-1].y);
      const s=orthoSnap(mouse.x,mouse.y,prev);
      klippSnap={...s2i(s.x,s.y),_ortho:true};
    }
  } else klippSnap=null;
  if(mode==='del-sone'){
    delSoneSnap=unifiedSnap(mouse.x,mouse.y,delSonePts);
    if(shiftHeld&&delSonePts.length>0&&!delSoneSnap){
      const prev=i2s(delSonePts[delSonePts.length-1].x,delSonePts[delSonePts.length-1].y);
      const s=orthoSnap(mouse.x,mouse.y,prev);
      delSoneSnap={...s2i(s.x,s.y),_ortho:true};
    }
  } else delSoneSnap=null;
}

// ── Canvas interaction ─────────────────────────────────────────
cwrap.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  mouse={x:e.clientX-r.left,y:e.clientY-r.top};
  if(dragging&&dragSt){offX=lastOff.x+(mouse.x-dragSt.x);offY=lastOff.y+(mouse.y-dragSt.y);}
  if(dragCorner){const pt=s2i(mouse.x,mouse.y);zones[dragCorner.zoneIdx].pts[dragCorner.ptIdx]={x:pt.x,y:pt.y};}
  if(dragZone){
    const pt=s2i(mouse.x,mouse.y);
    const dx=pt.x-dragZone.startIx,dy=pt.y-dragZone.startIy;
    const z=zones[dragZone.zoneIdx];
    z.pts=dragZone.origPts.map(p=>({x:p.x+dx,y:p.y+dy}));
    cv.style.cursor='grabbing';
  }
  if(mode==='navigate')cv.style.cursor=dragging?'grabbing':'grab';
  oppdaterSnap();
  draw();
});
cwrap.addEventListener('mouseleave',()=>{mouse=null;dragging=false;draw();});
// #cwrap inneheld ikkje berre teiknelerretet, men òg 3D-overlayet, kartpanelet
// og kompasset. Peikarhendingar derifrå bobler opp hit, og handterarane under
// kallar preventDefault() — det drep native drag-kontrollar som <input
// type="range"> (sol-slidarane og opasitets-slideren) og tekstmerking i
// søkefeltet. Berre hendingar som startar på sjølve lerretet skal styre planen.
const paaLerretet=e=>e.target===cv;

cwrap.addEventListener('wheel',e=>{
  if(!paaLerretet(e))return;
  e.preventDefault();
  const r=cv.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const f=e.deltaY<0?1.1:1/1.1;
  offX=mx-(mx-offX)*f;offY=my-(my-offY)*f;sc*=f;
  oppdaterSnap();draw();
},{passive:false});
let hoveredWin=null;
let dragWin=null;      // {w, wi, z, zi, seg, inst, dragOffsetT}
let winClipboard=null; // kopiert vindauge-objekt
let zoneClipboard=null;// kopiert sone-objekt
let hoveredZone=null;  // {z, zi, f, fi} — sona under muspeikar
cwrap.addEventListener('mousemove',e=>{
  if(dragging||dragCorner||dragZone)return;
  const r=cv.getBoundingClientRect();
  const sx=e.clientX-r.left,sy=e.clientY-r.top;

  // ── Flytte-cursor i edit-modus ──
  if(mode==='edit'&&editZoneIdx!==null&&shiftHeld){
    const _ez=zones[editZoneIdx];
    const _ip2=s2i(sx,sy);
    cv.style.cursor=(_ez&&_ez.pts.length>=3&&pointInPolygon(_ip2,_ez.pts))?'move':'crosshair';
  }

  // ── Dra vindauge langs fasaden ──
  // Ei gruppe vert dregen éi stk om gongen: første draget frys den jamne
  // fordelinga til faktiske posisjonar, slik at dei andre står i ro.
  if(dragWin){
    const {w,seg,inst}=dragWin;
    // Project mouse onto segment
    const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
    const segLenImg=Math.hypot(dx,dy);if(segLenImg<1)return;
    const ip=s2i(sx,sy);
    const t=Math.max(0,Math.min(1,((ip.x-seg.p1.x)*dx+(ip.y-seg.p1.y)*dy)/(segLenImg*segLenImg)));
    // Bruk breddeMm-basert breidde for dragging — ikkje lagra t1-t0
    // (lagra t1-t0 kan vere mykje større enn det visuelle vindauget om plasseringa vart gjort med store klikkpunkt)
    const widthPx=winBreiddPx(w,segLenImg,mmPerImgPx);
    const c=t-dragWin.dragOffsetT;
    if(winCount(w)>1)winFreezePos(w,widthPx,segLenImg);
    if(winHasPos(w)){
      w.posT[inst]=Math.max(0,Math.min(1,c));
      winSyncAnchor(w,widthPx,segLenImg);
    } else {
      const _ns=fitSpanT(c,widthPx,segLenImg);
      w.t0=_ns.t0;w.t1=_ns.t1;
    }
    cv.style.cursor='grabbing';
    draw();
    return;
  }

  const hit=findWindowAtScreen(sx,sy);
  const prev=hoveredWin;
  hoveredWin=hit||null;
  const prevM=hoveredMeasure;
  hoveredMeasure=hoveredWin?null:findMeasureAtScreen(sx,sy);
  // Nøkkelen tek med stk-indeksen — å gli frå ei stk til ei anna i same
  // gruppa endrar ingen null-status, men merkinga skal likevel følgje musa
  const _wk=h=>h?h.fli+'/'+h.zi+'/'+h.wi+'/'+h.inst:'';
  if(_wk(prev)!==_wk(hoveredWin)||(prevM&&prevM.idx)!==(hoveredMeasure&&hoveredMeasure.idx)||(prevM==null)!==(hoveredMeasure==null))draw();
  cwrap.style.cursor=hoveredWin?'grab':(hoveredMeasure?'pointer':(mode==='navigate'?'grab':'crosshair'));

  // Track kva sone musa er over (for Ctrl+C)
  if(!hoveredWin&&mode==='navigate'&&!iFasade()){
    const ip2=s2i(sx,sy);
    let hz=null;
    for(let zi=0;zi<zones.length;zi++){
      if(zones[zi].skjult)continue;
      if(zones[zi].pts.length>=3&&pointInPolygon(ip2,zones[zi].pts)){hz={z:zones[zi],zi,f:curFloor(),fi:activeFloor};break;}
    }
    hoveredZone=hz;
  } else if(hoveredWin){
    hoveredZone=null;
  }
  _markerKort(mode==='navigate'&&hoveredZone?hoveredZone.z:null);
});
cwrap.addEventListener('mouseleave',()=>_markerKort(null));
cwrap.addEventListener('mousedown',e=>{
  if(!paaLerretet(e))return;
  if(e.button===1||(e.button===0&&e.altKey)||(e.button===0&&mode==='navigate'&&!hoveredWin)){
    dragging=true;const r=cv.getBoundingClientRect();
    dragSt={x:e.clientX-r.left,y:e.clientY-r.top};lastOff={x:offX,y:offY};e.preventDefault();
    // Eit klikk utan panorering på ei sone viser sonekortet (sjå mouseup)
    _klikkSone=(e.button===0&&!e.altKey&&mode==='navigate'&&hoveredZone)?{z:hoveredZone.z,x:e.clientX,y:e.clientY}:null;
    return;
  }
  // Start window drag
  if(e.button===0&&hoveredWin&&mode==='navigate'){
    e.preventDefault();
    const r=cv.getBoundingClientRect();
    const sx=e.clientX-r.left,sy=e.clientY-r.top;
    const {w,wi,z,zi,fli,seg,inst}=hoveredWin;
    const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
    const segLenImg=Math.hypot(dx,dy);
    const ip=s2i(sx,sy);
    const t=Math.max(0,Math.min(1,((ip.x-seg.p1.x)*dx+(ip.y-seg.p1.y)*dy)/(segLenImg*segLenImg)));
    snapshot();
    // dragOffsetT = avstand frå sentrum i den stk som vart teken til klikkpunktet
    const _sp=winSpansPx(w,segLenImg,mmPerImgPx)[inst||0];
    const _c=_sp?(_sp.t0+_sp.t1)/2:(w.t0+w.t1)/2;
    dragWin={w,wi,z,zi,fli,seg,inst:inst||0,dragOffsetT:t-_c};
    return;
  }
  if(e.button===0&&mode==='edit'&&editZoneIdx!==null){
    const r=cv.getBoundingClientRect();
    const sx=e.clientX-r.left,sy=e.clientY-r.top;
    const z=zones[editZoneIdx];let best=14,bpi=-1;
    z.pts.forEach((p,pi)=>{const sp=i2s(p.x,p.y);const d=Math.hypot(sx-sp.x,sy-sp.y);if(d<best){best=d;bpi=pi;}});
    if(bpi>=0){snapshot();dragCorner={zoneIdx:editZoneIdx,ptIdx:bpi};e.preventDefault();}
    else if(shiftHeld&&z.pts.length>=3){
      // Shift+drag = flytt heile sonen
      const ip=s2i(sx,sy);
      if(pointInPolygon(ip,z.pts)){
        snapshot();
        dragZone={zoneIdx:editZoneIdx,startIx:ip.x,startIy:ip.y,origPts:z.pts.map(p=>({...p}))};
        e.preventDefault();
      }
    }
  }
});
let _klikkSone=null;
cwrap.addEventListener('mouseup',e=>{
  dragging=false;
  if(_klikkSone){
    const k=_klikkSone;_klikkSone=null;
    if(Math.hypot(e.clientX-k.x,e.clientY-k.y)<4)visSonekort(k.z);
  }
  if(dragCorner){updateResults();dragCorner=null;}
  if(dragZone){updateResults();renderTable();dragZone=null;cv.style.cursor='crosshair';}
  if(dragWin){updateResults();renderTable();dragWin=null;cv.style.cursor='grab';}
});
cwrap.addEventListener('contextmenu',e=>{
  if(!paaLerretet(e))return;
  e.preventDefault();

  const r=cv.getBoundingClientRect();
  const sx=e.clientX-r.left,sy=e.clientY-r.top;

  // ── Høgreklikk på vindauge/dør (alle moduser) ──
  const hit=findWindowAtScreen(sx,sy);
  if(hit){
    showWindowContextMenu(e.clientX,e.clientY,hit);
    return;
  }

  // ── Høgreklikk på ei målelinje (alle moduser) ──
  const mHit=findMeasureAtScreen(sx,sy);
  if(mHit){
    showMeasureContextMenu(e.clientX,e.clientY,mHit);
    return;
  }

  // ── Høgreklikk på fasade (navigate-modus) — lim inn vindauge ──
  if((mode==='navigate'||mode==='window')&&winClipboard){
    const result=snapScreenToSegment(sx,sy);
    if(result&&result.snap){
      const {zi,seg}=result.snap;
      const z=zones[zi];
      if(z&&seg&&!(z.skillevegg||new Set()).has(seg.idx)){
        // Vis liten kontekstmeny med lim-inn
        document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
        const menu=document.createElement('div');
        menu.className='ctx-menu';
        menu.style.cssText=`left:${e.clientX}px;top:${e.clientY}px`;
        const hdr=document.createElement('div');
        hdr.className='ctx-menu-header';
        const segsForLabel=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
        const segLabel=getFacadeLabels(z,segsForLabel)[segsForLabel.findIndex(s=>s.idx===seg.idx)??0]||seg.dir;
        hdr.textContent=`Fasade: ${segLabel}`;
        menu.appendChild(hdr);
        const pasteBtn=document.createElement('button');
        pasteBtn.className='ctx-menu-item';
        const wLabel=winClipboard.name||(winClipboard.type==='dor'?'Dør':'Vindauge');
        pasteBtn.innerHTML=`<span class="ctx-ik">${ctxIkon('📋')}</span><span>Lim inn «${wLabel}»</span>`;
        pasteBtn.onclick=()=>{
          menu.remove();
          document.removeEventListener('mousedown',close);
          snapshot();
          const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
          const segLen=Math.hypot(dx,dy);
          const ip2=s2i(sx,sy);
          const tMid=Math.max(0,Math.min(1,((ip2.x-seg.p1.x)*dx+(ip2.y-seg.p1.y)*dy)/(segLen*segLen)));
          // Breidda kjem frå breddeMm — den lagra t1-t0 gjeld kjeldeveggen
          const widthPx=winBreiddPx(winClipboard,segLen,mmPerImgPx);
          const {t0,t1}=fitSpanT(tMid,widthPx,segLen);
          if(!z.windows)z.windows=[];
          const copy={...winClipboard,t0,t1,segIdx:seg.idx,dir:seg.dir,name:uniqueWinName(winClipboard.name||(winClipboard.type==='dor'?'Dør':'Vindauge'),z.windows)};
          z.windows.push(copy);
          updateResults();renderTable();draw();
          hintText.textContent=`✓ Lima inn «${wLabel}» på ${segLabel}`;
        };
        menu.appendChild(pasteBtn);
        document.body.appendChild(menu);
        // Korriger posisjon om utanfor viewport
        const rect=menu.getBoundingClientRect();
        if(rect.right>window.innerWidth)menu.style.left=(e.clientX-rect.width)+'px';
        if(rect.bottom>window.innerHeight)menu.style.top=(e.clientY-rect.height)+'px';
        const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',close);}};
        setTimeout(()=>document.addEventListener('mousedown',close),10);
        return;
      }
    }
  }

  // ── Høgreklikk på sone (navigate/draw/window-modus) ──
  // Eit fasadeark har ingen soner, og sonene frå etasjane ligg på heilt andre
  // koordinatar — eit treff her ville vore reint tilfeldig.
  if(!iFasade()&&(mode==='navigate'||mode==='draw'||mode==='window')){
    // Basispunkt utan etasje-offset — kvar etasje har sitt eige offset-rammeverk,
    // så punktet må reknast per etasje (elles bommar treffet med offset-differansen)
    const _bx=(sx-offX)/sc,_by=(sy-offY)/sc;
    // Find which zone the point is inside
    let foundZ=null,foundZi=-1,foundFi=-1,foundF=null;
    // Check active floor first, then others
    const allFloorsOrdered=[
      {f:curFloor(),fi:activeFloor},
      ...floors.map((f,fi)=>({f,fi})).filter(({fi})=>fi!==activeFloor)
    ];
    outer: for(const {f,fi} of allFloorsOrdered){
      const ip={x:_bx-(f.floorDxImg||0),y:_by-(f.floorDyImg||0)};
      for(let zi=0;zi<f.zones.length;zi++){
        const z=f.zones[zi];
        if(z.pts.length<3||z.skjult)continue;
        if(pointInPolygon(ip,z.pts)){
          foundZ=z;foundZi=zi;foundFi=fi;foundF=f;
          break outer;
        }
      }
    }
    if(foundZ){
      showZoneContextMenu(e.clientX,e.clientY,foundZ,foundZi,foundF,foundFi);
      return;
    }
  }

  // ── Høgreklikk på hjørne i edit-modus ──
  if(mode!=='edit'||editZoneIdx===null)return;
  const z=zones[editZoneIdx];if(z.pts.length<=3)return;
  let best=14,bpi=-1;
  z.pts.forEach((p,pi)=>{const sp=i2s(p.x,p.y);const d=Math.hypot(sx-sp.x,sy-sp.y);if(d<best){best=d;bpi=pi;}});
  if(bpi>=0){snapshot();remapSegsBeforeDelete(z,bpi);z.pts.splice(bpi,1);updateResults();renderTable();draw();}
});

// ── Point-in-polygon test ─────────────────────────────────────
function pointInPolygon(pt,pts){
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;
    if(((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

// ── Kontekstmenyar ────────────────────────────────────────────
// Stilen vert lagd inn ved fyrste meny, uansett kva meny det er — både
// sonemenyen og etasjemenyen brukar desse klassene.
function _ensureCtxStyle(){}   // stilen står i stilarket (.ctx-menu)

// Monokrome ikon for menyar og knappar — same strekstil som verktøylinja.
const IKON_SVG={
  rediger:'<path d="M10.5 2.5l3 3L6 13H3v-3z"/>',
  geometri:'<path d="M3 12.5 4 3.5l8.5-1 1 10z"/><circle cx="3" cy="12.5" r="1.4" fill="currentColor"/><circle cx="4" cy="3.5" r="1.4" fill="currentColor"/><circle cx="12.5" cy="2.5" r="1.4" fill="currentColor"/><circle cx="13.5" cy="12.5" r="1.4" fill="currentColor"/>',
  klipp:'<circle cx="4" cy="4.5" r="2"/><circle cx="4" cy="11.5" r="2"/><path d="M5.7 5.6 14 12M5.7 10.4 14 4"/>',
  kopier:'<rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M3 10.5V3.5a1 1 0 0 1 1-1h7"/>',
  lim:'<rect x="3.5" y="3" width="9" height="11" rx="1.5"/><path d="M6 3V2h4v1M6 7h4M6 9.5h4"/>',
  kople:'<path d="M6.5 9.5l3-3"/><path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2"/><path d="M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8"/>',
  slett:'<path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 9h6.6l.7-9"/>',
  auge:'<path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z"/><circle cx="8" cy="8" r="2"/>',
  zoom:'<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>',
  ok:'<path d="M3 8.5 6.5 12 13 4.5"/>',
  kort:'<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M10 2.5v11M4.5 5.5h3M4.5 8h3M4.5 10.5h2"/>',
  vindauge:'<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M8 2.5v11M2.5 8h11"/>',
  dor:'<path d="M4 14V2.5h8V14M2.5 14h11"/><circle cx="10" cy="8.5" r=".8" fill="currentColor"/>',
  loys:'<rect x="1.5" y="5" width="3.5" height="6" rx=".6"/><rect x="6.25" y="5" width="3.5" height="6" rx=".6"/><rect x="11" y="5" width="3.5" height="6" rx=".6"/>',
  jamn:'<path d="M2 8h12M2 8l2.5-2.5M2 8l2.5 2.5M14 8l-2.5-2.5M14 8l-2.5 2.5"/>',
};
function ikonSvg(namn){
  const p=IKON_SVG[namn];
  return p?'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>':'';
}
// Teikna som menyane alltid har brukt, omsette til SVG der vi har eitt.
// Andre teikn (⇱ ⇲ ▣ …) er monokrome og står som dei er.
const _CTX_IKON={'⊹':'geometri','✂':'klipp','🔍':'zoom','👁':'auge','⬡':'kopier','⧉':'kopier','⎘':'kopier',
  '📋':'lim','⧈':'lim','⋮⋮':'loys','⇔':'jamn','⇌':'kople','▤':'kort','✓':'ok','✎':'rediger','🗑':'slett','▭':'vindauge','🚪':'dor'};
function ctxIkon(sym){
  const n=_CTX_IKON[sym];
  return n?ikonSvg(n):'<span class="ctx-g">'+sym+'</span>';
}

function showZoneContextMenu(clientX,clientY,z,zi,f,fi){
  // Remove any existing context menus
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());

  const menu=document.createElement('div');
  menu.className='ctx-menu';
  menu.style.cssText=`left:${clientX}px;top:${clientY}px`;

  _ensureCtxStyle();

  const mkItem=(icon,label,action,cls='')=>{
    const btn=document.createElement('button');
    btn.className='ctx-menu-item'+( cls?' '+cls:'');
    btn.innerHTML=`<span class="ctx-ik">${ctxIkon(icon)}</span><span>${label}</span>`;
    btn.onclick=()=>{close();action();};
    return btn;
  };
  const mkSep=()=>{const d=document.createElement('div');d.className='ctx-menu-sep';return d;};

  // Header
  const hdr=document.createElement('div');
  hdr.className='ctx-menu-header';
  hdr.innerHTML=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLORS[zi%COLORS.length]};margin-right:5px"></span>${z.name}`;
  menu.appendChild(hdr);
  menu.appendChild(mkSep());

  // Edit geometry
  menu.appendChild(mkItem('⊹','Rediger geometri',()=>{
    if(fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
    setMode('edit');editZoneIdx=zi;draw();
  }));
  menu.appendChild(mkItem('✂','Del sone…',()=>{
    if(z.pts.length<3){hintText.textContent='Sona har for få punkt til å delast.';return;}
    if(fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
    delSoneTarget={z,zi};delSonePts=[];delSoneSnap=null;
    setMode('del-sone');
    hintText.textContent='Klikk startpunkt utanfor eller på veggen, og teikn ei linje tvers gjennom «'+z.name+'» · Shift for 90°/45°';
    draw();
  }));
  menu.appendChild(mkItem('🔍','Zoom til sone',()=>zoomToZone(z)));
  menu.appendChild(mkItem('▤','Vis sonekort',()=>visSonekort(z)));
  menu.appendChild(mkItem('👁','Skjul sona',()=>{
    setSkjult(z,fi,zi,true);
    markDirty();updateResults();draw();_rebuild3DDebounced();
    hintText.textContent='«'+z.name+'» er skjult — auge-ikonet i sonekortet viser henne igjen.';
  }));
  menu.appendChild(mkItem('⬡','Kopier sone… (Ctrl+C)',()=>{
    zoneClipboard=JSON.parse(JSON.stringify(z));
    zoneClipboard.skillevegg=Array.from(z.skillevegg||[]);
    zoneClipboard._srcFloorDxImg=f.floorDxImg||0;
    zoneClipboard._srcFloorDyImg=f.floorDyImg||0;
    winClipboard=null;
    hintText.textContent='Kopierte «'+z.name+'» — Ctrl+V for å lime inn, eller vel etasje i meny';
    showCopyZoneMenu(z,zi,f,fi);
  }));
  menu.appendChild(mkSep());

  // ── Sonekobling ──────────────────────────────────────────────
  const srcBygkat2=z.bygkat||'Kontorbygg';

  // Koble soner i same etasje
  const sameFl=f.zones.filter((_,i)=>i!==zi&&(f.zones[i].bygkat||'Kontorbygg')===srcBygkat2);
  if(sameFl.length){
    const linkHdr=document.createElement('div');
    linkHdr.className='ctx-menu-header';
    linkHdr.textContent='Koble med sone i same etasje';
    menu.appendChild(linkHdr);
    sameFl.forEach((tz,_tzi)=>{
      const tzi=f.zones.indexOf(tz);
      const isLinked=z.groupId&&tz.groupId===z.groupId;
      menu.appendChild(mkItem(isLinked?'✓':'⇌',tz.name+(isLinked?' (kopla)':''),()=>{
        snapshot();
        if(isLinked){
          // Dele opp — fjern groupId frå denne sona
          delete tz.groupId;
          if(f.zones.filter(x=>x.groupId===z.groupId).length<=1)delete z.groupId;
        } else {
          if(!z.groupId)z.groupId='g'+(++_nextGroupId);
          tz.groupId=z.groupId;
        }
        updateResults();renderTable();draw();
      },isLinked?'':''));
    });
    menu.appendChild(mkSep());
  }

  // Koble soner i andre etasjar
  if(floors.length>1){
    const otherFloors=floors.filter((_,i)=>i!==fi);
    const crossFloorItems=[];
    otherFloors.forEach(tf=>{
      tf.zones.filter(tz=>(tz.bygkat||'Kontorbygg')===srcBygkat2).forEach(tz=>{
        const isLinked=z.groupId&&tz.groupId===z.groupId;
        crossFloorItems.push(mkItem(isLinked?'✓':'⇌',tf.name+' › '+tz.name+(isLinked?' (kopla)':''),()=>{
          snapshot();
          if(isLinked){
            delete tz.groupId;
            if(floors.flatMap(fl=>fl.zones).filter(x=>x.groupId===z.groupId).length<=1)delete z.groupId;
          } else {
            if(!z.groupId)z.groupId='g'+(++_nextGroupId);
            tz.groupId=z.groupId;
          }
          updateResults();renderTable();draw();
        },isLinked?'':''));
      });
    });
    if(crossFloorItems.length){
      const linkXHdr=document.createElement('div');
      linkXHdr.className='ctx-menu-header';
      linkXHdr.textContent='Koble med sone i anna etasje';
      menu.appendChild(linkXHdr);
      crossFloorItems.forEach(item=>menu.appendChild(item));
      menu.appendChild(mkSep());
    }
  }

  // Fjern alle koplingar for denne sona
  if(z.groupId){
    const linkedAll=floors.flatMap(fl=>fl.zones).filter(x=>x.groupId===z.groupId);
    menu.appendChild(mkItem('✂','Del opp alle koplingar',()=>{
      snapshot();
      linkedAll.forEach(x=>delete x.groupId);
      updateResults();renderTable();draw();
    },'danger'));
    menu.appendChild(mkSep());
  }

  // Copy to other floor (uten kobling)
  if(floors.length>1){
    const copyHdr=document.createElement('div');
    copyHdr.className='ctx-menu-header';copyHdr.textContent='Kopier geometri til etasje';
    menu.appendChild(copyHdr);
    floors.forEach((tf,tfi)=>{
      if(tfi===fi)return;
      menu.appendChild(mkItem('⬡',tf.name,()=>{
        snapshot();
        const copy=JSON.parse(JSON.stringify(z));
        copy.name='Sone '+(++_nextZoneId);
        copy.skillevegg=new Set(Array.from(z.skillevegg||[]));
        copy.zoneConnections=new Map();
        delete copy.groupId;
        _adjustPtsForFloorOffset(copy, f, tf);
        tf.zones.push(copy);
        renderFloorTabs();updateResults();renderTable();
        hintText.textContent=`"${z.name}" kopiert til ${tf.name} som ${copy.name}`;
      }));
    });
    menu.appendChild(mkSep());
  }

  menu.appendChild(mkItem('🗑','Slett sone',()=>{
    snapshot();
    // Rydd opp groupId om det var siste i gruppa
    if(z.groupId){
      const remaining=floors.flatMap(fl=>fl.zones).filter(x=>x.groupId===z.groupId&&x!==z);
      if(remaining.length===1)delete remaining[0].groupId;
    }
    f.zones.splice(zi,1);
    if(fi===activeFloor&&editZoneIdx===zi)editZoneIdx=null;
    zones=curFloor().zones;
    renderFloorTabs();updateResults();renderTable();draw();
  },'danger'));

  document.body.appendChild(menu);

  // Keep menu inside viewport
  const rect=menu.getBoundingClientRect();
  if(rect.right>window.innerWidth)menu.style.left=(clientX-rect.width)+'px';
  if(rect.bottom>window.innerHeight)menu.style.top=(clientY-rect.height)+'px';

  const close=()=>{menu.remove();document.removeEventListener('mousedown',outsideClick);};
  const outsideClick=ev=>{if(!menu.contains(ev.target))close();};
  setTimeout(()=>document.addEventListener('mousedown',outsideClick),10);
}

// ── Unik vindauge/dør-namn ────────────────────────────────────
function uniqueWinName(name, existingWindows){
  if(!existingWindows||!existingWindows.length)return name;
  const taken=new Set(existingWindows.map(w=>w.name));
  if(!taken.has(name))return name;
  const base=name.replace(/\s*\(\d+\)$/,'');
  let n=2;
  while(taken.has(base+' ('+n+')'))n++;
  return base+' ('+n+')';
}

function findWindowAtScreen(sx,sy){
  if(iFasade())return null;
  const THRESH=10;
  let best=null,bestD=THRESH;
  // Berre søk i aktiv etasje — vindauge på andre etasjar skal ikkje påverkast
  const fl=curFloor();
  const fli=activeFloor;
  fl.zones.forEach((z,zi)=>{
    if(z.skjult)return;
    const segs=calcSegments(z.pts,getHoyde(z));
    if(!segs)return;
    (z.windows||[]).forEach((w,wi)=>{
      const seg=segs[w.segIdx];
      if(!seg)return;
      const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
      const segLen=Math.hypot(dx,dy);if(segLen<1)return;
      const ux=dx/segLen,uy=dy/segLen;
      // Kvar stk i gruppa er sin eigen treffflate — brukaren tek tak i éin
      // om gongen, og `inst` fortel kven det vart.
      winSpansPx(w,segLen,mmPerImgPx).forEach((_sp,inst)=>{
        const s0i={x:seg.p1.x+ux*_sp.t0*segLen,y:seg.p1.y+uy*_sp.t0*segLen};
        const s1i={x:seg.p1.x+ux*_sp.t1*segLen,y:seg.p1.y+uy*_sp.t1*segLen};
        const s0=i2s(s0i.x,s0i.y),s1=i2s(s1i.x,s1i.y);
        const ex=s1.x-s0.x,ey=s1.y-s0.y;
        const elen=Math.hypot(ex,ey)||1;
        const t=Math.max(0,Math.min(1,((sx-s0.x)*ex+(sy-s0.y)*ey)/(elen*elen)));
        const px=s0.x+t*ex,py=s0.y+t*ey;
        const d=Math.hypot(sx-px,sy-py);
        const mx=(s0.x+s1.x)/2,my=(s0.y+s1.y)/2;
        const dm=Math.hypot(sx-mx,sy-my);
        const dist=Math.min(d,dm);
        if(dist<bestD){bestD=dist;best={w,wi,z,zi,fli,fl,seg,segs,inst};}
      });
    });
  });
  return best;
}

// ── Løyse stk ut av ei vindaugsgruppe ─────────────────────────
// Gruppa er eitt element i SIMIEN (<window number="n">). Å løyse ut ei stk
// gjer gruppa til number="n-1" og legg det utløyste vindauget ved sida av som
// eit eige element med number="1" — same plass på veggen, same mål.
function loysUtStk(w,z,inst){
  const n=winCount(w);
  if(n<2)return;
  const {segLen,width}=winGeom(z,w);
  snapshot();
  const cs=winCentres(w,width,segLen);
  const c=cs[inst]!=null?cs[inst]:cs[0];
  const sp=fitSpanT(c,width,segLen);
  const ny={...w,antal:1,posT:[c],t0:sp.t0,t1:sp.t1,lappStk:0,
            name:uniqueWinName(w.name||(w.type==='dor'?'Dør':'Vindauge'),z.windows)};
  w.antal=n-1;
  w.posT=cs.filter((_,i)=>i!==inst);
  // Lappen følgjer det teikna stykket; vart det sjølv løyst ut, går han til nabostykket
  if(Number.isInteger(w.lappStk)&&w.lappStk>=inst)w.lappStk=Math.max(0,w.lappStk-1);
  winSyncAnchor(w,width,segLen);
  const ix=z.windows.indexOf(w);
  z.windows.splice(ix>=0?ix+1:z.windows.length,0,ny);
  updateResults();renderTable();draw();
  hintText.textContent='Løyste ut «'+ny.name+'» — gruppa står att med '+winCount(w)+' stk.';
}
// Heile gruppa til sjølvstendige vindauge. Merk at det gir n element i SXI-en
// i staden for eitt — difor er det eit eige val, ikkje noko som skjer av seg
// sjølv når brukaren flyttar på stykka.
function loysOppGruppe(w,z){
  const n=winCount(w);
  if(n<2)return;
  const {segLen,width}=winGeom(z,w);
  snapshot();
  const cs=winCentres(w,width,segLen);
  const base=w.name||(w.type==='dor'?'Dør':'Vindauge');
  const ix=Math.max(0,z.windows.indexOf(w));
  z.windows.splice(ix,1);
  cs.forEach((c,i)=>{
    const sp=fitSpanT(c,width,segLen);
    z.windows.splice(ix+i,0,{...w,antal:1,posT:[c],t0:sp.t0,t1:sp.t1,
      name:i===0?base:uniqueWinName(base,z.windows)});
  });
  updateResults();renderTable();draw();
  hintText.textContent='Løyste opp gruppa i '+n+' sjølvstendige '+(w.type==='dor'?'dører':'vindauge')+'.';
}
// Tilbake til jamn fordeling rundt gruppesenteret
function fordelStkJamnt(w,z){
  snapshot();
  w.posT=null;
  updateResults();renderTable();draw();
  hintText.textContent='Fordelte stykka jamnt på veggen.';
}

// ── Kontekstmeny for vindauge/dør ────────────────────────────
function showWindowContextMenu(cx,cy,hit){
  document.getElementById('winCtxMenu')?.remove();
  const {w,wi,z,zi,fli}=hit;
  const inst=hit.inst||0;
  const nStk=winCount(w);
  const label=w.name||(w.type==='dor'?'Dør':'Vindauge');
  const menu=document.createElement('div');
  menu.id='winCtxMenu';
  menu.className='ctx-menu';
  menu.style.cssText=`left:${cx}px;top:${cy}px`;

  const header=document.createElement('div');
  header.className='ctx-menu-header';
  header.style.textTransform='none';header.style.letterSpacing='0';header.style.fontSize='11.5px';
  header.innerHTML='<span class="ctx-ik">'+ikonSvg(w.type==='dor'?'dor':'vindauge')+'</span><span></span>';
  header.lastChild.textContent=label+(nStk>1?' '+(inst+1)+'/'+nStk:'')+' · '+w.breddeMm+'×'+w.hoyMm+' mm';
  menu.appendChild(header);
  const sep0=document.createElement('div');sep0.className='ctx-menu-sep';menu.appendChild(sep0);

  const mkItem=(icon,txt,cb,danger=false)=>{
    const btn=document.createElement('button');
    btn.className='ctx-menu-item'+(danger?' danger':'');
    btn.innerHTML='<span class="ctx-ik">'+ctxIkon(icon)+'</span><span></span>';
    btn.lastChild.textContent=txt;
    btn.onclick=()=>{menu.remove();cb();};
    menu.appendChild(btn);
  };

  mkItem('✎','Rediger',()=>showWindowEditDialog(w,wi,z,zi,fli));
  if(nStk>1){
    mkItem('⧉','Løys ut denne stk',()=>loysUtStk(w,z,inst));
    mkItem('⋮⋮','Løys opp gruppa ('+nStk+' eigne)',()=>loysOppGruppe(w,z));
  }
  if(nStk>1&&winHasPos(w))mkItem('⇔','Fordel jamnt',()=>fordelStkJamnt(w,z));
  mkItem('⧉','Kopier til fasade…',()=>{showCopyWindowMenu(w,z,zi,floors[fli],fli);});
  mkItem('📋','Kopier (Ctrl+C)',()=>{
    winClipboard=JSON.parse(JSON.stringify(w));
    hintText.textContent='Kopierte «'+(winClipboard.name||winClipboard.type)+'» — trykk Ctrl+V for å lime inn';
  });
  const sepS=document.createElement('div');sepS.className='ctx-menu-sep';menu.appendChild(sepS);
  mkItem('🗑','Slett',()=>{
    snapshot();const ix=z.windows.indexOf(w);if(ix>=0)z.windows.splice(ix,1);updateResults();renderTable();draw();
  },true);

  document.body.appendChild(menu);
  // Close on outside click
  const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',close);}};
  setTimeout(()=>document.addEventListener('mousedown',close),0);

  // Reposition if off-screen
  const mr=menu.getBoundingClientRect();
  if(mr.right>window.innerWidth)menu.style.left=(cx-mr.width)+'px';
  if(mr.bottom>window.innerHeight)menu.style.top=(cy-mr.height)+'px';
}

// ── Rediger vindauge/dør dialog ───────────────────────────────
function showWindowEditDialog(w,wi,z,zi,fli){
  document.getElementById('winEditDlg')?.remove();
  const dlg=document.createElement('div');
  dlg.id='winEditDlg';
  dlg.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.4);z-index:700;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  const typeL=w.type==='dor'?'Dør':'Vindauge';
  const box=document.createElement('div');
  box.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:24px;width:400px;max-width:92vw;box-shadow:var(--shadow-lg)';

  const mkRow=(lbl,inp)=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:10px';
    const l=document.createElement('label');
    l.style.cssText='font-size:12px;color:var(--text3);width:110px;flex-shrink:0;font-weight:500';
    l.textContent=lbl;
    row.appendChild(l);row.appendChild(inp);
    return row;
  };
  const mkInput=(val,type='text',width='100%')=>{
    const i=document.createElement('input');
    i.type=type;i.value=val;
    i.style.cssText=`flex:1;padding:6px 10px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:${type==='number'?'inherit':'inherit'};width:${width}`;
    i.onfocus=()=>{i.style.borderColor='var(--accent)';};
    i.onblur=()=>{i.style.borderColor='var(--border2)';};
    return i;
  };

  const nameI=mkInput(w.name||'');
  const brI=mkInput(w.breddeMm,'number');brI.min=1;brI.step=1;
  const hoI=mkInput(w.hoyMm,'number');hoI.min=1;hoI.step=1;
  const antI=mkInput(w.antal,'number');antI.min=1;antI.max=999;antI.step=1;
  const uI=mkInput(w.uVerdi||'','number');uI.min=0;uI.step=0.01;uI.placeholder='standard';

  // Brystningshøgde (berre 3D-modell, ikkje SXI)
  const hasBrystning=w.brystningMm!=null;
  const brystCb=document.createElement('input');
  brystCb.type='checkbox';brystCb.checked=hasBrystning;
  brystCb.style.cssText='width:15px;height:15px;accent-color:var(--accent);cursor:pointer;flex-shrink:0';
  const brystI=mkInput(w.brystningMm??900,'number');brystI.min=0;brystI.step=10;
  brystI.style.cssText=`flex:1;padding:6px 10px;font-size:13px;border:1.5px solid var(--border2);border-radius:7px;outline:none;font-family:inherit;display:${hasBrystning?'block':'none'}`;
  brystI.onfocus=()=>{brystI.style.borderColor='var(--accent)'};
  brystI.onblur=()=>{brystI.style.borderColor='var(--border2)'};
  brystCb.onchange=()=>{brystI.style.display=brystCb.checked?'block':'none';};
  const brystRow=document.createElement('div');
  brystRow.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:10px';
  const brystLbl=document.createElement('label');
  brystLbl.style.cssText='font-size:12px;color:var(--text3);width:110px;flex-shrink:0;font-weight:500';
  brystLbl.textContent='Brystning (mm)';
  const brystNote=document.createElement('span');
  brystNote.style.cssText='font-size:10px;color:var(--text3);white-space:nowrap';
  brystNote.textContent='kun 3D';
  const brystRight=document.createElement('div');
  brystRight.style.cssText='display:flex;align-items:center;gap:6px;flex:1';
  brystRight.appendChild(brystCb);brystRight.appendChild(brystI);brystRight.appendChild(brystNote);
  brystRow.appendChild(brystLbl);brystRow.appendChild(brystRight);

  box.innerHTML=`<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px"><span style="width:18px;height:18px;color:var(--accent);display:inline-flex">${ikonSvg(w.type==='dor'?'dor':'vindauge')}</span>Rediger ${typeL.toLowerCase()}</div>`;
  box.appendChild(mkRow('Namn',nameI));
  box.appendChild(mkRow('Breidde (mm)',brI));
  box.appendChild(mkRow('Høgde (mm)',hoI));
  // Dører har ikkje antal i SIMIEN. Ei gammal dør med antal>1 får feltet, men
  // berre for å kunne setje det ned — aldri opp.
  const _antalDor=w.type==='dor';
  const _visAntal=!_antalDor||winCount(w)>1;
  if(_antalDor)antI.max=winCount(w);
  if(_visAntal)box.appendChild(mkRow('Antal stk',antI));
  const antNote=document.createElement('div');
  antNote.style.cssText='font-size:11px;margin:-6px 0 10px 120px;line-height:1.4';
  // Lever på breidde og antal medan brukaren skriv: ei gruppe som er breiare
  // enn veggen kan ikkje stå utan å overlappe, og det skal han sjå med ein gong
  const _segLenM=(()=>{const g=winGeom(z,w);return g.mpp?g.segLen*g.mpp/1000:null;})();
  const oppdaterAntNote=()=>{
    const br=parseInt(brI.value),ant=parseInt(antI.value);
    const trongt=_segLenM&&br>0&&ant>1&&(ant*br/1000)>_segLenM*1.0001;
    antNote.style.color=trongt?'#c0302a':'var(--text3)';
    if(_antalDor){antNote.style.color='var(--text3)';antNote.textContent='Dører kan ikkje grupperast i SIMIEN — set antalet til 1 og kopier døra om det er fleire.';return;}
    antNote.textContent=trongt
      ?`⚠ ${ant} × ${br} mm = ${(ant*br/1000).toFixed(2)} m på ein vegg på ${_segLenM.toFixed(2)} m — stykka vil overlappe.`
      :'Fleire stk = eitt element i SIMIEN med dette antalet, fordelt jamnt utover veggen. Kvar stk kan dragast for seg.';
  };
  oppdaterAntNote();
  antI.oninput=oppdaterAntNote;brI.oninput=oppdaterAntNote;
  if(_visAntal)box.appendChild(antNote);
  box.appendChild(mkRow('U-verdi W/m²K',uI));
  if(w.type!=='dor') box.appendChild(brystRow);

  const errEl=document.createElement('div');
  errEl.style.cssText='display:none;background:var(--dm-red-bg,#fef0ef);border:1px solid var(--dm-red-bd,#f2b8b5);border-radius:7px;padding:8px 12px;font-size:12px;color:var(--dm-red-tx,#c0302a);margin-bottom:10px';
  box.appendChild(errEl);

  const btnRow=document.createElement('div');
  btnRow.style.cssText='display:flex;gap:8px;justify-content:flex-end;margin-top:6px';
  const cancel=document.createElement('button');
  cancel.textContent='Avbryt';
  cancel.className='dcancel';
  cancel.onclick=()=>dlg.remove();
  const save=document.createElement('button');
  save.textContent='Lagre';
  save.className='dok';
  save.onclick=()=>{
    const br=parseInt(brI.value),ho=parseInt(hoI.value);
    let ant=parseInt(antI.value);
    if(_antalDor&&ant>winCount(w))ant=winCount(w);
    if(!br||br<=0||!ho||ho<=0||!ant||ant<=0){errEl.textContent='Breidde, høgde og antal må vere positive tal.';errEl.style.display='block';return;}
    snapshot();
    w.name=nameI.value.trim()||typeL;
    w.breddeMm=br;w.hoyMm=ho;
    // Antalet endrar plasseringa til stykka — winSetAntal tek vare på dei som
    // alt står der og legg nye etter den siste (sjå winSetAntal)
    const _g=winGeom(z,w);
    winSetAntal(w,ant,_g.width,_g.segLen,winOpptekne(z,w,_g.segLen,_g.mpp));
    const uv=parseFloat(uI.value);w.uVerdi=isNaN(uv)?undefined:uv;
    if(w.type!=='dor'){
      if(brystCb.checked){const bv=parseInt(brystI.value);w.brystningMm=isNaN(bv)?null:bv;}
      else w.brystningMm=null;
    }
    dlg.remove();updateResults();renderTable();draw();
  };

  // Kopier til same fasade
  const copyBtn=document.createElement('button');
  copyBtn.innerHTML='<span style="width:14px;height:14px;display:inline-flex">'+ikonSvg('kopier')+'</span>Kopier på veggen';
  copyBtn.title='Legg ein kopi av '+typeL.toLowerCase()+'et ved sida av på same fasade';
  copyBtn.className='dcancel';copyBtn.style.cssText='display:inline-flex;align-items:center;gap:6px;margin-right:auto;white-space:nowrap';
  copyBtn.onclick=()=>{
    snapshot();
    // Breidda kjem frå breddeMm, ikkje frå lagra t1-t0 (som berre er senteret)
    const _seg=(calcSegments(z.pts,getHoyde(z),mppForZone(z))||[])[w.segIdx];
    const _segLenPx=_seg?_seg.lenPx:0;
    const _src=winSpanPx(w,_segLenPx,mppForZone(z));
    const width=_src.t1-_src.t0;
    const {t0,t1}=fitSpanT(_src.t1+0.02+width/2,width*_segLenPx,_segLenPx);
    const copy={...w,t0,t1,posT:null,name:uniqueWinName(w.name,z.windows)};
    z.windows.push(copy);
    dlg.remove();updateResults();renderTable();draw();
  };
  btnRow.appendChild(copyBtn);btnRow.appendChild(cancel);btnRow.appendChild(save);
  box.appendChild(btnRow);
  dlg.appendChild(box);
  document.body.appendChild(dlg);
  dlg.addEventListener('click',ev=>{if(ev.target===dlg)dlg.remove();});
  setTimeout(()=>nameI.focus(),50);
}

cv.addEventListener('click',e=>{
  if(e.button!==0||e.altKey||dragging||dragCorner)return;
  if(calOverlay.classList.contains('show'))return;
  if(rettOverlay.classList.contains('show'))return;
  const r=cv.getBoundingClientRect();
  const sx=e.clientX-r.left,sy=e.clientY-r.top;

  if(mode==='plasser-ark'){_plasserKlikk(sx,sy);return;}
  if(mode==='rett-ut'){_rettKlikk(sx,sy);return;}

  // ── Måleverktøy ──
  if(mode==='measure'){
    let ip=s2i(sx,sy);
    // Snap til hjørne/kant har forrang; elles låser Shift til 90°/45°
    const _gs=unifiedSnap(sx,sy,measurePts);
    if(_gs)ip={x:_gs.x,y:_gs.y};
    else if(shiftHeld&&measurePts.length>0){
      const prevS=i2s(measurePts[0].x,measurePts[0].y);
      const snapped=orthoSnap(sx,sy,prevS);
      ip=s2i(snapped.x,snapped.y);
    }
    if(measurePts.length===0){
      measurePts=[ip];
      hintText.textContent='Klikk endepunkt for å fullføre måling · Shift for 90°/45°';
    } else {
      const p1=measurePts[0],p2=ip;
      const dPx=Math.hypot(p2.x-p1.x,p2.y-p1.y);
      const dMm=dPx*mmPerImgPx;
      snapshot();
      measureResults.push({p1,p2});
      measurePts=[];
      showMeasurements=true;updateMeasureUI();
      hintText.textContent=`Målt: ${fmtMaal(dMm)} — målet er lagra. Klikk for ny måling · høgreklikk på eit mål for å slette · Esc for å avslutte.`;
    }
    draw();
    return;
  }
  if(mode==='draw'){
    if(curPts.length>=3){const p0=i2s(curPts[0].x,curPts[0].y);if(Math.hypot(sx-p0.x,sy-p0.y)<12){finishZone();return;}}
    // Ortho snap: om Shift heldt, lås til 90° frå førre punkt
    let rawPt=drawSnap&&!drawSnap._ortho?{x:drawSnap.x,y:drawSnap.y}:s2i(sx,sy);
    if(shiftHeld&&curPts.length>0){
      const prevS=i2s(curPts[curPts.length-1].x,curPts[curPts.length-1].y);
      const snapped=orthoSnap(sx,sy,prevS);
      rawPt=s2i(snapped.x,snapped.y);
    } else if(drawSnap&&!drawSnap._ortho){
      rawPt={x:drawSnap.x,y:drawSnap.y};
    }
    curPts.push(rawPt);drawSnap=null;draw();return;
  }
  if(mode==='tegn-takflate'){
    if(takflatePts.length>=3){const tp0=i2s(takflatePts[0].x,takflatePts[0].y);if(Math.hypot(sx-tp0.x,sy-tp0.y)<12){finishTakflate();return;}}
    let rawPt2=drawSnap&&!drawSnap._ortho?{x:drawSnap.x,y:drawSnap.y}:s2i(sx,sy);
    if(shiftHeld&&takflatePts.length>0){
      const prevS=i2s(takflatePts[takflatePts.length-1].x,takflatePts[takflatePts.length-1].y);
      const snapped=orthoSnap(sx,sy,prevS);
      rawPt2=s2i(snapped.x,snapped.y);
    } else if(drawSnap&&!drawSnap._ortho){
      rawPt2={x:drawSnap.x,y:drawSnap.y};
    }
    takflatePts.push(rawPt2);drawSnap=null;draw();return;
  }
  if(mode==='klipp-takflate'){
    // Dobbelklikk: fullfør utan å leggje til nytt punkt
    if(e.detail===2){
      if(klippTakflatePts.length>=2)_finishKlipp();
      return;
    }
    // Klikk på startpunktet lukkar sløyfa og klippar ut ein bit midt i flata
    if(klippSnap&&klippSnap.type==='lukk'&&klippTakflatePts.length>=3){_finishKlipp();return;}
    let ip=klippSnap?{x:klippSnap.x,y:klippSnap.y}:s2i(sx,sy);
    if(!klippSnap&&shiftHeld&&klippTakflatePts.length>0){
      const prev=i2s(klippTakflatePts[klippTakflatePts.length-1].x,klippTakflatePts[klippTakflatePts.length-1].y);
      const s=orthoSnap(sx,sy,prev);ip=s2i(s.x,s.y);
    }
    klippTakflatePts.push(ip);
    if(klippTakflatePts.length===1){
      hintText.textContent='Klikk neste punkt · Shift for 90°/45° · Enter eller dobbelklikk for å klippe · Esc for å avbryte';
    } else if(klippTakflatePts.length===3){
      hintText.textContent='Klikk på startpunktet for å klippe ut ein bit midt i flata · eller dra linja heilt igjennom og trykk Enter';
    }
    draw();return;
  }
  if(mode==='del-sone'){
    if(e.detail===2){
      if(delSonePts.length>=2)_finishDelSone();
      return;
    }
    let ip=delSoneSnap?{x:delSoneSnap.x,y:delSoneSnap.y}:s2i(sx,sy);
    if(!delSoneSnap&&shiftHeld&&delSonePts.length>0){
      const prev=i2s(delSonePts[delSonePts.length-1].x,delSonePts[delSonePts.length-1].y);
      const s=orthoSnap(sx,sy,prev);ip=s2i(s.x,s.y);
    }
    delSonePts.push(ip);
    if(delSonePts.length===1)hintText.textContent='Klikk vidare til linja går heilt igjennom sona · Shift for 90°/45° · Enter eller dobbelklikk for å dele';
    draw();return;
  }
  if(mode==='calibrate'){
    if(calMode==='area'){
      const ip=s2i(sx,sy);
      // Sjekk om brukaren klikka på ein eksisterande sone
      let clickedZone=null;
      for(let zi=0;zi<zones.length;zi++){
        if(zones[zi].skjult)continue;
        if(zones[zi].pts.length>=3&&pointInPolygon(ip,zones[zi].pts)){
          clickedZone=zones[zi];break;
        }
      }
      if(clickedZone){
        // Bruk sona sin piksel-area direkte
        let a=0;
        const pts=clickedZone.pts;
        for(let i=0;i<pts.length;i++){
          const j=(i+1)%pts.length;
          a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;
        }
        pendingCalAreaPx2=Math.abs(a)/2;
        calPts=clickedZone.pts.map(p=>({...p})); // vis sona sin kontur
        // Om allereie kalibrert: vis gjeldande areal som forslag
        const existM2=mmPerImgPx?(pendingCalAreaPx2*(mmPerImgPx/1000)**2):null;
        document.getElementById('calAreaInput').value=existM2?existM2.toFixed(2):'';
        document.getElementById('calAreaHint').textContent=`Klikka på «${clickedZone.name}» — skriv inn faktisk areal i m²`;
        document.getElementById('calAreaDesc').textContent='Kor stort er arealet til «'+clickedZone.name+'» i verkelegheita?';
        showCalStep2('area');
        calOverlay.classList.add('show');
        setTimeout(()=>{const el=document.getElementById('calAreaInput');el.select();el.focus();},50);
        draw();return;
      }
      // Areal-kalibrering: legg til punkt med ortho-snap
      let ip2=s2i(sx,sy);
      if(shiftHeld&&calPts.length>0){
        const prevS=i2s(calPts[calPts.length-1].x,calPts[calPts.length-1].y);
        const snapped=orthoSnap(sx,sy,prevS);
        ip2=s2i(snapped.x,snapped.y);
      } else if(calSnap&&!calSnap._ortho){
        ip2={x:calSnap.x,y:calSnap.y};
      }
      // Klikk første punkt = avslutt (same som dobbelklikk og sone-teikning)
      if(calPts.length>=3){
        const p0s=i2s(calPts[0].x,calPts[0].y);
        if(Math.hypot(sx-p0s.x,sy-p0s.y)<12){
          // Avslutt polygon
          finishAreaCal();
          return;
        }
      }
      calPts.push(ip2);calSnap=null;
      if(calPts.length>=3){
        hintText.textContent=calPts.length+' punkt. Klikk startpunktet eller dobbelklikk for å avslutte.';
      } else {
        hintText.textContent='Klikka utanfor soner. Klikk hjørner for manuelt polygon'+( calPts.length===0?' eller klikk på ei sone.':'.');
      }
      draw();return;
    }
    // Lengde-kalibrering med ortho-snap.
    // calPts lagrast i BILETkoordinatar (som areal-modus) — elles korrumperer
    // zoom/pan mellom første og andre klikk kalibreringa stille.
    let calImgPt;
    if(shiftHeld&&calPts.length>0){
      const prevS=i2s(calPts[calPts.length-1].x,calPts[calPts.length-1].y);
      const snapped=orthoSnap(sx,sy,prevS);
      calImgPt=s2i(snapped.x,snapped.y);
    } else if(calSnap&&!calSnap._ortho){
      calImgPt={x:calSnap.x,y:calSnap.y};
    } else {
      calImgPt=s2i(sx,sy);
    }
    calPts.push(calImgPt);calSnap=null;
    if(calPts.length===2){
      const imgD=Math.hypot(calPts[1].x-calPts[0].x,calPts[1].y-calPts[0].y);
      pendingCalImgPx=imgD;
      calPxSpan.textContent=Math.round(imgD*sc)+'px = '+Math.round(imgD)+' biletpx';
      if(mmPerImgPx)document.getElementById('calMmInput').value=Math.round(imgD*mmPerImgPx);
      else document.getElementById('calMmInput').value='';
      showCalStep2('length');
      calOverlay.classList.add('show');
      setTimeout(()=>{document.getElementById('calMmInput').select();document.getElementById('calMmInput').focus();},50);
      draw();
    } else {hintText.textContent='Klikk endepunktet.';draw();}
    return;
  }
  if(mode==='window'){
    const snapped=snapScreenToSegment(sx,sy);
    if(!snapped.snap){
      hintText.textContent='Klikk på ein fasade (den farga vegglinja rundt sona).';draw();return;
    }
    // Lagre i biletkoordinatar (ikkje skjerm) — punktet skal ikkje flytte seg
    // om brukaren panorerer eller zoomar mellom dei to klikka.
    winPts.push({ix:snapped.snap.cx,iy:snapped.snap.cy,snap:snapped.snap});
    if(winPts.length===1){
      hintText.textContent='Klikk der vindauget/døra sluttar på same fasade.';draw();return;
    }
    // Two points — both snapped
    const s1=winPts[0].snap,s2=winPts[1].snap;
    // Check same zone and segment
    if(s1.zi!==s2.zi||s1.seg.idx!==s2.seg.idx){
      // Accept: find segment for first point, project second onto same seg
      // Use first point's segment
    }
    const seg=s1.seg;const zi=s1.zi;
    const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
    const segLen=Math.hypot(dx,dy);
    const ux=dx/segLen,uy=dy/segLen;
    const proj=(px,py)=>((px-seg.p1.x)*ux+(py-seg.p1.y)*uy)/segLen;
    const t0c=Math.max(0,Math.min(1,proj(s1.cx,s1.cy)));
    const t1c=Math.max(0,Math.min(1,proj(s2.cx,s2.cy)));
    const tMin=Math.min(t0c,t1c),tMax=Math.max(t0c,t1c);
    if(tMax-tMin<0.005){hintText.textContent='Vindauget er for smalt. Prøv igjen.';winPts=[];draw();return;}
    // Calc width in mm
    const widthMm=mmPerImgPx?(tMax-tMin)*segLen*mmPerImgPx:1200;
    const result={zi,segIdx:seg.idx,dir:seg.dir,t0:tMin,t1:tMax,lenM:seg.lenM};
    pendingWin=result;
    document.getElementById('winFacadeDir').textContent=seg.dir;
    document.getElementById('winW').value=Math.round(widthMm);
    const _zt=zones[zi];
    const setAutoName=()=>{
      const _tval=document.getElementById('winType').value;
      const _tl=_tval==='dor'?'Dør':'Vindauge';
      const _cnt=((_zt.windows||[]).filter(x=>x.type===_tval).length)+1;
      document.getElementById('winName').value=_tl+' '+_cnt;
      // Skjul brystningshøgde for dør
      const _brystRow=document.getElementById('winBrystRow');
      _brystRow.style.display=_tval==='dor'?'none':'';
      document.getElementById('winNRow').style.display=_tval==='dor'?'none':'';
      if(_tval==='dor')document.getElementById('winN').value=1;
    };
    setAutoName();
    // Checkbox og inputfelt for brystningshøgde
    const _brystCb=document.getElementById('winBrystCb');
    const _brystI=document.getElementById('winBryst');
    const _brystUnit=document.getElementById('winBrystUnit');
    _brystCb.checked=false;_brystI.style.display='none';_brystUnit.style.display='none';
    _brystCb.onclick=()=>{
      _brystI.style.display=_brystCb.checked?'':'none';
      _brystUnit.style.display=_brystCb.checked?'':'none';
      if(_brystCb.checked) setTimeout(()=>_brystI.focus(),10);
    };
    document.getElementById('winType').onchange=()=>{
      setAutoName();
    };
    winOverlay.classList.add('show');
    winPts=[];draw();
    setTimeout(()=>{const el=document.getElementById('winName');el.select();el.focus();},50);
    return;
  }
  if(mode==='edit'){
    // Midpoint click → insert
    if(editZoneIdx!==null){
      const z=zones[editZoneIdx];
      for(let i=0;i<z.pts.length;i++){
        const p1=z.pts[i],p2=z.pts[(i+1)%z.pts.length];
        const mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;
        const sp=i2s(mx,my);
        if(Math.hypot(sx-sp.x,sy-sp.y)<12){
          snapshot();z.pts.splice(i+1,0,{x:mx,y:my});remapSegsAfterInsert(z,i);updateResults();renderTable();draw();return;
        }
      }
    }
  }
});
function finishAreaCal(){
  if(calPts.length<3)return;
  let a=0;
  for(let i=0;i<calPts.length;i++){
    const j=(i+1)%calPts.length;
    a+=calPts[i].x*calPts[j].y-calPts[j].x*calPts[i].y;
  }
  pendingCalAreaPx2=Math.abs(a)/2;
  if(mmPerImgPx) document.getElementById('calAreaInput').value=(pendingCalAreaPx2*(mmPerImgPx/1000)**2).toFixed(2);
  else document.getElementById('calAreaInput').value='';
  document.getElementById('calAreaDesc').textContent='Kor stort er dette arealet i verkelegheita?';
  document.getElementById('calAreaHint').textContent='';
  showCalStep2('area');
  calOverlay.classList.add('show');
  setTimeout(()=>{const el=document.getElementById('calAreaInput');el.select();el.focus();},50);
}

let lastClickTime=0;
cv.addEventListener('dblclick',e=>{
  if(mode==='draw'&&curPts.length>=3){
    if(curPts.length>0) curPts.pop();
    finishZone();
  }
  if(mode==='calibrate'&&calMode==='area'&&calPts.length>=3){
    if(calPts.length>0) calPts.pop(); // fjern dobbelklikk-duplikat
    finishAreaCal();
  }
});
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA') return;
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();return;}
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='Z'))){e.preventDefault();redo();return;}
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(e.key==='S'||e.key==='s')){e.preventDefault();lastNedProsjektfil();return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();document.getElementById('saveBtn').click();return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='o'){e.preventDefault();fi.click();return;}

  // ── Kopier (Ctrl+C) — sone eller vindauge avhengig av kva musa er over ──
  if((e.ctrlKey||e.metaKey)&&e.key==='c'){
    if(hoveredWin){
      // Vindauge har prioritet om musa er over eit vindauge
      winClipboard=JSON.parse(JSON.stringify(hoveredWin.w));
      zoneClipboard=null;
      hintText.textContent='Kopierte «'+(winClipboard.name||winClipboard.type)+'» — Ctrl+V for å lime inn på fasade';
      e.preventDefault();return;
    } else if(hoveredZone){
      // Sone
      zoneClipboard=JSON.parse(JSON.stringify(hoveredZone.z));
      zoneClipboard.skillevegg=Array.from(hoveredZone.z.skillevegg||[]);
      zoneClipboard._srcFloorDxImg=floors[hoveredZone.fi].floorDxImg||0;
      zoneClipboard._srcFloorDyImg=floors[hoveredZone.fi].floorDyImg||0;
      winClipboard=null;
      hintText.textContent='Kopierte sone «'+zoneClipboard.name+'» — Ctrl+V for å lime inn';
      e.preventDefault();return;
    }
  }

  // ── Lim inn (Ctrl+V) ──
  // Soner og vindauge høyrer til planteikninga. Vart dei limte inn medan eit
  // fasadeark var framme, ville dei hamna usynleg på den aktive etasjen.
  if((e.ctrlKey||e.metaKey)&&e.key==='v'&&iFasade()){
    hintText.textContent='Soner og vindauge kan ikkje limast inn på eit fasadeark. Byt til Plan.';
    return;
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='v'){
    // Sone
    if(zoneClipboard&&!winClipboard){
      snapshot();
      const copy=JSON.parse(JSON.stringify(zoneClipboard));
      copy.name='Sone '+(++_nextZoneId);
      copy.skillevegg=new Set(zoneClipboard.skillevegg||[]);
      copy.zoneConnections=new Map();
      delete copy.groupId;
      // Juster for offset-forskjell mellom kjeldeetasje og aktiv etasje
      const _srcF={floorDxImg:zoneClipboard._srcFloorDxImg||0,floorDyImg:zoneClipboard._srcFloorDyImg||0};
      _adjustPtsForFloorOffset(copy, _srcF, curFloor());
      zones.push(copy);
      renderFloorTabs();updateResults();renderTable();draw();
      hintText.textContent='✓ Lima inn «'+copy.name+'» på aktiv etasje. Ctrl+V igjen for ei til.';
      e.preventDefault();return;
    }
    // Vindauge
    if(winClipboard){
      // Breidda kjem alltid frå breddeMm — den lagra t1-t0 gjeld kjeldeveggen,
      // som kan ha annan lengd, og han følgjer ikkje endra breidde/skala
      const _clipW=(segLenPx)=>winBreiddPx(winClipboard,segLenPx,mmPerImgPx);
      if(hoveredWin){
        snapshot();
        const {w:refW,z,seg}=hoveredWin;
        const _refSpan=winSpanPx(refW,seg.lenPx,mmPerImgPx);
        const _wPx=_clipW(seg.lenPx);
        const {t0,t1}=fitSpanT(_refSpan.t1+0.02+(_wPx/2)/(seg.lenPx||1),_wPx,seg.lenPx);
        // posT gjeld kjeldeveggen — kopien får jamn fordeling frå den nye staden
        const copy={...winClipboard,t0,t1,posT:null,segIdx:refW.segIdx,dir:seg.dir};
        if(!z.windows)z.windows=[];
        copy.name=uniqueWinName(winClipboard.name||(winClipboard.type==='dor'?'Dør':'Vindauge'),z.windows);
        z.windows.push(copy);
        updateResults();renderTable();draw();
        hintText.textContent='✓ Lima inn «'+(copy.name||copy.type)+'» på same fasade. Ctrl+V igjen for ei til.';
      } else if(mouse){
        const result=snapScreenToSegment(mouse.x,mouse.y);
        if(result&&result.snap){
          snapshot();
          const {zi,seg}=result.snap;
          const z=zones[zi];
          if(z&&seg){
            const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
            const segLen=Math.hypot(dx,dy);
            const ip=s2i(mouse.x,mouse.y);
            const tMid=Math.max(0,Math.min(1,((ip.x-seg.p1.x)*dx+(ip.y-seg.p1.y)*dy)/(segLen*segLen)));
            const {t0,t1}=fitSpanT(tMid,_clipW(segLen),segLen);
            if(!z.windows)z.windows=[];
            const copy={...winClipboard,t0,t1,posT:null,segIdx:seg.idx,dir:seg.dir,name:uniqueWinName(winClipboard.name||(winClipboard.type==='dor'?'Dør':'Vindauge'),z.windows)};
            z.windows.push(copy);
            updateResults();renderTable();draw();
            hintText.textContent='✓ Lima inn «'+(copy.name||copy.type)+'» på fasade.';
          }
        } else {
          hintText.textContent='Hald muspeikar over ein fasade eller eit vindauge for å lime inn.';
        }
      }
      e.preventDefault();return;
    }
  }

  if(e.key==='Enter'&&mode==='klipp-takflate'){
    if(klippTakflatePts.length>=2)_finishKlipp();
    e.preventDefault();return;
  }
  if(e.key==='Enter'&&mode==='del-sone'){
    if(delSonePts.length>=2)_finishDelSone();
    e.preventDefault();return;
  }
  if(e.key==='Escape'){
    if(mode==='measure'){measurePts=[];measureSnap=null;setMode('navigate');draw();return;}
    if(mode==='edit'){setMode('navigate');editZoneIdx=null;draw();}
    else if(mode==='draw'){curPts=[];setMode('navigate');draw();}
    else if(mode==='window'){winPts=[];winSnapPreview=null;setMode('navigate');draw();}
    else if(mode==='tegn-takflate'){takflatePts=[];activeTakflateZone=null;setMode('navigate');draw();}
    else if(mode==='klipp-takflate'){klippTakflatePts=[];klippTakflateTarget=null;setMode('navigate');draw();}
    else if(mode==='del-sone'){delSonePts=[];delSoneTarget=null;delSoneSnap=null;setMode('navigate');draw();}
    else if(mode==='plasser-ark'){setMode('navigate');hintText.textContent='Plasseringa vart avbroten — arket står der det stod.';draw();}
    else if(mode==='rett-ut'&&!rettOverlay.classList.contains('show')){setMode('navigate');draw();}
  }
  if(e.key==='Backspace'||e.key==='Delete'){
    // Slett hovered vindauge/dør
    if(hoveredWin&&mode==='navigate'){
      snapshot();
      const {w,z}=hoveredWin;
      const ix=z.windows.indexOf(w);
      if(ix>=0)z.windows.splice(ix,1);
      hoveredWin=null;
      updateResults();renderTable();draw();
      e.preventDefault();return;
    }
    // Fjern siste punkt under teikning
    if(mode==='draw'){
      if(curPts.length>0){
        curPts.pop();
        hintText.textContent=curPts.length>0
          ?curPts.length+' punkt. Backspace for å angre, dobbelklikk for å avslutte.'
          :'Alle punkt fjerna. Klikk for å starte på nytt.';
        draw();
      }
      e.preventDefault();
    }
    if(mode==='tegn-takflate'){
      if(takflatePts.length>0){takflatePts.pop();draw();}
      e.preventDefault();
    }
    if(mode==='rett-ut'&&!rettOverlay.classList.contains('show')){
      if(rettPts.length>0){rettPts.pop();draw();}
      e.preventDefault();
    }
  }
});

// Desse feltene fyrer på kvart tastetrykk. Lerretet oppdaterast med ein gong,
// men sidepanel og tabell — som er dyre å byggje — ventar til du har slutta
// å skrive. Utan dette kostar «3.5» tre fulle ombyggingar.
let _tungOppdateringTimer=null;
function tungOppdateringSnart(){
  clearTimeout(_tungOppdateringTimer);
  _tungOppdateringTimer=setTimeout(()=>{updateResults();renderTable();},220);
}
[northI,fhI].forEach(el=>el.addEventListener('input',()=>{
  if(el===northI){
    setGlobalNorth(parseFloat(northI.value)||0);
  }
  // Etasjehøgda gjeld alle arka i etasjen, ikkje berre det aktive
  if(el===fhI&&!iFasade()){
    const v=parseFloat(fhI.value);
    if(v>0)etasjeArk(curFloor()).forEach(x=>{x.defaultHoyde=v;});
  }
  draw();
  tungOppdateringSnart();
}));
// Ved blur/Enter oppdaterer vi med ein gong, så verdien aldri står att uvist
[northI,fhI].forEach(el=>el.addEventListener('change',()=>{
  clearTimeout(_tungOppdateringTimer);
  updateResults();renderTable();draw();
}));

renderFloorTabs();
applyViewUI();
renderFasadeTabs();

