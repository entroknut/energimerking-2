// ── Window management ─────────────────────────────────────────
// Snap for draw mode: corners (green square) or edges (purple diamond)
// ── Snapping ─────────────────────────────────────────────────
// Prioritert: eigne punkt under teikning → sonehjørne → hjørne i sjølve
// planteikninga → sonekant. Hjørne i teikninga vert funne med ein Harris-
// detektor i eit lite vindauge rundt peikaren, så snapping verkar òg før
// nokon soner finst — t.d. under kalibrering og kontrollmåling.
let snapEnabled=true;
let _snapBlocked=false;
let _lineCv=null,_lineCtx=null;
let LINE_MIN_FRAC=0.35; // kor stor del av vindauget ei linje må dekkje
const SNAP_R={point:15,corner:15,imgcorner:13,edge:9};

// Veggkryss-snap: ser etter LANGE rette strekar i eit vindauge og snappar til
// krysset mellom dei. På skanna arkitektteikningar er veggane tynne (1–2 px),
// men dei går tvers gjennom vindauget — medan tekst, møblar og målelinjer gir
// korte strekar. Difor treffer dette veggane og overser resten, der ein rein
// hjørnedetektor lett låser seg til næraste bokstav.
// Kven snappinga skal sjå på: null = alt, 'aktiv' = berre det aktive arket,
// 'syster' = berre systerarka (delplanar). Brukt av «Plasser delplan».
let _snapKjelde=null;
function imgLineSnap(sx,sy){
  if(!snapEnabled||_snapBlocked)return null;
  if(bgImg&&_snapKjelde!=='syster'){
    const _ip=s2i(sx,sy),_R=Math.max(10,Math.round(SNAP_R.imgcorner/sc));
    const r=_linjeKryss(bgImg,_ip,_R)||(mode==='rett-ut'&&!_snapBlocked?_linjeKryssSkeiv(bgImg,_ip,_R):null);
    if(r){const sp=i2s(r.x,r.y);return{x:r.x,y:r.y,type:'imgcorner',sx:sp.x,sy:sp.y};}
  }
  // Delplanar: veggkryss i systerteikningane, der det aktive arket er blankt
  // eller sluttar. Søket går i biletpikslane til systerarket, og treffet vert
  // rekna attende til det aktive arket.
  if(_snapKjelde==='aktiv')return null;
  for(const f of synlegeSysterark()){
    if(!f.bgImg)continue;
    const k=_arkK(f);
    const r=_linjeKryss(f.bgImg,aktivTilArk(s2i(sx,sy),f),Math.max(10,Math.round(SNAP_R.imgcorner/(sc*k))));
    if(_snapBlocked)return null;
    if(!r)continue;
    const a=arkTilAktiv(r,f),sp=i2s(a.x,a.y);
    return{x:a.x,y:a.y,type:'imgcorner',sx:sp.x,sy:sp.y,ark:f};
  }
  return null;
}
// Linjekrysset nærast ip (biletpikslar på img), eller null. Rimg er
// søkeradien i biletpikslar.
// Utsnittet rundt ip, skalert til maks 81×81, som gråtonar med terskel.
// Null ved for lite kontrast eller utanfor biletet.
function _snapVindauge(img,ip,Rimg){
  const iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
  if(!iw||!ih)return null;
  const src=Rimg*2+1;
  const W=Math.max(21,Math.min(81,src)|1);
  const x0=Math.round(ip.x)-Rimg,y0=Math.round(ip.y)-Rimg;
  if(x0<0||y0<0||x0+src>=iw||y0+src>=ih)return null;
  if(!_lineCv){
    _lineCv=document.createElement('canvas');_lineCv.width=_lineCv.height=81;
    _lineCtx=_lineCv.getContext('2d',{willReadFrequently:true});
  }
  let d;
  try{
    _lineCtx.fillStyle='#fff';_lineCtx.fillRect(0,0,W,W);
    _lineCtx.drawImage(img,x0,y0,src,src,0,0,W,W);
    d=_lineCtx.getImageData(0,0,W,W).data;
  }catch(e){_snapBlocked=true;return null;}
  const n=W*W,g=new Float32Array(n);
  let mn=255,mx=0;
  for(let i=0;i<n;i++){
    const v=d[i*4]*0.299+d[i*4+1]*0.587+d[i*4+2]*0.114;
    g[i]=v;if(v<mn)mn=v;if(v>mx)mx=v;
  }
  if(mx-mn<25)return null;                    // for lite kontrast
  const t=mn+(mx-mn)*0.45;                    // terskel mellom papir og strek
  return{g,W,t,x0,y0,src};
}
function _linjeKryss(img,ip,Rimg){
  const v=_snapVindauge(img,ip,Rimg);
  if(!v)return null;
  const{g,W,t,x0,y0,src}=v;
  // Lengste SAMANHENGANDE strek per rad/kolonne — ikkje totalt tal mørke
  // pikslar. Ei tekstlinje har like mange mørke pikslar som ein vegg, men
  // oppstykka i bokstavar; ein vegg er ubroten. Små hol (1 px) vert tolererte
  // for å tåle skannestøy.
  const rowC=new Int32Array(W),colC=new Int32Array(W);
  for(let y=0;y<W;y++){
    let best=0,cur=0,hol=0;
    for(let x=0;x<W;x++){
      if(g[y*W+x]<t){cur++;hol=0;if(cur>best)best=cur;}
      else if(cur&&hol===0){hol=1;cur++;}
      else{cur=0;hol=0;}
    }
    rowC[y]=best;
  }
  for(let x=0;x<W;x++){
    let best=0,cur=0,hol=0;
    for(let y=0;y<W;y++){
      if(g[y*W+x]<t){cur++;hol=0;if(cur>best)best=cur;}
      else if(cur&&hol===0){hol=1;cur++;}
      else{cur=0;hol=0;}
    }
    colC[x]=best;
  }
  // Ei linje må dekkje ein god del av vindauget — veggar gjer det, tekst ikkje.
  // Ved eit hjørne endar begge strekane midt i vindauget, så kravet kan ikkje
  // vere mykje over halvparten.
  const need=Math.max(6,Math.round(W*LINE_MIN_FRAC));
  const c=(W-1)/2;
  // Finn beste linje: grupper naboradar (2px strek) og vel den nærast midten
  function finnLinje(cnt){
    let best=-1,bestScore=-1;
    for(let i=0;i<W;i++){
      if(cnt[i]<need)continue;
      if(i>0&&cnt[i-1]>cnt[i])continue;        // ikkje toppen i gruppa
      if(i<W-1&&cnt[i+1]>cnt[i])continue;
      const dist=Math.abs(i-c);
      const score=cnt[i]/W-0.45*(dist/c);      // lang linje nær midten vinn
      if(score>bestScore){bestScore=score;best=i;}
    }
    return best;
  }
  const hy=finnLinje(rowC),vx=finnLinje(colC);
  if(hy<0||vx<0)return null;                   // treng både vassrett og loddrett
  const f=src/W;
  return{x:x0+vx*f+f/2,y:y0+hy*f+f/2};
}


