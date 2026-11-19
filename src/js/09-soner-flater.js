// ── Zone management ───────────────────────────────────────────
function finishZone(){
  if(curPts.length<3)return;
  snapshot();markDirty();
  const nz={name:'Sone '+(++_nextZoneId),pts:[...curPts],windows:[],skillevegg:new Set(),zoneConnections:new Map(),takflater:[],gulvflater:[],gavlflater:[]};
  if(piBygg.byggeaar)nz.byggeaar=piBygg.byggeaar;   // byggeåret frå EntroPi
  zones.push(nz);
  curPts=[];
  const skTal=autoSkilleveggForNySone(nz);
  updateResults();renderTable();draw();
  hintText.textContent=nz.name+' lagt til!'+(skTal?' '+(skTal===1?'1 vegg':skTal+' veggar')+' mot nabosone vart skiljekonstruksjon.':'');
}

function finishTakflate(){
  if(takflatePts.length<3||!activeTakflateZone)return;
  snapshot();markDirty();
  if(!activeTakflateZone.takflater)activeTakflateZone.takflater=[];
  const idx=activeTakflateZone.takflater.length+1;
  activeTakflateZone.takflater.push({id:'tf_'+Date.now(),pts:[...takflatePts],type:'Tak',vinkel:30,retning:180,name:'Takflate '+idx});
  takflatePts=[];activeTakflateZone=null;
  updateResults();renderTable();draw();
  setMode('navigate');
  hintText.textContent='Takflate lagt til! Set vinkel og retning i sone-panelet.';
}

// ── Klippeverktøy for takflater (DEAKTIVERT — KLIPP_TAKFLATE_ENA=false) ────
// a1-a2 = klippelja (uendeleg — t er ubegrensa)
// b1-b2 = polygon-kant (u må vera i [0,1])
function _lineSegIntersect2D(a1,a2,b1,b2){
  const d1={x:a2.x-a1.x,y:a2.y-a1.y};
  const d2={x:b2.x-b1.x,y:b2.y-b1.y};
  const cross=d1.x*d2.y-d1.y*d2.x;
  if(Math.abs(cross)<1e-10)return null;
  const u=((b1.x-a1.x)*d1.y-(b1.y-a1.y)*d1.x)/cross;
  if(u<0||u>1)return null;
  const t=((b1.x-a1.x)*d2.y-(b1.y-a1.y)*d2.x)/cross;
  return{x:a1.x+t*d1.x,y:a1.y+t*d1.y};
}
function _splitPolygonByLine(poly,lp1,lp2){
  const crossings=[];
  for(let i=0;i<poly.length;i++){
    const p1=poly[i],p2=poly[(i+1)%poly.length];
    const ix=_lineSegIntersect2D(lp1,lp2,p1,p2);
    if(ix)crossings.push({i,pt:{x:ix.x,y:ix.y}});
  }
  if(crossings.length<2)return null;
  crossings.sort((a,b)=>a.i-b.i);
  const c1=crossings[0],c2=crossings[crossings.length-1];
  const poly1=[{...c1.pt}];
  for(let i=c1.i+1;i<=c2.i;i++)poly1.push({...poly[i]});
  poly1.push({...c2.pt});
  const poly2=[{...c2.pt}];
  for(let i=c2.i+1;i<poly.length;i++)poly2.push({...poly[i]});
  for(let i=0;i<=c1.i;i++)poly2.push({...poly[i]});
  poly2.push({...c1.pt});
  if(poly1.length<3||poly2.length<3)return null;
  return[poly1,poly2];
}

// Justerer pts og takflater-pts for offset-forskjell mellom to etasjar.
// Nødvendig ved kopiering av soner mellom etasjar som er justerte med ghost-funksjonen.
function _adjustPtsForFloorOffset(copy, srcFloor, dstFloor){
  // floorDxImg er allereie i biletpikslar — ingen sc-divisjon nødvendig
  const dx=(srcFloor.floorDxImg||0)-(dstFloor.floorDxImg||0);
  const dy=(srcFloor.floorDyImg||0)-(dstFloor.floorDyImg||0);
  if(!dx&&!dy)return;
  copy.pts=(copy.pts||[]).map(p=>({x:p.x+dx,y:p.y+dy}));
  [...(copy.takflater||[]),...(copy.gulvflater||[])].forEach(fl=>{
    fl.pts=(fl.pts||[]).map(p=>({x:p.x+dx,y:p.y+dy}));
  });
}

// Segment × segment interseksjon (begge avgrensa, t ∈ [0,1])
function _segSegIntersect(a1,a2,b1,b2){
  const d1={x:a2.x-a1.x,y:a2.y-a1.y};
  const d2={x:b2.x-b1.x,y:b2.y-b1.y};
  const cross=d1.x*d2.y-d1.y*d2.x;
  if(Math.abs(cross)<1e-10)return null;
  const tA=((b1.x-a1.x)*d2.y-(b1.y-a1.y)*d2.x)/cross;
  const tB=((b1.x-a1.x)*d1.y-(b1.y-a1.y)*d1.x)/cross;
  if(tA<-1e-10||tA>1+1e-10||tB<-1e-10||tB>1+1e-10)return null;
  return{x:a1.x+tA*d1.x,y:a1.y+tA*d1.y,tA,tB};
}

// Del polygon med polylinje — returnerer [poly1, poly2] eller null
// Polygon-strukturen:
//   poly1: c1 → polygon-verteksar (c1→c2) → c2 → klippelinje baklengs → (lukkar til c1)
//   poly2: c2 → polygon-verteksar (c2→c1 rundt) → c1 → klippelinje framlengs → (lukkar til c2)
function _splitPolygonByPolyline(poly,polyline){
  if(!poly||poly.length<3||!polyline||polyline.length<2)return null;
  const crossings=[];
  for(let pi=0;pi<polyline.length-1;pi++){
    const lp1=polyline[pi],lp2=polyline[pi+1];
    for(let ei=0;ei<poly.length;ei++){
      const ep1=poly[ei],ep2=poly[(ei+1)%poly.length];
      const ix=_segSegIntersect(lp1,lp2,ep1,ep2);
      if(ix)crossings.push({polyIdx:pi,edgeIdx:ei,tA:ix.tA,pt:{x:ix.x,y:ix.y}});
    }
  }
  if(crossings.length<2)return null;
  // Sorter etter posisjon langs polylinjen
  crossings.sort((a,b)=>a.polyIdx!==b.polyIdx?a.polyIdx-b.polyIdx:a.tA-b.tA);
  const first=crossings[0],last=crossings[crossings.length-1];
  if(first.edgeIdx===last.edgeIdx)return null;
  // c1 = krysset med lågast polygon-kant-indeks, c2 = høgast
  const c1=first.edgeIdx<last.edgeIdx?first:last;
  const c2=first.edgeIdx<last.edgeIdx?last:first;
  // Indre polylinje-punkt i retning c1→c2 (mellom dei to kryssepunkta)
  const innerFwd=[];
  for(let i=first.polyIdx+1;i<=last.polyIdx;i++)innerFwd.push({...polyline[i]});
  if(c1!==first)innerFwd.reverse(); // polylinjen gjekk c2→c1, snu til c1→c2
  // poly1: c1 → polygon(c1→c2) → c2 → klipp baklengs → (lukkar til c1)
  const poly1=[{...c1.pt}];
  for(let i=c1.edgeIdx+1;i<=c2.edgeIdx;i++)poly1.push({...poly[i]});
  poly1.push({...c2.pt});
  [...innerFwd].reverse().forEach(p=>poly1.push({...p}));
  // poly2: c2 → polygon(c2→c1 rundt) → c1 → klipp framlengs → (lukkar til c2)
  const poly2=[{...c2.pt}];
  for(let i=c2.edgeIdx+1;i<poly.length;i++)poly2.push({...poly[i]});
  for(let i=0;i<=c1.edgeIdx;i++)poly2.push({...poly[i]});
  poly2.push({...c1.pt});
  innerFwd.forEach(p=>poly2.push({...p}));
  if(poly1.length<3||poly2.length<3)return null;
  return[poly1,poly2];
}

// ── Flategeometri: hòl midt i flata, og samanslåing ──────────
// Ei flate er alltid EIN ring med punkt. Eit hòl midt i flata vert lagra som
// eit nøkkelhòl: ei smal bru ut til hòlet, hòlet gjennomløpt andre vegen, og
// bru tilbake. Brua har null areal, så både shoelace-arealet (calcAreaM2) og
// canvas-fyllet (nonzero winding) vert rett — og vi slepp å innføre fleire
// ringar i datamodellen, som ville ha råka teikning, 3D, eksport og lagring.
const _FLATE_TOL=0.25;                                 // biletpikslar
const _pk=p=>p.x.toFixed(2)+','+p.y.toFixed(2);        // punktnøkkel

function _ringAreaSigned(pts){
  let a=0;
  for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;}
  return a/2;
}

// Ligg brua fritt? Vi krympar henne litt i begge endar, elles ville kantane
// som deler endepunkt telje som treff.
function _bruaFri(a,b,ringar){
  const dx=b.x-a.x,dy=b.y-a.y;
  const p1={x:a.x+dx*0.001,y:a.y+dy*0.001};
  const p2={x:a.x+dx*0.999,y:a.y+dy*0.999};
  for(const r of ringar){
    for(let i=0;i<r.length;i++){
      if(_segSegIntersect(p1,p2,r[i],r[(i+1)%r.length]))return false;
    }
  }
  return true;
}

