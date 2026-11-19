// ── 3. Pinch-to-zoom ─────────────────────────────────────────
(()=>{
  let lastDist=null;
  cwrap.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      lastDist=Math.hypot(
        e.touches[0].clientX-e.touches[1].clientX,
        e.touches[0].clientY-e.touches[1].clientY
      );
      e.preventDefault();
    }
  },{passive:false});
  cwrap.addEventListener('touchmove',e=>{
    if(e.touches.length===2&&lastDist){
      const dist=Math.hypot(
        e.touches[0].clientX-e.touches[1].clientX,
        e.touches[0].clientY-e.touches[1].clientY
      );
      const ratio=dist/lastDist;
      lastDist=dist;
      // Pinch centre in screen coords
      const r=cv.getBoundingClientRect();
      const cx=(e.touches[0].clientX+e.touches[1].clientX)/2-r.left;
      const cy=(e.touches[0].clientY+e.touches[1].clientY)/2-r.top;
      const newSc=Math.max(0.05,Math.min(50,sc*ratio));
      offX=cx-(cx-offX)*(newSc/sc);
      offY=cy-(cy-offY)*(newSc/sc);
      sc=newSc;
      saveFloorState();draw();
      e.preventDefault();
    }
  },{passive:false});
  cwrap.addEventListener('touchend',e=>{
    if(e.touches.length<2)lastDist=null;
  });
})();

