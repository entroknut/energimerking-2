// ── Angre-historikk (Ctrl+Z) ──────────────────────────────────
// Kvar oppføring er tilstanden FØR ei handling, med namnet på handlinga
// (snapshot(namn), elles henta frå hintlinja like etter), tidspunktet og dei
// automatiske endringane som skjedde i same steg (loggAuto). Namnet følgjer
// steget over til redoStack og tilbake.
const autoLogg=[];   // {tid,tekst} — alt programmet har endra av seg sjølv i økta
// Automatiske endringar: vindauge skalerte, veggar gjort til SK, KI-forslag
// godtekne … Dei vert festa til angre-steget dei høyrer til (om det er
// ferskt) og står i «Kva skjedde» i historikken.
function loggAuto(tekst){
  if(!tekst)return;
  autoLogg.push({tid:Date.now(),tekst});
  if(autoLogg.length>200)autoLogg.shift();
  const e=history[history.length-1];
  if(e&&Date.now()-(e.tid||0)<8000)(e.hendingar=e.hendingar||[]).push(tekst);
}
function _histNamnFraHint(){
  const t=(hintText.textContent||'').trim();
  if(!t||(typeof HINTS==='object'&&Object.values(HINTS).includes(t)))return'Endring';
  return t.length>80?t.slice(0,77)+'…':t;
}
function _kl(t){const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
function visHistorikk(anker){
  document.querySelectorAll('.ctx-menu').forEach(m=>m.remove());
  const m=document.createElement('div');m.className='ctx-menu hist-meny';
  const hdr=t=>{const d=document.createElement('div');d.className='ctx-menu-header';d.textContent=t;m.appendChild(d);};
  const lin=(t,cls)=>{const d=document.createElement('div');d.className=cls;d.textContent=t;return d;};
  hdr(history.length?'Angre tilbake til før …':'Ingen angre-steg enno');
  history.slice().reverse().forEach((e,k)=>{
    const steg=k+1;   // tal på angre-steg som må til
    const it=document.createElement('div');it.className='ctx-menu-item hist-item';
    const top=document.createElement('div');top.className='hist-topp';
    top.appendChild(lin(e.namn||'Endring','hist-namn'));
    top.appendChild(lin(_kl(e.tid||Date.now())+(steg>1?' · '+steg+' steg':''),'hist-tid'));
    it.appendChild(top);
    (e.hendingar||[]).forEach(t=>it.appendChild(lin('↳ '+t,'hist-auto')));
    it.onclick=()=>{m.remove();for(let i=0;i<steg&&history.length;i++)undo();};
    m.appendChild(it);
  });
  if(redoStack.length){
    const d=lin(redoStack.length+' steg kan gjerast om (Ctrl+Y)','hist-redo');m.appendChild(d);
  }
  const sep=document.createElement('div');sep.className='ctx-menu-sep';m.appendChild(sep);
  hdr('Kva skjedde av seg sjølv');
  const al=autoLogg.slice(-15).reverse();
  if(!al.length)m.appendChild(lin('Ingenting enno i denne økta.','hist-auto'));
  al.forEach(a=>m.appendChild(lin(_kl(a.tid)+'  '+a.tekst,'hist-auto')));
  document.body.appendChild(m);
  const r=anker.getBoundingClientRect();
  m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+'px';
  m.style.top=(r.bottom+4)+'px';
  const lukk=ev=>{if(ev.type==='keydown'&&ev.key!=='Escape')return;if(ev.type==='mousedown'&&m.contains(ev.target))return;
    m.remove();document.removeEventListener('mousedown',lukk,true);document.removeEventListener('keydown',lukk,true);};
  setTimeout(()=>{document.addEventListener('mousedown',lukk,true);document.addEventListener('keydown',lukk,true);},0);
}

// ── Overlappande soner ────────────────────────────────────────
// To soner som ligg oppå kvarandre vert rekna to gonger i energimerket.
// Overlappen vert funnen i verdskoordinatar (meter) innanfor kvar etasje,
// delplanane med, ved å telje ruter (≤ 200×200 per par) der midtpunktet
// ligg i begge. Ei felles kant gir 0 — midtpunkta ligg på kvar si side.
// Resultatet vert hugsa til geometrien endrar seg (signatur).
const OVL_MIN_M2=0.5;
let _ovlMemo={sig:null,res:[]};
function _ovlSoner(f){const i=floors.indexOf(f);return(i===activeFloor&&viewMode==='plan'?zones:f.zones)||[];}
function sonerOverlapp(){
  const sig=floors.map(f=>(mppForFloor(f)||0)+'@'+(f.floorDxImg||0)+','+(f.floorDyImg||0)+'@'+(f.delAv||'')+':'
    +_ovlSoner(f).map(z=>(z.pts||[]).map(p=>Math.round(p.x)+','+Math.round(p.y)).join(';')).join('|')).join('#');
  if(sig===_ovlMemo.sig)return _ovlMemo.res;
  const res=[];
  const grupper=new Map();
  floors.forEach(f=>{const hv=hovudEtasje(f);if(!grupper.has(hv))grupper.set(hv,[]);grupper.get(hv).push(f);});
  grupper.forEach(ark=>{
    const l=[];
    ark.forEach(f=>{
      const mpp=mppForFloor(f);if(!mpp)return;
      const k=mpp/1000;
      _ovlSoner(f).forEach(z=>{
        if((z.pts||[]).length<3)return;
        const w=z.pts.map(p=>({x:(p.x+(f.floorDxImg||0))*k,y:(p.y+(f.floorDyImg||0))*k}));
        const xs=w.map(p=>p.x),ys=w.map(p=>p.y);
        l.push({z,f,w,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)});
      });
    });
    for(let i=0;i<l.length;i++)for(let j=i+1;j<l.length;j++){
      const a=l[i],b=l[j];
      const x0=Math.max(a.x0,b.x0),x1=Math.min(a.x1,b.x1),y0=Math.max(a.y0,b.y0),y1=Math.min(a.y1,b.y1);
      if(!((x1-x0)*(y1-y0)>=OVL_MIN_M2))continue;
      const c=Math.max(0.1,Math.sqrt((x1-x0)*(y1-y0)/40000));
      let n=0;const rader=[];
      for(let y=y0+c/2;y<y1;y+=c){
        let start=null;
        for(let x=x0+c/2;x<x1+c;x+=c){
          const inn=x<x1&&kiInniPolygon({x,y},a.w)&&kiInniPolygon({x,y},b.w);
          if(inn){n++;if(start==null)start=x-c/2;}
          else if(start!=null){rader.push({y0:y-c/2,y1:y+c/2,x0:start,x1:x-c/2});start=null;}
        }
      }
      const areal=n*c*c;
      if(areal>=OVL_MIN_M2)res.push({a:a.z,fa:a.f,b:b.z,fb:b.f,areal,rader});
    }
  });
  res.sort((p,q)=>q.areal-p.areal);
  _ovlMemo={sig,res};
  return res;
}
// Overlappen raud oppå planen (berre arka i den aktive etasjen)
function teiknOverlapp(){
  if(viewMode!=='plan')return;
  const f=curFloor(),mpp=mppForFloor(f);if(!mpp)return;
  const hv=hovudEtasje(f);
  const l=sonerOverlapp().filter(o=>hovudEtasje(o.fa)===hv);
  if(!l.length)return;
  const k=1000/mpp,dx=f.floorDxImg||0,dy=f.floorDyImg||0;
  ctx.save();
  ctx.fillStyle='rgba(220,38,38,.35)';ctx.strokeStyle='rgba(185,28,28,.9)';ctx.lineWidth=1;
  l.forEach(o=>{
    o.rader.forEach(r=>{
      const p=i2s(r.x0*k-dx,r.y0*k-dy),q=i2s(r.x1*k-dx,r.y1*k-dy);
      ctx.fillRect(p.x,p.y,q.x-p.x,q.y-p.y);
    });
    // Lapp ved fyrste rada
    const r0=o.rader[Math.floor(o.rader.length/2)];
    if(r0){
      const p=i2s((r0.x0+r0.x1)/2*k-dx,(r0.y0+r0.y1)/2*k-dy);
      const t='⚠ Overlapp '+o.areal.toFixed(1)+' m²';
      ctx.font='bold 11px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      const tw=ctx.measureText(t).width+10;
      ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(p.x-tw/2,p.y-9,tw,18);
      ctx.strokeRect(p.x-tw/2,p.y-9,tw,18);
      ctx.fillStyle='#b91c1c';ctx.fillText(t,p.x,p.y);
      ctx.fillStyle='rgba(220,38,38,.35)';
    }
  });
  ctx.restore();
}