// Byggjer eit nøkkelhòl-polygon av ytterring + hòlring.
function _byggNokkelhol(poly,hole){
  // Hòlet må gå motsett veg av ytterkanten for at arealet skal trekkjast frå
  const h=(_ringAreaSigned(hole)>0)===(_ringAreaSigned(poly)>0)?[...hole].reverse():[...hole];
  // Prøv dei næraste hjørneparaa fyrst, men berre bruer som ligg fritt
  const par=[];
  poly.forEach((a,i)=>h.forEach((b,j)=>par.push({i,j,d:Math.hypot(a.x-b.x,a.y-b.y)})));
  par.sort((m,n)=>m.d-n.d);
  for(const{i,j}of par.slice(0,400)){
    const a=poly[i],b=h[j];
    if(!_bruaFri(a,b,[poly,h]))continue;
    const midt={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    if(!pointInPolygon(midt,poly)||pointInPolygon(midt,h))continue;
    const ut=[];
    for(let k=0;k<=i;k++)ut.push({...poly[k]});
    for(let k=0;k<=h.length;k++)ut.push({...h[(j+k)%h.length]});
    ut.push({...poly[i]});
    for(let k=i+1;k<poly.length;k++)ut.push({...poly[k]});
    return ut;
  }
  return null;
}

// Konturane i eit flatepolygon, utan bru-kantane i eit nøkkelhòl.
// Brua er to motsette kantar oppå kvarandre; å teikne henne ville gitt ein
// strek tvers over flata som ikkje finst i bygget. Fyllet skal derimot
// bruke heile ringen — det er brua som gjer at hòlet ikkje vert fylt.
function flateKonturar(pts){
  const n=pts.length;
  const finst=new Set();
  for(let i=0;i<n;i++)finst.add(_pk(pts[i])+'|'+_pk(pts[(i+1)%n]));
  const behald=[];
  for(let i=0;i<n;i++)behald.push(!finst.has(_pk(pts[(i+1)%n])+'|'+_pk(pts[i])));
  const start=behald.indexOf(false);
  if(start<0)return{lukka:true,deler:[pts]};      // vanleg polygon
  const deler=[];let cur=null;
  for(let k=1;k<=n;k++){
    const i=(start+k)%n;
    if(behald[i]){
      if(!cur){cur=[pts[i]];deler.push(cur);}
      cur.push(pts[(i+1)%n]);
    } else cur=null;
  }
  return{lukka:false,deler};
}

// Eit punkt godt inne i flata, til merkelappen. Tyngdepunktet til eit
// nøkkelhòl-polygon kan hamne midt i sjølve hòlet.
function flateMerkepunkt(pts){
  const cx=pts.reduce((t,p)=>t+p.x,0)/pts.length;
  const cy=pts.reduce((t,p)=>t+p.y,0)/pts.length;
  if(pointInPolygon({x:cx,y:cy},pts))return{x:cx,y:cy};
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  pts.forEach(p=>{minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);});
  let best=null,bestD=-1;
  for(let i=1;i<10;i++)for(let j=1;j<10;j++){
    const q={x:minX+(maxX-minX)*i/10,y:minY+(maxY-minY)*j/10};
    if(!pointInPolygon(q,pts))continue;
    let d=Infinity;
    for(let k=0;k<pts.length;k++){
      const a=pts[k],b=pts[(k+1)%pts.length];
      const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy;
      const t=L2<1e-9?0:Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/L2));
      d=Math.min(d,Math.hypot(q.x-(a.x+dx*t),q.y-(a.y+dy*t)));
    }
    if(d>bestD){bestD=d;best=q;}
  }
  return best||{x:cx,y:cy};
}

// Klipp ein bit ut MIDT i ei flate. `loop` er ei lukka sløyfe heilt inne i
// polygonet. Returnerer [restenMedNøkkelhòl, biten] eller null.
function _splitPolygonByHole(poly,loop){
  if(!poly||poly.length<3||!loop||loop.length<3)return null;
  for(const p of loop)if(!pointInPolygon(p,poly))return null;
  // Sløyfa må ikkje krysse kanten — då er det eit vanleg gjennomgåande kutt
  for(let i=0;i<loop.length;i++){
    const a=loop[i],b=loop[(i+1)%loop.length];
    for(let j=0;j<poly.length;j++){
      if(_segSegIntersect(a,b,poly[j],poly[(j+1)%poly.length]))return null;
    }
  }
  if(Math.abs(_ringAreaSigned(loop))<1)return null;   // for lite til å vere ein bit
  const ytre=_byggNokkelhol(poly,loop);
  if(!ytre)return null;
  return[ytre,loop.map(p=>({...p}))];
}

// Slår saman to flatepolygon som deler ein kant.
//
// Metoden er kantkansellering: kantar som finst i begge polygona, men i kvar
// si retning, er innvendige og fell bort; det som står att er ytterkanten av
// summen. Det handterer nøkkelhòl heilt av seg sjølv — brua er to motsette
// kantar og kansellerer seg sjølv når hòlet vert lagt tilbake.
function _unionPolygons(a,b){
  // 1. Del kantane ved motpartens hjørne, så delte kantar vert identiske.
  //    Vi set inn motpartens PUNKT, ikkje projeksjonen, så nøklane matchar.
  const refine=(poly,other)=>{
    const ut=[];
    for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length];
      ut.push({...p});
      const dx=q.x-p.x,dy=q.y-p.y,L2=dx*dx+dy*dy;
      if(L2<1e-9)continue;
      const paa=[];
      other.forEach(o=>{
        const t=((o.x-p.x)*dx+(o.y-p.y)*dy)/L2;
        if(t<=1e-6||t>=1-1e-6)return;
        if(Math.hypot(o.x-(p.x+dx*t),o.y-(p.y+dy*t))>_FLATE_TOL)return;
        paa.push({t,pt:{...o}});
      });
      paa.sort((m,n)=>m.t-n.t);
      let sist=-1;
      paa.forEach(({t,pt})=>{if(t-sist>1e-6){ut.push(pt);sist=t;}});
    }
    return ut;
  };
  const A=refine(a,b),B=refine(b,a);

  // 2. Kanseller motsette kantar
  const kantar=new Map();
  const legg=(p,q)=>{
    const kp=_pk(p),kq=_pk(q);
    if(kp===kq)return;
    const rev=kq+'|'+kp;
    if(kantar.has(rev)){kantar.delete(rev);return;}
    kantar.set(kp+'|'+kq,{p:{...p},q:{...q}});
  };
  [A,B].forEach(r=>{for(let i=0;i<r.length;i++)legg(r[i],r[(i+1)%r.length]);});
  if(!kantar.size)return null;

  // 3. Spor sløyfene som står att
  const fraa=new Map();
  kantar.forEach(e=>{const k=_pk(e.p);if(!fraa.has(k))fraa.set(k,[]);fraa.get(k).push(e);});
  const brukt=new Set(),loops=[];
  const ek=e=>_pk(e.p)+'|'+_pk(e.q);
  kantar.forEach(start=>{
    if(brukt.has(ek(start)))return;
    const loop=[];let cur=start,vakt=0;
    while(cur&&vakt++<20000){
      const k=ek(cur);
      if(brukt.has(k))break;
      brukt.add(k);
      loop.push({...cur.p});
      cur=(fraa.get(_pk(cur.q))||[]).find(x=>!brukt.has(ek(x)));
    }
    if(loop.length>=3)loops.push(loop);
  });
  if(!loops.length)return null;

  // 4. Største sløyfa er ytterkanten; eventuelle andre er hòl
  loops.sort((x,y)=>Math.abs(_ringAreaSigned(y))-Math.abs(_ringAreaSigned(x)));
  let ut=loops[0];
  for(let i=1;i<loops.length;i++){
    const nytt=_byggNokkelhol(ut,loops[i]);
    if(!nytt)return null;
    ut=nytt;
  }
  return ut;
}

// Samanslåing med fasitsjekk: arealet av resultatet MÅ vere summen av dei to.
// Er det ikkje det, har sporinga gått feil — då er det betre å seie frå enn å
// skrive eit polygon vi ikkje stolar på inn i energimerket.
function _slaaSamanPolygon(aPts,bPts){
  const ut=_unionPolygons(aPts,bPts);
  if(!ut||ut.length<3)return null;
  const forventa=Math.abs(_ringAreaSigned(aPts))+Math.abs(_ringAreaSigned(bPts));
  const fekk=Math.abs(_ringAreaSigned(ut));
  if(!(forventa>0)||Math.abs(fekk-forventa)/forventa>0.005)return null;
  return ut;
}

// Lengda (biletpikslar) av den felles kanten mellom to flatepolygon.
// Brukt til å finne kva nabo ei sletta flate skal gå tilbake til.
function _felleskantLen(aPts,bPts){
  let sum=0;
  for(let i=0;i<aPts.length;i++){
    const p=aPts[i],q=aPts[(i+1)%aPts.length];
    const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
    for(let j=0;j<bPts.length;j++){
      const r=bPts[j],t2=bPts[(j+1)%bPts.length];
      const dx=t2.x-r.x,dy=t2.y-r.y,L2=dx*dx+dy*dy;
      if(L2<1e-9)continue;
      let t=((mx-r.x)*dx+(my-r.y)*dy)/L2;
      if(t<-1e-6||t>1+1e-6)continue;
      t=Math.max(0,Math.min(1,t));
      if(Math.hypot(mx-(r.x+dx*t),my-(r.y+dy*t))>_FLATE_TOL)continue;
      sum+=Math.hypot(q.x-p.x,q.y-p.y);break;
    }
  }
  return sum;
}