(()=>{
  const helpBtn=document.getElementById('helpBtn');

  const overlay=document.createElement('div');
  overlay.style.cssText='display:none;position:fixed;inset:0;background:rgba(17,24,39,.5);z-index:700;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  overlay.innerHTML=`
  <div style="background:var(--surface);border-radius:14px;padding:28px 32px;width:460px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.18);max-height:85vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="font-size:15px;font-weight:700;color:var(--dm-t1,#111827)">Tastatursnarvegar</div>
      <button id="helpClose" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--dm-t3,#9ca3af);line-height:1">×</button>
    </div>
    ${[
      ['Generelt',''],
      ['Ctrl+Z / ⌘Z','Angre siste handling'],
      ['Ctrl+Y / Ctrl+Shift+Z','Gjere om'],
      ['Ctrl+S','Lagre prosjekt (på bygget i EntroPi)'],
      ['Ctrl+Shift+S','Last ned prosjektfila til maskina'],
      ['Ctrl+O','Opne prosjekt'],
      ['Esc','Avbryt / avslutt til navigeringsmodus'],
      ['?','Vis/skjul denne oversikta'],
      ['',''],
      ['Teikning av sone',''],
      ['Klikk','Legg til hjørne'],
      ['Shift + klikk','Lås til 90°/45° (vassrett, loddrett, diagonal)'],
      ['Dobbelklikk / klikk startpunkt','Fullfør sone'],
      ['Backspace / Delete','Fjern siste punkt'],
      ['',''],
      ['Kopiering',''],
      ['Ctrl+C over sone','Kopier sone'],
      ['Ctrl+C over vindauge/dør','Kopier vindauge/dør'],
      ['Ctrl+V over sone','Lim inn sone på aktiv etasje'],
      ['Ctrl+V over fasade','Lim inn vindauge/dør på fasaden'],
      ['Høgreklikk på fasade','Lim inn-meny (med noko i utklippstavla)'],
      ['Høgreklikk på etasjefane','Kopier etasje, eller hent ein frå eit anna prosjekt'],
      ['',''],
      ['Redigering av sone',''],
      ['Dra hjørne','Flytt hjørne'],
      ['Klikk midtpunkt','Legg til hjørne'],
      ['Høgreklikk hjørne','Slett hjørne'],
      ['',''],
      ['Vindauge og dører',''],
      ['Dra vindauge (navigeringsmodus)','Flytt vindauge langs fasaden'],
      ['Backspace / Delete over vindauge','Slett vindauge/dør'],
      ['',''],
      ['Kalibrering',''],
      ['Shift under teikning','Lås til 90°/45°'],
      ['Klikk på sone (arealmodus)','Bruk sona sitt areal til kalibrering'],
      ['Dobbelklikk / klikk startpunkt (arealmodus)','Fullfør polygon'],
      ['',''],
      ['Måleverktøy',''],
      ['Klikk start → klikk slutt','Mål avstand'],
      ['Esc','Avslutt og fjern målingar'],
      ['',''],
      ['Navigering',''],
      ['Scroll','Zoom inn/ut'],
      ['Klikk+dra','Flytt plantegning'],
      ['Høgreklikk sone','Kontekstmeny (rediger, kopier, slett…)'],
      ['',''],
      ['Fasadeteikningar',''],
      ['Plan / Fasade','Vekslar mellom planteikningane og fasadearka'],
      ['+ Fasade','Nytt fasadeark — eigen teikning og eigen skala'],
      ['Kalibrer','Kvart fasadeark har si eiga kalibrering'],
      ['Mål','Kontrollmål på arket — ingen soner, ingen verknad på SXI eller 3D'],
    ].map(([k,v])=>k===''?`<div style="height:8px"></div>`:v===''?
      `<div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;margin-top:4px">${k}</div>`:
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--dm-bd,#f3f4f6);font-size:12px;gap:12px">
        <span style="font-family:inherit;background:var(--dm-s2,#f3f4f6);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--dm-t2,#374151);white-space:nowrap">${k}</span>
        <span style="color:var(--dm-t2,#4b5563);text-align:right">${v}</span>
      </div>`
    ).join('')}
  </div>`;
  document.body.appendChild(overlay);

  helpBtn.onclick=()=>{overlay.style.display='flex';};
  document.getElementById('helpClose').onclick=()=>{overlay.style.display='none';};
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.style.display='none';});
  document.addEventListener('keydown',e=>{
    if(e.key==='?'&&!e.ctrlKey&&!e.metaKey&&
       e.target.tagName!=='INPUT'&&e.target.tagName!=='SELECT'&&e.target.tagName!=='TEXTAREA'){
      overlay.style.display=overlay.style.display==='flex'?'none':'flex';
    }
    if(e.key==='Escape'&&overlay.style.display==='flex'){overlay.style.display='none';}
  });
})();

// ── 5. Eksporter soneinndelinga som PDF — éi side per ark ─────
// Planen vert teikna av draw() sjølv, ikkje av ein eigen kopi av
// teiknekoden: cv/ctx/sc/offX/offY og etasjen vert mellombels peika på eit
// eige lerret, og alt anna (fargar, SK/KJ-strekar, fasadelappar, vindauge,
// takflater, kontrollmål) kjem med slik det står på skjermen. Ein eigen
// kopi ville glidd frå skjermen for kvar endring i draw().
// Alt mellom bytet og attendesettinga er synkront — ingen await — så
// ingen hendingar kan sjå lerretet medan det er utlånt.
(()=>{
  const JSPDF_URL='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  let _jspdfLast=null;
  function lastJsPdf(){
    if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
    if(_jspdfLast)return _jspdfLast;
    _jspdfLast=new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src=JSPDF_URL;
      s.onload=()=>window.jspdf&&window.jspdf.jsPDF?res(window.jspdf.jsPDF):rej(new Error('jsPDF lasta ikkje'));
      s.onerror=()=>{_jspdfLast=null;rej(new Error('fekk ikkje lasta PDF-biblioteket (krev nett)'));};
      document.head.appendChild(s);
    });
    return _jspdfLast;
  }

  // Sidemål i «skjermpikslar»: A3 ved 96 dpi. Merkelappane i draw() er
  // faste pikselstorleikar, så dette gir om lag same tekststorleik på
  // arket som på skjermen. K gir skarp utskrift.
  const A3L={w:1587,h:1123},K=2.4;
  const HEAD=64,SIDE=300,MARG=20;

  // Det som skal vere med på arket: biletet og alle sonene (ei sone kan
  // stikke utanfor teikninga), i biletkoordinatar utan forskyving.
  function innhaldBoks(f){
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    const ta=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);};
    if(f.bgImg){ta(0,0);ta(f.bgImg.width,f.bgImg.height);}
    f.zones.forEach(z=>{if(!z.skjult)z.pts.forEach(p=>ta(p.x,p.y));});
    return isFinite(x0)&&x1>x0&&y1>y0?{x0,y0,x1,y1}:null;
  }

  // Teikn planen for etasjen som no er aktiv, med draw(), inn på eit
  // lerret på w×h logiske pikslar.
  function teiknPlan(f,boks,w,h){
    const c=document.createElement('canvas');
    c.width=Math.round(w*K);c.height=Math.round(h*K);
    const cx=c.getContext('2d');
    cx.setTransform(K,0,0,K,0,0);
    const PAD=14;
    const s=Math.min((w-2*PAD)/(boks.x1-boks.x0),(h-2*PAD)/(boks.y1-boks.y0));
    const d={x:f.floorDxImg||0,y:f.floorDyImg||0};
    const lagra={cv,ctx,sc,offX,offY};
    cv=c;ctx=cx;sc=s;
    // i2s() legg til forskyvinga — trekk ho frå så boksen står midt på
    offX=(w-(boks.x1-boks.x0)*s)/2-(boks.x0+d.x)*s;
    offY=(h-(boks.y1-boks.y0)*s)/2-(boks.y0+d.y)*s;
    try{draw();}
    finally{({cv,ctx,sc,offX,offY}=lagra);}
    return c;
  }

  function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}

  // Nordpila. Kompasset i programmet er eit eige DOM-lerret med
  // bruksrettleiing inni — på papiret treng vi berre pila og ein N.
  function teiknNordpil(c,cx,cy){
    const r=30,a=((globalNorth||0)-90)*Math.PI/180;
    c.save();
    c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);
    c.fillStyle='rgba(255,255,255,.95)';c.fill();
    c.strokeStyle='#cbd2db';c.lineWidth=1.2;c.stroke();
    const ux=Math.cos(a),uy=Math.sin(a),nx=-uy,ny=ux;
    const tip={x:cx+ux*(r-16),y:cy+uy*(r-16)},tail={x:cx-ux*(r-7),y:cy-uy*(r-7)};
    c.beginPath();c.moveTo(tail.x,tail.y);c.lineTo(tip.x,tip.y);
    c.strokeStyle='#1a7a6e';c.lineWidth=2.2;c.lineCap='round';c.stroke();
    const b={x:tip.x-ux*9,y:tip.y-uy*9};
    c.beginPath();c.moveTo(tip.x,tip.y);c.lineTo(b.x+nx*4.5,b.y+ny*4.5);c.lineTo(b.x-nx*4.5,b.y-ny*4.5);c.closePath();
    c.fillStyle='#1a7a6e';c.fill();
    c.font='700 11px Inter,sans-serif';c.textAlign='center';c.textBaseline='middle';
    // N framfor pilspissen, inne i ringen — utanfor kunne han hamne utanfor ramma
    c.fillStyle='#1a7a6e';c.fillText('N',cx+ux*(r-8),cy+uy*(r-8));
    c.restore();
  }

  // Ei heil side: topp, plan, og sonelista med teiknforklaring til høgre.
  function teiknSide(f,fli,sideNr,antSider,boks){
    const stende=(boks.y1-boks.y0)>(boks.x1-boks.x0)*1.15;
    const P=stende?{w:A3L.h,h:A3L.w}:A3L;
    const side=document.createElement('canvas');
    side.width=Math.round(P.w*K);side.height=Math.round(P.h*K);
    const c=side.getContext('2d');
    c.setTransform(K,0,0,K,0,0);
    c.fillStyle='#ffffff';c.fillRect(0,0,P.w,P.h);

    // Topp
    c.fillStyle='#1d4f4f';c.fillRect(0,0,P.w,4);
    c.textAlign='left';c.textBaseline='alphabetic';
    c.fillStyle='#0d1b2a';c.font='700 22px Inter,sans-serif';
    c.fillText(arkNamn(f),MARG,38);
    c.font='12.5px Inter,sans-serif';c.fillStyle='#4b5563';
    const under=[prosjektAdresse||null,new Date().toLocaleDateString('nb-NO')].filter(Boolean).join('  ·  ');
    c.fillText(under,MARG,56);
    c.textAlign='right';c.font='600 12px Inter,sans-serif';c.fillStyle='#1d4f4f';
    c.fillText('SXI-generatoren · Soneinndeling',P.w-MARG,34);
    c.font='11.5px Inter,sans-serif';c.fillStyle='#6b7280';
    c.fillText('Side '+sideNr+' av '+antSider,P.w-MARG,52);
    c.strokeStyle='#e5e7eb';c.lineWidth=1;
    c.beginPath();c.moveTo(MARG,HEAD+0.5);c.lineTo(P.w-MARG,HEAD+0.5);c.stroke();

    // Plan — ramma følgjer forma på innhaldet, så det grå lerretet berre
    // vert ein smal kant rundt teikninga, som i programmet
    const aw=P.w-SIDE-MARG*3,ah=P.h-HEAD-MARG*2;
    const bw=boks.x1-boks.x0,bh=boks.y1-boks.y0;
    const s0=Math.min((aw-28)/bw,(ah-28)/bh);
    const pw=Math.min(aw,bw*s0+28),ph=Math.min(ah,bh*s0+28);
    const px=MARG+(aw-pw)/2,py=HEAD+MARG+(ah-ph)/2;
    const plan=teiknPlan(f,boks,pw,ph);
    c.drawImage(plan,px,py,pw,ph);
    c.strokeStyle='#cbd2db';c.lineWidth=1;c.strokeRect(px+0.5,py+0.5,pw-1,ph-1);
    teiknNordpil(c,px+pw-44,py+ph-44);

    // Sonelista
    const sx=P.w-SIDE-MARG;let y=HEAD+MARG+6;
    c.textAlign='left';c.textBaseline='middle';
    c.font='700 12px Inter,sans-serif';c.fillStyle='#0d1b2a';
    c.fillText('SONER',sx,y);y+=20;
    let sum=0,n=0;
    const synlege=f.zones.map((z,zi)=>({z,zi})).filter(o=>o.z.pts.length>=3);
    const maksRader=Math.floor((P.h-HEAD-MARG*2-260)/34);
    synlege.forEach((o,i)=>{
      const a=getAreaM2(o.z);
      if(a!=null){sum+=a;n++;}
      if(i>=maksRader)return;
      const col=COLORS[zoneColorIdx(fli,o.zi,o.z)];
      c.fillStyle=FILLS[zoneColorIdx(fli,o.zi,o.z)];rr(c,sx,y-9,16,16,3);c.fill();
      c.strokeStyle=col;c.lineWidth=1.6;c.stroke();
      c.font='600 12px Inter,sans-serif';c.fillStyle=o.z.skjult?'#9ca3af':'#0d1b2a';
      let nm=o.z.name+(o.z.skjult?' (skjult)':'');
      while(c.measureText(nm).width>SIDE-110&&nm.length>4)nm=nm.slice(0,-2)+'…';
      c.fillText(nm,sx+24,y-1);
      c.textAlign='right';c.font='12px Inter,sans-serif';c.fillStyle='#374151';
      c.fillText(a!=null?fmtM2(a):'–',sx+SIDE,y-1);
      c.textAlign='left';c.font='10.5px Inter,sans-serif';c.fillStyle='#6b7280';
      c.fillText([o.z.bygkat,getHoyde(o.z)?('h '+(+getHoyde(o.z)).toFixed(2)+' m'):null].filter(Boolean).join(' · '),sx+24,y+13);
      y+=34;
    });
    if(synlege.length>maksRader){
      c.font='italic 11px Inter,sans-serif';c.fillStyle='#6b7280';
      c.fillText('+ '+(synlege.length-maksRader)+' soner til (sjå sonetabellen)',sx,y);y+=20;
    }
    if(!synlege.length){c.font='italic 11.5px Inter,sans-serif';c.fillStyle='#6b7280';c.fillText('Ingen soner på dette arket.',sx,y);y+=20;}
    c.strokeStyle='#e5e7eb';c.beginPath();c.moveTo(sx,y+0.5);c.lineTo(sx+SIDE,y+0.5);c.stroke();y+=16;
    c.font='700 12.5px Inter,sans-serif';c.fillStyle='#0d1b2a';
    c.fillText('Sum BRA',sx,y);
    c.textAlign='right';c.fillText(n?fmtM2(sum):'–',sx+SIDE,y);c.textAlign='left';
    y+=14;
    const mpp=mppForFloor(f);
    c.font='10.5px Inter,sans-serif';c.fillStyle='#6b7280';
    if(!mpp){y+=12;c.fillText('Arket er ikkje kalibrert — areal manglar.',sx,y);}

    // Teiknforklaring — same strekar som draw() brukar
    let ly=P.h-MARG-8-7*22;
    c.font='700 12px Inter,sans-serif';c.fillStyle='#0d1b2a';
    c.fillText('TEIKNFORKLARING',sx,ly);ly+=22;
    const linje=(farge,bredd,strek,tekst)=>{
      c.save();c.strokeStyle=farge;c.lineWidth=bredd;c.setLineDash(strek);
      c.beginPath();c.moveTo(sx,ly);c.lineTo(sx+34,ly);c.stroke();c.restore();
      c.font='11.5px Inter,sans-serif';c.fillStyle='#374151';c.fillText(tekst,sx+46,ly);ly+=22;
    };
    linje(COLORS[0],1.5,[],'Yttervegg (fasade)');
    linje('#d97706',2.5,[7,4],'Skiljekonstruksjon (SK)');
    linje('#8a6a3b',3.5,[2,3],'Kjellarvegg');
    linje('#10b981',2.5,[7,4],'Sonekopling');
    linje('#7c3aed',2.5,[8,4],'Kopla soner (same SIMIEN-sone)');
    linje('#06b6d4',3.5,[],'Vindauge');
    linje('#f59e0b',3.5,[],'Dør');
    return {side,P};
  }

  document.getElementById('exportImgBtn').onclick=async()=>{
    if(iFasade()){hintText.textContent='PDF-en viser soneinndelinga — byt til planvisinga først.';return;}
    saveFloorState();
    const ark=floors.map((f,fli)=>({f,fli,boks:innhaldBoks(f)})).filter(o=>o.boks);
    if(!ark.length){hintText.textContent='Ingenting å skrive ut enno — last opp ei planteikning eller teikn ei sone.';return;}
    const btn=document.getElementById('exportImgBtn');
    btn.disabled=true;hintText.textContent='Lagar PDF …';
    let JsPDF;
    try{JsPDF=await lastJsPdf();}
    catch(e){btn.disabled=false;hintText.textContent='PDF: '+e.message+'.';return;}

    // Tilstand som berre gjeld skjermen og ikkje skal på arket
    const lagra={activeFloor,mode,editZoneIdx,hoveredWin,hoveredMeasure,dragWin,dragCorner,
      mouse,drawSnap,nordCheck,ghostMode,draftZones};
    let doc=null;
    try{
      mode='navigate';editZoneIdx=null;hoveredWin=null;hoveredMeasure=null;dragWin=null;dragCorner=null;
      mouse=null;drawSnap=null;nordCheck=false;ghostMode=false;draftZones=[];
      ark.forEach((o,i)=>{
        activeFloor=o.fli;syncFloorState();
        const {side,P}=teiknSide(o.f,o.fli,i+1,ark.length,o.boks);
        const orient=P.w>P.h?'landscape':'portrait';
        if(!doc)doc=new JsPDF({orientation:orient,unit:'mm',format:'a3',compress:true});
        else doc.addPage('a3',orient);
        const wMm=orient==='landscape'?420:297,hMm=orient==='landscape'?297:420;
        doc.addImage(side.toDataURL('image/jpeg',0.9),'JPEG',0,0,wMm,hMm,undefined,'FAST');
      });
    } finally {
      ({activeFloor,mode,editZoneIdx,hoveredWin,hoveredMeasure,dragWin,dragCorner,
        mouse,drawSnap,nordCheck,ghostMode,draftZones}=lagra);
      syncFloorState();draw();
      btn.disabled=false;
    }
    const namn=foreslaaFilnamn().replace(/\.entro$/,'')+'_soneinndeling.pdf';
    doc.save(namn);
    hintText.textContent='PDF lagra: '+ark.length+(ark.length===1?' side':' sider')+' ('+namn+').';
  };
})();

