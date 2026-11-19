// ── Compass ───────────────────────────────────────────────────
// Entro-symbolet (--entro-ikon), farga i mørkeblått, står som ein liten fast
// signatur nedst i skiva. Det dreiar ikkje — det er pila som peikar.
let _kompassBilete=null,_kompassLastar=false;
function _kompassIkon(){
  if(_kompassBilete||_kompassLastar)return _kompassBilete;
  const m=/url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(document.documentElement).getPropertyValue('--entro-ikon'));
  if(!m)return null;
  _kompassLastar=true;
  const img=new Image();
  img.onload=()=>{
    // Farge inn masken éin gong
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
    const x=c.getContext('2d');
    x.drawImage(img,0,0);
    x.globalCompositeOperation='source-in';
    x.fillStyle='#32595e';x.fillRect(0,0,c.width,c.height);
    _kompassBilete=c;drawCompass();
  };
  img.src=m[1];
  return null;
}
function drawCompass(){
  const W=96,H=96,cx=48,cy=48,r=40;
  cctx.clearRect(0,0,W,H);
  // Under nordCheck viser kompassen alltid pil rett opp (nord er opp)
  const nd=nordCheck?0:(parseFloat(northI.value)||0);
  // Shadow + background circle
  cctx.beginPath();cctx.arc(cx,cy,r,0,Math.PI*2);
  const mork=erMork();
  cctx.fillStyle=mork?'rgba(21,23,25,.96)':'rgba(255,255,255,.96)';cctx.fill();
  cctx.strokeStyle=mork?'#373c42':'#e2e6ed';cctx.lineWidth=1.5;cctx.stroke();
  // Subtle ring inside
  cctx.beginPath();cctx.arc(cx,cy,r-8,0,Math.PI*2);
  cctx.strokeStyle=mork?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';cctx.lineWidth=1;cctx.stroke();
  // Signaturen i bandet mellom ringane, under pila — så halen (r-16) aldri
  // ligg oppå han
  const ikon=_kompassIkon();
  if(ikon){
    const ih=9,iw=ih*ikon.width/ikon.height;
    cctx.globalAlpha=.55;
    cctx.drawImage(ikon,cx-iw/2,cy+r-10,iw,ih);
    cctx.globalAlpha=1;
  }

  // Arrow angle: northI degrees CW from UP
  // In canvas: UP = -PI/2, CW = positive direction
  const arrowAngle = (nd - 90) * Math.PI / 180;
  const tipR = r - 6;
  const tailR = r - 16;

  // Arrow tip and tail positions
  const tip  = {x: cx + Math.cos(arrowAngle)*tipR,  y: cy + Math.sin(arrowAngle)*tipR};
  const tail = {x: cx - Math.cos(arrowAngle)*tailR, y: cy - Math.sin(arrowAngle)*tailR};
  const perp = {x: -Math.sin(arrowAngle), y: Math.cos(arrowAngle)};

  // Draw arrow shaft
  cctx.beginPath();
  cctx.moveTo(tail.x, tail.y);
  cctx.lineTo(tip.x, tip.y);
  cctx.strokeStyle=mork?'#3fa0a5':'#1a7a6e';cctx.lineWidth=2.5;
  cctx.lineCap='round';cctx.stroke();cctx.lineCap='butt';

  // Arrowhead (filled triangle at tip)
  const headLen = 11;
  const headW = 5.5;
  const base = {x: tip.x - Math.cos(arrowAngle)*headLen, y: tip.y - Math.sin(arrowAngle)*headLen};
  cctx.beginPath();
  cctx.moveTo(tip.x, tip.y);
  cctx.lineTo(base.x + perp.x*headW, base.y + perp.y*headW);
  cctx.lineTo(base.x - perp.x*headW, base.y - perp.y*headW);
  cctx.closePath();
  cctx.fillStyle=mork?'#3fa0a5':'#1a7a6e';cctx.fill();

  // Small tail dot
  cctx.beginPath();cctx.arc(tail.x,tail.y,2.5,0,Math.PI*2);
  cctx.fillStyle=mork?'#4a5058':'#c8cfe0';cctx.fill();

  // "N" label near arrowhead (outside circle, at tip direction)
  const labelR = r + 8; // outside the circle... no, keep inside near tip
  const labelPos = {
    x: cx + Math.cos(arrowAngle)*(tipR - 18),
    y: cy + Math.sin(arrowAngle)*(tipR - 18)
  };
  cctx.font='bold 11px Inter,sans-serif';
  cctx.fillStyle='#fff';
  cctx.textAlign='center';cctx.textBaseline='middle';
  // White halo
  cctx.strokeStyle='#1a7a6e';cctx.lineWidth=3;
  cctx.strokeText('N', labelPos.x, labelPos.y);
  cctx.fillStyle='#fff';
  cctx.fillText('N', labelPos.x, labelPos.y);

  // Centre pivot dot
  cctx.beginPath();cctx.arc(cx,cy,3.5,0,Math.PI*2);
  cctx.fillStyle='#1a7a6e';cctx.fill();
  cctx.beginPath();cctx.arc(cx,cy,1.5,0,Math.PI*2);
  cctx.fillStyle='#fff';cctx.fill();
  // «Dra for å justere» står i title-attributtet på lerretet. Som tekst inne
  // i ringen la han seg over pila kvar gong nord peika nedover.
}

// ── Compass drag interaction ──────────────────────────────────
let compassDragging=false;
compassCanvas.addEventListener('mousedown', e=>{
  compassDragging=true;
  compassCanvas.classList.add('dragging');
  e.preventDefault();
});
document.addEventListener('mousemove', e=>{
  if(!compassDragging)return;
  const rect=compassCanvas.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  const dx=e.clientX-cx, dy=e.clientY-cy;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
  if(angle<0)angle+=360;
  if(angle>=360)angle-=360;
  setGlobalNorth(Math.round(angle));
  // Berre lerretet under draginga — fasaderetningane er synlege der.
  // Sidepanel og tabell er tunge å byggje, og vert oppdaterte når du slepp.
  draw();
});
document.addEventListener('mouseup', ()=>{
  if(compassDragging){
    compassDragging=false;compassCanvas.classList.remove('dragging');
    updateResults();renderTable();draw();
  }
});
// Touch support
compassCanvas.addEventListener('touchstart', e=>{compassDragging=true;e.preventDefault();},{passive:false});
document.addEventListener('touchmove', e=>{
  if(!compassDragging)return;
  const t=e.touches[0];
  const rect=compassCanvas.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  let angle=Math.atan2(t.clientY-cy,t.clientX-cx)*180/Math.PI+90;
  if(angle<0)angle+=360;if(angle>=360)angle-=360;
  setGlobalNorth(Math.round(angle));
  draw();
},{passive:false});
document.addEventListener('touchend',()=>{
  if(compassDragging){compassDragging=false;updateResults();renderTable();draw();}
});