// Sett sona sin eigen type frå den største flata og fjern oppdelinga.
// Brukt av «↺ Slå saman» og av sletting av den siste flata — begge stader
// skal sona ende opp heilt dekt av éin type, ikkje utan tak eller golv.
function _fjernFlateoppdeling(z,kind){
  const F=FLATE[kind];
  let best=null,bestA=-1;
  flateListe(z,kind).forEach(fl=>{const a=flateAreaM2(z,fl);if(a>bestA){bestA=a;best=fl;}});
  if(best){
    const bt=flateType(z,kind,best);
    z[F.zoneFelt]=bt;
    if(kind==='tak')z.takvinkel=(bt==='Tak'&&best.vinkel>0)?best.vinkel:null;
  }
  z[F.arr]=[];
  if(kind==='tak')z.gavlflater=[];
  return z[F.zoneFelt]||F.std;
}

// Slettar ei flate og gir arealet tilbake til nabo­flata, slik at sona alltid
// er heilt dekt av tak og golv. Returnerer ei melding, eller null om
// samanslåinga ikkje lét seg gjere (då står flata att).
function slettFlate(z,kind,idx){
  const F=FLATE[kind];
  const arr=z[F.arr]||[];
  const fl=arr[idx];
  if(!fl)return null;
  const namn=fl.name||F.lbl;
  // Siste flata: oppdelinga forsvinn, og sona er dekt av éin type igjen
  if(arr.length===1){
    snapshot();
    const t=_fjernFlateoppdeling(z,kind);
    return 'Oppdelinga av '+F.eining+' er fjerna — heile flata er no «'+t+'».';
  }
  // Nabo med lengst felles kant arvar arealet
  let best=-1,bestLen=0;
  arr.forEach((g,i)=>{
    if(i===idx)return;
    const L=_felleskantLen(fl.pts,g.pts);
    if(L>bestLen){bestLen=L;best=i;}
  });
  if(best<0)return '⚠ «'+namn+'» grensar ikkje til nokon annan flate, så arealet har ingen stad å gå. Bruk «↺ Slå saman» for å nullstille oppdelinga.';
  const nyPts=_slaaSamanPolygon(arr[best].pts,fl.pts);
  if(!nyPts)return '⚠ Klarte ikkje å slå «'+namn+'» saman med «'+(arr[best].name||F.lbl)+'» utan å endre arealet. Flata står att — bruk «↺ Slå saman» om du vil starte oppdelinga på nytt.';
  snapshot();
  const tilNamn=arr[best].name||F.lbl;
  arr[best].pts=nyPts;
  arr.splice(idx,1);
  if(kind==='tak')z.gavlflater=[];
  return '«'+namn+'» er sletta — arealet gjekk til «'+tilNamn+'».';
}

// Held gavlflater i sync: om dei er berekna, oppdater dei. Kallast etter takflate-endringar.
function _syncGavlflater(z){
  if((z.gavlflater||[]).length>0)z.gavlflater=_calcGavlflater(z);
}

// Bereknar gavlflater (trekant-fasadar over veggtopp) ut frå sona sine takflater.
// Returnerer array med {segIdx, profile:[{t,h}], area, lenM} per ytterfasade-segment.
function _calcGavlflater(z){
  const _mpp=mppForZone(z);
  if(!_mpp||(z.takflater||[]).length===0)return[];
  const segs=calcSegments(z.pts,getHoyde(z),_mpp)||[];
  const sk=z.skillevegg||new Set();
  const mpp=_mpp;
  // Bestem innadpeikande normal for sona (for å offset testp. litt inni sona)
  let area2=0;
  z.pts.forEach((p1,i)=>{const p2=z.pts[(i+1)%z.pts.length];area2+=p1.x*p2.y-p2.x*p1.y;});
  const gavlflater=[];
  segs.forEach(seg=>{
    if(sk.has(seg.idx))return;
    const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
    const len=Math.hypot(dx,dy);if(len<1)return;
    // Innadpeikande normallvektor (eps pixlar inn i sona)
    const inX=area2>0?-dy/len:dy/len;
    const inY=area2>0?dx/len:-dx/len;
    const eps=3;
    const T=16;
    const profile=[];
    for(let i=0;i<=T;i++){
      const t=i/T;
      const imgX=seg.p1.x+dx*t,imgY=seg.p1.y+dy*t;
      const testX=imgX+inX*eps,testY=imgY+inY*eps;
      let maxH=0;
      (z.takflater||[]).forEach(tf=>{
        if(!tf.pts||tf.pts.length<3)return;
        // Ei himling mot ei anna sone er flat og gir ingen gavl
        if(flateType(z,'tak',tf)!=='Tak')return;
        if(!pointInPolygon({x:testX,y:testY},tf.pts))return;
        const tanV=Math.tan((tf.vinkel||0)*Math.PI/180);
        if(tanV<0.001)return;
        // tf.retning er kompass-asimut; legg til nord-rotasjonen for å få bilderetning
        // (calcSegments trekkjer nd frå — dette er inversen)
        const retRad=((tf.retning||0)+(parseFloat(northI.value)||0))*Math.PI/180;
        const ux=-Math.sin(retRad),uz=Math.cos(retRad);
        let minProj=Infinity;
        tf.pts.forEach(p=>{
          const proj=(p.x*mpp/1000)*ux+(p.y*mpp/1000)*uz;
          if(proj<minProj)minProj=proj;
        });
        const proj=(imgX*mpp/1000)*ux+(imgY*mpp/1000)*uz;
        const h=Math.max(0,(proj-minProj))*tanV;
        if(h>maxH)maxH=h;
      });
      profile.push({t,h:maxH});
    }
    const maxH=Math.max(...profile.map(p=>p.h));
    if(maxH<0.05)return; // Hopp over viss gavlhøgde < 5 cm
    const lenM=seg.lenM||(len*mpp/1000);
    let area=0;
    for(let i=1;i<profile.length;i++){
      const dt=(profile[i].t-profile[i-1].t)*lenM;
      area+=(profile[i-1].h+profile[i].h)/2*dt;
    }
    gavlflater.push({segIdx:seg.idx,profile,area:Math.round(area*100)/100,lenM,dir:seg.dir});
  });
  return gavlflater;
}

// Auto-vel retning for ein takflate basert på næraste YV-fasade til polygonets tyngdepunkt
function _autoRetningForTakflate(roofPts,zone,segs){
  if(!segs||segs.length===0)return 180;
  const sk=zone.skillevegg||new Set();
  const cx=roofPts.reduce((s,p)=>s+p.x,0)/roofPts.length;
  const cy=roofPts.reduce((s,p)=>s+p.y,0)/roofPts.length;
  let minDist=Infinity,bestSeg=null;
  segs.forEach(seg=>{
    if(sk.has(seg.idx))return;
    const dx=seg.p2.x-seg.p1.x,dy=seg.p2.y-seg.p1.y;
    const len=Math.hypot(dx,dy);if(len<1)return;
    const ux=dx/len,uy=dy/len;
    const t=Math.max(0,Math.min(1,((cx-seg.p1.x)*ux+(cy-seg.p1.y)*uy)/len));
    const px=seg.p1.x+ux*t*len,py=seg.p1.y+uy*t*len;
    const d=Math.hypot(cx-px,cy-py);
    if(d<minDist){minDist=d;bestSeg=seg;}
  });
  if(!bestSeg)return 180;
  return Math.round(bestSeg.normalAz/45)*45%360;
}