// ── 6. Zoom til sone (dobbelklikk på sonenamn i sidepanel) ───
// Handled in renderZoneCard — we add dblclick to zone header
function zoomToZone(z){
  if(!z||z.pts.length<3)return;
  // Sonelista er skjult i fasadevisinga, men eit kall kan kome frå anna hald.
  if(iFasade())setViewMode('plan');
  const r=cwrap.getBoundingClientRect();
  // Bounding box of zone in image coords
  const xs=z.pts.map(p=>p.x),ys=z.pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  const zW=maxX-minX,zH=maxY-minY;
  if(zW<1||zH<1)return;
  const padding=60;
  const newSc=Math.min((r.width-padding*2)/zW,(r.height-padding*2)/zH);
  sc=Math.max(0.05,Math.min(50,newSc));
  // Sona vert teikna på (ix + floorDxImg)*sc + offX, så etasjens ghost-forskyving
  // må reknast med — elles zoomar vi til der sona låg før ho vart justert.
  let zf=curFloor();
  for(const fl of floors){if(fl.zones.includes(z)){zf=fl;break;}}
  const fdx=zf.floorDxImg||0,fdy=zf.floorDyImg||0;
  offX=r.width/2-((minX+maxX)/2+fdx)*sc;
  offY=r.height/2-((minY+maxY)/2+fdy)*sc;
  saveFloorState();draw();
}

// ── 7. Canvas resize ved sidebar-drag (allereie i place via resize()) ─
// Already handled — resize() is called on sidebar drag mousemove

// ── Roter plantegning 90° CW ─────────────────────────────────
document.getElementById('rotBtn').onclick=()=>{
  if(!bgImg){hintText.textContent='Last opp ei teikning først.';return;}
  saveFloorState();
  // Fasadearket har ingen soner og ingen nord — berre biletet og måla skal
  // snuast. Punkta er i biletkoordinatar, så same transformen som for sonene.
  if(iFasade()){
    const fa=curFasade();
    if(!fa||!fa.bgImg)return;
    const oH=fa.bgImg.height;
    const tmpF=document.createElement('canvas');
    tmpF.width=oH;tmpF.height=fa.bgImg.width;
    const tcF=tmpF.getContext('2d',{alpha:false});
    tcF.fillStyle='#ffffff';tcF.fillRect(0,0,tmpF.width,tmpF.height);
    tcF.translate(oH,0);tcF.rotate(Math.PI/2);
    tcF.drawImage(fa.bgImg,0,0);
    const ferdig=bmp=>{
      fa.bgImg=bmp;
      (fa.measurements||[]).forEach(m=>{
        const p1={x:oH-m.p1.y,y:m.p1.x},p2={x:oH-m.p2.y,y:m.p2.x};
        m.p1=p1;m.p2=p2;
      });
      markDirty();
      syncFasadeState();fitImage();
    };
    if(typeof createImageBitmap!=='undefined')createImageBitmap(tmpF).then(ferdig);
    else{const r=new Image();r.onload=()=>ferdig(r);r.src=tmpF.toDataURL('image/png');}
    return;
  }
  const f=curFloor();
  const origW=f.bgImg.width, origH=f.bgImg.height;
  // Rotate image 90° CW on a canvas
  const tmp=document.createElement('canvas');
  tmp.width=origH; tmp.height=origW;
  const tc=tmp.getContext('2d',{alpha:false});
  tc.fillStyle='#ffffff';tc.fillRect(0,0,tmp.width,tmp.height);
  tc.translate(origH,0);
  tc.rotate(Math.PI/2);
  tc.drawImage(f.bgImg,0,0);
  const finishRotate=async(bmp)=>{
    f.bgImg=bmp;
    // Transform all zone points: (x,y) → (origH - y, x)
    f.zones.forEach(z=>{
      z.pts=z.pts.map(p=>({x:origH-p.y, y:p.x}));
    });
    // North shifts 90° CW when image rotates CW
    setGlobalNorth((globalNorth+90)%360);
    syncFloorState();
    fitImage();
    updateResults();renderTable();draw();
  };
  if(typeof createImageBitmap!=='undefined'){
    createImageBitmap(tmp).then(finishRotate);
  } else {
    const rotated=new Image();
    rotated.onload=()=>finishRotate(rotated);
    rotated.src=tmp.toDataURL('image/png');
  }
};

// ── Rett ut skeiv teikning ───────────────────────────────────
// Ein dårleg skann eller eit foto av ei planteikning er sjeldan berre rotert:
// arket kan vere skeivt, ha perspektiv og ulik skala på langs og tvers. To
// variantar, valde i dialogen:
//
// - «To mål» (rettType 'linjer'): eitt kjent mål i x og eitt i y. Kvar linje
//   gir retning og lengd, og saman gir dei ein affin transform — rotasjon,
//   skeivheit og ulik skala på langs og tvers vert retta. Perspektiv kan to
//   linjer ikkje seie noko om. Måla treng ikkje møtast.
// - «Rektangel» (rettType 'rekt'): fire hjørne på eit rektangel med kjende mål
//   gir ein full perspektivtransform (homografi), som i tillegg rettar
//   perspektiv — for foto tekne på skrå.
//
// Begge endar i éin 3×3-matrise H, og resten er felles: biletet vert rekna
// om, og alt som ligg i biletkoordinatar på arket (soner, tak-/golvflater,
// vindauge, kontrollmål, plasseringsanker) vert flytta med same transformen,
// så det følgjer bygget.
//
// Skalaen vert sett frå måla. Brukar etasjen den globale skalaen, og andre
// etasjar har teikning eller soner på same skala, får etasjen eigen skala
// (ownCal) — den globale ville elles flytta dei andre etasjane.
// Ei ny PDF-side (‹ ›) vert rendra frå originalen og er ikkje retta.
let rettType='linjer';