// Veggkryss i vilkårleg vinkel — berre i «Rett ut», der teikninga per
// definisjon er skeiv. _linjeKryss krev vassrette og loddrette strekar og
// sluttar å finne tynne strekar ved om lag 8°. Same prinsipp her: lengste
// SAMANHENGANDE strek (tekst er oppstykka), no langs linjer i kvar 1,5°.
// Dei to beste linjene med minst 30° imellom vert finjusterte med minste
// kvadrat på dei mørke pikslane langs kvar (ikkje dei rundt krysset, som
// høyrer til begge), og krysset mellom dei er snappunktet.
// Utanfor «Rett ut» står regelen om at ingen snap er betre enn feil snap.
function _linjeKryssSkeiv(img,ip,Rimg){
  const v=_snapVindauge(img,ip,Rimg);
  if(!v)return null;
  const{g,W,t,x0,y0,src}=v;
  const c=(W-1)/2,need=Math.max(6,Math.round(W*LINE_MIN_FRAC));
  let ant=0;for(let i=0;i<W*W;i++)if(g[i]<t)ant++;
  if(ant<need*2)return null;
  const mork=(x,y)=>{const xi=Math.round(x),yi=Math.round(y);return xi>=0&&yi>=0&&xi<W&&yi<W&&g[yi*W+xi]<t;};
  const L=Math.ceil(c*1.42);
  const run=(deg,o)=>{
    const a=deg*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
    const bx=c-dy*o,by=c+dx*o;
    let best=0,cur=0,hol=0;
    for(let s=-L;s<=L;s++){
      if(mork(bx+dx*s,by+dy*s)){cur++;hol=0;if(cur>best)best=cur;}
      else if(cur&&hol===0){hol=1;cur++;}
      else{cur=0;hol=0;}
    }
    return best;
  };
  // Kandidatar: per vinkel, toppane i o med lang nok strek
  const kand=[];
  const R=Math.floor(c);
  for(let deg=0;deg<180;deg+=1.5){
    const rr=[];
    for(let o=-R;o<=R;o++)rr.push(run(deg,o));
    for(let i=0;i<rr.length;i++){
      if(rr[i]<need)continue;
      if(i>0&&rr[i-1]>rr[i])continue;
      if(i<rr.length-1&&rr[i+1]>rr[i])continue;
      const o=i-R;
      kand.push({deg,o,score:rr[i]/W-0.45*(Math.abs(o)/c)});
    }
  }
  if(kand.length<2)return null;
  const diff=(a,b)=>{const v=Math.abs(a-b)%180;return Math.min(v,180-v);};
  const l1=kand.reduce((b,k)=>k.score>b.score?k:b);
  const rest=kand.filter(k=>diff(k.deg,l1.deg)>=30);
  if(!rest.length)return null;
  const l2=rest.reduce((b,k)=>k.score>b.score?k:b);
  // Linje som {p, d}: eit punkt og ein einingsvektor
  const tilLinje=k=>{const a=k.deg*Math.PI/180,d={x:Math.cos(a),y:Math.sin(a)};return{p:{x:c-d.y*k.o,y:c+d.x*k.o},d};};
  const avst=(q,l)=>Math.abs((q.x-l.p.x)*-l.d.y+(q.y-l.p.y)*l.d.x);
  const tilpass=(l,anna)=>{
    let sx=0,sy=0,n=0;const pts=[];
    for(let y=0;y<W;y++)for(let x=0;x<W;x++){
      if(g[y*W+x]>=t)continue;
      const q={x,y};
      if(avst(q,l)<=2.5&&avst(q,anna)>4){pts.push(q);sx+=x;sy+=y;n++;}
    }
    if(n<5)return l;
    const mx=sx/n,my=sy/n;let xx=0,xy=0,yy=0;
    pts.forEach(q=>{const a=q.x-mx,b=q.y-my;xx+=a*a;xy+=a*b;yy+=b*b;});
    const ang=0.5*Math.atan2(2*xy,xx-yy);
    return{p:{x:mx,y:my},d:{x:Math.cos(ang),y:Math.sin(ang)}};
  };
  let a=tilLinje(l1),b=tilLinje(l2);
  // Fleire rundar: på ein tjukk strek dreg kvar runde linja nærare midten
  for(let it=0;it<5;it++){const na=tilpass(a,b),nb=tilpass(b,a);a=na;b=nb;}
  const det=a.d.x*b.d.y-a.d.y*b.d.x;
  if(Math.abs(det)<0.3)return null;            // under ~17° imellom etter tilpassinga
  const s=((b.p.x-a.p.x)*b.d.y-(b.p.y-a.p.y)*b.d.x)/det;
  const X=a.p.x+a.d.x*s,Y=a.p.y+a.d.y*s;
  if(X<0||Y<0||X>W-1||Y>W-1)return null;
  const f=src/W;
  return{x:x0+X*f+f/2,y:y0+Y*f+f/2};
}