// ── Måleverktøy — hjelpefunksjonar ────────────────────────────
// Måla ligg i biletkoordinatar på etasjen. Lengda reknast på nytt ved kvar
// teikning, slik at ei omkalibrering slår gjennom på gamle mål òg.
function normMaal(arr){
  return (arr||[]).filter(m=>m&&m.p1&&m.p2&&isFinite(m.p1.x)&&isFinite(m.p1.y)&&isFinite(m.p2.x)&&isFinite(m.p2.y))
                  .map(m=>({p1:{x:m.p1.x,y:m.p1.y},p2:{x:m.p2.x,y:m.p2.y}}));
}
function fmtMaal(mm){
  if(mm==null||!isFinite(mm))return '';
  return mm<1000?Math.round(mm)+' mm':(mm/1000).toFixed(3).replace('.',',')+' m';
}
function measureLenMm(m){
  const mpp=iFasade()?mmPerImgPx:mppForFloor(curFloor());
  if(!mpp)return null;
  return Math.hypot(m.p2.x-m.p1.x,m.p2.y-m.p1.y)*mpp;
}
// Målsettingslinje i teknisk stil: hjelpestrekar på tvers, piler i begge endar
// og etiketten liggjande langs linja i eit opphald midt på.
function drawDimension(s1,s2,label,opts){
  const o=opts||{};
  // o.ctx: side-om-side-ruta teiknar måla sine på eit anna lerret
  const ctx=o.ctx||cv.getContext('2d');
  const col=o.color||'#dc2626';
  const dx=s2.x-s1.x,dy=s2.y-s1.y,len=Math.hypot(dx,dy);
  if(len<2)return;
  const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  const lw=o.hot?2:1.3;
  ctx.save();
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.lineCap='butt';
  // Hjelpestrekar på tvers av endepunkta
  const tick=o.hot?9:7;
  ctx.beginPath();
  ctx.moveTo(s1.x-nx*tick,s1.y-ny*tick);ctx.lineTo(s1.x+nx*tick,s1.y+ny*tick);
  ctx.moveTo(s2.x-nx*tick,s2.y-ny*tick);ctx.lineTo(s2.x+nx*tick,s2.y+ny*tick);
  ctx.stroke();
  // Etikett — plassert i eit opphald midt på linja når det er plass
  ctx.font='600 11.5px Inter,sans-serif';
  const tw=label?ctx.measureText(label).width:0;
  const gap=label&&len>tw+34?tw+12:0;
  const mx=(s1.x+s2.x)/2,my=(s1.y+s2.y)/2;
  ctx.beginPath();
  if(gap){
    ctx.moveTo(s1.x,s1.y);ctx.lineTo(mx-ux*gap/2,my-uy*gap/2);
    ctx.moveTo(mx+ux*gap/2,my+uy*gap/2);ctx.lineTo(s2.x,s2.y);
  } else {
    ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);
  }
  ctx.stroke();
  // Piler — utover mot kvar ende, slik som på ei måleskisse
  if(len>26){
    const al=9,aw=3.2;
    [[s1,-1],[s2,1]].forEach(([p,sg])=>{
      ctx.beginPath();
      ctx.moveTo(p.x,p.y);
      ctx.lineTo(p.x-sg*ux*al+nx*aw,p.y-sg*uy*al+ny*aw);
      ctx.lineTo(p.x-sg*ux*al-nx*aw,p.y-sg*uy*al-ny*aw);
      ctx.closePath();ctx.fill();
    });
  }
  if(label){
    let ang=Math.atan2(dy,dx);
    if(ang>Math.PI/2||ang<-Math.PI/2)ang+=Math.PI;  // aldri opp-ned
    ctx.translate(mx,my);ctx.rotate(ang);
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(gap){
      // Opphaldet er alt der — berre ein lett bakgrunn for lesbarheit
      ctx.fillStyle='rgba(255,255,255,.82)';
      ctx.beginPath();ctx.roundRect(-tw/2-5,-8,tw+10,16,3);ctx.fill();
    } else {
      ctx.translate(0,-11);
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.beginPath();ctx.roundRect(-tw/2-5,-8,tw+10,16,3);ctx.fill();
      ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke();
    }
    ctx.fillStyle=col;
    ctx.fillText(label,0,.5);
  }
  ctx.restore();
}
function showMeasureContextMenu(px,py,hitM){
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
  const menu=document.createElement('div');
  menu.className='ctx-menu';
  menu.style.cssText=`left:${px}px;top:${py}px`;
  const hdr=document.createElement('div');
  hdr.className='ctx-menu-header';
  const dMm=measureLenMm(hitM.m);
  hdr.textContent='Mål: '+(dMm!=null?fmtMaal(dMm):'ukalibrert');
  menu.appendChild(hdr);
  const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',close);}};
  const mkBtn=(icon,txt,fn)=>{
    const b=document.createElement('button');
    b.className='ctx-menu-item';
    b.innerHTML=`<span class="ctx-ik">${ctxIkon(icon)}</span><span>${txt}</span>`;
    b.onclick=()=>{menu.remove();document.removeEventListener('mousedown',close);fn();};
    menu.appendChild(b);
  };
  mkBtn('🗑','Slett dette målet',()=>slettMaal(hitM.idx));
  if(measureResults.length>1)mkBtn('🧹',`Slett alle mål (${measureResults.length})`,()=>slettAlleMaal());
  mkBtn('👁','Skjul alle mål',()=>{showMeasurements=false;hoveredMeasure=null;updateMeasureUI();draw();hintText.textContent='Mål er skjulte — dei er framleis lagra.';});
  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  if(rect.right>window.innerWidth)menu.style.left=(px-rect.width)+'px';
  if(rect.bottom>window.innerHeight)menu.style.top=(py-rect.height)+'px';
  setTimeout(()=>document.addEventListener('mousedown',close),10);
}
// Finn målelinja under peikaren (skjermkoordinatar)
function findMeasureAtScreen(sx,sy){
  if(!showMeasurements||!measureResults||!measureResults.length)return null;
  let best=null,bestD=9;
  measureResults.forEach((m,idx)=>{
    const a=i2s(m.p1.x,m.p1.y),b=i2s(m.p2.x,m.p2.y);
    const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
    if(l2<1)return;
    const t=Math.max(0,Math.min(1,((sx-a.x)*dx+(sy-a.y)*dy)/l2));
    const d=Math.hypot(sx-(a.x+dx*t),sy-(a.y+dy*t));
    if(d<bestD){bestD=d;best={m,idx};}
  });
  return best;
}
function slettMaal(idx){
  snapshot();
  measureResults.splice(idx,1);
  hoveredMeasure=null;updateMeasureUI();draw();
  hintText.textContent='Målet er sletta.';
}
function slettAlleMaal(){
  snapshot();
  measureResults.length=0;
  hoveredMeasure=null;updateMeasureUI();draw();
  hintText.textContent=iFasade()?'Alle mål på dette fasadearket er sletta.':'Alle mål på denne etasjen er sletta.';
}

// ── Draw ──────────────────────────────────────────────────────
// ── Delplanar på lerretet (berre under «Plasser») ──
// Systerarka vert teikna to gonger: fyrst dempa under det aktive arket (der
// dei stikk ut), så med multiply oppå, så strekane deira syner gjennom det
// kvite papiret på det aktive arket. Kvitt papir gjer ingenting i multiply,
// så det aktive arket står like klart. drawImage er GPU-akselerert, så to
// teikningar per ark kostar under eit millisekund.
function _teiknSysterBilete(alpha,op){
  const ark=synlegeSysterark().filter(f=>f.bgImg);
  if(!ark.length)return;
  ctx.save();ctx.globalAlpha=alpha;
  if(op)ctx.globalCompositeOperation=op;
  ark.forEach(_teiknArkBilete);
  ctx.restore();
}
// Sonene på systerarka: stipla og utan fyllfarge-identitet — dei kan ikkje
// redigerast herifrå, berre snappast mot. Namnet står så ein ser kva det er.
function _teiknSysterSoner(){
  const ss=systerSoner();
  if(!ss.length)return;
  ctx.save();
  ss.forEach(o=>{
    if(o.pts.length<3)return;
    ctx.beginPath();
    o.pts.forEach((p,i)=>{const sp=i2s(p.x,p.y);if(i)ctx.lineTo(sp.x,sp.y);else ctx.moveTo(sp.x,sp.y);});
    ctx.closePath();
    ctx.fillStyle='rgba(29,79,79,0.07)';ctx.fill();
    ctx.strokeStyle='rgba(29,79,79,0.55)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
  });
  ctx.font='600 10.5px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ss.forEach(o=>{
    if(o.pts.length<3)return;
    const mp=typeof flateMerkepunkt==='function'?flateMerkepunkt(o.pts):o.pts[0];
    if(!mp)return;
    const sp=i2s(mp.x,mp.y);
    ctx.fillStyle='rgba(29,79,79,0.7)';
    ctx.fillText(o.z.name+' · '+o.f.name,sp.x,sp.y);
  });
  ctx.restore();
}