const MAX_HISTORY=50;
const history=[];
const redoStack=[];

function updateUndoBtn(){
  const btn=document.getElementById('undoBtn');
  const rBtn=document.getElementById('redoBtn');
  if(btn){btn.disabled=history.length===0;btn.style.opacity=history.length===0?'.4':'1';}
  if(rBtn){rBtn.disabled=redoStack.length===0;rBtn.style.opacity=redoStack.length===0?'.4':'1';}
}

// Eit fasadeark inn og ut av angre-historikken. Bilete og PDF ligg som
// referansar (dei er uforanderlege i praksis), måla vert kopierte.
function _fasadeMinne(fa){
  return{
    id:fa.id,name:fa.name,
    bgImg:fa.bgImg||null,pdfDoc:fa.pdfDoc||null,
    pdfPage:fa.pdfPage||1,totalPages:fa.totalPages||1,
    paperWMm:fa.paperWMm??null,paperHMm:fa.paperHMm??null,paperSource:fa.paperSource??null,
    mmPerImgPx:fa.mmPerImgPx??null,
    sc:fa.sc??1,offX:fa.offX??0,offY:fa.offY??0,
    measurements:normMaal(fa.measurements)
  };
}

// ── Etasjar og soner inn og ut av minnet ──────────────────────
// Éin stad for felta, så angre (snapshot/getCurrentState/applyHistoryState)
// og fil (serialiserEtasje/deserialiserEtasje) aldri kjem i utakt. Nytt felt
// på ei ETASJE: legg det i _etasjeUt OG _etasjeInn. Nytt felt på ei SONE:
// ingenting — sonene går med spread ({...z}); berre Set/Map må omsetjast her.
function _soneUt(z){
  const obj={...z,skillevegg:Array.from(z.skillevegg||[])};
  const zc=z.zoneConnections;
  obj.zoneConnections=zc instanceof Map?Array.from(zc.entries()):(Array.isArray(zc)?zc:[]);
  return obj;
}
function _soneInn(z){
  const nz={...z,skillevegg:new Set(z.skillevegg||[])};
  const zc=z.zoneConnections;
  // Array (nyaste format), Map, eller objekt {key:value} (gamal format)
  nz.zoneConnections=Array.isArray(zc)||zc instanceof Map?new Map(zc)
    :(zc&&typeof zc==='object'?new Map(Object.entries(zc)):new Map());
  return nz;
}
// Felta på ei etasje som både angre og fil tek med (utan bilete/PDF og soner)
function _etasjeUt(f){
  return{
    id:f.id,name:f.name,
    mmPerImgPx:f.mmPerImgPx,ownCal:f.ownCal||false,defaultHoyde:f.defaultHoyde??3.0,
    sc:f.sc,offX:f.offX,offY:f.offY,floorDxImg:f.floorDxImg||0,floorDyImg:f.floorDyImg||0,
    delAv:f.delAv??null,plassAnker:_kopiAnker(f.plassAnker),
    pdfPage:f.pdfPage||1,totalPages:f.totalPages||1,
    paperWMm:f.paperWMm??null,paperHMm:f.paperHMm??null,paperSource:f.paperSource??null,
    measurements:normMaal(f.measurements)
  };
}
function _etasjeInn(f){
  return{
    id:f.id,name:f.name,
    mmPerImgPx:f.mmPerImgPx??null,ownCal:f.ownCal||false,defaultHoyde:f.defaultHoyde??3.0,
    sc:f.sc??1,offX:f.offX??0,offY:f.offY??0,
    // floorDxImg er biletpikslar. Gamle filer har floorDx i skjermpikslar — migrer via sc.
    floorDxImg:f.floorDxImg!=null?f.floorDxImg:(f.floorDx||0)/(f.sc||1),
    floorDyImg:f.floorDyImg!=null?f.floorDyImg:(f.floorDy||0)/(f.sc||1),
    delAv:f.delAv??null,plassAnker:_kopiAnker(f.plassAnker),
    pdfPage:f.pdfPage??1,totalPages:f.totalPages??1,
    paperWMm:f.paperWMm??null,paperHMm:f.paperHMm??null,paperSource:f.paperSource??null,
    measurements:normMaal(f.measurements)
  };
}
// Tilstanden til angre-historikken: etasjar med bilete som referansar
// (Image-objekt er uforanderlege i praksis) og soner som djupkopi.
function _historikkTilstand(){
  return{
    floors:floors.map(f=>({..._etasjeUt(f),
      bgImg:f.bgImg||null,bgImgData:f.bgImgData||null,pdfDoc:f.pdfDoc||null,
      zones:JSON.parse(JSON.stringify(f.zones.map(_soneUt)))})),
    fasadar:fasadar.map(_fasadeMinne),
    activeFloor,activeFasade,globalNorth,globalMmPerImgPx,_nextGroupId,_nextZoneId,_nextFasadeId
  };
}