// ── Tilpass takflater til kvarandre ─────────────────────────────────────────
// Kvar takflate er eitt plan: vinkel + fallretning, med lågaste hjørne på
// raftet. Fallretninga vart vald i 45°-steg, så på ei sone som ikkje står
// heilt i vinkel treffer ikkje plana kvarandre i mønet og gradene.
//
// Referanseflata held vinkelen sin, men fallretninga vert sett nøyaktig
// vinkelrett på raftet hennar. Då er høgda i kvart av hjørna hennar kjend, og
// alle dei andre skrå takflatene vert løyste som plan (h = a·x + b·y + c) med
// minste kvadrat: kvart hjørne har éi felles høgd for alle flatene som rører
// det, sonehjørna ligg på raftet (h = 0). Vinkel og fallretning kjem ut av
// planet. Planteikninga vert ikkje flytta.
//
// Går ikkje linjene i planen opp som eitt tak (t.d. mønet ikkje parallelt med
// raftet), finst det inga eksakt løysing — då vert det største spranget i eit
// hjørne rekna ut frå det som faktisk vart lagra, og meldt.
function _tpRetningFraNed(dx,dy,north){
  // Inversen av 3D-/gavl-formelen: oppover = (-sin R, cos R), R = retning+nord
  const R=Math.atan2(dx,-dy)*180/Math.PI;
  return ((R-north)%360+360)%360;
}
function _tpPlan(tf,north,mpp){
  // Planet slik 3D-modellen og gavlflatene teiknar det, i meter
  const tanV=Math.tan(Math.max(0,tf.vinkel||0)*Math.PI/180);
  const r=((tf.retning||0)+north)*Math.PI/180;
  const ux=-Math.sin(r),uy=Math.cos(r);
  const k=mpp/1000;
  let minP=Infinity;
  tf.pts.forEach(p=>{const pr=p.x*k*ux+p.y*k*uy;if(pr<minP)minP=pr;});
  return p=>Math.max(0,(p.x*k*ux+p.y*k*uy-minP))*tanV;
}
function tilpassTakflater(z,refIdx){
  const mpp=mppForZone(z);
  if(!mpp)return {ok:false,msg:'Kalibrer teikninga fyrst — tilpassinga reknar i meter.'};
  const alle=flateListe(z,'tak');
  const ref=alle[refIdx];
  if(!ref||flateType(z,'tak',ref)!=='Tak'||!((ref.vinkel||0)>0))
    return {ok:false,msg:'Referanseflata må vere tak mot det fri med ein vinkel over 0°.'};
  const andre=alle.filter((tf,i)=>i!==refIdx&&flateType(z,'tak',tf)==='Tak'&&(tf.pts||[]).length>=3);
  if(!andre.length)return {ok:false,msg:'Det finst ingen andre skrå takflater å tilpasse.'};
  const north=parseFloat(northI.value)||0;
  const k=mpp/1000;
  const tolPx=0.05/k;                          // 5 cm
  const avst=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const paaKant=(p,pts)=>{
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
      const t=l2>0?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;
      if(Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t))<=tolPx)return true;
    }
    return false;
  };
  // Sonehjørne der sona faktisk svingar — innsette punkt på ei rett linje
  // (t.d. frå automatisk skiljekonstruksjon) kan liggje på ein gavlvegg.
  const n0=z.pts.length;
  const raftHj=z.pts.filter((p,i)=>{
    const a=z.pts[(i-1+n0)%n0],b=z.pts[(i+1)%n0];
    const v1x=p.x-a.x,v1y=p.y-a.y,v2x=b.x-p.x,v2y=b.y-p.y;
    const l=Math.hypot(v1x,v1y)*Math.hypot(v2x,v2y);
    return l>0&&Math.abs(v1x*v2y-v1y*v2x)/l>Math.sin(10*Math.PI/180);
  });
  const erRaft=p=>raftHj.some(q=>avst(p,q)<=tolPx);

  // 1. Referanseflata: fallretning vinkelrett på raftet hennar
  const refRetning0=ref.retning;
  const refRaft=ref.pts.filter(erRaft);
  if(refRaft.length>=2){
    let pa=refRaft[0],pb=refRaft[1],best=-1;
    refRaft.forEach((p,i)=>refRaft.forEach((q,j)=>{if(j>i&&avst(p,q)>best){best=avst(p,q);pa=p;pb=q;}}));
    const ex=pb.x-pa.x,ey=pb.y-pa.y,el=Math.hypot(ex,ey);
    let nx=-ey/el,ny=ex/el;
    const cx=ref.pts.reduce((s,p)=>s+p.x,0)/ref.pts.length,cy=ref.pts.reduce((s,p)=>s+p.y,0)/ref.pts.length;
    if(((pa.x+pb.x)/2-cx)*nx+((pa.y+pb.y)/2-cy)*ny<0){nx=-nx;ny=-ny;}  // ned = mot raftet
    ref.retning=Math.round(_tpRetningFraNed(nx,ny,north)*10)/10;
  }
  const hRef=_tpPlan(ref,north,mpp);

  // 2. Unike hjørne over alle skrå flater
  const V=[];
  const finnV=p=>{let v=V.find(q=>avst(q,p)<=tolPx);if(!v){v={x:p.x,y:p.y};V.push(v);}return v;};
  [ref,...andre].forEach(tf=>tf.pts.forEach(finnV));
  const ox=V.reduce((s,v)=>s+v.x,0)/V.length,oy=V.reduce((s,v)=>s+v.y,0)/V.length;
  V.forEach(v=>{
    v.X=(v.x-ox)*k;v.Y=(v.y-oy)*k;
    if(paaKant(v,ref.pts))v.H=hRef(v);
    else if(erRaft(v))v.H=0;
    else v.fri=true;
  });
  const fri=V.filter(v=>v.fri);
  fri.forEach((v,i)=>v.ui=3*andre.length+i);
  const N=3*andre.length+fri.length;
  // Normallikningar AᵀA·x = Aᵀb
  const M=Array.from({length:N},()=>new Float64Array(N)),rhs=new Float64Array(N);
  const leggTil=(koef,b,w)=>{            // koef: [[indeks,verdi],…]
    koef.forEach(([i,ai])=>{rhs[i]+=w*w*ai*b;koef.forEach(([j,aj])=>{M[i][j]+=w*w*ai*aj;});});
  };
  let span=0;V.forEach(v=>{span=Math.max(span,Math.hypot(v.X,v.Y));});span=Math.max(span,1);
  andre.forEach((tf,ki)=>{
    const ia=3*ki,ib=ia+1,ic=ia+2;
    V.forEach(v=>{
      if(!paaKant(v,tf.pts))return;       // hjørne ELLER på ein kant (T-kryss)
      if(v.fri)leggTil([[ia,v.X],[ib,v.Y],[ic,1],[v.ui,-1]],0,1);
      else leggTil([[ia,v.X],[ib,v.Y],[ic,1]],v.H,1);
    });
    // Svak drag mot dagens plan, så ei flate med få faste hjørne ikkje gjer
    // systemet singulært
    const h0=_tpPlan(tf,north,mpp),t0=tf.pts[0],h00=h0(t0);
    const tanV=Math.tan(Math.max(0,tf.vinkel||0)*Math.PI/180),r=((tf.retning||0)+north)*Math.PI/180;
    const a0=-Math.sin(r)*tanV,b0=Math.cos(r)*tanV;
    const c0=h00-a0*(t0.x-ox)*k-b0*(t0.y-oy)*k;
    const eps=1e-3;
    leggTil([[ia,1]],a0,eps*span);leggTil([[ib,1]],b0,eps*span);leggTil([[ic,1]],c0,eps);
  });
  fri.forEach(v=>leggTil([[v.ui,1]],hRef(v),1e-3));
  // Gauss med delvis pivotering
  for(let c=0;c<N;c++){
    let p=c;for(let r=c+1;r<N;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
    if(Math.abs(M[p][c])<1e-12){ref.retning=refRetning0;return {ok:false,msg:'Klarte ikkje å løyse takplana — sjekk at takflatene heng saman.'};}
    [M[c],M[p]]=[M[p],M[c]];[rhs[c],rhs[p]]=[rhs[p],rhs[c]];
    for(let r=c+1;r<N;r++){const f=M[r][c]/M[c][c];if(!f)continue;for(let j=c;j<N;j++)M[r][j]-=f*M[c][j];rhs[r]-=f*rhs[c];}
  }
  const x=new Float64Array(N);
  for(let c=N-1;c>=0;c--){let s=rhs[c];for(let j=c+1;j<N;j++)s-=M[c][j]*x[j];x[c]=s/M[c][c];}

  // 3. Planet → vinkel og fallretning
  const endra=[];
  andre.forEach((tf,ki)=>{
    const a=x[3*ki],b=x[3*ki+1],g=Math.hypot(a,b);
    const v=Math.atan(g)*180/Math.PI;
    if(v<0.05){tf.vinkel=0;}
    else{
      tf.vinkel=Math.round(Math.min(v,89)*10)/10;
      tf.retning=Math.round(_tpRetningFraNed(-a,-b,north)*10)/10;
    }
    endra.push(tf);
  });

  // 4. Kontroll på det som faktisk vart lagra: høgda i kvart delte hjørne
  const plan=[ref,...andre].map(tf=>({tf,h:_tpPlan(tf,north,mpp)}));
  let maks=0;
  V.forEach(v=>{
    const hs=plan.filter(p=>paaKant(v,p.tf.pts)).map(p=>p.h(v));
    if(hs.length>1)maks=Math.max(maks,Math.max(...hs)-Math.min(...hs));
  });
  return {ok:true,ref,endra,maksAvvikM:maks};
}

// Startar oppdelinga: éi flate som dekkjer heile sona, med sona sin eigen type.
// Vinkelen vert arva frå `z.takvinkel` — eit flatt tak skal ikkje plutseleg bli
// skrått av at brukaren deler det opp.
function initFlater(z,kind){
  const F=FLATE[kind];
  if((z.pts||[]).length<3)return false;
  const flate={id:kind+'_'+Date.now(),pts:z.pts.map(p=>({...p})),
               type:z[F.zoneFelt]||F.std,name:F.lbl+' 1'};
  if(kind==='tak'){
    const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
    flate.vinkel=getTakvinkel(z);
    flate.retning=_autoRetningForTakflate(z.pts,z,segs);
  }
  z[F.arr]=[flate];
  if(kind==='tak')z.gavlflater=[];
  return true;
}

// Startar klippemodus på ei flate
function startKlippFlate(z,kind,tfi,fi){
  if(fi!=null&&fi!==activeFloor){saveFloorState();activeFloor=fi;syncFloorState();renderFloorTabs();}
  const fl=flateListe(z,kind)[tfi];
  if(!fl)return;
  flateLag=kind;
  klippTakflateTarget={z,tfi,kind};
  klippTakflatePts=[];
  setMode('klipp-takflate');draw();
  hintText.textContent='Klipp «'+(fl.name||FLATE[kind].lbl)+'» · dra ei linje heilt igjennom for å dele i to, '
    +'eller teikn ei lukka sløyfe inni for å klippe ut ein bit midt i flata. Esc for å avbryte.';
}