// Samla snap. ownPts = punkta i den pågåande teikninga (høgste prioritet).
function unifiedSnap(sx,sy,ownPts){
  if(!snapEnabled)return null;
  // På eit fasadeark finst ingen soner å snappe til — berre eigne punkt og
  // veggkryss i sjølve teikninga. Sonene ville dessutan lege på heilt andre
  // koordinatar, sidan arket er ei anna teikning.
  const _sz=(iFasade()||_snapKjelde==='syster')?[]:zones;
  // Sonene på systerarka (delplanar), omrekna til det aktive arket
  const _ss=_snapKjelde==='aktiv'?[]:systerSoner();
  let bd,b;
  if(ownPts&&ownPts.length){
    bd=SNAP_R.point;b=null;
    ownPts.forEach(p=>{
      const sp=i2s(p.x,p.y),dd=Math.hypot(sx-sp.x,sy-sp.y);
      if(dd<bd){bd=dd;b={x:p.x,y:p.y,type:'point',sx:sp.x,sy:sp.y};}
    });
    if(b)return b;
  }
  bd=SNAP_R.corner;b=null;
  _sz.forEach(z=>{if(z.skjult)return;z.pts.forEach(p=>{
    const sp=i2s(p.x,p.y),dd=Math.hypot(sx-sp.x,sy-sp.y);
    if(dd<bd){bd=dd;b={x:p.x,y:p.y,type:'corner',sx:sp.x,sy:sp.y};}
  });});
  _ss.forEach(o=>o.pts.forEach(p=>{
    const sp=i2s(p.x,p.y),dd=Math.hypot(sx-sp.x,sy-sp.y);
    if(dd<bd){bd=dd;b={x:p.x,y:p.y,type:'corner',sx:sp.x,sy:sp.y,ark:o.ark};}
  }));
  if(b)return b;
  const il=imgLineSnap(sx,sy);
  if(il&&Math.hypot(sx-il.sx,sy-il.sy)<=SNAP_R.imgcorner)return il;
  bd=SNAP_R.edge;b=null;
  [..._sz,..._ss].forEach(z=>{
    if(z.skjult)return;
    for(let i=0;i<z.pts.length;i++){
      const p1=z.pts[i],p2=z.pts[(i+1)%z.pts.length];
      const s1=i2s(p1.x,p1.y),s2=i2s(p2.x,p2.y);
      const dx=s2.x-s1.x,dy=s2.y-s1.y,len=Math.hypot(dx,dy);
      if(len<1)continue;
      const t=((sx-s1.x)*dx+(sy-s1.y)*dy)/(len*len);
      if(t<=0||t>=1)continue;
      const px=s1.x+t*dx,py=s1.y+t*dy,dd=Math.hypot(sx-px,sy-py);
      if(dd<bd){bd=dd;const ipp=s2i(px,py);b={x:ipp.x,y:ipp.y,type:'edge',sx:px,sy:py,ark:z.ark};}
    }
  });
  return b;
}
// Teiknar snap-markøren. Form etter type, farge etter modus.
function drawSnapMarker(sp,type,col){
  ctx.save();
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.fillStyle=col.replace('rgb','rgba').replace(')',',.15)');
  if(type==='corner'||type==='point'){
    const r=7;ctx.beginPath();ctx.rect(sp.x-r,sp.y-r,r*2,r*2);ctx.stroke();ctx.fill();
  } else if(type==='imgcorner'){
    ctx.beginPath();ctx.arc(sp.x,sp.y,7,0,Math.PI*2);ctx.stroke();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sp.x-10,sp.y);ctx.lineTo(sp.x-3,sp.y);ctx.moveTo(sp.x+3,sp.y);ctx.lineTo(sp.x+10,sp.y);
    ctx.moveTo(sp.x,sp.y-10);ctx.lineTo(sp.x,sp.y-3);ctx.moveTo(sp.x,sp.y+3);ctx.lineTo(sp.x,sp.y+10);
    ctx.lineWidth=1.5;ctx.stroke();
  } else {
    const r=6;ctx.beginPath();
    ctx.moveTo(sp.x,sp.y-r);ctx.lineTo(sp.x+r,sp.y);ctx.lineTo(sp.x,sp.y+r);ctx.lineTo(sp.x-r,sp.y);
    ctx.closePath();ctx.stroke();ctx.fill();
  }
  ctx.restore();
}