// 4 punkt → 4 punkt. Gir [h0..h8] med h8=1, eller null om punkta ligg på linje.
function _homografi(src,dst){
  const A=[];
  for(let i=0;i<4;i++){
    const x=src[i].x,y=src[i].y,u=dst[i].x,v=dst[i].y;
    A.push([x,y,1,0,0,0,-u*x,-u*y,u]);
    A.push([0,0,0,x,y,1,-v*x,-v*y,v]);
  }
  for(let c=0;c<8;c++){
    let pr=c;
    for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[pr][c]))pr=r;
    if(Math.abs(A[pr][c])<1e-12)return null;
    [A[c],A[pr]]=[A[pr],A[c]];
    for(let r=0;r<8;r++){
      if(r===c)continue;
      const f=A[r][c]/A[c][c];
      if(f)for(let k=c;k<9;k++)A[r][k]-=f*A[c][k];
    }
  }
  const h=A.map((row,i)=>row[8]/row[i]);
  h.push(1);
  return h;
}
function _hBruk(H,p){
  const w=H[6]*p.x+H[7]*p.y+H[8];
  return{x:(H[0]*p.x+H[1]*p.y+H[2])/w,y:(H[3]*p.x+H[4]*p.y+H[5])/w};
}
function _hMul(A,B){
  const C=[];
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)
    C.push(A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c]);
  return C;
}
function _hInv(m){
  const[a,b,c,d,e,f,g,h,i]=m;
  const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g;
  const det=a*A+b*B+c*C;
  if(Math.abs(det)<1e-15)return null;
  return[A/det,-(b*i-c*h)/det,(b*f-c*e)/det,
         B/det,(a*i-c*g)/det,-(a*f-c*d)/det,
         C/det,-(a*h-b*g)/det,(a*e-b*d)/det];
}

// Ordnar fire punkt rundt sentrum (med klokka på skjermen) og startar på
// hjørnet der kanten vidare peikar mest mot høgre — det er toppkanten A–B,
// så ei teikning som er skeiv med under 45° ikkje vert snudd. Null om
// firkanten ikkje er konveks (eit punkt inne i trekanten av dei andre).
function _rettOrdne(pts){
  const cx=pts.reduce((s,p)=>s+p.x,0)/4,cy=pts.reduce((s,p)=>s+p.y,0)/4;
  const q=pts.slice().sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));
  let teikn=0;
  for(let i=0;i<4;i++){
    const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4];
    const k=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
    if(Math.abs(k)<1e-6)return null;
    if(teikn&&Math.sign(k)!==teikn)return null;
    teikn=Math.sign(k);
  }
  let best=0,bestA=Infinity;
  for(let i=0;i<4;i++){
    const a=q[i],b=q[(i+1)%4];
    const v=Math.abs(Math.atan2(b.y-a.y,b.x-a.x));
    if(v<bestA){bestA=v;best=i;}
  }
  return[0,1,2,3].map(i=>q[(best+i)%4]);
}
// Lengdene i biletpikslar som måla gjeld: for eit rektangel snittet av
// toppen/botnen og av sidene, for to mål sjølve linjene.
function _rettSider(q){
  const d=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  if(rettType==='linjer')return{b:d(q[0],q[1]),h:d(q[2],q[3])};
  return{b:(d(q[0],q[1])+d(q[3],q[2]))/2,h:(d(q[1],q[2])+d(q[0],q[3]))/2};
}
// To mål: den mest vassrette linja er x. Null om linjene er nesten parallelle
// (under 30° imellom) — då seier dei ingenting om den andre retninga.
function _rettOrdneLinjer(p){
  const l1=[p[0],p[1]],l2=[p[2],p[3]];
  const v=l=>({x:l[1].x-l[0].x,y:l[1].y-l[0].y});
  const v1=v(l1),v2=v(l2),n1=Math.hypot(v1.x,v1.y),n2=Math.hypot(v2.x,v2.y);
  if(n1<1||n2<1)return null;
  if(Math.abs(v1.x*v2.y-v1.y*v2.x)/(n1*n2)<0.5)return null;
  const x1=Math.abs(v1.y)/n1<=Math.abs(v2.y)/n2;
  return x1?[...l1,...l2]:[...l2,...l1];
}

document.getElementById('rettBtn').onclick=()=>{
  if(!bgImg){hintText.textContent='Last opp ei teikning først.';return;}
  if(mode==='rett-ut'){setMode('navigate');draw();return;}
  document.getElementById('rettSteg1').style.display='';
  document.getElementById('rettSteg2').style.display='none';
  rettOverlay.classList.add('show');
};
function _rettStart(type){
  rettType=type;
  rettOverlay.classList.remove('show');
  setMode('rett-ut');editZoneIdx=null;curPts=[];calPts=[];
  rettPts=[];
  hintText.textContent=type==='linjer'
    ?'Klikk start og slutt på eit mål du kjenner i x-retning (t.d. ein lang yttervegg) · Backspace angrar · Esc for å avbryte'
    :'Klikk fire hjørne på eit rektangel du kjenner målet på — t.d. ytterveggane · Backspace angrar · Esc for å avbryte';
  draw();
}
document.getElementById('rettVelLinjer').onclick=()=>_rettStart('linjer');
document.getElementById('rettVelRekt').onclick=()=>_rettStart('rekt');
document.querySelectorAll('#rettOverlay .rett-val').forEach(btn=>{
  btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.background='var(--accent-dim)';};
  btn.onmouseleave=()=>{btn.style.borderColor='var(--border2)';btn.style.background='var(--surface)';};
});

function _rettKlikk(sx,sy){
  if(rettPts.length>=4)return;
  const ip=rettSnap?{x:rettSnap.x,y:rettSnap.y}:s2i(sx,sy);
  // Same punkt to gonger: i eit rektangel aldri, med to mål berre innanfor
  // same linja — dei to måla kan godt starte i same hjørne.
  const sjekk=rettType==='linjer'?(rettPts.length%2?[rettPts[rettPts.length-1]]:[]):rettPts;
  if(sjekk.some(p=>Math.hypot(p.x-ip.x,p.y-ip.y)<2))return;
  rettPts.push(ip);rettSnap=null;
  if(rettPts.length<4){
    hintText.textContent=rettType==='linjer'
      ?['','Klikk slutten av målet','Klikk start og slutt på eit mål du kjenner i y-retning (på tvers av det fyrste)','Klikk slutten av målet'][rettPts.length]+' · Backspace angrar'
      :'Hjørne '+rettPts.length+' av 4 · klikk dei andre hjørna på rektangelet (rekkjefølgja spelar inga rolle) · Backspace angrar';
    draw();return;
  }
  const q=rettType==='linjer'?_rettOrdneLinjer(rettPts):_rettOrdne(rettPts);
  if(!q){
    rettPts.pop();
    hintText.textContent=rettType==='linjer'
      ?'Dei to måla må gå på tvers av kvarandre (minst 30° imellom). Klikk slutten av det andre målet på nytt.'
      :'Dei fire punkta dannar ikkje ein firkant (eitt ligg inne i dei andre eller på linje). Klikk det fjerde hjørnet på nytt.';
    draw();return;
  }
  rettPts=q;
  const sd=_rettSider(q);
  const linjer=rettType==='linjer';
  document.getElementById('rettTekst').textContent=linjer
    ?'Linjene vert vassrett og loddrett med desse lengdene. Skeivheit, rotasjon og ulik skala på langs og tvers vert retta opp, og skalaen vert sett samstundes.'
    :'Dei fire punkta vert eit rektangel med desse måla. Skeivheit, perspektiv og ulik skala på langs og tvers vert retta opp, og skalaen vert sett samstundes.';
  document.getElementById('rettWLbl').textContent=linjer?'Mål X (vassrett)':'Breidde (A–B, øvst)';
  document.getElementById('rettHLbl').textContent=linjer?'Mål Y (loddrett)':'Djupn (B–C, høgre)';
  const wI=document.getElementById('rettW'),hI=document.getElementById('rettH');
  // Framlegg frå dagens skala — brukaren skal skrive inn det verkelege målet
  wI.value=mmPerImgPx?Math.round(sd.b*mmPerImgPx/10)*10:'';
  hI.value=mmPerImgPx?Math.round(sd.h*mmPerImgPx/10)*10:'';
  document.getElementById('rettInfo').textContent=mmPerImgPx
    ?'Framlegga er målte med dagens skala. Skriv inn dei verkelege måla. Tomt felt: lengda vert rekna frå teikninga.'
    :'Teikninga er ikkje kalibrert. Skriv inn begge måla for å få rett skala.';
  document.getElementById('rettSteg1').style.display='none';
  document.getElementById('rettSteg2').style.display='';
  rettOverlay.classList.add('show');
  draw();
  setTimeout(()=>{wI.select();wI.focus();},50);
}

