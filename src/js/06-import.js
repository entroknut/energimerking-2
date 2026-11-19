// ── PDF / image loading ───────────────────────────────────────
async function loadPdfPage(n){
  return loadPdfPage_with(pdfDoc,n);
}
async function handleFile(f){
  if(!f)return;
  const result={bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,paperWMm:null,paperHMm:null,paperSource:null};
  if(f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf')){
    hintText.textContent='Laster PDF…';
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
  // Fasadevising: teikninga går på det aktive fasadearket, aldri på etasjen.
  // Ei ny teikning gjer både skalaen og måla ugyldige — dei var målte på det
  // biletet som nettopp vart bytta ut. Måla vert tømde i staden for å bli
  // tildelte ei ny array, så measureResults-aliaset held.
  if(iFasade()){
    const fa=curFasade()||nyFasade();
    fa.bgImg=result.bgImg;fa.pdfDoc=result.pdfDoc;
    fa.pdfPage=result.pdfPage;fa.totalPages=result.totalPages;
    fa.paperWMm=result.paperWMm;fa.paperHMm=result.paperHMm;fa.paperSource=result.paperSource;
    fa.mmPerImgPx=null;
    if(fa.measurements)fa.measurements.length=0;else fa.measurements=[];
    syncFasadeState();
    measurePts=[];setMode('navigate');
    markDirty();
    renderFasadeTabs();renderFasadePanel();fitImage();
    return;
  }
  // Load into active floor
  const f2=curFloor();
  f2.bgImg=result.bgImg;f2.pdfDoc=result.pdfDoc;
  f2.pdfPage=result.pdfPage;f2.totalPages=result.totalPages;
  f2.paperWMm=result.paperWMm;f2.paperHMm=result.paperHMm;f2.paperSource=result.paperSource;
  f2.mmPerImgPx=null;f2.zones=[];
  syncFloorState();
  curPts=[];editZoneIdx=null;draftZones=[];winPts=[];
  updatePdfSideUI();
  renderFloorTabs();updateResults();fitImage();
}
function fitImage(){
  if(!bgImg)return;
  const r=cwrap.getBoundingClientRect();
  sc=Math.min((r.width-30)/bgImg.width,(r.height-30)/bgImg.height);
  offX=(r.width-bgImg.width*sc)/2;offY=(r.height-bgImg.height*sc)/2;
  cv.width=r.width;cv.height=r.height;
  dropz.style.display='none';draw();
}

document.getElementById('upBtn').onclick=()=>fi.click();
// Fleire filer eller ei fleirsidig PDF går til masseimporten (kvar side ein etasje)
fi.onchange=async e=>{const l=[...e.target.files];e.target.value='';await lastInnFiler(l);};
dropz.onclick=()=>fi.click();
// Slepp-tilstand: når filer vert dregne over lerretet, skal det vere tydeleg
// at dei kan sleppast. dragenter/dragleave fyrer for kvart barn musa passerer,
// så vi tel inn og ut. Berre filer — ikkje tekst eller element frå sida.
let _draDjup=0;
const _erFiler=e=>[...(e.dataTransfer?.types||[])].includes('Files');
function _draSlutt(){
  _draDjup=0;
  cwrap.classList.remove('dra-inn','over-teikning');
  applyViewUI();   // set tilbake vanleg tekst i slippsona
}
cwrap.addEventListener('dragenter',e=>{
  if(!_erFiler(e))return;
  e.preventDefault();
  if(_draDjup++>0)return;
  const n=e.dataTransfer.items?e.dataTransfer.items.length:0;
  const kva=n>1?n+' filer':'fila';
  const tomt=getComputedStyle(dropz).display!=='none';
  cwrap.classList.add('dra-inn');
  cwrap.classList.toggle('over-teikning',!tomt);
  const tekst=iFasade()?'Fasadeteikningar vert lagde inn som nye fasadeark.'
    :n>1?'Kvar fil eller PDF-side vert ein etasje — du ser over før noko vert lagt inn.'
    :tomt?'Ei teikning, ei fleirsidig PDF eller eit prosjekt (.entro).'
    // Éi fil over ei teikning går til den aktive etasjen (lastInnFiler) — sei det
    :'Eitt bilete eller ei einsida PDF byter ut teikninga på denne etasjen. Ei fleirsidig PDF vert nye etasjar.';
  if(tomt){
    document.getElementById('dropz-text').innerHTML='<strong>Slepp '+kva+' her</strong>'+tekst;
  }else{
    document.getElementById('slippTittel').textContent='Slepp '+kva+' her';
    document.getElementById('slippTekst').textContent=tekst;
  }
});
cwrap.addEventListener('dragleave',e=>{if(_erFiler(e)&&--_draDjup<=0)_draSlutt();});
cwrap.addEventListener('dragover',e=>{e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';});
cwrap.addEventListener('drop',async e=>{e.preventDefault();_draSlutt();await lastInnFiler(e.dataTransfer.files);});
// Avbrote drag (Esc, eller slept utanfor vindauget)
window.addEventListener('dragend',_draSlutt);
// Sidebla-kontrollen høyrer til den AKTIVE etasjen — ein etasje kan ha si eiga
// PDF (t.d. lasta inn med «+ Etasje → Last opp fil»), og ein annan ingen.
// Difor er dette den einaste staden som styrer synlegheita, og han vert kalla
// frå syncFloorState() så etasjebyte, ny etasje, prosjektlasting og
// etasjeimport alle får han med seg.
//
// Kontrollen står så lenge arket er ei fleirsidig PDF — også når sjølve
// PDF-dokumentet manglar. Det gjer det etter ein autolagring (localStorage har
// ikkje plass til PDF-en) eller for ein etasje henta frå eit anna prosjekt.
// Før forsvann knappen då utan forklaring; no ber han om fila på nytt.
function updatePdfSideUI(){
  const f=curArk();
  const n=f.totalPages||1;
  pgctrl.style.display=n>1?'flex':'none';
  pgLbl.textContent=(f.pdfPage||1)+'/'+n;
  pgctrl.title=f.pdfDoc?'':'PDF-fila er ikkje med i dette prosjektet — klikk ‹ › for å velje ho på nytt';
  pgctrl.style.opacity=f.pdfDoc?'1':'.6';
}
// Opnar ei PDF og tek vare på ein kopi av bytane, så dokumentet kan lagrast i
// prosjektfila (serialiserProsjekt → pdfar). pdf.js overfører bufferen til
// workeren og tømmer han, difor må kopien takast FØR getDocument.
async function opnePdf(ab){
  const bytes=new Uint8Array(ab.slice(0));
  const doc=await pdfjsLib.getDocument({data:ab}).promise;
  doc._entroBytes=bytes;
  return doc;
}
// Ingen PDF i minnet, men arket er ei fleirsidig PDF: be om fila på nytt.
// Sidetalet må stemme — elles er det truleg ei anna fil, og då spør vi.
async function _hentPdfPaaNytt(){
  const f=curArk();
  const fil=await new Promise(res=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='application/pdf,.pdf';
    inp.onchange=()=>res(inp.files[0]||null);
    inp.click();
  });
  if(!fil)return false;
  let doc;
  try{doc=await opnePdf(await fil.arrayBuffer());}
  catch(e){alert('Klarte ikkje å opne PDF-fila: '+(e.message||e));return false;}
  if(doc.numPages!==(f.totalPages||1)&&!confirm(
    `Fila har ${doc.numPages} sider, men teikninga kom frå ei PDF med ${f.totalPages} sider. Bruke ho likevel?`))
    return false;
  f.pdfDoc=doc;f.totalPages=doc.numPages;
  pdfDoc=doc;totalPages=doc.numPages;
  if(curPage>totalPages)curPage=totalPages;
  updatePdfSideUI();
  markDirty();   // PDF-en skal no med i lagringa
  return true;
}
async function _byttPdfSide(nyPg){
  curPage=nyPg;
  bgImg=await loadPdfPage(curPage);
  const f=curArk();
  f.pdfPage=curPage;f.bgImg=bgImg;
  const pm=await pdfSidePapirMm(pdfDoc,curPage);
  if(pm){f.paperWMm=pm.w;f.paperHMm=pm.h;f.paperSource='pdf';}
  updatePdfSideUI();
  markDirty();
  fitImage();
}
document.getElementById('prevPg').onclick=async()=>{
  if(!pdfDoc&&!(await _hentPdfPaaNytt()))return;
  if(curPage<=1)return;await _byttPdfSide(curPage-1);};
document.getElementById('nextPg').onclick=async()=>{
  if(!pdfDoc&&!(await _hentPdfPaaNytt()))return;
  if(curPage>=totalPages)return;await _byttPdfSide(curPage+1);};

// ── Masseimport: mange teikningar på ein gong ─────────────────
// Fleire filer, eller ei PDF med fleire sider, vert ikkje lagde på den
// aktive etasjen. Kvar side får ei rad i ein dialog med miniatyr, type
// (etasje, delplan, fasade, hopp over) og namn — gjetta frå teksten på arket
// (PDF) eller filnamnet — og brukaren rettar før noko vert lagt inn. Alt
// vert lagt inn som eitt angre-steg.
//
// Kalibreringa: PDF-ane vert rendra til om lag same tal pikslar uansett
// papirformat, så ein global skala gjeld berre ark med same pikseltettleik
// (px per mm papir) som arket skalaen vart sett på. Eit ark med annan
// tettleik får eiga kalibrering — med same målestokk føreslått når
// referansen har ein vanleg målestokk (som ved delplanar).
// Lastekortet midt på lerretet: spinnar, tekst og ein framdriftsstrek.
// del=null gir ein glidande strek (ukjend lengd). Hintlinja åleine var for
// lite — med mange teikningar såg det ut som ingenting skjedde.
function lasteVis(tittel,tekst,del){
  const k=document.getElementById('lasteKort');
  k.querySelector('.lk-tittel').textContent=tittel;
  k.querySelector('.lk-tekst').textContent=tekst||'';
  k.classList.toggle('uviss',del==null);
  if(del!=null)k.querySelector('.lk-fyll').style.width=Math.round(Math.max(0,Math.min(1,del))*100)+'%';
  k.classList.add('on');
}
function lasteSkjul(){document.getElementById('lasteKort').classList.remove('on');}
// Gi nettlesaren høve til å teikne kortet før eit tungt synkront steg.
// rAF fyrer ikkje i ei bakgrunnsfane, difor setTimeout som reserve.
const lastePaus=()=>new Promise(r=>{requestAnimationFrame(()=>setTimeout(r,0));setTimeout(r,60);});
const MASSE_TYPAR=[['etasje','Etasje'],['del','Delplan'],['fasade','Fasade'],['hopp','Hopp over']];
const erPdfFil=f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name);
const masseStor=s=>s.charAt(0).toUpperCase()+s.slice(1);
// Type, namn og etasjenummer gjetta frå teksten på arket eller filnamnet
function masseGjett(tekst){
  const s=' '+String(tekst||'').toLowerCase().replace(/[_\-]+/g,' ').replace(/\s+/g,' ')+' ';
  let type='etasje',namn=null,nr=null,m;
  if(/fasade|oppriss|elevation/.test(s))type='fasade';
  else if(/situasjonsplan|tittelblad|forside|innhaldsliste|innholdsfortegnelse|tegningsliste/.test(s))type='hopp';
  else if(/\bsnitt\b/.test(s)&&!/etasje|etg\b|plan\b|plantegning|planteikning/.test(s))type='hopp';
  if(type==='fasade'){
    m=/fasade\s*(?:mot\s*)?(nord|sør|syd|aust|øst|vest)/.exec(s);
    if(m)namn='Fasade '+masseStor(m[1]==='syd'?'sør':m[1]);
  }else if(type==='etasje'){
    if(/kjell[ae]r|underetasje|u\.?\s*etg/.test(s)){namn='Kjeller';nr=0;}
    else if((m=/(\d+)\s*\.?\s*(?:etasje|etg)/.exec(s))||(m=/(?:etasje|etg|plan)\s*(\d+)\b/.exec(s))){nr=+m[1];namn='Etasje '+nr;}
    else if(/\bloft/.test(s)){namn='Loft';nr=90;}
    else if(/takplan|tak\s*plan/.test(s)){namn='Takplan';nr=95;type='hopp';}
  }
  return{type,namn,nr};
}
// Miniatyr som dataURL, lengste kant maks px
function masseMini(kjelde,px){
  const s=Math.min(1,px/Math.max(kjelde.width,kjelde.height));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(kjelde.width*s));c.height=Math.max(1,Math.round(kjelde.height*s));
  const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
  g.drawImage(kjelde,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',0.8);
}
// Les filene til ei liste med ark: {fil, doc, side, n, img, mini, tekst, paperWMm, paperHMm}
async function masseLes(filer){
  const ark=[];let ukjende=0;
  const N=filer.length,fTekst=i=>N>1?'Fil '+(i+1)+' av '+N+' · ':'';
  for(let fi=0;fi<N;fi++){
    const f=filer[fi];
    hintText.textContent='Les '+f.name+'…';
    lasteVis('Les teikningar…',fTekst(fi)+f.name,fi/N);
    try{
      if(erPdfFil(f)){
        const doc=await opnePdf(await f.arrayBuffer());
        for(let p=1;p<=doc.numPages;p++){
          if(doc.numPages>1)lasteVis('Les teikningar…',fTekst(fi)+'side '+p+' av '+doc.numPages+' · '+f.name,(fi+(p-1)/doc.numPages)/N);
          const page=await doc.getPage(p);
          const vp1=page.getViewport({scale:1});
          const s=180/Math.max(vp1.width,vp1.height),vp=page.getViewport({scale:s});
          const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
          const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
          await page.render({canvasContext:g,viewport:vp}).promise;
          let tekst='';
          try{tekst=(await page.getTextContent()).items.map(i=>i.str).join(' ');}catch(e){}
          ark.push({fil:f.name,doc,side:p,n:doc.numPages,mini:c.toDataURL('image/jpeg',0.8),
            tekst:tekst+' '+f.name,paperWMm:vp1.width*25.4/72,paperHMm:vp1.height*25.4/72});
        }
      }else if(/^image\//.test(f.type)||/\.(png|jpe?g|gif|bmp|webp|tiff?)$/i.test(f.name)){
        const url=URL.createObjectURL(f);
        const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
        const dpi=await lesBiletDpi(f);
        const okDpi=dpi&&dpi>=50&&dpi<=2400;
        ark.push({fil:f.name,img,mini:masseMini(img,180),tekst:f.name,
          paperWMm:okDpi?img.width/dpi*25.4:null,paperHMm:okDpi?img.height/dpi*25.4:null});
      }else ukjende++;
    }catch(e){ukjende++;console.warn('Masseimport: kunne ikkje lese '+f.name,e);}
  }
  return{ark,ukjende};
}
// Dialogen. Returnerer rader, 'gammal' (berre side 1, som før) eller null.
function masseDialog(rader,einPdf){
  return new Promise(resolve=>{
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.45);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
    const box=document.createElement('div');
    box.style.cssText='background:var(--surface);border-radius:14px;width:min(780px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(13,27,42,.2);overflow:hidden';
    box.innerHTML='<div style="padding:18px 22px 10px"><div style="font-size:15px;font-weight:700;color:var(--text)">Legg inn teikningar</div>'
      +'<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">Kvar side vert ei eiga etasje, ein delplan eller eit fasadeark. '
      +'Type og namn er gjetta frå teksten på arket — rett det som er feil, og hopp over snitt og situasjonsplanar.</div></div>';
    const liste=document.createElement('div');
    liste.style.cssText='overflow-y:auto;padding:4px 22px;flex:1;border-top:1px solid var(--border);border-bottom:1px solid var(--border)';
    box.appendChild(liste);
    const fot=document.createElement('div');
    fot.style.cssText='padding:12px 22px;display:flex;align-items:center;gap:8px;flex-wrap:wrap';
    const sum=document.createElement('div');sum.style.cssText='flex:1;font-size:12px;color:var(--text3);min-width:180px';
    const knapp=(t,stil)=>{const b=document.createElement('button');b.textContent=t;
      b.style.cssText='padding:7px 14px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;'+stil;return b;};
    const avbryt=knapp('Avbryt','border:1px solid var(--border2);background:var(--surface);color:var(--text2)');
    const ok=knapp('','border:none;background:var(--accent);color:#fff;font-weight:600');
    fot.appendChild(sum);
    if(einPdf){
      const gml=knapp('Berre side 1 her','border:1px solid var(--border2);background:var(--surface);color:var(--text2)');
      gml.title='Legg berre fyrste sida på den aktive etasjen og bla med ‹ › — som før';
      gml.onclick=()=>{ov.remove();resolve('gammal');};
      fot.appendChild(gml);
    }
    fot.appendChild(avbryt);fot.appendChild(ok);
    box.appendChild(fot);
    const oppdater=()=>{
      const t={etasje:0,del:0,fasade:0,hopp:0};rader.forEach(r=>t[r.type]++);
      const n=rader.length-t.hopp;
      sum.textContent=[t.etasje&&t.etasje+' etasje'+(t.etasje===1?'':'r'),t.del&&t.del+' delplan'+(t.del===1?'':'ar'),
        t.fasade&&t.fasade+' fasade'+(t.fasade===1?'':'r'),t.hopp&&t.hopp+' hoppa over'].filter(Boolean).join(' · ');
      ok.textContent='Legg inn '+n+' teikning'+(n===1?'':'ar');
      ok.disabled=!n;ok.style.opacity=n?'1':'.45';
    };
    const teikn=()=>{
      liste.innerHTML='';
      rader.forEach((r,i)=>{
        const rad=document.createElement('div');
        rad.style.cssText='display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)'
          +(r.type==='hopp'?';opacity:.5':'');
        const bilde=document.createElement('img');bilde.src=r.k.mini;
        bilde.style.cssText='width:90px;height:64px;object-fit:contain;border:1px solid var(--border);border-radius:6px;background:var(--surface);flex-shrink:0';
        const midt=document.createElement('div');midt.style.cssText='flex:1;min-width:0';
        const kj=document.createElement('div');kj.style.cssText='font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        kj.textContent=r.k.fil+(r.k.doc&&r.k.n>1?' · side '+r.k.side+' av '+r.k.n:'');
        const namn=document.createElement('input');namn.value=r.namn;namn.disabled=r.type==='hopp';
        namn.style.cssText='margin-top:4px;width:100%;padding:5px 8px;border:1px solid var(--border2);border-radius:6px;font-family:inherit;font-size:13px';
        namn.oninput=()=>{r.namn=namn.value;};
        midt.append(kj,namn);
        const sel=document.createElement('select');
        sel.style.cssText='padding:5px 6px;border:1px solid var(--border2);border-radius:6px;font-family:inherit;font-size:12px';
        MASSE_TYPAR.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;if(v===r.type)o.selected=true;sel.appendChild(o);});
        sel.onchange=()=>{r.type=sel.value;teikn();};
        const pil=(t,d)=>{const b=document.createElement('button');b.textContent=t;
          b.style.cssText='width:26px;height:24px;border:1px solid var(--border2);border-radius:5px;background:var(--surface);cursor:pointer;color:var(--text2)';
          const j=i+d;b.disabled=j<0||j>=rader.length;if(b.disabled)b.style.opacity='.3';
          b.onclick=()=>{[rader[i],rader[j]]=[rader[j],rader[i]];teikn();};return b;};
        const pilar=document.createElement('div');pilar.style.cssText='display:flex;flex-direction:column;gap:2px';
        pilar.title='Rekkjefølgja er etasjerekkjefølgja — nedste etasje øvst';
        pilar.append(pil('↑',-1),pil('↓',1));
        rad.append(bilde,midt,sel,pilar);
        liste.appendChild(rad);
      });
      oppdater();
    };
    avbryt.onclick=()=>{ov.remove();resolve(null);};
    ok.onclick=()=>{ov.remove();resolve(rader);};
    teikn();
    ov.appendChild(box);document.body.appendChild(ov);
  });
}
async function masseImport(filer){
  let ark,ukjende;
  try{({ark,ukjende}=await masseLes(filer));}finally{lasteSkjul();}
  hintText.textContent='';
  if(!ark.length){hintText.textContent='Fann ingen teikningar å leggje inn'+(ukjende?' ('+ukjende+' filer kunne ikkje lesast)':'')+'.';return;}
  // Gjett, gi namn til dei utan, og sorter etasjane nedanfrå
  let rader=ark.map((k,i)=>{const g=masseGjett(k.tekst);if(!g.namn&&k.tekst!==k.fil){const f=masseGjett(k.fil);if(f.namn)Object.assign(g,f);}return{k,i,...g};});
  const etg=rader.filter(r=>r.type==='etasje'),fas=rader.filter(r=>r.type==='fasade'),hopp=rader.filter(r=>r.type==='hopp');
  etg.sort((a,b)=>(a.nr??500+a.i)-(b.nr??500+b.i));
  let ne=floors.filter(f=>!erDelplan(f)&&(f.bgImg||f.zones.length)).length;
  etg.forEach(r=>{if(!r.namn)r.namn='Etasje '+(++ne);});
  // Same etasjenamn to gonger: den andre er truleg ein annan fløy av same etasje
  const sett=new Set();
  etg.forEach(r=>{if(sett.has(r.namn))r.type='del';sett.add(r.namn);});
  fas.forEach((r,i)=>{if(!r.namn)r.namn='Fasade '+(fasadar.length+i+1);});
  hopp.forEach(r=>{if(!r.namn)r.namn=r.k.fil.replace(/\.[^.]+$/,'')+(r.k.doc&&r.k.n>1?' s.'+r.k.side:'');});
  rader=[...etg,...fas,...hopp];
  const val=await masseDialog(rader,filer.length===1&&!!ark[0].doc);
  if(val==='gammal'){
    lasteVis('Opnar teikninga…',filer[0].name,null);
    try{await lastePaus();await handleFile(filer[0]);}finally{lasteSkjul();}
    return;
  }
  if(!val)return;
  try{await masseLeggInn(val.filter(r=>r.type!=='hopp'));}finally{lasteSkjul();}
  if(ukjende)hintText.textContent+=' ('+ukjende+' filer kunne ikkje lesast.)';
}
async function masseLeggInn(bruk){
  if(!bruk.length)return;
  saveFloorState();
  snapshot();
  const tomStart=floors.length===1&&!floors[0].bgImg&&!floors[0].zones.length;
  // Mange ark på 48 Mpx kvar vert fort fleire GB i minnet — halv oppløysing då
  const target=bruk.length>6?24e6:undefined;
  const ref=floors.find(f=>f.bgImg&&f.paperWMm&&!f.ownCal&&mppForFloor(f))||null;
  let dRef=ref?ref.bgImg.width/ref.paperWMm:null;
  const ms=ref?_arkMaalestokk(ref):null;
  const nye=[],nyeF=[];let eiga=0,foreslatt=0,lastHov=null;
  for(let i=0;i<bruk.length;i++){
    const r=bruk[i],k=r.k;
    hintText.textContent='Legg inn '+(i+1)+' av '+bruk.length+'…';
    lasteVis('Legg inn teikningar…',(i+1)+' av '+bruk.length+' · '+(String(r.namn||'').trim()||k.fil),i/bruk.length);
    const img=k.doc?await loadPdfPage_with(k.doc,k.side,target):k.img;
    const felles={bgImg:img,pdfDoc:k.doc||null,pdfPage:k.side||1,totalPages:k.doc?k.n:1,
      paperWMm:k.paperWMm??null,paperHMm:k.paperHMm??null,paperSource:k.doc?'pdf':(k.paperWMm?'dpi':null)};
    const namn=String(r.namn||'').trim();
    if(r.type==='fasade'){
      const fa=nyFasade({name:namn||undefined});
      Object.assign(fa,felles);
      nyeF.push(fa);
      continue;
    }
    const del=r.type==='del'&&lastHov;
    // Ein delplan med same namn som etasjen sin heiter «Del n», som ved «+»
    let fnamn=namn||(del?'':'Etasje');
    if(del&&(!fnamn||fnamn===lastHov.name))fnamn='Del '+(nye.filter(x=>x.delAv===lastHov.id).length+2);
    const f={id:_nextFloorId++,name:fnamn,...felles,
      mmPerImgPx:null,ownCal:!!del,defaultHoyde:del?(lastHov.defaultHoyde??3.0):(parseFloat(fhI.value)||3.0),
      floorDxImg:0,floorDyImg:0,sc:1,offX:0,offY:0,zones:[],measurements:[],
      delAv:del?lastHov.id:null,plassAnker:null};
    const d=k.paperWMm?img.width/k.paperWMm:null;
    if(!dRef&&d&&!del)dRef=d;   // ingen skala frå før: det fyrste arket er referansen
    if(f.ownCal||(d&&dRef&&Math.abs(d/dRef-1)>0.01)){
      f.ownCal=true;
      if(!del)eiga++;          // delplanar har alltid eiga kalibrering — ikkje noko å melde
      if(ms&&k.paperWMm){f.mmPerImgPx=k.paperWMm/img.width*ms;foreslatt++;}
    }
    if(!del)lastHov=f;
    nye.push(f);
  }
  lasteVis('Legg inn teikningar…','Byggjer etasjane',1);
  await lastePaus();
  if(tomStart&&nye.length)floors.splice(0,1);
  floors.push(...nye);
  // Nye etasjar på rett plass i stabelen (Kjeller under Etasje 1 …) — men
  // berre når kvar hovudetasje har eit nummer i namnet. Elles står dei sist,
  // og brukaren dreg fanene på plass.
  const hov=floors.filter(f=>f.delAv==null),nr=new Map(hov.map(f=>[f,kiEtgNr(f.name)]));
  if(hov.every(f=>nr.get(f)!=null)){
    const rekkje=hov.slice().sort((a,b)=>nr.get(a)-nr.get(b));
    floors.sort((a,b)=>rekkje.indexOf(hovudEtasje(a))-rekkje.indexOf(hovudEtasje(b)));
  }
  _ordneDelplanar();
  if(nye.length)activeFloor=floors.indexOf(nye[0]);
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();renderFasadeTabs();updateResults();renderTable();
  if(bgImg)fitImage();else draw();
  markDirty();
  const ne=nye.filter(f=>!f.delAv).length,nd=nye.length-ne;
  hintText.textContent=[ne&&ne+' etasje'+(ne===1?'':'r'),nd&&nd+' delplan'+(nd===1?'':'ar'),
    nyeF.length&&nyeF.length+' fasadeark'].filter(Boolean).join(', ')+' lagt inn.'
    +(eiga?' '+eiga+' har anna pikseltettleik enn dei andre og fekk eiga kalibrering.':'')
    +(nd?' Delplanane har eiga kalibrering, som alltid.':'')
    +(foreslatt?' Målestokken 1:'+ms+' er føreslått på '+foreslatt+' — kontroller med eit kontrollmål.'
      :(eiga||nd)?' Kalibrer dei som ikkje har skala.':'')
    +(nyeF.length?' Fasadeteikningane ligg under «Fasade».':'');
}
// Éin eller fleire filer inn. Éi fil som er eit bilete eller ei einsida PDF
// går til den aktive etasjen som før; alt anna til masseimporten.
async function lastInnFiler(liste){
  let filer=[...(liste||[])].filter(Boolean);
  if(!filer.length)return;
  // Ei .entro-fil opnar heile prosjektet, så ho kan ikkje blandast med
  // teikningar (dei ville hamna i prosjektet som vert bytt ut) eller med
  // andre prosjekt. Då seier vi frå og gjer ingenting.
  const prosj=filer.filter(f=>/\.entro$/i.test(f.name));
  if(prosj.length){
    if(prosj.length>1||filer.length>1){
      alert('Ei .entro-fil opnar eit heilt prosjekt og må veljast åleine. Opne prosjektet fyrst, og last opp teikningane etterpå.');
      return;
    }
    return opneProsjektfil(prosj[0]);
  }
  // Éi teikning i full oppløysing tek òg eit par sekund — same kort, utan tal
  const enkel=async f=>{lasteVis('Opnar teikninga…',f.name,null);
    try{await lastePaus();return await handleFile(f);}finally{lasteSkjul();}};
  if(filer.length===1&&!erPdfFil(filer[0]))return enkel(filer[0]);
  if(filer.length===1){
    let n=1;
    lasteVis('Opnar teikninga…',filer[0].name,null);
    try{const doc=await pdfjsLib.getDocument({data:await filer[0].arrayBuffer()}).promise;n=doc.numPages;doc.destroy&&doc.destroy();}catch(e){}
    if(n<=1)return enkel(filer[0]);
  }
  return masseImport(filer);
}