// Find the closest segment to a screen point, and the projected t (0-1) along it
function snapToSegment(sx,sy){
  if(iFasade())return null;
  const ip=s2i(sx,sy);
  let best=null,bestD=Infinity;
  zones.forEach((z,zi)=>{
    if(z.skjult)return;
    const segs=calcSegments(z.pts)||[];
    segs.forEach(seg=>{
      // Distance from point to infinite line of segment
      const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
      const len=Math.hypot(dx,dy);if(len<1)return;
      const ux=dx/len,uy=dy/len;
      // Project point onto segment
      const t=((ip.x-seg.p1.x)*ux+(ip.y-seg.p1.y)*uy)/len;
      const tc=Math.max(0,Math.min(1,t));
      // Closest point on segment
      const cx2=seg.p1.x+ux*tc*len,cy2=seg.p1.y+uy*tc*len;
      const d=Math.hypot(ip.x-cx2,ip.y-cy2);
      if(d<bestD){bestD=d;best={zi,seg,t:tc,cx:cx2,cy:cy2,ux,uy,len,dx,dy};}
    });
  });
  // Accept snap within 40 image pixels (generous, scales with zoom via sc)
  if(!best||bestD>40/sc*1)return null;
  return best;
}

// Snap screen point to closest segment, return screen coords of snapped point
function snapScreenToSegment(sx,sy){
  const snap=snapToSegment(sx,sy);
  if(!snap)return{x:sx,y:sy,snap:null};
  const snappedScreen=i2s(snap.cx,snap.cy);
  return{x:snappedScreen.x,y:snappedScreen.y,snap};
}