// ── Sonekortet: tak- og golvseksjonen ─────────────────────────
// Éin funksjon byggjer begge — det er berre FLATE[kind] som skil dei.
// `fi` er etasjeindeksen sona ligg på; klippeknappen må kunne byte aktiv etasje.
// Legg tak-/golvdelen inn i `settings`.
//
// Ei udelt sone — det store fleirtalet — får berre éi vanleg innstillingsrad,
// same rytme som Kategori/Byggeår/Etg.høgde over. Fyrst når laget faktisk er
// delt opp veks det til ein kollapsbar seksjon med eitt kort per flate.
function byggFlateSeksjon(z,kind,fi,zi,settings){
  const F=FLATE[kind];
  const list=flateListe(z,kind);
  const delt=list.length>0;
  const std=entroStandard(z.byggeaar);
  const avvik=flateAvvikM2(z,kind);
  const harAvvik=delt&&Math.abs(avvik)>0.05;
  const tittel=kind==='tak'?'Tak':'Golv';

  const mkRow=(label,content)=>{
    const r=document.createElement('div');
    r.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px';
    const l=document.createElement('span');
    l.style.cssText='font-size:11px;color:var(--text3);white-space:nowrap;min-width:72px';
    l.textContent=label;
    r.appendChild(l);r.appendChild(content);return r;
  };
  // Liten ikonknapp i same stil overalt
  const ikon=(tekst,tittel2,farge)=>{
    const b=document.createElement('button');b.textContent=tekst;b.title=tittel2;
    b.style.cssText='flex-shrink:0;background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;line-height:1;padding:3px 4px;border-radius:4px;transition:all .1s';
    b.onmouseenter=()=>{b.style.color=farge;b.style.background=farge+'18';};
    b.onmouseleave=()=>{b.style.color='var(--text3)';b.style.background='none';};
    return b;
  };

  // ── Udelt: éi rad ────────────────────────────────────────────
  if(!delt){
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;align-items:center;gap:4px;flex:1;min-width:0';
    const sel=document.createElement('select');sel.className='zone-select';
    sel.style.cssText='padding:3px 6px;font-size:11px;flex:1;min-width:0';
    F.typar.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;
      if(o===(z[F.zoneFelt]||F.std))op.selected=true;sel.appendChild(op);});
    sel.onchange=()=>{z[F.zoneFelt]=sel.value;markDirty();updateResults();renderTable();draw();};
    wrap.appendChild(sel);

    // Takvinkelen ligg inline i staden for på ei eiga rad med avkryssingsboks.
    // Tomt eller 0 = flatt tak; avkryssingsboksen skilde aldri mellom noko —
    // både null og 0 er flatt for getTakvinkel().
    if(kind==='tak'&&(z.taktype||'Tak')==='Tak'){
      const v=document.createElement('input');v.type='number';v.min='0';v.max='89';v.step='1';
      v.value=getTakvinkel(z)||'';
      v.placeholder='0';
      v.title='Takvinkel i grader frå horisontalt. Tomt eller 0 = flatt tak. Arealet vert korrigert med 1/cos(vinkel).';
      v.style.cssText="width:38px;flex-shrink:0;padding:3px 4px;font-size:11px;border:1px solid var(--border2);border-radius:4px;text-align:right;background:var(--surface);font-family:inherit";
      v.onchange=()=>{
        const raw=v.value.trim();
        const n=raw===''?0:parseFloat(v.value);
        if(raw!==''&&(isNaN(n)||n<0||n>=90)){
          hintText.textContent='⚠ Takvinkel må vere mellom 0 og 89 grader — sett til flatt tak.';
          z.takvinkel=null;
        } else z.takvinkel=n>0?n:null;
        markDirty();updateResults();renderTable();draw();
      };
      const g=document.createElement('span');g.style.cssText='font-size:11px;color:var(--text3);flex-shrink:0';g.textContent='°';
      wrap.appendChild(v);wrap.appendChild(g);
    }

    const kl=ikon('✂','Del '+F.eining+' i fleire flater med kvar sin konstruksjonstype','#dc2626');
    kl.onclick=()=>{
      if((z.pts||[]).length<3){hintText.textContent='Sona har ikkje nok punkt.';return;}
      snapshot();initFlater(z,kind);flateLag=kind;
      if(window._flateCollapsed)delete window._flateCollapsed[`fl_${_zuk(z)}_${kind}`];
      updateResults();renderTable();
      startKlippFlate(z,kind,0,fi);
    };
    wrap.appendChild(kl);
    settings.appendChild(mkRow(tittel,wrap));
    if(kind==='gulv')byggKjellerBoks(z,settings);
    return;
  }

  // ── Oppdelt: kollapsbar seksjon ──────────────────────────────
  // Tilstanden vert hugsa per sone og lag på tvers av dei hyppige rebuildane,
  // som i vindaugslista. Lange lister startar samanslegne.
  if(!window._flateCollapsed)window._flateCollapsed={};
  const key=`fl_${_zuk(z)}_${kind}`;
  if(window._flateCollapsed[key]===undefined)
    window._flateCollapsed[key]=list.length>FLATELIST_AUTO_COLLAPSE;
  const collapsed=!!window._flateCollapsed[key];

  const sec=document.createElement('div');
  sec.className='sub-sec'+(collapsed?' collapsed':'');
  sec.style.cssText='margin-top:5px;padding-top:6px;border-top:1px dashed var(--border)';

  const hdr=document.createElement('div');
  hdr.className='sub-hdr';
  hdr.style.marginBottom='4px';
  hdr.title='Klikk for å slå saman/utvide · Alt+klikk for alle sonene';
  const chev=document.createElement('span');chev.className='sub-chevron';
  chev.innerHTML='<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,4 6,8 10,4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const hLbl=document.createElement('span');hLbl.textContent=tittel;
  hdr.appendChild(chev);hdr.appendChild(hLbl);

  // Samandraget står i headeren, så ein ser kva som ligg der utan å opne
  const pill=document.createElement('span');pill.className='sub-count';
  pill.textContent=list.length+' flater';
  if(harAvvik){
    pill.style.background='var(--dm-amb-bg,#fef3c7)';pill.style.color='var(--dm-amb-tx,#92400e)';
    pill.textContent='⚠ '+pill.textContent;
    pill.title=avvik>0?avvik.toFixed(2)+' m² er ikkje dekt':(-avvik).toFixed(2)+' m² overlappar';
  }
  hdr.appendChild(pill);

  const paa=flateLag===kind;
  const eye=ikon('👁',paa?'Denne oppdelinga vert teikna oppå planen'
                        :'Teikn denne oppdelinga oppå planen (tak og golv vert aldri viste samstundes)','#0f766e');
  if(paa){eye.style.color='var(--accent)';eye.style.background='var(--accent-dim)';
          eye.onmouseleave=()=>{eye.style.color='var(--accent)';eye.style.background='var(--accent-dim)';};}
  else eye.style.opacity='.45';
  eye.onclick=e=>{e.stopPropagation();flateLag=kind;updateResults();draw();};
  hdr.appendChild(eye);

  const klipp=ikon('✂','Del ei flate til','#dc2626');
  klipp.onclick=e=>{e.stopPropagation();window._flateCollapsed[key]=false;startKlippFlate(z,kind,list.length-1,fi);};
  hdr.appendChild(klipp);

  hdr.onclick=e=>{
    const ny=!window._flateCollapsed[key];
    if(e.altKey){
      // Alt+klikk: same tilstand for alle soner, så eit stort prosjekt kan
      // ryddast med eitt klikk i staden for eitt per sonekort
      floors.forEach(_f=>_f.zones.forEach(_z=>{window._flateCollapsed[`fl_${_zuk(_z)}_${kind}`]=ny;}));
      updateResults();return;
    }
    window._flateCollapsed[key]=ny;
    sec.classList.toggle('collapsed',ny);
  };
  sec.appendChild(hdr);

  const body=document.createElement('div');body.className='sub-body';
  sec.appendChild(body);

  const PAL=kind==='gulv'
    ?['#0ea5e9','#8b5cf6','#10b981','#f43f5e','#3b82f6','#a855f7']
    :['#f59e0b','#6366f1','#ec4899','#22c55e','#f97316','#14b8a6'];
  const RETNING_ALLE=[{v:0,l:'Nord'},{v:45,l:'Nordaust'},{v:90,l:'Aust'},{v:135,l:'Søraust'},
                      {v:180,l:'Sør'},{v:225,l:'Sørvest'},{v:270,l:'Vest'},{v:315,l:'Nordvest'}];
  const _segs=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
  const _sk=z.skillevegg||new Set();
  const _fasadeAz=new Set();
  _segs.forEach(sg=>{if(!_sk.has(sg.idx))_fasadeAz.add(Math.round(sg.normalAz/45)*45%360);});

  list.forEach((fl,fli)=>{
    const col=PAL[fli%PAL.length];
    const ftype=flateType(z,kind,fl);
    const card=document.createElement('div');
    card.style.cssText=`margin-bottom:4px;padding:5px 6px;border-radius:5px;border:1px solid ${col}40;background:${col}0d;display:flex;flex-direction:column;gap:3px`;

    // Rad 1: farge, namn, areal, klipp, slett
    const r1=document.createElement('div');r1.style.cssText='display:flex;align-items:center;gap:4px';
    const dot=document.createElement('span');dot.style.cssText=`width:7px;height:7px;border-radius:2px;background:${col};flex-shrink:0`;
    const nInp=document.createElement('input');nInp.type='text';nInp.value=fl.name||(F.lbl+' '+(fli+1));
    nInp.title='Namnet går rett inn i SIMIEN som elementnamn';
    nInp.style.cssText="flex:1;min-width:0;font-size:11px;border:1px solid transparent;border-radius:4px;padding:1px 3px;font-family:inherit;background:transparent";
    nInp.onfocus=()=>{nInp.style.borderColor='var(--border2)';nInp.style.background='var(--surface)';};
    nInp.onblur=()=>{nInp.style.borderColor='transparent';nInp.style.background='transparent';};
    nInp.onchange=()=>{fl.name=nInp.value.trim()||fl.name;markDirty();renderTable();draw();};
    const aLbl=document.createElement('span');
    aLbl.style.cssText="font-size:10px;color:var(--text3);font-family:inherit;white-space:nowrap";
    aLbl.textContent=flateAreaM2(z,fl).toFixed(1)+' m²';
    const klippFl=ikon('✂','Del denne flata i to','#dc2626');
    klippFl.onclick=()=>startKlippFlate(z,kind,fli,fi);
    const delFl=ikon('✕',list.length>1
      ?'Slett flata — arealet går til naboflata, så sona alltid er heilt dekt'
      :'Fjern oppdelinga — heile '+F.eining+' får igjen éin type','#dc2626');
    delFl.onclick=()=>{
      const m=slettFlate(z,kind,fli);
      if(m)hintText.textContent=m;
      updateResults();renderTable();draw();
    };
    r1.appendChild(dot);r1.appendChild(nInp);r1.appendChild(aLbl);r1.appendChild(klippFl);r1.appendChild(delFl);
    card.appendChild(r1);

    // Rad 2: konstruksjonstype, U-verdi og — på tak mot det fri — vinkel og fall
    const r2=document.createElement('div');r2.style.cssText='display:flex;align-items:center;gap:4px';
    const tSel=document.createElement('select');
    tSel.style.cssText='flex:1;min-width:0;font-size:11px;border:1px solid var(--border2);border-radius:4px;padding:2px 3px;background:var(--surface)';
    F.typar.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;
      if(o===ftype)op.selected=true;tSel.appendChild(op);});
    tSel.onchange=()=>{
      snapshot();
      fl.type=tSel.value;
      if(kind==='tak'){
        if(fl.type==='Tak'){
          if(fl.vinkel==null)fl.vinkel=getTakvinkel(z);
          if(fl.retning==null)fl.retning=_autoRetningForTakflate(fl.pts,z,_segs);
        }
        z.gavlflater=[];
      }
      updateResults();renderTable();draw();
    };
    r2.appendChild(tSel);
    // Ei himling mot ei varm sone har ein heilt annan U-verdi enn taket ved
    // sida av, så utan dette måtte brukaren velje éin verdi for begge.
    if(ftype!==KJELLER_GULV){
      const uStd=z[F.uFelt]??std?.[F.uFelt];
      const uInp=document.createElement('input');uInp.type='number';uInp.min='0.01';uInp.step='0.01';
      uInp.value=fl.uverdi!=null?fl.uverdi:'';
      uInp.placeholder=uStd!=null?uStd.toFixed(2):'U';
      uInp.title='U-verdi (W/m²K) for denne flata. Blank = sona sin ('+(uStd!=null?uStd.toFixed(2):'ikkje sett')+').';
      uInp.style.cssText="width:44px;flex-shrink:0;font-size:11px;border:1px solid "+(fl.uverdi!=null?'var(--amber)':'var(--border2)')+";border-radius:4px;padding:2px 3px;text-align:right;font-family:inherit;background:"+(fl.uverdi!=null?'var(--amber-dim)':'#fff');
      uInp.onchange=()=>{
        const v=parseFloat(uInp.value);
        fl.uverdi=(isNaN(v)||v<=0)?null:v;
        markDirty();updateResults();renderTable();
      };
      r2.appendChild(uInp);
    }
    card.appendChild(r2);

    if(kind==='tak'&&ftype==='Tak'){
      const r3=document.createElement('div');r3.style.cssText='display:flex;align-items:center;gap:4px';
      const vInp=document.createElement('input');vInp.type='number';vInp.min='0';vInp.max='89';vInp.step='0.1';vInp.value=fl.vinkel||'';
      vInp.placeholder='0';
      vInp.title='Takvinkel i grader. Tomt eller 0 = flatt.';
      vInp.style.cssText="width:38px;flex-shrink:0;font-size:11px;border:1px solid var(--border2);border-radius:4px;padding:2px 3px;text-align:right;font-family:inherit;background:var(--surface)";
      vInp.onchange=()=>{
        const v=parseFloat(vInp.value);
        fl.vinkel=(isNaN(v)||v<0||v>=90)?0:v;
        vInp.value=fl.vinkel||'';
        markDirty();_syncGavlflater(z);updateResults();renderTable();draw();
      };
      const gr=document.createElement('span');gr.style.cssText='font-size:10px;color:var(--text3);flex-shrink:0';gr.textContent='°';
      const rSel=document.createElement('select');
      rSel.title='Fallretning — dit vatnet renn';
      rSel.style.cssText='font-size:11px;border:1px solid var(--border2);border-radius:4px;padding:2px 3px;flex:1;min-width:0;background:var(--surface)';
      const valgt=fl.retning??180;
      // «Tilpass» gir ei nøyaktig retning (t.d. 187,4°) — ho må stå i lista
      // som seg sjølv, elles ville nedtrekket vist ein annan verdi enn den lagra
      const eksakt=!RETNING_ALLE.some(o=>o.v===valgt);
      if(eksakt){
        const op=document.createElement('option');op.value=valgt;op.selected=true;
        const naer=RETNING_ALLE[Math.round(((valgt%360)+360)%360/45)%8];
        op.textContent=naer.l+' '+(Math.round(valgt*10)/10).toString().replace('.',',')+'°';
        rSel.appendChild(op);
      }
      RETNING_ALLE.filter(o=>_fasadeAz.has(o.v)||o.v===valgt).forEach(o=>{
        const op=document.createElement('option');op.value=o.v;op.textContent=o.l;
        if(!eksakt&&o.v===valgt)op.selected=true;rSel.appendChild(op);
      });
      rSel.onchange=()=>{fl.retning=parseFloat(rSel.value);markDirty();_syncGavlflater(z);updateResults();renderTable();draw();};
      r3.appendChild(vInp);r3.appendChild(gr);r3.appendChild(rSel);
      const fleireSkraa=list.filter(t=>flateType(z,kind,t)==='Tak').length>1;
      if(fleireSkraa&&fl.vinkel>0){
        const tp=ikon('⇄','Tilpass dei andre takflatene til denne: vinkelen her står, fallretninga vert sett '
          +'vinkelrett på raftet, og vinkel og fallretning på dei andre vert rekna ut slik at hjørna møtest.','#6366f1');
        tp.onclick=()=>{
          snapshot();
          const res=tilpassTakflater(z,fli);
          if(!res.ok){hintText.textContent=res.msg;return;}
          markDirty();_syncGavlflater(z);updateResults();renderTable();draw();
          const cm=res.maksAvvikM*100;
          const liste=res.endra.map(t=>(t.name||'Tak')+' '+String(t.vinkel).replace('.',',')+'°').join(', ');
          hintText.textContent='Tilpassa til «'+(res.ref.name||'Tak')+'» ('+String(res.ref.vinkel).replace('.',',')+'°): '+liste
            +(cm<3?' · hjørna møtest (avvik under '+Math.max(0.1,Math.ceil(cm*10)/10).toString().replace('.',',')+' cm).'
                 :' · ⚠ Største sprang i eit hjørne er '+cm.toFixed(0)+' cm — linjene i planen går ikkje opp som eitt tak '
                  +'(t.d. mønet ikkje parallelt med raftet). Sjekk at mønet og gradene er teikna inn til hjørna.');
        };
        r3.appendChild(tp);
      }
      if(fl.vinkel>0){
        const sk=document.createElement('span');
        sk.style.cssText="font-size:10px;color:var(--text3);font-family:inherit;white-space:nowrap";
        sk.title='Skrått areal etter vinkelkorrigering';
        sk.textContent='→ '+(flateAreaM2(z,fl)/Math.cos(fl.vinkel*Math.PI/180)).toFixed(1);
        r3.appendChild(sk);
      }
      card.appendChild(r3);
    }
    body.appendChild(card);
  });

  // ── Botnrad: sum og tilbakestilling på same linje ──
  const sum=list.reduce((t,fl)=>t+flateAreaM2(z,fl),0);
  const bunn=document.createElement('div');
  bunn.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:6px;padding-top:3px;border-top:1px solid var(--border)';
  const sumTxt=document.createElement('span');
  sumTxt.style.cssText="font-size:10px;font-weight:700;color:var(--text);font-family:inherit";
  sumTxt.textContent='Σ '+sum.toFixed(2)+' m²';
  sumTxt.title='Sum av flatene mot sonearealet '+((getAreaM2(z)??0).toFixed(2))+' m²';
  const reset=document.createElement('button');
  reset.textContent='↺ Slå saman';
  reset.title='Fjern oppdelinga — heile '+F.eining+' får igjen éin type';
  reset.style.cssText='padding:2px 7px;border:1px solid var(--border2);border-radius:5px;background:transparent;color:var(--text3);cursor:pointer;font-family:inherit;font-size:10px;transition:all .12s';
  reset.onmouseenter=()=>{reset.style.background='var(--surface2)';reset.style.color='var(--text2)';};
  reset.onmouseleave=()=>{reset.style.background='transparent';reset.style.color='var(--text3)';};
  reset.onclick=()=>{
    snapshot();
    const t=_fjernFlateoppdeling(z,kind);   // største flata gir sona sin type
    delete window._flateCollapsed[key];     // tilbake til standardtilstanden
    updateResults();renderTable();draw();
    hintText.textContent=F.eining[0].toUpperCase()+F.eining.slice(1)+' er slege saman til éi flate av typen «'+t+'».';
  };
  bunn.appendChild(sumTxt);bunn.appendChild(reset);
  body.appendChild(bunn);

  if(harAvvik){
    const warn=document.createElement('div');
    warn.style.cssText='font-size:10px;color:var(--dm-amb-tx,#92400e);background:var(--dm-amb-bg,#fef3c7);border-radius:4px;padding:4px 6px;margin-top:3px;line-height:1.45';
    warn.innerHTML=avvik>0
      ?`<b>⚠ ${avvik.toFixed(2)} m² av ${F.eining} er ikkje dekt</b> av nokon flate og kjem ikkje med i SXI-fila.`
      :`<b>⚠ Flatene overlappar med ${(-avvik).toFixed(2)} m²</b> — arealet vert talt to gonger i SXI-fila.`;
    body.appendChild(warn);
  }

  if(kind==='gulv')byggKjellerBoks(z,body);
  if(kind==='tak')byggGavlBoks(z,body);

  settings.appendChild(sec);
}