function snapshot(namn){
  const _e={..._historikkTilstand(),namn:namn||null,tid:Date.now(),hendingar:[]};
  history.push(_e);
  // Utan namn: handlinga skriv nesten alltid kva ho gjorde i hintlinja like etter
  if(!namn)setTimeout(()=>{if(!_e.namn)_e.namn=_histNamnFraHint();},80);
  if(history.length>MAX_HISTORY)history.shift();
  redoStack.length=0; // Ny handling tømer redo-stacken
  updateUndoBtn();
}

function applyHistoryState(prev){
  if(mode==='plasser-ark')setMode('navigate');
  floors=prev.floors.map((pf,fi)=>{
    const cur=floors[fi]||{};
    return{..._etasjeInn(pf),
      // Bruk historikkens bilete/PDF om dei finst, elles noverande (eldre snapshots)
      bgImg:pf.bgImg!==undefined?pf.bgImg:(cur.bgImg||null),
      bgImgData:pf.bgImgData!==undefined?pf.bgImgData:(cur.bgImgData||null),
      pdfDoc:pf.pdfDoc!==undefined?pf.pdfDoc:(cur.pdfDoc||null),
      measurements:normMaal(pf.measurements!==undefined?pf.measurements:cur.measurements),
      zones:pf.zones.map(_soneInn)
    };
  });
  // Fasadearka. Eldre snapshots manglar feltet — då står arka som dei er.
  if(prev.fasadar){
    fasadar=prev.fasadar.map(_fasadeMinne);
    activeFasade=Math.min(prev.activeFasade??0,Math.max(0,fasadar.length-1));
    if(prev._nextFasadeId!==undefined)_nextFasadeId=prev._nextFasadeId;
  }
  activeFloor=Math.min(prev.activeFloor,floors.length-1);
  _ordneDelplanar();
  _nextGroupId=prev._nextGroupId;
  if(prev._nextZoneId!==undefined)_nextZoneId=prev._nextZoneId;
  if(prev.globalMmPerImgPx!==undefined)globalMmPerImgPx=prev.globalMmPerImgPx;
  setGlobalNorth(prev.globalNorth);
  syncFloorState();                 // peikar `zones` på rett etasje i begge visingar
  if(iFasade()){syncFasadeState();renderFasadeTabs();}
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();draw();
  updateUndoBtn();
}