document.getElementById('winOk').onclick=()=>{
  if(!pendingWin)return;
  // Negative/ugyldige verdiar fell tilbake til standard
  const _posI=(id,dflt)=>{const v=parseInt(document.getElementById(id).value);return v>0?v:dflt;};
  const w=_posI('winW',1200);
  const h=_posI('winH',1200);
  const type=document.getElementById('winType').value;
  // SIMIEN har ikkje antal på <door> — dører er alltid éi og éi
  const n=type==='dor'?1:_posI('winN',1);
  zones[pendingWin.zi].windows=zones[pendingWin.zi].windows||[];
  snapshot();
  const _existW=zones[pendingWin.zi].windows;
  const _typeL=type==='dor'?'Dør':'Vindauge';
  const _autoN=_typeL+' '+(_existW.filter(x=>x.type===type).length+1);
  const _wname=(document.getElementById('winName').value||'').trim()||_autoN;
  const _brystCb=document.getElementById('winBrystCb');
  const _brystVal=parseInt(document.getElementById('winBryst').value);
  const _brystMm=(type!=='dor'&&_brystCb.checked&&!isNaN(_brystVal))?Math.max(0,_brystVal):null;
  const _ny={segIdx:pendingWin.segIdx,dir:pendingWin.dir,t0:pendingWin.t0,t1:pendingWin.t1,breddeMm:w,hoyMm:h,antal:n,type,name:_wname,brystningMm:_brystMm,posT:null};
  _existW.push(_ny);
  const _z=zones[pendingWin.zi];
  pendingWin=null;winPts=[];
  winOverlay.classList.remove('show');
  markerNyeStk(_ny,Array.from({length:n},(_,i)=>i));
  updateResults();renderTable();draw();
  // Ei gruppe: stykket brukaren teikna står der det vart teikna, resten vert
  // fordelte utover veggen derifrå. Får dei ikkje plass rundt det, fell gruppa
  // tilbake til jamn fordeling — og er ho breiare enn veggen, seier vi frå med
  // ein gong, for tala går rett inn i energimerket.
  if(n>1){
    const g=winGeom(_z,_ny);
    const _c=(_ny.t0+_ny.t1)/2;
    _ny.posT=winPosFraKlikk(_c,n,g.width,g.segLen,winOpptekne(_z,_ny,g.segLen,g.mpp));
    winMerkTeikna(_ny,_c);
    if(_ny.posT)winSyncAnchor(_ny,g.width,g.segLen);
    hintText.textContent=(g.mpp&&winForTrongt(_ny,g.width,g.segLen))
      ?`⚠ ${n} × ${w} mm er breiare enn veggen (${(g.segLen*(g.mpp||0)/1000).toFixed(2)} m) — stykka overlappar. Sjekk breidda eller antalet.`
      :_ny.posT
        ?`${n} stk: det teikna står der du sette det, resten fordelte utover fasaden — drag ei enkelt stk for å flytte henne.`
        :`${n} stk fordelte jamnt utover fasaden (ikkje plass rundt det teikna og vindauga som alt står der) — sjekk at dei ikkje ligg oppå kvarandre.`;
  }
};
document.getElementById('winCancel').onclick=()=>{winOverlay.classList.remove('show');winPts=[];pendingWin=null;draw();};