// ── Slett etasjar ──
// Same reglar som ✕ på fana: ei delplan går åleine, ei hovudteikning med
// delplanar lèt den fyrste delplanen ta over etasjen og namnet.
function slettArk(f){
  const fi=floors.indexOf(f);
  if(fi<0)return;
  const _del=erDelplan(f),_ark=etasjeArk(f);
  const _arv=!_del&&_ark.length>1?_ark[1]:null;
  if(_arv){
    _arv.delAv=null;_arv.plassAnker=null;
    _ark.slice(2).forEach(x=>{x.delAv=_arv.id;});
    _arv.name=f.name;
  }
  floors.splice(fi,1);
  // Slettar vi ei etasje FØR den aktive, forskyvast indeksen — juster
  if(fi<activeFloor)activeFloor--;
  if(activeFloor>=floors.length)activeFloor=floors.length-1;
}
function etterSletting(){
  if(!floors.length){
    floors.push({id:_nextFloorId++,name:'Etasje 1',bgImg:null,pdfDoc:null,pdfPage:1,totalPages:1,
      paperWMm:null,paperHMm:null,paperSource:null,mmPerImgPx:null,ownCal:false,defaultHoyde:3.0,
      floorDxImg:0,floorDyImg:0,sc:1,offX:0,offY:0,zones:[],measurements:[],delAv:null,plassAnker:null});
    activeFloor=0;
  }
  if(activeFloor<0)activeFloor=0;
  // Fjern groupId frå soner som mista koplingspartnarane sine
  const _gidCount={};
  floors.forEach(fl=>fl.zones.forEach(z=>{if(z.groupId)_gidCount[z.groupId]=(_gidCount[z.groupId]||0)+1;}));
  floors.forEach(fl=>fl.zones.forEach(z=>{if(z.groupId&&_gidCount[z.groupId]<2)delete z.groupId;}));
  _ordneDelplanar();
  syncFloorState();
  editZoneIdx=null;curPts=[];draftZones=[];winPts=[];
  renderFloorTabs();updateResults();renderTable();
  if(bgImg)fitImage();else{dropz.style.display='';draw();}
}
// Dialog med alle arka: kryss av og slett i eitt angre-steg.
function slettEtasjarDialog(){
  saveFloorState();
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(13,27,42,.45);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  const box=document.createElement('div');
  box.style.cssText='background:var(--surface);border-radius:14px;width:min(520px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(13,27,42,.2);overflow:hidden';
  box.innerHTML='<div style="padding:18px 22px 10px"><div style="font-size:15px;font-weight:700;color:var(--text)">Slett etasjar</div>'
    +'<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">Sonene på arka du slettar forsvinn òg. Kan angrast med Ctrl+Z.</div></div>';
  const liste=document.createElement('div');
  liste.style.cssText='overflow-y:auto;padding:4px 22px;flex:1;border-top:1px solid var(--border);border-bottom:1px solid var(--border)';
  const valt=new Set();
  floors.forEach(f=>{
    const rad=document.createElement('label');
    rad.style.cssText='display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer'
      +(erDelplan(f)?';padding-left:22px':'');
    const cb=document.createElement('input');cb.type='checkbox';
    cb.onchange=()=>{cb.checked?valt.add(f):valt.delete(f);oppdater();};
    const bilde=document.createElement('div');
    bilde.style.cssText='width:64px;height:44px;border:1px solid var(--border);border-radius:5px;background:var(--dm-s2,#f8fafc) center/contain no-repeat;flex-shrink:0';
    if(f.bgImg)bilde.style.backgroundImage='url('+masseMini(f.bgImg,120)+')';
    const t=document.createElement('div');t.style.cssText='flex:1;min-width:0;font-size:13px;color:var(--text)';
    t.textContent=arkNamn(f);
    const u=document.createElement('div');u.style.cssText='font-size:11px;color:var(--text3)';
    u.textContent=(f.bgImg?'':'Inga teikning · ')+f.zones.length+' soner';
    t.appendChild(u);
    rad.append(cb,bilde,t);
    liste.appendChild(rad);
  });
  box.appendChild(liste);
  const fot=document.createElement('div');
  fot.style.cssText='padding:12px 22px;display:flex;gap:8px;justify-content:flex-end';
  const avbryt=document.createElement('button');avbryt.textContent='Avbryt';
  avbryt.style.cssText='padding:7px 14px;border:1px solid var(--border2);background:var(--surface);color:var(--text2);border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer';
  const ok=document.createElement('button');
  ok.style.cssText='padding:7px 14px;border:none;background:#dc2626;color:#fff;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer';
  const oppdater=()=>{
    const n=valt.size,s=[...valt].reduce((a,f)=>a+f.zones.length,0);
    ok.textContent='Slett '+n+' ark'+(s?' og '+s+' soner':'');
    ok.disabled=!n;ok.style.opacity=n?'1':'.45';
  };
  avbryt.onclick=()=>ov.remove();
  ok.onclick=()=>{
    if(!valt.size)return;
    ov.remove();
    snapshot();markDirty();
    const n=valt.size;
    // Hovudteikningar sist, så ein delplan som skal slettast ikkje fyrst arvar etasjen
    [...valt].sort((a,b)=>(erDelplan(b)?1:0)-(erDelplan(a)?1:0)).forEach(slettArk);
    etterSletting();
    hintText.textContent=n+' ark sletta. Ctrl+Z angrar.';
  };
  fot.append(avbryt,ok);box.appendChild(fot);
  oppdater();
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  ov.appendChild(box);document.body.appendChild(ov);
}