// Oppfylling + oppsummering av kjellerelementet. Gjeld både udelt golv og
// oppdelt golv der minst éi flate er kjellergolv.
function byggKjellerBoks(z,sec){
  if(!isKjeller(z))return;
  const wrap=document.createElement('div');wrap.style.cssText='display:flex;align-items:center;gap:5px;flex:1';
  const inp=document.createElement('input');inp.type='number';inp.min='0.1';inp.step='0.1';
  inp.value=z.oppfylling!=null?z.oppfylling:'';
  inp.placeholder=getHoyde(z).toFixed(2);
  inp.title='Kor djupt kjellaren ligg under terreng. Blank = heile veggen er under terreng (= etasjehøgda).';
  inp.style.cssText="width:60px;padding:3px 6px;font-size:11px;border:1px solid var(--border2);border-radius:4px;text-align:right;background:var(--surface);font-family:inherit";
  const u=document.createElement('span');u.style.cssText='font-size:11px;color:var(--text3)';u.textContent='m';
  inp.onchange=()=>{const v=parseFloat(inp.value);z.oppfylling=(isNaN(v)||v<=0)?null:v;markDirty();updateResults();renderTable();};
  wrap.appendChild(inp);wrap.appendChild(u);
  const row=document.createElement('div');
  row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px';
  const l=document.createElement('span');l.style.cssText='font-size:11px;color:var(--text3);white-space:nowrap;min-width:72px';l.textContent='Oppfylling';
  row.appendChild(l);row.appendChild(wrap);
  sec.appendChild(row);

  const note=document.createElement('div');
  note.style.cssText='font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 2px;padding:5px 7px;background:var(--surface3);border-radius:4px';
  const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
  const nKj=segs.filter(sg=>isKjellervegg(z,sg.idx)).length;
  const nWinKj=(z.windows||[]).filter(w=>isKjellervegg(z,w.segIdx)).length;
  // Med oppdelt golv gjeld kjellerelementet berre sin eigen del av golvet og
  // den delen av KJ-veggane som ligg langs nett den flata.
  const kjFlater=flateListe(z,'gulv').filter(fl=>flateType(z,'gulv',fl)===KJELLER_GULV);
  const kjArea=kjFlater.length?kjFlater.reduce((t,fl)=>t+flateAreaM2(z,fl),0):(getAreaM2(z)??0);
  const kjLen=kjFlater.length
    ?kjFlater.reduce((t,fl)=>t+flateKantLenM(z,fl,i=>isKjellervegg(z,i)),0)
    :(getKjellerVeggLen(z)??0);
  const kstd=entroStandard(z.byggeaar);
  const ukv=z.uKjVegg??kstd?.uKjVegg,ukg=z.uKjGulv??kstd?.uKjGulv;
  const uT=v=>v!=null?v.toFixed(2):'—';
  note.innerHTML='<b>Kjellerelement</b>'+(kjFlater.length>1?' ('+kjFlater.length+' flater)':'')
    +': golv '+kjArea.toFixed(1)+' m², vegg '+kjLen.toFixed(1)+' m ('+nKj+' av '+segs.length+'), høgd '
    +getHoyde(z).toFixed(2)+' m, veggtjukn '+KJELLER_VEGGTJUKN.toFixed(2)+' m.'
    +'<br>U-verdi vegg '+uT(ukv)+' · gulv '+uT(ukg)+' W/m²K'
    +(z.uKjVegg!=null||z.uKjGulv!=null?' <b>(manuell)</b>':' (standard '+(z.byggeaar||'—')+')')
    +(nKj===0?'<br><b>⚠ Ingen veggar er merkte KJ</b> — kjellaren får 0 m yttervegg.':'')
    +(kjFlater.length&&nKj>0&&kjLen<0.05?'<br><b>⚠ Kjellergolvflata rører ingen KJ-vegg</b> — elementet får 0 m yttervegg.':'')
    +(nWinKj?'<br><b>⚠ '+nWinKj+' vindauge/dør</b> står på ein KJ-vegg og vert ikkje med — kjellerelementet har ingen opningar.':'')
    +'<br>Klikk ein vegg i lista under for å sykle <b>KJ → YV → SK</b>.';
  sec.appendChild(note);
}