function getCurrentState(){return _historikkTilstand();}

function undo(){
  if(!history.length){hintText.textContent='Ingen fleire angre-steg.';return;}
  const prev=history.pop();
  // Namnet følgjer steget, så «Gjer om» seier kva som kjem att
  redoStack.push({...getCurrentState(),namn:prev.namn,tid:prev.tid,hendingar:prev.hendingar||[]});
  applyHistoryState(prev);
  hintText.textContent='Angra'+(prev.namn?': '+prev.namn:'.');
  if(listeOverlay.classList.contains('show'))renderListe();
}

function redo(){
  if(!redoStack.length){hintText.textContent='Ingen fleire gjere-om-steg.';return;}
  const next=redoStack.pop();
  history.push({...getCurrentState(),namn:next.namn,tid:next.tid,hendingar:next.hendingar||[]});
  applyHistoryState(next);
  hintText.textContent='Gjort om'+(next.namn?': '+next.namn:'.');
  if(listeOverlay.classList.contains('show'))renderListe();
}

// ── Nord-sjekk knapp ──────────────────────────────────────────
(()=>{
  const btn=document.getElementById('nordBtn');
  function activate(){
    nordCheck=true;
    btn.classList.add('on');
    hintText.textContent='Nord peikar opp — slepp for å gå tilbake';
    draw();
  }
  function deactivate(){
    nordCheck=false;
    btn.classList.remove('on');
    hintText.textContent=HINTS[mode]||'';
    draw();
  }
  btn.addEventListener('mousedown',e=>{activate();e.preventDefault();});
  btn.addEventListener('touchstart',e=>{activate();e.preventDefault();},{passive:false});
  document.addEventListener('mouseup',()=>{if(nordCheck)deactivate();});
  document.addEventListener('touchend',()=>{if(nordCheck)deactivate();});
  btn.addEventListener('mouseleave',()=>{}); // don't deactivate on mouseleave — only on mouseup

  // Kompas-knappen nede ved nordpila — same åtferd
  const compassBtn=document.getElementById('compassNordBtn');
  if(compassBtn){
    compassBtn.addEventListener('mousedown',e=>{activate();e.preventDefault();});
    compassBtn.addEventListener('touchstart',e=>{activate();e.preventDefault();},{passive:false});
    compassBtn.addEventListener('mouseleave',()=>{});
  }
})();

document.getElementById('undoBtn').onclick=undo;
document.getElementById('histBtn').onclick=e=>{e.stopPropagation();visHistorikk(e.currentTarget);};
document.getElementById('redoBtn').onclick=redo;

document.getElementById('clrBtn').onclick=()=>{
  if(!confirm('Slett alle soner på denne etasjen?\n\nDenne handlinga kan angrast med Ctrl+Z.'))return;
  snapshot('Slett alle soner på '+arkNamn(curFloor()));
  zones=curFloor().zones=[];   // éi liste: aliaset og etasjen må vere same array
 curPts=[];calPts=[];winPts=[];editZoneIdx=null;
  renderFloorTabs();updateResults();draw();
};

// ── Tabs ──────────────────────────────────────────────────────
document.querySelectorAll('.stab').forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll('.stab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    const tab=t.dataset.tab;
    document.getElementById('zonesPanel').style.display=tab==='zones'?'':'none';
    document.getElementById('tablePanel').style.display=tab==='table'?'':'none';
    if(tab==='table')renderTable();
  };
});