function _teiknRettUt(){
  const sp=rettPts.map(p=>i2s(p.x,p.y));
  const ferdig=sp.length===4;
  const col='#7c3aed';
  const m=mouse?(rettSnap?i2s(rettSnap.x,rettSnap.y):mouse):null;
  const lapp=(x,y,t)=>{
    ctx.font='bold 12px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle=col;ctx.fillText(t,x,y+.5);
  };
  ctx.save();
  if(rettType==='linjer'){
    // To separate linjer; den pågåande følgjer musa
    for(let i=0;i<sp.length;i+=2){
      const a=sp[i],b=sp[i+1]||(!ferdig?m:null);
      if(!b)continue;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash(sp[i+1]?[]:[6,4]);ctx.stroke();ctx.setLineDash([]);
    }
    sp.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    });
    if(ferdig){
      [[0,'X'],[2,'Y']].forEach(([i,t])=>{
        const a=sp[i],b=sp[i+1],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
        lapp((a.x+b.x)/2-dy/l*16,(a.y+b.y)/2+dx/l*16,t);
      });
    }
  } else {
    if(sp.length){
      ctx.beginPath();ctx.moveTo(sp[0].x,sp[0].y);
      sp.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
      if(ferdig)ctx.closePath();
      else if(m){
        ctx.lineTo(m.x,m.y);
        if(sp.length===3)ctx.lineTo(sp[0].x,sp[0].y);
      }
      if(ferdig){ctx.fillStyle='rgba(124,58,237,.08)';ctx.fill();}
      ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash(ferdig?[]:[6,4]);ctx.stroke();ctx.setLineDash([]);
    }
    const cx=sp.reduce((s,q)=>s+q.x,0)/(sp.length||1),cy=sp.reduce((s,q)=>s+q.y,0)/(sp.length||1);
    sp.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
      if(ferdig){
        const dx=p.x-cx,dy=p.y-cy,l=Math.hypot(dx,dy)||1;
        lapp(p.x+dx/l*16,p.y+dy/l*16,'ABCD'[i]);
      }
    });
  }
  ctx.restore();
  if(rettSnap&&!ferdig)drawSnapMarker(i2s(rettSnap.x,rettSnap.y),rettSnap.type,
    rettSnap.type==='imgcorner'?'rgb(219,39,119)':'rgb(124,58,237)');
}

// Reknar biletet om. Hinv går frå utbiletet til originalen; bilineær
// interpolasjon, kvitt utanfor. ~1,3 s ved 48 Mpx.
function _rettBilete(img,Hinv,W,H){
  const iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
  const sc0=document.createElement('canvas');sc0.width=iw;sc0.height=ih;
  const sctx=sc0.getContext('2d');
  sctx.fillStyle='#fff';sctx.fillRect(0,0,iw,ih);   // gjennomsiktig PNG vert kvit, ikkje svart
  sctx.drawImage(img,0,0);
  const sd=sctx.getImageData(0,0,iw,ih).data;
  sc0.width=sc0.height=1;
  const out=document.createElement('canvas');out.width=W;out.height=H;
  const octx=out.getContext('2d',{alpha:false});
  const od=octx.createImageData(W,H),o=od.data;
  const[a,b,c,d,e,f,g,h,i]=Hinv;
  const rad=iw*4;
  let k=0;
  for(let y=0;y<H;y++){
    const yy=y+.5;
    let X=a*.5+b*yy+c,Y=d*.5+e*yy+f,Z=g*.5+h*yy+i;
    for(let x=0;x<W;x++,k+=4,X+=a,Y+=d,Z+=g){
      o[k+3]=255;
      if(Z<=0){o[k]=o[k+1]=o[k+2]=255;continue;}
      const fx0=X/Z-.5,fy0=Y/Z-.5;
      if(!(fx0>=0&&fy0>=0&&fx0<iw-1&&fy0<ih-1)){o[k]=o[k+1]=o[k+2]=255;continue;}
      const x0=fx0|0,y0=fy0|0,fx=fx0-x0,fy=fy0-y0;
      const p=(y0*iw+x0)*4,q=p+rad;
      const w00=(1-fx)*(1-fy),w10=fx*(1-fy),w01=(1-fx)*fy,w11=fx*fy;
      o[k]=sd[p]*w00+sd[p+4]*w10+sd[q]*w01+sd[q+4]*w11;
      o[k+1]=sd[p+1]*w00+sd[p+5]*w10+sd[q+1]*w01+sd[q+5]*w11;
      o[k+2]=sd[p+2]*w00+sd[p+6]*w10+sd[q+2]*w01+sd[q+6]*w11;
    }
  }
  octx.putImageData(od,0,0);
  return out;
}

['rettAvbryt','rettAvbryt1'].forEach(id=>document.getElementById(id).onclick=()=>{
  rettOverlay.classList.remove('show');
  setMode('navigate');draw();
});
['rettW','rettH'].forEach(id=>document.getElementById(id).addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('rettOk').click();
  if(e.key==='Escape')document.getElementById('rettAvbryt').click();
  e.stopPropagation();
}));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&rettOverlay.classList.contains('show'))document.getElementById('rettAvbryt').click();
});

// Transformen frå originalbiletet til eit rett bilete der måla er Wr×Hr
// pikslar (før utsnitt og pikselbudsjett).
function _rettH0(q,Wr,Hr){
  if(rettType==='rekt')
    return _homografi(q,[{x:0,y:0},{x:Wr,y:0},{x:Wr,y:Hr},{x:0,y:Hr}]);
  // To mål: lineær del A = T·V⁻¹, der V har linjevektorane som kolonnar og T
  // det dei skal bli — (±Wr,0) og (0,±Hr), med forteikn etter retninga dei
  // vart klikka i, så teikninga ikkje snur. Startpunktet til x-målet → origo.
  const v1={x:q[1].x-q[0].x,y:q[1].y-q[0].y},v2={x:q[3].x-q[2].x,y:q[3].y-q[2].y};
  const det=v1.x*v2.y-v2.x*v1.y;
  if(Math.abs(det)<1e-9)return null;
  const sx=v1.x<0?-1:1;
  let sy=v2.y<0?-1:1;
  // Spegling (forteiknet til determinanten snur) skal aldri skje
  if(Math.sign(sx*sy)!==Math.sign(det))sy=-sy;
  const t1x=sx*Wr,t2y=sy*Hr;
  const a=t1x*v2.y/det,b=-t1x*v2.x/det;
  const c=-t2y*v1.y/det,d=t2y*v1.x/det;
  return[a,b,-(a*q[0].x+b*q[0].y),c,d,-(c*q[0].x+d*q[0].y),0,0,1];
}

document.getElementById('rettOk').onclick=async()=>{
  const q=rettPts;
  if(q.length!==4||!bgImg)return;
  const wMm=parseFloat(document.getElementById('rettW').value);
  const hMm=parseFloat(document.getElementById('rettH').value);
  const harW=wMm>0,harH=hMm>0;
  const sd=_rettSider(q);
  // Måla i pikslar. Same oppløysing som originalen i snitt; eit mål som
  // manglar vert rekna frå teikninga.
  const bmm=harW?wMm:(harH?hMm*sd.b/sd.h:null);
  const hmm=harH?hMm:(harW?wMm*sd.h/sd.b:null);
  let Wr,Hr,pxPerMm=null;
  if(bmm){pxPerMm=(sd.b+sd.h)/(bmm+hmm);Wr=bmm*pxPerMm;Hr=hmm*pxPerMm;}
  else{Wr=sd.b;Hr=sd.h;}
  if(Wr<20||Hr<20){hintText.textContent='Måla er for korte på teikninga — vel punkt lenger frå kvarandre.';return;}
  const H0=_rettH0(q,Wr,Hr);
  if(!H0){hintText.textContent='Klarte ikkje å rekne ut rettinga — prøv andre punkt.';return;}
  // Ein affin transform (to mål) gir alltid eit endeleg utsnitt og vert ikkje
  // klipt — måla kan vere korte samanlikna med teikninga.
  const M=rettType==='rekt'?Math.max(Wr,Hr)*1.5:Infinity;
  const res=await _rettUtfor({H0,Wr,Hr,M,pxPerMm,q});
  if(!res)return;
  const skalaTxt=res.nyMppFraMaal?' Skalaen er sett frå '+(harW&&harH?'måla.':'eitt mål — det andre er rekna frå teikninga.')
    :(mmPerImgPx?' Skalaen er omtrentleg — kalibrer på nytt.':'');
  hintText.textContent='✓ Teikninga er retta ut.'+skalaTxt+res.melding+(res.klipt?' Sterkt perspektiv: kantane langt ute er skorne bort.':'')+' Ctrl+Z for å angre.';
};