// Gavlflater — trekantane over veggtoppen. Berre meiningsfulle når minst éi
// takflate er eit skrått tak mot det fri.
function byggGavlBoks(z,sec){
  if(!mmPerImgPx)return;
  const harSkraa=flateListe(z,'tak').some(fl=>flateType(z,'tak',fl)==='Tak'&&(fl.vinkel||0)>0);
  if(!harSkraa&&!(z.gavlflater||[]).length)return;
  const box=document.createElement('div');
  box.style.cssText='margin-top:8px;padding-top:6px;border-top:1px dashed var(--border)';
  const hdr=document.createElement('div');hdr.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:5px';
  const lbl=document.createElement('span');
  lbl.style.cssText='font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em';
  lbl.textContent='Gavlflater';
  const btn=document.createElement('button');btn.textContent='⊿ Berekn';
  btn.title='Berekn trekantforma gavlveggar frå takflatene';
  btn.style.cssText='padding:2px 7px;font-size:10px;border:1px solid var(--border2);border-radius:4px;background:var(--surface);color:var(--text2);cursor:pointer;font-family:inherit;transition:all .1s';
  btn.onmouseenter=()=>{btn.style.borderColor='var(--accent)';btn.style.color='var(--accent)';};
  btn.onmouseleave=()=>{btn.style.borderColor='var(--border2)';btn.style.color='var(--text2)';};
  btn.onclick=()=>{
    snapshot();
    z.gavlflater=_calcGavlflater(z);
    if(!z.gavlflater.length)hintText.textContent='Ingen gavlflater funne — sjekk at sona har takflater av typen «Tak» med vinkel > 0°';
    updateResults();renderTable();draw();
  };
  hdr.appendChild(lbl);hdr.appendChild(btn);box.appendChild(hdr);
  const liste=z.gavlflater||[];
  if(liste.length){
    liste.forEach(gf=>{
      const r=document.createElement('div');
      r.style.cssText='display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:2px 0;color:var(--text2)';
      r.innerHTML=`<span>⊿ ${gf.dir||'Gavl'}</span><span style="font-family:inherit;color:var(--text)">${gf.area.toFixed(2)} m²</span>`;
      box.appendChild(r);
    });
    const tot=liste.reduce((t,g)=>t+g.area,0);
    const tr=document.createElement('div');
    tr.style.cssText='display:flex;justify-content:space-between;font-size:11px;font-weight:700;padding-top:3px;border-top:1px solid var(--border);margin-top:2px;color:var(--text)';
    tr.innerHTML=`<span>Totalt</span><span style="font-family:inherit">${tot.toFixed(2)} m²</span>`;
    box.appendChild(tr);
  } else {
    const n=document.createElement('div');n.style.cssText='font-size:11px;color:var(--text3)';
    n.textContent='Ikkje berekna — klikk ⊿ Berekn';
    box.appendChild(n);
  }
  sec.appendChild(box);
}