function draw(){
  if(sideBySide)drawSideSnart();
  ctx.clearRect(0,0,cv.width,cv.height);

  // Vis/skjul dropzone basert på om det er eit bilete
  dropz.style.display=bgImg?'none':'flex';

  // Nord-sjekk: rotate canvas so north points up
  const nordRad = nordCheck ? -(globalNorth * Math.PI / 180) : 0;
  const cx2 = cv.width/2, cy2 = cv.height/2;

  ctx.save();
  if(nordCheck){
    // Dim overlay hint
    ctx.fillStyle='rgba(29,79,79,.08)';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.translate(cx2, cy2);
    ctx.rotate(nordRad);
    ctx.translate(-cx2, -cy2);
  }

  // Ingen fyllfarge her: lerretet er gjennomsiktig, så punktrutenettet på
  // #cwrap syner rundt arket (ei grå flate dekte det etter fyrste draw()).
  if(bgImg){
    // Ghost-overlay: vis nabeetasje UNDER, aktiv etasje OVER med redusert opacity
    // floorDxImg i biletpikslar → skjermoffset = floorDxImg * sc
    const _ao=_arkOffset();
    const afdx=_ao.x*sc,afdy=_ao.y*sc;
    const _ge=(ghostMode&&!iFasade())?ghostEtasje():null;
    if(_ge){
      // Steg 1: Teikn ghost-etasjen (naboetasjen) fullt synleg — alle arka hennar
      const _gArk=etasjeArk(_ge);
      _gArk.forEach(_teiknArkBilete);
      // Teikn ghost-soner med fyllt farge og stipla kontur
      _gArk.forEach(gf=>{
        gf.zones.forEach(gz=>{
          if(gz.pts.length<3||gz.skjult)return;
          ctx.beginPath();
          const gp0=i2sFloor(gz.pts[0].x,gz.pts[0].y,gf);ctx.moveTo(gp0.x,gp0.y);
          gz.pts.forEach((p,i)=>{if(i>0){const gp=i2sFloor(p.x,p.y,gf);ctx.lineTo(gp.x,gp.y);}});
          ctx.closePath();
          ctx.fillStyle='rgba(124,58,237,0.08)';ctx.fill();
          ctx.strokeStyle='rgba(124,58,237,0.5)';ctx.lineWidth=1.5;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
        });
      });
      // Steg 2: Aktiv etasje sitt bilete med 65% opacity over ghost
      _teiknSysterBilete(0.55);
      ctx.save();ctx.globalAlpha=0.65;
      ctx.drawImage(bgImg,offX+afdx,offY+afdy,bgImg.width*sc,bgImg.height*sc);
      ctx.restore();
      _teiknSysterBilete(0.35,'multiply');
    } else {
      // Normalt — full opacity
      _teiknSysterBilete(0.55);
      ctx.drawImage(bgImg,offX+afdx,offY+afdy,bgImg.width*sc,bgImg.height*sc);
      _teiknSysterBilete(0.35,'multiply');
    }
  } else {
    _teiknSysterBilete(0.55);   // ei blank delplan viser framleis resten av etasjen
  }
  _teiknSysterSoner();

  // Completed zones — fasadearket er eit reint oppmålingslag og har ingen
  zones.forEach((z,zi)=>{
    if(iFasade())return;
    if(z.pts.length<2||z.skjult)return;
    // Grupperte soner deler farge — bruk global indeks for konsistens
    const ci=zoneColorIdx(activeFloor,zi,z);
    ctx.beginPath();
    const p0=i2s(z.pts[0].x,z.pts[0].y);ctx.moveTo(p0.x,p0.y);
    z.pts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});
    ctx.closePath();ctx.fillStyle=FILLS[ci];ctx.fill();
    // Musa over kortet i sonelista: dobbel fylling og ein brei, mjuk kant under
    // veggstrekane, så sona er lett å finne i teikninga
    if(z===_kortHover&&_kortHoverSegs){
      // Musa over ei rad i Konstruksjonar: berre veggane i rada, breitt og
      // tydeleg, med prikkar i endane så ein kort vegg òg er lett å sjå
      ctx.save();ctx.strokeStyle=COLORS[ci];ctx.fillStyle=COLORS[ci];ctx.lineCap='round';ctx.setLineDash([]);
      _kortHoverSegs.segs.forEach(si=>{
        if(si<0||si>=z.pts.length)return;
        const a=i2s(z.pts[si].x,z.pts[si].y),b=i2s(z.pts[(si+1)%z.pts.length].x,z.pts[(si+1)%z.pts.length].y);
        ctx.globalAlpha=.5;ctx.lineWidth=12;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.9;
        [a,b].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});
      });
      ctx.restore();
    }else if(z===_kortHover){
      ctx.fill();
      ctx.save();ctx.strokeStyle=COLORS[ci];ctx.globalAlpha=.4;ctx.lineWidth=7;ctx.lineJoin='round';ctx.setLineDash([]);ctx.stroke();ctx.restore();
    }
    const isEditing=mode==='edit'&&editZoneIdx===zi;
    const sk_set=z.skillevegg||new Set();
    ensureZoneConnectionsMap(z);
    const zc_set=z.zoneConnections;
    const yvMerged_set=new Set((z.yvMergedGroups||[]).flatMap(g=>g.segs));
    for(let si=0;si<z.pts.length;si++){
      const sp1=i2s(z.pts[si].x,z.pts[si].y);
      const sp2=i2s(z.pts[(si+1)%z.pts.length].x,z.pts[(si+1)%z.pts.length].y);
      const segIsZC=zc_set.has(si);
      const segIsSK=!segIsZC&&sk_set.has(si);
      const segIsKJ=!segIsSK&&!segIsZC&&isKjellervegg(z,si);
      const segIsYvMerged=!segIsSK&&!segIsKJ&&!segIsZC&&yvMerged_set.has(si);
      ctx.beginPath();ctx.moveTo(sp1.x,sp1.y);ctx.lineTo(sp2.x,sp2.y);
      if(segIsZC){
        // Sonekobling — grøn farge
        ctx.strokeStyle='#10b981';ctx.lineWidth=isEditing?3:2.5;ctx.setLineDash([7,4]);
      } else if(segIsSK){
        ctx.strokeStyle='#d97706';ctx.lineWidth=isEditing?3:2.5;ctx.setLineDash([7,4]);
      } else if(segIsKJ){
        // Kjellervegg — tjukk jordfarga strek med tett prikkemønster
        ctx.strokeStyle='#8a6a3b';ctx.lineWidth=isEditing?4:3.5;ctx.setLineDash([2,3]);
      } else {
        ctx.strokeStyle=isEditing?COLORS[ci]:COLORS[ci]+'bb';ctx.lineWidth=isEditing?2.5:1.5;ctx.setLineDash([]);
      }
      ctx.stroke();
      if(segIsYvMerged){
        ctx.beginPath();ctx.moveTo(sp1.x,sp1.y);ctx.lineTo(sp2.x,sp2.y);
        ctx.strokeStyle='rgba(22,61,61,0.55)';ctx.lineWidth=isEditing?5:3.5;ctx.setLineDash([4,4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.setLineDash([]);

    // Vertex dots (only in edit mode for this zone)
    if(isEditing){
      z.pts.forEach(p=>{
        const pp=i2s(p.x,p.y);
        ctx.beginPath();ctx.arc(pp.x,pp.y,4,0,Math.PI*2);
        ctx.fillStyle='#0f1117';ctx.fill();ctx.strokeStyle=COLORS[ci];ctx.lineWidth=2;ctx.stroke();
      });
    }

    // Linked zone indicator — stipla teal outline for kopla soner
    if(z.groupId){
      const nLinked=floors.flatMap(fl=>fl.zones).filter(x=>x.groupId===z.groupId).length;
      if(nLinked>1){
        ctx.beginPath();
        const lp0=i2s(z.pts[0].x,z.pts[0].y);ctx.moveTo(lp0.x,lp0.y);
        z.pts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});
        ctx.closePath();
        ctx.strokeStyle='#7c3aed';ctx.lineWidth=2.5;ctx.setLineDash([8,4]);ctx.stroke();
        ctx.setLineDash([]);
        // Liten "kopla"-badge i hjørnet
        const fpx=i2s(z.pts[0].x,z.pts[0].y);
        const lbl='⇌'+nLinked;
        ctx.font='bold 10px Inter,sans-serif';
        const ltw=ctx.measureText(lbl).width+8;
        ctx.fillStyle='#ede9fe';ctx.beginPath();ctx.roundRect(fpx.x,fpx.y-14,ltw,14,3);ctx.fill();
        ctx.strokeStyle='#7c3aed';ctx.lineWidth=1;ctx.stroke();
        ctx.fillStyle='#5b21b6';ctx.textAlign='left';ctx.textBaseline='middle';
        ctx.fillText(lbl,fpx.x+4,fpx.y-7);
        ctx.setLineDash([]);
      }
    }

    // Centre label
    const cxI=z.pts.reduce((s,p)=>s+p.x,0)/z.pts.length;
    const cyI=z.pts.reduce((s,p)=>s+p.y,0)/z.pts.length;
    const cp=i2s(cxI,cyI);
    const area=getAreaM2(z);
    const areaTxt=area!==null?fmtM2(area):'';
    ctx.font='bold 12px Inter,sans-serif';
    const w1=ctx.measureText(z.name).width;
    ctx.font='10px Inter,sans-serif';
    const w2=ctx.measureText(areaTxt).width;
    const bw=Math.max(w1,w2)+14,bh=areaTxt?30:18;
    ctx.fillStyle='rgba(255,255,255,.90)';
    ctx.beginPath();ctx.roundRect(cp.x-bw/2,cp.y-bh/2,bw,bh,5);ctx.fill();
    ctx.font='bold 11px Inter,sans-serif';ctx.fillStyle=COLORS[ci];ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(z.name,cp.x,areaTxt?cp.y-7:cp.y);
    if(areaTxt){ctx.font='10px Inter,sans-serif';ctx.fillStyle='#4b5563';ctx.fillText(areaTxt,cp.x,cp.y+7);}

    // Facade labels — always show direction, metrics only when calibrated
    if(!isEditing){
      const segs=calcSegments(z.pts,getHoyde(z));
      if(segs){
        const labels=getFacadeLabels(z,segs);
        const sk=z.skillevegg||new Set();
        const zc=z.zoneConnections;
        const yvMergedSet=new Set((z.yvMergedGroups||[]).flatMap(g=>g.segs));
        // Namn på SK-samanslåinga, så ein ser på teikninga kva veggar som er eitt element
        const skMergedName=new Map();
        (z.skMergedGroups||[]).forEach(g=>g.segs.forEach(i=>skMergedName.set(i,g.name||'SK')));
        // Group zone connections by facingZoneIdx to track which is first
        // Only show label on lower-indexed zone of the pair
        const myZoneIdx=floors.flatMap(f=>f.zones).indexOf(z);
        const zcGroups=new Map();
        segs.forEach((seg,si)=>{
          if(zc.has(seg.idx)){
            const zcData=zc.get(seg.idx);
            const facing=zcData.facingZoneIdx;
            if(!zcGroups.has(facing))zcGroups.set(facing,[]);
            zcGroups.get(facing).push(seg.idx);
          }
        });
        const firstZcSegPerGroup=new Set();
        zcGroups.forEach((segs,facing)=>{
          // Only mark as "first" if this is the lower-indexed zone in the pair
          if(myZoneIdx<facing)firstZcSegPerGroup.add(segs[0]);
        });
        // Track first segment of each SK-merged group
        const firstSkSegPerGroup=new Set();
        (z.skMergedGroups||[]).forEach(g=>{if(g.segs.length>0)firstSkSegPerGroup.add(g.segs[0]);});

        segs.forEach((seg,si)=>{
          const isZC2=zc.has(seg.idx);
          const isSK2=!isZC2&&sk.has(seg.idx);
          const isKJ2=!isSK2&&!isZC2&&isKjellervegg(z,seg.idx);
          const isMergedYv=!isSK2&&!isKJ2&&!isZC2&&yvMergedSet.has(seg.idx);
          const nm=labels[si];
          const mp=i2s(seg.midImgX,seg.midImgY);
          const dx=seg.midImgX-cxI,dy=seg.midImgY-cyI;
          const dlen=Math.hypot(dx,dy)||1;
          const nx=mp.x+dx/dlen*16,ny=mp.y+dy/dlen*16;
          const wins=(z.windows||[]).filter(w=>w.segIdx===seg.idx);
          const winNote=wins.length?` [${wins.length}×▭]`:'';
          const skMName=isSK2&&!isZC2&&firstSkSegPerGroup.has(seg.idx)?skMergedName.get(seg.idx):null;  // Vis SK-namn berre på fyrste segment
          // Vis "Sonekobling" berre på første segment i gruppa, elles ingenting
          const zcName=isZC2&&firstZcSegPerGroup.has(seg.idx)?'Sonekobling':'';
          const labelTxt=isZC2&&!firstZcSegPerGroup.has(seg.idx)?'' // Sonekobling-segment unntatt første får ingen merkelapps
            :(isSK2&&!firstSkSegPerGroup.has(seg.idx))?''  // SK-merged segment unntatt første får ingen merkelapps
            :(isMergedYv?'⊞ ':'')+(zcName?'⊙ '+zcName+' · ':(skMName?'⊞ '+skMName+' · ':''))+(isKJ2?'⛰ ':'')+nm+winNote;
          if(labelTxt){  // Teikn berre viss merkelappen har tekst
            ctx.font='bold 9px Inter,sans-serif';
            const tw=ctx.measureText(labelTxt).width+10;
            ctx.fillStyle=isZC2?'#d1fae5':isSK2?'#fef3c7':isKJ2?'#f3ece0':isMergedYv?'#dbeafe':'rgba(255,255,255,.88)';
            ctx.beginPath();ctx.roundRect(nx-tw/2,ny-9,tw,17,3);ctx.fill();
            if(isZC2){ctx.strokeStyle='#10b981';ctx.lineWidth=1;ctx.stroke();}
            else if(isSK2){ctx.strokeStyle='#d97706';ctx.lineWidth=1;ctx.stroke();}
            else if(isKJ2){ctx.strokeStyle='#8a6a3b';ctx.lineWidth=1;ctx.stroke();}
            else if(isMergedYv){ctx.strokeStyle='#3b82f6';ctx.lineWidth=1;ctx.stroke();}
            ctx.fillStyle=isZC2?'#047857':isSK2?'#92400e':isKJ2?'#5f4520':isMergedYv?'#1e40af':COLORS[ci];ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(labelTxt,nx,ny);
          }
        });
      }
    }

    // Edit mode: midpoint handles + drag handles
    if(isEditing){
      for(let i=0;i<z.pts.length;i++){
        const p1=z.pts[i],p2=z.pts[(i+1)%z.pts.length];
        const mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;
        const mp=i2s(mx,my);
        // Lys knapp med strekt pluss — skil seg frå dei mørke hjørna,
        // så det er tydeleg at klikk her legg til eit punkt
        ctx.beginPath();ctx.arc(mp.x,mp.y,7,0,Math.PI*2);
        ctx.fillStyle='#ffffff';ctx.fill();
        ctx.strokeStyle=COLORS[ci];ctx.lineWidth=1.5;ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mp.x-3.5,mp.y);ctx.lineTo(mp.x+3.5,mp.y);
        ctx.moveTo(mp.x,mp.y-3.5);ctx.lineTo(mp.x,mp.y+3.5);
        ctx.strokeStyle=COLORS[ci];ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';
      }
      z.pts.forEach((p,pi)=>{
        const pp=i2s(p.x,p.y);
        const active=dragCorner&&dragCorner.zoneIdx===zi&&dragCorner.ptIdx===pi;
        ctx.beginPath();ctx.arc(pp.x,pp.y,active?8:6,0,Math.PI*2);
        ctx.fillStyle=active?COLORS[ci]:'#0f1117';ctx.fill();
        ctx.strokeStyle=COLORS[ci];ctx.lineWidth=2;ctx.stroke();
      });
    }

    // Draw windows/doors on zone
    // Ei gruppe (antal>1) vert teikna som antal stykk — kvar med si eiga
    // plassering, og kvar for seg å ta tak i. Sjå winCentres/winSpansPx.
    const _winSpennAlle=[];   // alle stk i sona, til overlappsmarkeringa under
    (z.windows||[]).forEach((w,wi)=>{
      const seg=calcSegments(z.pts)?.[w.segIdx];
      if(!seg)return;
      const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
      const segLen=Math.hypot(dx,dy);
      if(segLen<1)return;
      const ux=dx/segLen,uy=dy/segLen;
      const perp={x:-uy,y:ux};
      const psx=perp.x*sc,psy=perp.y*sc;
      const plen=Math.hypot(psx,psy)||1;
      const baseColor=w.type==='dor'?'#f59e0b':'#06b6d4';
      const nStk=winCount(w);
      // Bruk breddeMm for visuell breidde (uavhengig av segmentlengd)
      const spans=winSpansPx(w,segLen,mmPerImgPx);
      // Samanlikn soneindeksen (zi), ikkje fargeindeksen (ci) — dei er berre
      // like på første etasje utan kopla soner
      const isSameW=hoveredWin&&hoveredWin.wi===wi&&hoveredWin.zi===zi&&hoveredWin.fli===activeFloor;
      let merkt=false;
      spans.forEach(sp=>_winSpennAlle.push({segIdx:w.segIdx,t0:sp.t0,t1:sp.t1,dor:w.type==='dor',seg,segLen,ux,uy}));
      spans.forEach((sp,k)=>{
        const s0i={x:seg.p1.x+ux*sp.t0*segLen,y:seg.p1.y+uy*sp.t0*segLen};
        const s1i={x:seg.p1.x+ux*sp.t1*segLen,y:seg.p1.y+uy*sp.t1*segLen};
        const s0=i2s(s0i.x,s0i.y),s1=i2s(s1i.x,s1i.y);
        const isHov=isSameW&&hoveredWin.inst===k;
        const isDrag=dragWin&&dragWin.w===w&&dragWin.inst===k;
        // Dei andre stykka i same gruppa får ein svak glød, så ein ser kva
        // som heng saman med det stykket musa er på. Berre visning.
        const isGrp=nStk>1&&!isHov&&!isDrag&&(isSameW||(dragWin&&dragWin.w===w));
        const newFade=winNyFade(w,k);
        const mx=(s0.x+s1.x)/2,my=(s0.y+s1.y)/2;
        // Oransje gløw for nye vindauge (fade ut på 1.5 sekunder)
        if(newFade>0){
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=`rgba(249,115,22,${0.15*newFade})`;
          ctx.lineWidth=18;ctx.stroke();
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=`rgba(249,115,22,${0.55*newFade})`;
          ctx.lineWidth=13;ctx.stroke();
        }
        // Highlight glow — outer ring
        if(isHov||isDrag){
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=isDrag?'rgba(29,79,79,.15)':w.type==='dor'?'rgba(245,158,11,.12)':'rgba(6,182,212,.12)';
          ctx.lineWidth=18;ctx.stroke();
          // Inner glow — brighter
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=isDrag?'rgba(29,79,79,.6)':w.type==='dor'?'rgba(245,158,11,.55)':'rgba(6,182,212,.55)';
          ctx.lineWidth=13;ctx.stroke();
        } else if(isGrp){
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=w.type==='dor'?'rgba(245,158,11,.22)':'rgba(6,182,212,.22)';
          ctx.lineWidth=10;ctx.stroke();
        }
        ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
        ctx.strokeStyle=(isHov||isDrag)?'#fff':baseColor;
        ctx.lineWidth=(isHov||isDrag)?5:3.5;ctx.stroke();
        if(isHov||isDrag){
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle=isDrag?'#1d4f4f':baseColor;ctx.lineWidth=2.5;ctx.stroke();
        }
        if(!(isHov||isDrag))return;
        // Merkelapp på den stk musa er på — gruppelappen står under
        merkt=true;
        const lx=mx+psx/plen*12,ly=my+psy/plen*12;
        const _cl=(w.name||(w.type==='dor'?'D':'V'))+(nStk>1?' '+(k+1)+'/'+nStk:'');
        ctx.font='bold 9px Inter,sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        const tw=ctx.measureText(_cl).width+10;
        ctx.fillStyle='rgba(255,255,255,.92)';
        ctx.beginPath();ctx.roundRect(lx-tw/2,ly-8,tw,16,4);ctx.fill();
        ctx.fillStyle=isDrag?'#1d4f4f':baseColor;
        ctx.fillText(_cl,lx,ly);
        if(isDrag){
          // Show position while dragging
          const segLenM=dragWin.seg.lenM;
          const posLbl=segLenM?(sp.t0*segLenM).toFixed(2)+'m → '+(sp.t1*segLenM).toFixed(2)+'m':(sp.t0*100).toFixed(0)+'%';
          ctx.font='bold 9px Inter,sans-serif';
          ctx.fillStyle='#1d4f4f';
          ctx.fillText(posLbl,lx,ly+14);
        } else {
          ctx.font='8px Inter,sans-serif';
          ctx.fillStyle='rgba(100,116,139,.8)';
          ctx.fillText(nStk>1?'Drag for å flytte denne · høgreklikk for meny':'Drag for å flytte · høgreklikk for meny',lx,ly+14);
        }
      });
      // Gruppelappen står ved det stykket brukaren teikna (winLappStk), ikkje
      // midt i rekkja — på ein lang vegg hamna han elles langt frå der ein
      // nettopp klikka. Berre når ingen enkelt stk er markert.
      if(!merkt&&spans.length){
        const sp=spans[winLappStk(w,spans)]||spans[0];
        const m=i2s(seg.p1.x+ux*(sp.t0+sp.t1)/2*segLen,seg.p1.y+uy*(sp.t0+sp.t1)/2*segLen);
        const lx=m.x+psx/plen*12,ly=m.y+psy/plen*12;
        ctx.font='9px Inter,sans-serif';
        ctx.fillStyle=baseColor;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText((w.name||(w.type==='dor'?'D':'V'))+(nStk>1?'×'+nStk:''),lx,ly);
      }
    });
    // Overlappande vindauge/dører på same vegg: overlappsbiten vert teikna i
    // ein mørkare tone oppå, så ein ser han med ein gong. Både stk i same
    // gruppe og ulike element tel — begge gir eit energimerke med meir glas
    // enn det er plass til på veggen. Berre visning; tala vert ikkje endra.
    for(let a=0;a<_winSpennAlle.length;a++){
      const A=_winSpennAlle[a];
      for(let b=a+1;b<_winSpennAlle.length;b++){
        const B=_winSpennAlle[b];
        if(A.segIdx!==B.segIdx)continue;
        const o0=Math.max(A.t0,B.t0),o1=Math.min(A.t1,B.t1);
        if((o1-o0)*A.segLen<0.5)continue;   // berre kant-i-kant
        const p0=i2s(A.seg.p1.x+A.ux*o0*A.segLen,A.seg.p1.y+A.uy*o0*A.segLen);
        const p1=i2s(A.seg.p1.x+A.ux*o1*A.segLen,A.seg.p1.y+A.uy*o1*A.segLen);
        ctx.save();
        ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);
        ctx.strokeStyle=(A.dor&&B.dor)?'#92400e':(!A.dor&&!B.dor)?'#0e4f5c':'#3f3f46';
        ctx.lineWidth=5;ctx.lineCap='butt';ctx.stroke();
        ctx.restore();
      }
    }

    // Flate-overlay på canvas — tak eller golv, aldri begge samstundes.
    // Varm palett for taket, kald for golvet, så det aldri er tvil om kva
    // ein ser når ein har delt opp begge.
    const FL_PAL=flateLag==='gulv'
      ?['#0ea5e9','#8b5cf6','#10b981','#f43f5e','#3b82f6','#a855f7']
      :['#f59e0b','#6366f1','#ec4899','#22c55e','#f97316','#14b8a6'];
    const _hex2rgba=(h,a)=>`rgba(${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)},${a})`;
    const RDLBL=['N','NØ','Ø','SØ','S','SV','V','NV'];
    flateListe(z,flateLag).forEach((fl,fli)=>{
      if((fl.pts||[]).length<3)return;
      const isActive=flateLag==='tak'&&mode==='tegn-takflate'&&activeTakflateZone===z;
      const sc2=FL_PAL[fli%FL_PAL.length];
      // Fyllet brukar heile ringen — nonzero winding gjer at eit nøkkelhòl
      // står tomt av seg sjølv
      ctx.beginPath();
      const tp0=i2s(fl.pts[0].x,fl.pts[0].y);ctx.moveTo(tp0.x,tp0.y);
      fl.pts.slice(1).forEach(p=>{const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);});
      ctx.closePath();
      ctx.fillStyle=_hex2rgba(sc2,0.24);ctx.fill();
      // Konturen hoppar over brua, som ikkje finst i bygget
      const kon=flateKonturar(fl.pts);
      ctx.beginPath();
      kon.deler.forEach(del=>{
        const d0=i2s(del[0].x,del[0].y);ctx.moveTo(d0.x,d0.y);
        del.slice(1).forEach(p=>{const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);});
        if(kon.lukka)ctx.closePath();
      });
      ctx.strokeStyle=isActive?'#fff':sc2;ctx.lineWidth=isActive?2.5:1.8;
      ctx.setLineDash(flateLag==='gulv'?[2,3]:[5,3]);ctx.stroke();ctx.setLineDash([]);
      // Merkelapp: namn + type (og vinkel/retning på eit skrått tak)
      const mp=flateMerkepunkt(fl.pts);
      const tcp=i2s(mp.x,mp.y);
      const ftype=flateType(z,flateLag,fl);
      let tlbl=(fl.name||FLATE[flateLag].lbl)+' · ';
      if(flateLag==='tak'&&ftype==='Tak'){
        tlbl+=(fl.vinkel||0)+'° '+RDLBL[Math.round(((fl.retning||0)+360)%360/45)%8];
      } else tlbl+=flateTypeKort(ftype);
      ctx.font='bold 9px Inter,sans-serif';
      const tw2=ctx.measureText(tlbl).width+8;
      ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.roundRect(tcp.x-tw2/2,tcp.y-8,tw2,16,3);ctx.fill();
      ctx.strokeStyle=sc2;ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=sc2;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(tlbl,tcp.x,tcp.y);
    });
  });

  // Draft zones — KI-forslaget: farge etter kategori, så ein ser kva som høyrer
  // saman. Valt = heil, tjukk strek. Førehandsvising av «Same kategori» =
  // svart stipla kant og lapp. Nettopp slegen saman = kort blink.
  draftZones.forEach(z=>{
    if(z.pts.length<2)return;
    const _f=(typeof kiKatFarge==='function')?kiKatFarge(z.bruk):'#d97706';
    const _ph=typeof kiParHover!=='undefined'&&kiParHover&&(kiParHover.a===z||kiParHover.b===z);
    const _dv=z._valt,_dh=z._hover||_ph,_fh=z._forhand!=null;
    const _bl=z._blink?Math.max(0,1-(performance.now()-z._blink)/1600):0;
    const sti=()=>{ctx.beginPath();const p0=i2s(z.pts[0].x,z.pts[0].y);ctx.moveTo(p0.x,p0.y);
      z.pts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});ctx.closePath();};
    sti();
    ctx.globalAlpha=_dv||_dh||_fh?0.32:0.16;ctx.fillStyle=_f;ctx.fill();ctx.globalAlpha=1;
    if(_bl>0){ctx.strokeStyle='rgba(16,185,129,'+(0.9*_bl)+')';ctx.lineWidth=10;ctx.stroke();}
    if(_fh){ctx.strokeStyle='#111827';ctx.lineWidth=3.5;ctx.setLineDash([10,5]);ctx.stroke();ctx.setLineDash([]);}
    ctx.strokeStyle=_f;ctx.lineWidth=_dv?4:_dh?3:2;
    if(!_dv)ctx.setLineDash([8,4]);
    ctx.stroke();ctx.setLineDash([]);
    z.pts.forEach(p=>{
      const pp=i2s(p.x,p.y);
      ctx.beginPath();ctx.arc(pp.x,pp.y,_dv?5:4,0,Math.PI*2);
      ctx.fillStyle=_f;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    });
    const mp=(typeof flateMerkepunkt==='function')?flateMerkepunkt(z.pts):{
      x:z.pts.reduce((s,p)=>s+p.x,0)/z.pts.length,y:z.pts.reduce((s,p)=>s+p.y,0)/z.pts.length};
    const cpD=i2s(mp.x,mp.y);
    const l1=(_dv?'✓ ':'')+z.name,l2=(z.bruk&&z.bruk!=='Ukjend'?z.bruk:'ukjend kategori')
      +(z.byggeaar?' · '+z.byggeaar:'')+(_fh?' · vert slegen saman':'');
    ctx.font='bold 12px Inter,sans-serif';
    const tw=Math.max(ctx.measureText(l1).width,(ctx.font='11px Inter,sans-serif',ctx.measureText(l2).width))+14;
    ctx.fillStyle='rgba(255,255,255,.93)';ctx.beginPath();ctx.roundRect(cpD.x-tw/2,cpD.y-17,tw,34,6);ctx.fill();
    ctx.strokeStyle=_f;ctx.lineWidth=_dv?2:1;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 12px Inter,sans-serif';ctx.fillStyle='#111827';ctx.fillText(l1,cpD.x,cpD.y-7);
    ctx.font='11px Inter,sans-serif';ctx.fillStyle=_fh?'#111827':_f;ctx.fillText(l2,cpD.x,cpD.y+8);
  });
  // Musa over ⊕ på ein felles vegg: vis sona slik ho vert etter samanslåinga
  if(draftZones.length&&typeof kiParHover!=='undefined'&&kiParHover){
    const p=kiParHover.pts;
    ctx.beginPath();p.forEach((q,i)=>{const s=i2s(q.x,q.y);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y);});ctx.closePath();
    ctx.fillStyle='rgba(5,150,105,.18)';ctx.fill();
    ctx.strokeStyle='#059669';ctx.lineWidth=4;ctx.setLineDash([12,6]);ctx.stroke();ctx.setLineDash([]);
  }
  // Berre når det finst eit forslag (eller knappar å rydde) — KI-koden og
  // globalane hennar er ikkje initialiserte når draw() går under oppstarten
  teiknOverlapp();
  if(draftZones.length||(document.getElementById('kiHandtak')||{}).childElementCount)kiPlasserHandtak();

  // KI-forslag til vindauge og dører (sjå «2e. KI-oppteikning»)
  if(viewMode==='plan')kiDraftWins.forEach(d=>(d.spans||[d]).forEach((sp,si)=>{
    if(!zones.includes(d.z))return;
    const a=d.z.pts[d.segIdx],b=d.z.pts[(d.segIdx+1)%d.z.pts.length];
    if(!a||!b)return;
    const q0=i2s(a.x+(b.x-a.x)*sp.t0,a.y+(b.y-a.y)*sp.t0);
    const q1=i2s(a.x+(b.x-a.x)*sp.t1,a.y+(b.y-a.y)*sp.t1);
    ctx.beginPath();ctx.moveTo(q0.x,q0.y);ctx.lineTo(q1.x,q1.y);
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=9;ctx.lineCap='butt';ctx.stroke();
    ctx.strokeStyle=d.type==='dor'?'#7c3aed':'#d97706';ctx.lineWidth=5;
    if(d.type==='dor')ctx.setLineDash([6,3]);
    ctx.stroke();ctx.setLineDash([]);
    const mx=(q0.x+q1.x)/2,my=(q0.y+q1.y)/2;
    ctx.font='bold 10px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    if(si)return;   // lappen éin gong per gruppe, ved fyrste stk
    const lbl=(d.berreFasade?'◇':'')+(d.type==='dor'?'D ':'V ')+(d.breddeMm/1000).toFixed(1)+((d.antal||1)>1?' ×'+d.antal:'');
    const tw=ctx.measureText(lbl).width+6;
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(mx-tw/2,my-17,tw,13);
    ctx.fillStyle=d.type==='dor'?'#5b21b6':'#92400e';ctx.fillText(lbl,mx,my-10);
  }));

  // Current polygon being drawn
  if(curPts.length>0&&mode==='draw'){
    ctx.beginPath();
    const p0c=i2s(curPts[0].x,curPts[0].y);ctx.moveTo(p0c.x,p0c.y);
    curPts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});
    // Use snapped position as line endpoint if snap available
    const snapTarget=drawSnap?i2s(drawSnap.x,drawSnap.y):null;
    const lineEndX=snapTarget?snapTarget.x:(mouse?mouse.x:null);
    const lineEndY=snapTarget?snapTarget.y:(mouse?mouse.y:null);
    if(lineEndX!==null)ctx.lineTo(lineEndX,lineEndY);
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    // Ortho-indikator (Shift halden)
    if(shiftHeld&&curPts.length>0&&lineEndX!==null){
      ctx.font='bold 10px Inter,sans-serif';
      ctx.fillStyle='rgba(59,130,246,.9)';
      const _pv=i2s(curPts[curPts.length-1].x,curPts[curPts.length-1].y);
      const _sa=orthoSnapAngle(lineEndX,lineEndY,_pv);
      const lbl=(_sa!=null?_sa:0)+'°';
      const tw=ctx.measureText(lbl).width+8;
      ctx.beginPath();ctx.roundRect(lineEndX+8,lineEndY-9,tw,16,3);ctx.fill();
      ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(lbl,lineEndX+12,lineEndY);
    }
    // Live area
    if(curPts.length>=2&&mouse&&mmPerImgPx){
      const testPt=drawSnap?{x:drawSnap.x,y:drawSnap.y}:s2i(mouse.x,mouse.y);
      const a=calcAreaM2([...curPts,testPt]);
      if(a){
        const lx=lineEndX!=null?lineEndX:mouse.x,ly=lineEndY!=null?lineEndY:mouse.y;
        ctx.font='11px Inter,sans-serif';ctx.fillStyle='#3b82f6';ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText('~'+fmtM2(a),lx+10,ly+4);
      }
    }
    curPts.forEach((p,i)=>{
      const pp=i2s(p.x,p.y);
      ctx.beginPath();ctx.arc(pp.x,pp.y,i===0?7:4,0,Math.PI*2);
      ctx.fillStyle=i===0?'#1d4ed8':'#3b82f6';ctx.fill();
      if(i===0){ctx.strokeStyle='#f1f5f9';ctx.lineWidth=2;ctx.stroke();}
    });
  }
  // Snap-markør for soneteikning. MÅ liggje utanfor curPts-vakta over:
  // snappen verkar frå første klikk, men utan markør trur brukaren at han er av
  // heilt til det første punktet er sett.
  if(mode==='draw'&&drawSnap&&!drawSnap._ortho){
    drawSnapMarker(i2s(drawSnap.x,drawSnap.y),drawSnap.type,
      drawSnap.type==='imgcorner'?'rgb(219,39,119)':drawSnap.type==='edge'?'rgb(124,58,237)':'rgb(26,122,110)');
  }

  // Tegn-takflate: live polygon under teikning
  if(takflatePts.length>0&&mode==='tegn-takflate'){
    // Highlight aktiv sone
    if(activeTakflateZone&&activeTakflateZone.pts.length>=3){
      ctx.beginPath();
      const az0=i2s(activeTakflateZone.pts[0].x,activeTakflateZone.pts[0].y);ctx.moveTo(az0.x,az0.y);
      activeTakflateZone.pts.slice(1).forEach(p=>{const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);});
      ctx.closePath();ctx.strokeStyle='#f59e0b';ctx.lineWidth=2.5;ctx.setLineDash([8,4]);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.beginPath();
    const tfp0=i2s(takflatePts[0].x,takflatePts[0].y);ctx.moveTo(tfp0.x,tfp0.y);
    takflatePts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});
    const tfSnapTarget=drawSnap?i2s(drawSnap.x,drawSnap.y):null;
    const tfEndX=tfSnapTarget?tfSnapTarget.x:(mouse?mouse.x:null);
    const tfEndY=tfSnapTarget?tfSnapTarget.y:(mouse?mouse.y:null);
    if(tfEndX!==null)ctx.lineTo(tfEndX,tfEndY);
    ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    takflatePts.forEach((p,i)=>{
      const pp=i2s(p.x,p.y);
      ctx.beginPath();ctx.arc(pp.x,pp.y,i===0?7:4,0,Math.PI*2);
      ctx.fillStyle=i===0?'#b45309':'#f59e0b';ctx.fill();
      if(i===0){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}
    });
  }
  // Same som for soneteikning — markøren må stå frå første klikk.
  if(mode==='tegn-takflate'&&drawSnap&&!drawSnap._ortho){
    drawSnapMarker(i2s(drawSnap.x,drawSnap.y),drawSnap.type,
      drawSnap.type==='imgcorner'?'rgb(219,39,119)':drawSnap.type==='edge'?'rgb(124,58,237)':'rgb(217,119,6)');
  }

  // Window drawing mode
  if(mode==='window'){
    // Highlight all segments with a subtle glow to show they're clickable
    if(winPts.length===0){
      zones.forEach((z,zi)=>{
        if(z.skjult)return;
        const segs=calcSegments(z.pts)||[];
        segs.forEach(seg=>{
          const s0=i2s(seg.p1.x,seg.p1.y),s1=i2s(seg.p2.x,seg.p2.y);
          ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s1.x,s1.y);
          ctx.strokeStyle='rgba(6,182,212,.25)';ctx.lineWidth=6;ctx.stroke();
        });
      });
    }
    // Snap indicator: crosshair on nearest segment point
    const preview=mouse?snapScreenToSegment(mouse.x,mouse.y):winSnapPreview;
    if(preview&&preview.snap){
      ctx.beginPath();ctx.arc(preview.x,preview.y,6,0,Math.PI*2);
      ctx.strokeStyle='#0891b2';ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(preview.x-9,preview.y);ctx.lineTo(preview.x+9,preview.y);
      ctx.moveTo(preview.x,preview.y-9);ctx.lineTo(preview.x,preview.y+9);
      ctx.strokeStyle='#0891b2';ctx.lineWidth=1.5;ctx.stroke();
    }
    // First point placed — draw line from it to current snap
    if(winPts.length===1){
      // winPts held BILETkoordinatar — skjermposisjonen reknast på nytt kvar teikning,
      // slik at punktet blir liggjande på veggen sjølv om ein panorerer eller zoomar.
      const w0=i2s(winPts[0].ix,winPts[0].iy);
      const snap2=preview&&preview.snap?preview:null;
      const ex=snap2?snap2.x:mouse?mouse.x:w0.x;
      const ey=snap2?snap2.y:mouse?mouse.y:w0.y;
      // Draw along the segment direction if both points snap to same seg
      ctx.beginPath();ctx.moveTo(w0.x,w0.y);ctx.lineTo(ex,ey);
      ctx.strokeStyle='#0891b2';ctx.lineWidth=4;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';
      // Endpoint dots
      ctx.beginPath();ctx.arc(w0.x,w0.y,6,0,Math.PI*2);
      ctx.fillStyle='#0891b2';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
      if(snap2){
        ctx.beginPath();ctx.arc(ex,ey,6,0,Math.PI*2);
        ctx.fillStyle='#0891b2';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
      }
      // Live mm readout
      if(snap2&&mmPerImgPx){
        const p1i={x:winPts[0].ix,y:winPts[0].iy};
        const p2i={x:snap2.snap.cx,y:snap2.snap.cy};
        const distMm=Math.hypot(p2i.x-p1i.x,p2i.y-p1i.y)*mmPerImgPx;
        const lbl=Math.round(distMm)+' mm';
        ctx.font='bold 12px Inter,sans-serif';
        const tw=ctx.measureText(lbl).width+14;
        ctx.fillStyle='rgba(8,145,178,.9)';ctx.beginPath();ctx.roundRect((w0.x+ex)/2-tw/2,(w0.y+ey)/2-13,tw,20,4);ctx.fill();
        ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(lbl,(w0.x+ex)/2,(w0.y+ey)/2);
      }
    }
  }

  // Calibration area polygon
  if(mode==='calibrate'&&calMode==='area'&&calPts.length>0){
    ctx.beginPath();
    const cap0=i2s(calPts[0].x,calPts[0].y);ctx.moveTo(cap0.x,cap0.y);
    calPts.forEach((p,i)=>{if(i>0){const pp=i2s(p.x,p.y);ctx.lineTo(pp.x,pp.y);}});
    // For polygon mode: show live edge to mouse
    if(calPts.length<3||(pendingCalAreaPx2===0)){
      const _alsr=calSnap?i2s(calSnap.x,calSnap.y):null;
      if(_alsr){ctx.lineTo(_alsr.x,_alsr.y);}else if(mouse){ctx.lineTo(mouse.x,mouse.y);}
    }
    ctx.closePath();
    ctx.fillStyle='rgba(99,102,241,0.15)';ctx.fill();
    ctx.strokeStyle='#6366f1';ctx.lineWidth=2.5;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);
    // Senter-label
    const mx=calPts.reduce((s,p)=>s+i2s(p.x,p.y).x,0)/calPts.length;
    const my=calPts.reduce((s,p)=>s+i2s(p.x,p.y).y,0)/calPts.length;
    ctx.font='bold 11px Inter,sans-serif';
    const lbl='Valt areal';
    const tw=ctx.measureText(lbl).width+12;
    ctx.fillStyle='rgba(99,102,241,0.88)';ctx.beginPath();ctx.roundRect(mx-tw/2,my-9,tw,18,4);ctx.fill();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,mx,my);
    // Punktar berre for polygon-modus
    if(pendingCalAreaPx2===0){
      calPts.forEach((p,i)=>{
        const pp=i2s(p.x,p.y);
        ctx.beginPath();ctx.arc(pp.x,pp.y,i===0?6:4,0,Math.PI*2);
        ctx.fillStyle='#6366f1';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      });
    }
  }

  // Calibration line
  if(mode==='calibrate'&&calMode==='length'&&calPts.length>0){
    // calPts er biletkoordinatar — konverter til skjerm for teikning
    const _cp0=i2s(calPts[0].x,calPts[0].y);
    const _cp1=calPts.length===2?i2s(calPts[1].x,calPts[1].y):null;
    const _csr=calSnap&&calPts.length<2&&!calSnap._ortho?i2s(calSnap.x,calSnap.y):null;
    // Ortho: bruk calSnap om det er _ortho, elles vanleg
    const _ort=calSnap&&calSnap._ortho&&calPts.length<2?i2s(calSnap.x,calSnap.y):null;
    const ex=_cp1?_cp1.x:(_ort?_ort.x:_csr?_csr.x:mouse?mouse.x:_cp0.x);
    const ey=_cp1?_cp1.y:(_ort?_ort.y:_csr?_csr.y:mouse?mouse.y:_cp0.y);
    ctx.beginPath();ctx.moveTo(_cp0.x,_cp0.y);ctx.lineTo(ex,ey);
    ctx.strokeStyle='#f59e0b';ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
    [_cp0,...(_cp1?[_cp1]:[])].forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);
      ctx.fillStyle='#d97706';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    });
    if(mouse&&calPts.length===1){
      const d=Math.hypot(ex-_cp0.x,ey-_cp0.y);
      const imgD=(d/sc).toFixed(0);
      const est=mmPerImgPx?(imgD*mmPerImgPx/1000).toFixed(2)+' m':'';
      const _csa=shiftHeld?orthoSnapAngle(ex,ey,_cp0):null;
      const lbl=(_csa!=null?_csa+'° · ':'')+imgD+' px'+(est?' ≈ '+est:'');
      ctx.font='11px Inter,sans-serif';const tw=ctx.measureText(lbl).width+12;
      ctx.fillStyle='rgba(217,119,6,.9)';ctx.beginPath();ctx.roundRect(ex+8,ey-11,tw,18,4);ctx.fill();
      ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(lbl,ex+14,ey);
    }
  }
  // Snap-markør for kalibrering — også før første klikk.
  if(mode==='calibrate'&&calMode==='length'&&calSnap&&calPts.length<2&&!calSnap._ortho){
    drawSnapMarker(i2s(calSnap.x,calSnap.y),calSnap.type,
      calSnap.type==='imgcorner'?'rgb(219,39,119)':calSnap.type==='edge'?'rgb(184,106,10)':'rgb(217,119,6)');
  }

  if(mode==='rett-ut')_teiknRettUt();

  // ── Måleverktøy ─────────────────────────────────────────────
  if(mode==='measure'||(showMeasurements&&measureResults.length>0)){
    if(showMeasurements)measureResults.forEach((m,mi)=>{
      const s1=i2s(m.p1.x,m.p1.y),s2=i2s(m.p2.x,m.p2.y);
      const dMm=measureLenMm(m);
      const hot=!!(hoveredMeasure&&hoveredMeasure.idx===mi);
      drawDimension(s1,s2,dMm!=null?fmtMaal(dMm):'',{color:hot?'#991b1b':'#dc2626',hot});
    });
    if(mode==='measure'&&measurePts.length>0){
      const sp0=i2s(measurePts[0].x,measurePts[0].y);
      // Bruk det Shift-låste punktet om det finst, elles musa
      const _ms=measureSnap?i2s(measureSnap.x,measureSnap.y):null;
      const ex=_ms?_ms.x:(mouse?mouse.x:sp0.x),ey=_ms?_ms.y:(mouse?mouse.y:sp0.y);
      ctx.beginPath();ctx.moveTo(sp0.x,sp0.y);ctx.lineTo(ex,ey);
      ctx.strokeStyle='#dc2626';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(sp0.x,sp0.y,5,0,Math.PI*2);ctx.fillStyle='#dc2626';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      if(mouse&&mmPerImgPx){
        const dPx=Math.hypot((ex-sp0.x)/sc,(ey-sp0.y)/sc);
        const dMm=dPx*mmPerImgPx;
        const _msa=shiftHeld?orthoSnapAngle(ex,ey,sp0):null;
        const lbl=(_msa!=null?_msa+'° · ':'')+fmtMaal(dMm);
        ctx.font='bold 12px Inter,sans-serif';
        const tw=ctx.measureText(lbl).width+14;
        ctx.fillStyle='rgba(220,38,38,0.92)';ctx.beginPath();ctx.roundRect(ex+10,ey-12,tw,20,5);ctx.fill();
        ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(lbl,ex+17,ey);
      }
    }
    // Snap-markør — også før første klikk
    if(mode==='measure'&&measureGeoSnap){
      drawSnapMarker(i2s(measureGeoSnap.x,measureGeoSnap.y),measureGeoSnap.type,
        measureGeoSnap.type==='imgcorner'?'rgb(219,39,119)':measureGeoSnap.type==='edge'?'rgb(153,27,27)':'rgb(220,38,38)');
    }
  }

  // Klippeverktøy — forhåndsvisning (polylinje)
  if(mode==='klipp-takflate'){
    // Marker mål-takflata
    if(klippTakflateTarget){
      const{z:kz,tfi:ktfi}=klippTakflateTarget;
      const ktf=flateListe(kz,klippTakflateTarget.kind||'tak')[ktfi];
      if(ktf&&ktf.pts.length>=3){
        ctx.beginPath();
        const kp0=i2s(ktf.pts[0].x,ktf.pts[0].y);ctx.moveTo(kp0.x,kp0.y);
        ktf.pts.forEach((p,i)=>{if(i>0){const kp=i2s(p.x,p.y);ctx.lineTo(kp.x,kp.y);}});
        ctx.closePath();
        ctx.fillStyle='rgba(239,68,68,0.10)';ctx.fill();
        ctx.strokeStyle='#ef4444';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);
      }
    }
    // Snap-indikator
    if(klippSnap){
      const ksp=i2s(klippSnap.x,klippSnap.y);
      ctx.save();
      if(klippSnap.type==='lukk'){
        // Ring rundt startpunktet: klikk her lukkar sløyfa
        ctx.beginPath();ctx.arc(ksp.x,ksp.y,10,0,Math.PI*2);
        ctx.strokeStyle='#22c55e';ctx.lineWidth=2.5;ctx.stroke();
        ctx.fillStyle='rgba(34,197,94,0.18)';ctx.fill();
      } else if(klippSnap.type==='corner'||klippSnap.type==='zone'){
        // Grønt kvadrat for hjørner
        ctx.strokeStyle='#22c55e';ctx.lineWidth=2;ctx.strokeRect(ksp.x-7,ksp.y-7,14,14);
        ctx.fillStyle='rgba(34,197,94,0.15)';ctx.fillRect(ksp.x-7,ksp.y-7,14,14);
      } else {
        // Grønt diamant for kantmidtpunkt
        ctx.beginPath();
        ctx.moveTo(ksp.x,ksp.y-8);ctx.lineTo(ksp.x+8,ksp.y);ctx.lineTo(ksp.x,ksp.y+8);ctx.lineTo(ksp.x-8,ksp.y);ctx.closePath();
        ctx.strokeStyle='#22c55e';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='rgba(34,197,94,0.15)';ctx.fill();
      }
      ctx.restore();
    }
    if(klippTakflatePts.length>0){
      // Teikn eksisterande polylinje
      ctx.beginPath();
      const sp0=i2s(klippTakflatePts[0].x,klippTakflatePts[0].y);ctx.moveTo(sp0.x,sp0.y);
      klippTakflatePts.forEach((p,i)=>{if(i>0){const sp=i2s(p.x,p.y);ctx.lineTo(sp.x,sp.y);}});
      // Live segment — snap-punkt eller mus
      const liveEnd=klippSnap?i2s(klippSnap.x,klippSnap.y):(mouse||null);
      const lukkar=klippSnap&&klippSnap.type==='lukk'&&klippTakflatePts.length>=3;
      if(liveEnd)ctx.lineTo(liveEnd.x,liveEnd.y);
      ctx.strokeStyle='#ef4444';ctx.lineWidth=2.5;ctx.stroke();
      // Peikar brukaren på startpunktet, vert biten som vert klippt ut fylt
      // — då ser ein kva som faktisk blir eit eige element
      if(lukkar){
        ctx.beginPath();ctx.moveTo(sp0.x,sp0.y);
        klippTakflatePts.forEach((pp,i)=>{if(i>0){const sp=i2s(pp.x,pp.y);ctx.lineTo(sp.x,sp.y);}});
        ctx.closePath();
        ctx.fillStyle='rgba(239,68,68,0.18)';ctx.fill();
      }
      // Forlengd retningslinje bak første segment og framfor siste
      if(klippTakflatePts.length===1&&liveEnd){
        const dx=liveEnd.x-sp0.x,dy=liveEnd.y-sp0.y,len=Math.hypot(dx,dy)||1;
        const ext=Math.max(cv.width,cv.height)*3;
        ctx.beginPath();
        ctx.moveTo(sp0.x-dx/len*ext,sp0.y-dy/len*ext);
        ctx.lineTo(liveEnd.x+dx/len*ext,liveEnd.y+dy/len*ext);
        ctx.strokeStyle='rgba(239,68,68,0.3)';ctx.lineWidth=1;ctx.setLineDash([8,5]);ctx.stroke();ctx.setLineDash([]);
      }
      // Punkt på polylinjen
      klippTakflatePts.forEach((p,i)=>{
        const sp=i2s(p.x,p.y);
        ctx.beginPath();ctx.arc(sp.x,sp.y,i===0?6:4,0,Math.PI*2);
        ctx.fillStyle=i===0?'#ef4444':'#fff';ctx.fill();
        ctx.strokeStyle='#ef4444';ctx.lineWidth=i===0?2:1.5;ctx.stroke();
      });
      // Hint om antal punkt
      if(klippTakflatePts.length>=2&&mouse){
        ctx.font='bold 10px Inter,sans-serif';
        ctx.fillStyle='rgba(239,68,68,0.9)';
        const lbl=(klippSnap&&klippSnap.type==='lukk')
          ?`Klikk for å klippe ut biten`
          :`${klippTakflatePts.length} pt · Enter for å klippe`;
        const tw=ctx.measureText(lbl).width+10;
        ctx.beginPath();ctx.roundRect(mouse.x+8,mouse.y-14,tw,16,4);ctx.fill();
        ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(lbl,mouse.x+13,mouse.y-6);
      }
    }
  }

  // ── Del sone — klippelinje gjennom ei sone ──────────────────
  if(mode==='del-sone'){
    if(delSoneTarget){
      const dz=delSoneTarget.z;
      if(dz&&dz.pts.length>=3){
        ctx.beginPath();
        const dp0=i2s(dz.pts[0].x,dz.pts[0].y);ctx.moveTo(dp0.x,dp0.y);
        dz.pts.forEach((p,i)=>{if(i>0){const dp=i2s(p.x,p.y);ctx.lineTo(dp.x,dp.y);}});
        ctx.closePath();
        ctx.fillStyle='rgba(124,58,237,0.10)';ctx.fill();
        ctx.strokeStyle='#7c3aed';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);
      }
    }
    if(delSoneSnap&&!delSoneSnap._ortho){
      drawSnapMarker(i2s(delSoneSnap.x,delSoneSnap.y),delSoneSnap.type,
        delSoneSnap.type==='imgcorner'?'rgb(219,39,119)':'rgb(124,58,237)');
    }
    if(delSonePts.length>0){
      ctx.beginPath();
      const s0=i2s(delSonePts[0].x,delSonePts[0].y);ctx.moveTo(s0.x,s0.y);
      delSonePts.forEach((p,i)=>{if(i>0){const sp=i2s(p.x,p.y);ctx.lineTo(sp.x,sp.y);}});
      const live=delSoneSnap?i2s(delSoneSnap.x,delSoneSnap.y):(mouse||null);
      if(live)ctx.lineTo(live.x,live.y);
      ctx.strokeStyle='#7c3aed';ctx.lineWidth=2.5;ctx.stroke();
      delSonePts.forEach((p,i)=>{
        const sp=i2s(p.x,p.y);
        ctx.beginPath();ctx.arc(sp.x,sp.y,i===0?6:4,0,Math.PI*2);
        ctx.fillStyle=i===0?'#7c3aed':'#fff';ctx.fill();
        ctx.strokeStyle='#7c3aed';ctx.lineWidth=i===0?2:1.5;ctx.stroke();
      });
      if(delSonePts.length>=2&&mouse){
        ctx.font='bold 10px Inter,sans-serif';
        ctx.fillStyle='rgba(124,58,237,0.9)';
        const lbl=delSonePts.length+' pt · Enter for å dele';
        const tw=ctx.measureText(lbl).width+10;
        ctx.beginPath();ctx.roundRect(mouse.x+8,mouse.y-14,tw,16,4);ctx.fill();
        ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(lbl,mouse.x+13,mouse.y-6);
      }
    }
  }

  if(mode==='plasser-ark')_teiknPlassering();

  drawCompass();

  ctx.restore(); // end nordCheck rotation transform

  // Nord-sjekk overlay: banner og N-merke
  if(nordCheck){
    const bw=178,bh=30,bx=(cv.width-bw)/2,by=14;
    ctx.fillStyle='rgba(29,79,79,.92)';
    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 12px Inter,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('⬆ Nord peikar opp',cv.width/2,by+bh/2);
    ctx.font='bold 20px Inter,sans-serif';ctx.fillStyle='rgba(29,79,79,.45)';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('N',cv.width/2,by+bh+6);
  }
}