// Felles for begge vegane: H0 går frå originalbiletet til eit rett bilete
// (før utsnitt og pikselbudsjett). Sterkt perspektiv kan sende eit hjørne mot
// det uendelege; då vert utsnittet avgrensa til M rundt referansen.
// pxPerMm=null ⇒ skalaen står (berre justert for pikselbudsjettet).
// Returnerer {klipt,melding,nyMppFraMaal}, eller null ved feil.
async function _rettUtfor({H0,Wr,Hr,M,pxPerMm,q}){
  const iw=bgImg.width||bgImg.naturalWidth,ih=bgImg.height||bgImg.naturalHeight;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,bomHj=false;
  [{x:0,y:0},{x:iw,y:0},{x:iw,y:ih},{x:0,y:ih}].forEach(p=>{
    const w=H0[6]*p.x+H0[7]*p.y+H0[8];
    if(w<=1e-9){bomHj=true;return;}
    const t=_hBruk(H0,p);
    x0=Math.min(x0,t.x);y0=Math.min(y0,t.y);x1=Math.max(x1,t.x);y1=Math.max(y1,t.y);
  });
  if(bomHj){x0=-M;y0=-M;x1=Wr+M;y1=Hr+M;}
  const klipt=bomHj||x0<-M||y0<-M||x1>Wr+M||y1>Hr+M;
  x0=Math.max(x0,-M);y0=Math.max(y0,-M);x1=Math.min(x1,Wr+M);y1=Math.min(y1,Hr+M);
  // Pikselbudsjett: om lag like mange pikslar som originalen, maks 64 Mpx
  const budsjett=Math.min(Math.max(iw*ih*1.2,4e6),64e6);
  const s=Math.min(1,Math.sqrt(budsjett/((x1-x0)*(y1-y0))));
  const W=Math.max(1,Math.ceil((x1-x0)*s)),Hh=Math.max(1,Math.ceil((y1-y0)*s));
  const H=_hMul([s,0,-x0*s,0,s,-y0*s,0,0,1],H0),Hinv=_hInv(H);
  if(!Hinv){hintText.textContent='Klarte ikkje å rekne ut rettinga — prøv andre punkt.';return null;}

  rettOverlay.classList.remove('show');
  hintText.textContent='Rettar ut teikninga …';
  await new Promise(r=>setTimeout(r,40));   // lèt hintlinja teiknast (rAF står i ei bakgrunnsfane)
  let cvUt;
  try{cvUt=_rettBilete(bgImg,Hinv,W,Hh);}
  catch(e){
    setMode('navigate');draw();
    hintText.textContent='Klarte ikkje å lese biletet ('+(e&&e.message||e)+').';
    return null;
  }
  const bmp=typeof createImageBitmap!=='undefined'?await createImageBitmap(cvUt)
    :await new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.src=cvUt.toDataURL('image/png');});

  saveFloorState();
  snapshot();   // angre-steg (biletet ligg som referanse i historikken) + ulagra
  const P=p=>_hBruk(H,p);
  const nyMppFraMaal=pxPerMm?1/(pxPerMm*s):null;
  let melding='';

  if(iFasade()){
    const fa=curFasade();
    const gml=fa.mmPerImgPx??null;
    fa.bgImg=bmp;
    (fa.measurements||[]).forEach(m=>{m.p1=P(m.p1);m.p2=P(m.p2);});
    fa.mmPerImgPx=nyMppFraMaal??(gml?gml/s:null);
    fa.paperWMm=fa.paperHMm=null;fa.paperSource=null;
    syncFasadeState();fitImage();
    renderFasadeTabs();renderFasadePanel();
  } else {
    const f=curFloor();
    const gmlMpp=mppForFloor(f);
    const nyMpp=nyMppFraMaal??(gmlMpp?gmlMpp/s:null);
    // Punkta før, så vindauga kan følgje veggen sin
    const gmlPts=f.zones.map(z=>z.pts.map(p=>({...p})));
    const segLen=(pts,i)=>{const a=pts[i],b=pts[(i+1)%pts.length];return a&&b?Math.hypot(b.x-a.x,b.y-a.y):0;};
    f.zones.forEach(z=>{
      z.pts=z.pts.map(P);
      ['takflater','gulvflater'].forEach(k=>(z[k]||[]).forEach(fl=>{if(fl.pts)fl.pts=fl.pts.map(P);}));
    });
    // Ny skala
    if(nyMpp){
      const andreBrukarGlobal=floors.some(fl=>fl!==f&&!fl.ownCal&&(fl.bgImg||(fl.zones||[]).length));
      if(f.ownCal)f.mmPerImgPx=nyMpp;
      else if(andreBrukarGlobal){
        f.ownCal=true;f.mmPerImgPx=nyMpp;
        melding=' Etasjen fekk eigen skala, så dei andre etasjane står urørte.';
      } else {
        globalMmPerImgPx=nyMpp;
        floors.forEach(fl=>{if(!fl.ownCal)fl.mmPerImgPx=nyMpp;});
      }
      mmPerImgPx=nyMpp;
    }
    const nyM=mppForFloor(f);
    // Vindauge: posisjonen langs veggen vert flytta med transformen (ei rett
    // linje er framleis rett), breidda med forholdet mellom veglengdene i mm.
    f.zones.forEach((z,zi)=>{
      const op=gmlPts[zi];
      (z.windows||[]).forEach(w=>{
        const i=w.segIdx;if(i==null||!op[i])return;
        const a0=op[i],b0=op[(i+1)%op.length],a1=z.pts[i],b1=z.pts[(i+1)%z.pts.length];
        const dx=b1.x-a1.x,dy=b1.y-a1.y,L2=dx*dx+dy*dy;
        const nyT=t=>{
          if(!L2)return t;
          const p=P({x:a0.x+(b0.x-a0.x)*t,y:a0.y+(b0.y-a0.y)*t});
          return Math.max(0,Math.min(1,((p.x-a1.x)*dx+(p.y-a1.y)*dy)/L2));
        };
        if(w.t0!=null)w.t0=nyT(w.t0);
        if(w.t1!=null)w.t1=nyT(w.t1);
        if(Array.isArray(w.posT))w.posT=w.posT.map(nyT);
        const l0=segLen(op,i)*(gmlMpp||0),l1=segLen(z.pts,i)*(nyM||0);
        if(w.breddeMm&&l0>0&&l1>0)w.breddeMm=Math.round(w.breddeMm*l1/l0);
      });
      _syncGavlflater(z);
    });
    (f.measurements||[]).forEach(m=>{m.p1=P(m.p1);m.p2=P(m.p2);});
    // Plassering i etasjestabelen: anker på arket og ark plasserte mot det
    if(f.plassAnker&&f.plassAnker.a)f.plassAnker.a=P(f.plassAnker.a);
    floors.forEach(fl=>{if(fl.plassAnker&&fl.plassAnker.til===f.id&&fl.plassAnker.b)fl.plassAnker.b=P(fl.plassAnker.b);});
    if(!f.plassAnker&&floors.length>1){
      // Utan anker: hald midten av referansepunkta på same stad i verda, så
      // etasjen ikkje glir bort frå dei andre i 3D og ghost-laget.
      const c={x:q.reduce((t,p)=>t+p.x,0)/4,y:q.reduce((t,p)=>t+p.y,0)/4},cn=P(c);
      const k=(gmlMpp&&nyM)?gmlMpp/nyM:1/s;
      f.floorDxImg=(c.x+(f.floorDxImg||0))*k-cn.x;
      f.floorDyImg=(c.y+(f.floorDyImg||0))*k-cn.y;
    }
    f.bgImg=bmp;
    f.paperWMm=f.paperHMm=null;f.paperSource=null;   // målestokk-metoden gjeld ikkje lenger
    _brukAlleAnker();
    syncFloorState();fitImage();
    updateResults();renderTable();renderFloorTabs();
  }
  updateScaleBadge();
  setMode('navigate');
  draw();
  return{klipt,melding,nyMppFraMaal};
}