// Avsluttar klippeoperasjonen og splittar polygonet i to flater
function _finishKlipp(){
  if(!klippTakflateTarget||klippTakflatePts.length<2)return;
  const{z,tfi}=klippTakflateTarget;
  const kind=klippTakflateTarget.kind||'tak';
  const F=FLATE[kind];
  const arr=z[F.arr]||[];
  const tf=arr[tfi];
  if(!tf){klippTakflatePts=[];klippTakflateTarget=null;setMode('navigate');return;}
  const linje=klippTakflatePts.slice();
  // Ei linje som går heilt igjennom deler flata i to. Ei lukka sløyfe heilt
  // inne i flata klippar i staden ut ein bit MIDT i sona; resten vert eit
  // polygon med nøkkelhòl, så sona framleis er heilt dekt.
  let result=_splitPolygonByPolyline(tf.pts,linje),hol=false;
  if(!result&&linje.length>=3){
    const r=_splitPolygonByHole(tf.pts,linje);
    if(r){result=r;hol=true;}
  }
  // Rydd klippetilstanden FØR teikninga — elles ligg den raude
  // forhandsvisninga att på lerretet til noko anna utløyser ei ny draw()
  klippTakflatePts=[];klippTakflateTarget=null;klippSnap=null;
  if(result)setMode('navigate');
  if(result){
    const[p1,p2]=result;
    snapshot();markDirty();
    const baseName=tf.name||(F.lbl+' '+(tfi+1));
    // Ved eit hòl held restflata på namnet sitt — biten er det nye
    const tf2={...JSON.parse(JSON.stringify(tf)),pts:p2,id:kind+'_'+Date.now(),
               name:hol?baseName+' midt':baseName+' B'};
    tf.pts=p1;
    if(!hol)tf.name=baseName+' A';
    if(kind==='tak'){
      // Fallretninga følgjer den næraste ytterfasaden til kvar nye del
      const segs=calcSegments(z.pts,getHoyde(z),mppForZone(z))||[];
      if(!hol)tf.retning=_autoRetningForTakflate(p1,z,segs);
      tf2.retning=_autoRetningForTakflate(p2,z,segs);
      z.gavlflater=[]; // strukturendring — gavlflater må reberegnast
    }
    arr.splice(tfi+1,0,tf2);
    updateResults();renderTable();draw();
    hintText.textContent=hol
      ?'Ein bit er klippt ut midt i flata — sjekk typen på han i sonekortet.'
      :'Flata er klippt i to — sjekk typen på kvar del i sonekortet.';
  }else{
    // Bomskot: la brukaren prøve på nytt på same flate i staden for å
    // kaste han ut av klippemodus
    klippTakflateTarget={z,tfi,kind};
    hintText.textContent=linje.length>=3
      ?'Verken eit gjennomgåande kutt eller ei lukka sløyfe inne i flata — prøv igjen.'
      :'Klippelinja treffer ikkje flata — dra linja heilt igjennom, eller teikn ei lukka sløyfe inni for å klippe ut ein bit.';
    draw();
  }
}

// Deler ei sone i to langs ei teikna klippelinje. Segmenta som kjem frå
// klippelinja vert automatisk skiljekonstruksjonar på begge dei nye sonene.
function _finishDelSone(){
  if(!delSoneTarget||delSonePts.length<2)return;
  const{z,zi}=delSoneTarget;
  const res=_splitPolygonByPolyline(z.pts,delSonePts);
  if(!res){
    hintText.textContent='Klippelinja deler ikkje sona — dra linja heilt igjennom, frå ein yttervegg til ein annan.';
    draw();return;
  }
  const[p1,p2]=res;
  snapshot();
  const origPts=z.pts.map(p=>({...p}));
  const origSk=new Set(z.skillevegg||[]);
  const origWins=(z.windows||[]).map(w=>({...w}));
  const origSegs=origPts.map((a,i)=>({i,a,b:origPts[(i+1)%origPts.length]}));
  // Ligg punktet på ein av dei opphavlege veggane? Gir segmentindeks, elles -1
  const paaOpphavleg=pt=>{
    for(const s of origSegs){
      const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,L2=dx*dx+dy*dy;
      if(L2<1)continue;
      let t=((pt.x-s.a.x)*dx+(pt.y-s.a.y)*dy)/L2;
      if(t<-0.01||t>1.01)continue;
      t=Math.max(0,Math.min(1,t));
      if(Math.hypot(pt.x-(s.a.x+dx*t),pt.y-(s.a.y+dy*t))<=1.5)return s.i;
    }
    return -1;
  };
  const lagSone=(pts,namn)=>{
    const ny=JSON.parse(JSON.stringify({...z,skillevegg:[],windows:[]}));
    ny.pts=pts.map(p=>({...p}));
    ny.name=namn;
    ny.windows=[];
    ny.skillevegg=new Set();
    // Desse peikar på gamle segmentindeksar og gjeld ikkje lenger
    delete ny.segOverrides;delete ny.skMergedGroups;delete ny.yvMergedGroups;
    delete ny.kjellerveggar;   // nye ytterveggar = alle med i kjellerelementet
    delete ny.groupId;delete ny.areaOverride;delete ny.perimOverride;
    // Flatene peikar på den gamle soneforma — dei nye sonene startar udelte
    ny.takflater=[];ny.gulvflater=[];ny.gavlflater=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      const oi=paaOpphavleg({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      if(oi<0)ny.skillevegg.add(i);              // nytt segment = klippelinja
      else if(origSk.has(oi))ny.skillevegg.add(i); // arva skiljevegg
    }
    return ny;
  };
  const zA=lagSone(p1,z.name);
  const zB=lagSone(p2,z.name+' B');
  // Fordel vindauge og dører til den sona veggen deira hamna i — STK for stk.
  // Ei gruppe som står over klippet vert delt: kvar sone får dei stykka som
  // står på hennar vegg, som ei gruppe med antal = talet på stk der. Stykka
  // står der dei stod; posT vert rekna om til den nye (kortare) veggen.
  let mista=0;
  const finnVegg=pt=>{
    for(const nz of[zA,zB]){
      for(let i=0;i<nz.pts.length;i++){
        if(nz.skillevegg.has(i))continue;
        const a=nz.pts[i],b=nz.pts[(i+1)%nz.pts.length];
        const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy;
        if(L2<1)continue;
        const t=((pt.x-a.x)*dx+(pt.y-a.y)*dy)/L2;
        if(t<0||t>1)continue;
        if(Math.hypot(pt.x-(a.x+dx*t),pt.y-(a.y+dy*t))>1.5)continue;
        return{nz,i,t,len:Math.sqrt(L2)};
      }
    }
    return null;
  };
  origWins.forEach(w=>{
    const s=origSegs[w.segIdx];
    if(!s){mista+=winCount(w);return;}
    const origLen=Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y);
    // Breidda kjem frå breddeMm — den nye veggen er kortare enn den opphavlege,
    // så den lagra t1-t0 ville gitt feil utstrekning
    const widthPx=winBreiddPx(w,origLen,mmPerImgPx);
    const deler=new Map();   // `${sone}|${seg}` → {nz,i,len,ts:[]}
    winCentres(w,widthPx,origLen).forEach(c=>{
      const v=finnVegg({x:s.a.x+(s.b.x-s.a.x)*c,y:s.a.y+(s.b.y-s.a.y)*c});
      if(!v){mista++;return;}
      const k=(v.nz===zA?'A':'B')+'|'+v.i;
      if(!deler.has(k))deler.set(k,{nz:v.nz,i:v.i,len:v.len,ts:[]});
      deler.get(k).ts.push(v.t);
    });
    deler.forEach(d=>{
      const n=d.ts.length;
      const ny={...w,segIdx:d.i,antal:n,posT:n>1?d.ts.slice():null};
      delete ny.lappStk;
      const _ds=fitSpanT(d.ts[0],widthPx,d.len);
      ny.t0=_ds.t0;ny.t1=_ds.t1;
      if(n>1)winSyncAnchor(ny,widthPx,d.len);
      d.nz.windows.push(ny);
    });
  });
  curFloor().zones.splice(zi,1,zA,zB);
  zones=curFloor().zones;

  // Legg automatisk til sonekoblingar for segmenta som kjem frå klippelinja
  ensureZoneConnectionsMap(zA);
  ensureZoneConnectionsMap(zB);
  const zoneAIdx=zones.indexOf(zA),zoneBIdx=zones.indexOf(zB);
  // Finn alle klippelinja-segmenta (der originalindeksen er -1)
  for(let i=0;i<zA.pts.length;i++){
    const midPt={x:(zA.pts[i].x+zA.pts[(i+1)%zA.pts.length].x)/2,y:(zA.pts[i].y+zA.pts[(i+1)%zA.pts.length].y)/2};
    const oi=paaOpphavleg(midPt);
    if(oi<0){  // klippelinja-segment
      zA.zoneConnections.set(i,{facingZoneIdx:zoneBIdx,name:`Sonekobling ${zA.name} og ${zB.name}`});
    }
  }
  for(let i=0;i<zB.pts.length;i++){
    const midPt={x:(zB.pts[i].x+zB.pts[(i+1)%zB.pts.length].x)/2,y:(zB.pts[i].y+zB.pts[(i+1)%zB.pts.length].y)/2};
    const oi=paaOpphavleg(midPt);
    if(oi<0){  // klippelinja-segment
      zB.zoneConnections.set(i,{facingZoneIdx:zoneAIdx,name:`Sonekobling ${zB.name} og ${zA.name}`});
    }
  }

  delSonePts=[];delSoneTarget=null;delSoneSnap=null;
  setMode('navigate');
  updateResults();renderTable();renderFloorTabs();draw();
  hintText.textContent='Delt i «'+zA.name+'» og «'+zB.name+'» — klippelinja er sett som sonekobling i begge.'
    +(mista?' '+mista+' stk vindauge/dør kunne ikkje plasserast og vart fjerna.':'');
}