// ── Lagre / opne prosjekt ─────────────────────────────────────
// Lagrar prosjektet som .entro-fil på maskina. I EntroPi ligg dette på ein eigen
// knapp ved sida av «Lagre på bygget», så ein kan ta med seg ein kopi lokalt.
async function lastNedProsjektfil(){
  const blob=new Blob([JSON.stringify(serialiserProsjekt())],{type:'application/json'});
  const fname=foreslaaFilnamn();
  // Native lagre-dialog der nettlesaren støttar det, så brukaren vel mappe
  // og namn sjølv. Elles fell vi tilbake til vanleg nedlasting.
  if(window.showSaveFilePicker){
    try{
      const h=await window.showSaveFilePicker({
        suggestedName:fname,
        types:[{description:'SXI-generator prosjekt',accept:{'application/json':['.entro']}}]
      });
      const w=await h.createWritable();
      await w.write(blob);
      await w.close();
      hintText.textContent='Lagra som «'+h.name+'».';
      return;
    }catch(err){
      if(err&&err.name==='AbortError')return;   // brukaren avbraut
      // Andre feil (t.d. blokkert av nettlesaren): fall gjennom til nedlasting
    }
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=fname;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
  hintText.textContent='Lagra som «'+fname+'» i nedlastingsmappa.';
}

document.getElementById('saveBtn').onclick=()=>{
  // I EntroPi går lagringa rett på bygget i staden for til ei fil på maskina
  if(inPi()){window.EntroHost.saveToHost({auto:false});return;}
  lastNedProsjektfil();
};
document.getElementById('dlBtn').onclick=()=>lastNedProsjektfil();

// Opnar ei .entro-fil — same veg som den gamle «Opne prosjekt»-knappen.
// Kallast frå lastInnFiler (Last opp-knappen, Ctrl+O og slepp på lerretet).
async function opneProsjektfil(file){
  try{
    await lastProsjekt(JSON.parse(await file.text()),{fit:true});
  }catch(e){
    alert('Kunne ikkje opne prosjektfil: '+e.message);
  }
}
const KLIMA={
  'Bergen':    {lat:'60.380000',lon:'5.330000',fil:'E:\\Sites\\Climates\\TMY_Bergen_CERRA_1991-2020_tmy-no.csv',mean:'7.60',
    ds:{dt:'11.8',hum:'13.31',gr:'0.13'},
    dw:{dt:'4.6',hum:'1.09',gr:'0.17'},
    t1d_s:['20.80','22.70','24.10','25.30','26.00','26.90','28.20'],
    t2d_s:['20.20','22.30','23.50','24.70','25.40','26.20','27.20'],
    t3d_s:['19.80','21.80','23.00','24.20','24.80','25.50','26.50'],
    t4d_s:['19.50','21.50','22.70','23.80','24.50','25.20','26.20'],
    t5d_s:['19.30','21.20','22.50','23.60','24.20','24.90','25.90'],
    t1d_w:['-6.40','-8.90','-10.50','-11.80','-12.60','-13.50','-14.60'],
    t2d_w:['-5.70','-8.30','-9.90','-11.30','-12.10','-13.00','-14.30'],
    t3d_w:['-5.20','-7.70','-9.30','-10.60','-11.40','-12.30','-13.50'],
    t4d_w:['-4.90','-7.30','-8.80','-10.10','-10.80','-11.70','-12.80'],
    t5d_w:['-4.40','-6.80','-8.20','-9.50','-10.20','-11.00','-12.10'],
    cc:{apartments:'0.9500',cultural:'1.0000',hospital:'0.9700',hotel:'0.9900',industrial:'0.9800',kindergarten:'1.0200',nursing_home:'1.0100',office:'0.9700',residential:'0.9400',school:'0.9700',sports_venue:'0.8600',store:'0.7400',university:'0.9300'}},
  'Oslo':      {lat:'59.920000',lon:'10.750000',fil:'E:\\Sites\\Climates\\TMY_Oslo_CERRA_1991-2020_tmy-no.csv',mean:'7.30',
    ds:{dt:'10.7',hum:'13.64',gr:'0.14'},
    dw:{dt:'4.6',hum:'0.59',gr:'0.30'},
    t1d_s:['25.60','27.80','29.30','30.60','31.40','32.40','33.70'],
    t2d_s:['24.80','27.10','28.60','29.90','30.70','31.70','33.00'],
    t3d_s:['24.10','26.40','27.90','29.20','30.00','31.00','32.30'],
    t4d_s:['23.50','25.80','27.30','28.60','29.40','30.40','31.70'],
    t5d_s:['23.00','25.30','26.80','28.10','28.90','29.90','31.20'],
    t1d_w:['-14.70','-17.60','-19.40','-21.00','-21.90','-23.00','-24.40'],
    t2d_w:['-13.60','-16.50','-18.40','-20.00','-20.90','-22.00','-23.50'],
    t3d_w:['-12.80','-15.60','-17.40','-19.00','-19.90','-21.00','-22.40'],
    t4d_w:['-12.10','-14.90','-16.70','-18.20','-19.10','-20.20','-21.60'],
    t5d_w:['-11.50','-14.20','-16.00','-17.50','-18.40','-19.50','-20.90'],
    cc:{apartments:'0.9500',cultural:'1.0000',hospital:'0.9700',hotel:'0.9900',industrial:'0.9800',kindergarten:'1.0200',nursing_home:'1.0100',office:'0.9700',residential:'0.9400',school:'0.9700',sports_venue:'0.8600',store:'0.7400',university:'0.9300'}},
  'Stavanger': {lat:'58.960000',lon:'5.700000',fil:'E:\\Sites\\Climates\\TMY_Stavanger_CERRA_1991-2020_tmy-no.csv',mean:'8.50',
    ds:{dt:'12.1',hum:'1.17',gr:'0.14'},
    dw:{dt:'4.6',hum:'1.09',gr:'0.17'},
    t1d_s:['22.40','24.30','25.70','26.90','27.60','28.50','29.80'],
    t2d_s:['21.70','23.80','25.10','26.30','27.00','27.90','29.10'],
    t3d_s:['21.20','23.20','24.60','25.80','26.50','27.40','28.60'],
    t4d_s:['20.80','22.80','24.10','25.30','26.00','26.90','28.10'],
    t5d_s:['20.40','22.40','23.80','24.90','25.60','26.50','27.70'],
    t1d_w:['-4.30','-6.50','-8.00','-9.20','-9.90','-10.90','-12.10'],
    t2d_w:['-3.60','-5.80','-7.30','-8.60','-9.30','-10.20','-11.50'],
    t3d_w:['-3.10','-5.20','-6.70','-8.00','-8.70','-9.60','-10.80'],
    t4d_w:['-2.70','-4.80','-6.20','-7.50','-8.20','-9.10','-10.30'],
    t5d_w:['-2.30','-4.30','-5.80','-7.00','-7.70','-8.60','-9.80'],
    cc:{apartments:'0.9500',cultural:'1.0000',hospital:'0.9700',hotel:'0.9900',industrial:'0.9800',kindergarten:'1.0200',nursing_home:'1.0100',office:'0.9700',residential:'0.9400',school:'0.9700',sports_venue:'0.8600',store:'0.7400',university:'0.9300'}},
  'Sandnes':   {lat:'58.800000',lon:'5.700000',fil:'E:\\Sites\\Climates\\TMY_Sandnes_CERRA_1991-2020_tmy-no.csv',mean:'7.70',
    ds:{dt:'12.1',hum:'1.17',gr:'0.14'},
    dw:{dt:'4.6',hum:'1.09',gr:'0.17'},
    t1d_s:['22.40','24.30','25.70','26.90','27.60','28.50','29.80'],
    t2d_s:['21.70','23.80','25.10','26.30','27.00','27.90','29.10'],
    t3d_s:['21.20','23.20','24.60','25.80','26.50','27.40','28.60'],
    t4d_s:['20.80','22.80','24.10','25.30','26.00','26.90','28.10'],
    t5d_s:['20.40','22.40','23.80','24.90','25.60','26.50','27.70'],
    t1d_w:['-4.30','-6.50','-8.00','-9.20','-9.90','-10.90','-12.10'],
    t2d_w:['-3.60','-5.80','-7.30','-8.60','-9.30','-10.20','-11.50'],
    t3d_w:['-3.10','-5.20','-6.70','-8.00','-8.70','-9.60','-10.80'],
    t4d_w:['-2.70','-4.80','-6.20','-7.50','-8.20','-9.10','-10.30'],
    t5d_w:['-2.30','-4.30','-5.80','-7.00','-7.70','-8.60','-9.80'],
    cc:{apartments:'0.9500',cultural:'1.0000',hospital:'0.9700',hotel:'0.9900',industrial:'0.9800',kindergarten:'1.0200',nursing_home:'1.0100',office:'0.9700',residential:'0.9400',school:'0.9700',sports_venue:'0.8600',store:'0.7400',university:'0.9300'}},
  'Trondheim': {lat:'63.500000',lon:'10.350000',fil:'E:\\Sites\\Climates\\TMY_Trondheim_CERRA_1991-2020_tmy-no.csv',mean:'6.90',
    ds:{dt:'12.0',hum:'12.78',gr:'0.14'},
    dw:{dt:'3.9',hum:'1.88',gr:'0.19'},
    t1d_s:['21.20','23.30','24.80','26.30','27.20','28.30','29.80'],
    t2d_s:['20.50','22.60','24.20','25.60','26.50','27.60','29.20'],
    t3d_s:['19.90','21.90','23.20','24.50','25.30','26.30','27.60'],
    t4d_s:['19.40','21.40','22.70','23.90','24.70','25.60','26.90'],
    t5d_s:['19.10','21.10','22.50','23.80','24.50','25.50','26.80'],
    t1d_w:['-12.70','-16.10','-18.30','-20.40','-21.60','-23.00','-25.00'],
    t2d_w:['-11.50','-15.10','-17.50','-19.70','-21.00','-22.60','-24.70'],
    t3d_w:['-10.60','-14.20','-16.70','-19.00','-20.40','-22.00','-24.40'],
    t4d_w:['-9.90','-13.40','-15.80','-18.00','-19.20','-20.80','-22.90'],
    t5d_w:['-9.20','-12.70','-15.00','-17.10','-18.40','-19.90','-22.00'],
    cc:{apartments:'1.1000',cultural:'1.0500',hospital:'1.0200',hotel:'1.0400',industrial:'1.0400',kindergarten:'1.0500',nursing_home:'1.0400',office:'1.0300',residential:'1.0500',school:'1.0400',sports_venue:'1.0000',store:'0.8800',university:'1.0100'}},
  'Kristiansand':{lat:'58.200000',lon:'8.040000',fil:'E:\\Sites\\Climates\\TMY_Kristiansand_CERRA_1991-2020_tmy-no.csv',mean:'8.30',
    ds:{dt:'9.3',hum:'7.87',gr:'0.15'},
    dw:{dt:'2.6',hum:'1.77',gr:'0.16'},
    t1d_s:['21.00','22.80','23.90','24.80','25.30','25.80','26.50'],
    t2d_s:['20.60','22.30','23.40','24.30','24.80','25.40','26.10'],
    t3d_s:['20.20','22.00','23.10','24.00','24.50','25.10','25.90'],
    t4d_s:['19.90','21.60','22.70','23.60','24.10','24.70','25.40'],
    t5d_s:['19.70','21.40','22.40','23.30','23.70','24.30','24.90'],
    t1d_w:['-8.50','-11.80','-14.00','-16.10','-17.20','-18.70','-20.60'],
    t2d_w:['-7.30','-10.70','-12.90','-15.00','-16.30','-17.70','-19.60'],
    t3d_w:['-6.50','-9.70','-11.90','-14.00','-15.20','-16.60','-18.70'],
    t4d_w:['-5.80','-9.00','-11.20','-13.20','-14.30','-15.60','-17.50'],
    t5d_w:['-5.40','-8.50','-10.60','-12.70','-13.80','-15.20','-17.00'],
    cc:{apartments:'0.7300',cultural:'0.8300',hospital:'0.8400',hotel:'0.8400',industrial:'0.8200',kindergarten:'0.8900',nursing_home:'0.8700',office:'0.8000',residential:'0.7900',school:'0.7700',sports_venue:'0.7300',store:'0.6900',university:'0.7900'}},
  'Tromsø':    {lat:'69.650000',lon:'18.950000',fil:'E:\\Sites\\Climates\\TMY_Tromsø_CERRA_1991-2020_tmy-no.csv',mean:'3.00',
    ds:{dt:'9.9',hum:'15.50',gr:'0.19'},
    dw:{dt:'4.1',hum:'1.27',gr:'0.35'},
    t1d_s:['17.90','19.70','20.80','21.80','22.40','23.10','23.90'],
    t2d_s:['17.10','18.90','20.00','21.10','21.60','22.40','23.30'],
    t3d_s:['16.50','18.40','19.50','20.60','21.20','22.00','23.00'],
    t4d_s:['16.00','17.80','19.00','20.10','20.80','21.60','22.70'],
    t5d_s:['15.60','17.40','18.70','19.90','20.50','21.40','22.50'],
    t1d_w:['-10.60','-12.70','-14.10','-15.30','-16.00','-16.90','-18.10'],
    t2d_w:['-10.10','-11.90','-13.10','-14.20','-14.70','-15.40','-16.40'],
    t3d_w:['-9.40','-11.00','-12.00','-13.00','-13.50','-14.20','-15.00'],
    t4d_w:['-8.90','-10.40','-11.40','-12.40','-12.90','-13.60','-14.50'],
    t5d_w:['-8.50','-10.00','-11.00','-12.00','-12.60','-13.30','-14.30'],
    cc:{apartments:'1.6200',cultural:'1.3500',hospital:'1.2600',hotel:'1.3200',industrial:'1.3700',kindergarten:'1.2800',nursing_home:'1.2600',office:'1.3500',residential:'1.4900',school:'1.4100',sports_venue:'1.4900',store:'1.2300',university:'1.3400'}},
  'Bodø':      {lat:'67.240000',lon:'14.360000',fil:'E:\\Sites\\Climates\\TMY_Bodø_CERRA_1991-2020_tmy-no.csv',mean:'5.40',
    ds:{dt:'9.9',hum:'12.90',gr:'0.15'},
    dw:{dt:'2.9',hum:'1.85',gr:'0.17'},
    t1d_s:['19.80','21.90','23.20','24.40','25.00','25.90','27.00'],
    t2d_s:['19.20','21.30','22.70','23.90','24.50','25.40','26.40'],
    t3d_s:['18.60','20.90','22.20','23.40','24.00','24.80','25.90'],
    t4d_s:['18.10','20.40','21.80','23.00','23.70','24.50','25.50'],
    t5d_s:['17.60','19.80','21.20','22.40','23.10','23.90','25.00'],
    t1d_w:['-9.80','-11.70','-12.90','-13.90','-14.50','-15.20','-16.00'],
    t2d_w:['-9.10','-10.90','-12.10','-13.20','-13.80','-14.60','-15.50'],
    t3d_w:['-8.50','-10.40','-11.50','-12.60','-13.20','-13.90','-14.80'],
    t4d_w:['-8.00','-9.90','-11.10','-12.20','-12.80','-13.50','-14.40'],
    t5d_w:['-7.50','-9.40','-10.60','-11.70','-12.30','-13.00','-13.90'],
    cc:{apartments:'1.3700',cultural:'1.2300',hospital:'1.1300',hotel:'1.1900',industrial:'1.2200',kindergarten:'1.1800',nursing_home:'1.1600',office:'1.2200',residential:'1.2800',school:'1.2300',sports_venue:'1.2100',store:'0.9600',university:'1.1800'}},
};

const KOMMUNE_NR={'Bergen':'4601','Oslo':'0301','Stavanger':'1103','Sandnes':'1108','Trondheim':'5001','Kristiansand':'4204','Tromsø':'5401','Bodø':'1804'};

function klimaTempBlock(td,name){
  const keys=['two_year','five_year','ten_year','twenty_year','thirty_year','fifty_year','hundred_year'];
  const rows=['t1d','t2d','t3d','t4d','t5d'];
  return rows.map((r,ri)=>{
    const vals=keys.map((k,ki)=>`${k}="${td[r+'_'+name][ki]}"`).join(' ');
    return `        <temp_${ri+1}d ${vals}></temp_${ri+1}d>`;
  }).join('\n');
}

function klimaBlock(k,kname){
  const cc=Object.entries(k.cc).map(([a,v])=>`${a}="${v}"`).join(' ');
  return `  <climate id="klima#0" name="${kname}" comment="">
    <new_location name="${kname}" hour_val_file="${k.fil}" latitude="${k.lat}" longitude="${k.lon}" time_zone="1" mean_temperature="${k.mean}">
      <dim_summer delta_t="${k.ds.dt}" humidity="${k.ds.hum}" ground_reflection="${k.ds.gr}" wind_velocity="2.5" max_temp_time="14.50">
${klimaTempBlock(k,'s')}
      </dim_summer>
      <dim_winter delta_t="${k.dw.dt}" humidity="${k.dw.hum}" ground_reflection="${k.dw.gr}" wind_velocity="1.5" max_temp_time="13.50">
${klimaTempBlock(k,'w')}
      </dim_winter>
      <climate_correction ${cc}></climate_correction>
    </new_location>
  </climate>`;
}

// 96 time-slot profile helpers
function makeProfile(onFrom, onTo, onVal, offVal){
  const slots=[];
  for(let h=0;h<24;h++){for(let m=0;m<60;m+=15){
    const t=h+m/60;
    const hEnd=m===45?h+1:h;
    const mEnd=(m+15)%60;
    // Wrap 24:00 → 00:00
    const hEndStr=String(hEnd===24?0:hEnd).padStart(2,'0');
    const mEndStr=String(mEnd).padStart(2,'0');
    const key=`percentage_${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}-${hEndStr}${mEndStr}`;
    slots.push(`${key}="${t>=onFrom&&t<onTo?onVal:offVal}"`);
  }}
  return slots.join(' ');
}
const KONTOR_VENT_PROFILE=makeProfile(7,17,100,30);
const KONTOR_LYS_PROFILE=makeProfile(7,17,100,0);
const KONTOR_TAP_PROFILE=makeProfile(7,17,100,0);

function sfpLookup(y){
  if(!y||isNaN(y))return 2.0;
  const yr=parseInt(y);
  if(yr<2000)return 4.0;if(yr<=2009)return 3.0;if(yr<=2019)return 2.5;return 2.0;
}
// SIMIEN godtek berre desse fire kodane i building_code. TEK17 finst ikkje som
// eigen kode der — energikrava i TEK17 er dei same som kom i TEK10 §14 frå 2016,
// og SIMIEN kallar dei 'tek16'. Ein 'tek17' her gjer at SIMIEN nektar å opne
// energimerket: «Value must be one of: tek16, tek10, tek07, tek97».
function tekKode(y){
  const yr=parseInt(y);
  if(yr<=2006)return'tek97';if(yr<=2009)return'tek07';if(yr<=2015)return'tek10';return'tek16';
}

