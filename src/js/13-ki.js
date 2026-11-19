// ── 2e. KI-oppteikning (beta) ─────────────────────────────────
// «✦ KI-oppteikning» lèt Claude teikne opp soner — og vindauge og dører på
// fasadane — frå planteikninga. Kallet går gjennom EntroPi
// (EntroHost.askAi → sxi:ai-request): verktøyet har ingen API-nøkkel, så
// knappen er .embed-only. Prompt og JSON-skjema bur her; verten sender dei
// vidare til Claude og svarar med det tolka resultatet.
//
// Omfang: denne etasjen, eller heile bygget (alle ark med planteikning).
// Fasadeteikningane (fasadar[]) vert lesne fyrst når dei finst: retning,
// etasjenivå og opningar med høgd og brystning. Dei gir høgd og brystning
// til vindauga planen finn, og etasjehøgdene.
//
// To steg, kvart med sitt eige forslag og sitt eige angre-steg:
//   1. soner — éin førespurnad per ark, forslaget ligg per etasje (kiUtkast)
//      og vert sett over etasje for etasje
//   2. opningar, éin førespurnad per sone, på dei veggane som er fasade
// Steg 2 køyrer på sonene som ligg i etasjane når det startar — anten dei kom
// frå steg 1 eller vart teikna for hand. Fyrst då er skiljekonstruksjonen
// sett, og vi veit kva veggar som er fasade.
//
// Stega les aldri lerret-globalane (bgImg, zones, mmPerImgPx) for anna enn
// den aktive etasjen: alt går gjennom eit «ark» {f,img,mpp,zones} frå kiArk().
//
// KI-koordinatane er grove (om lag 1 % av arket). Difor vert kvart hjørne
// snappa til veggkrysset i teikninga (_linjeKryss), hjørne som høyrer saman
// i nabosoner slegne saman, og eit hjørne som ligg på kanten av ei nabosone
// lagt nøyaktig på kanten. Utan det ville ikkje autoSkilleveggForNySone
// (toleranse 8 cm) sjå at to soner deler vegg.
const KI_MAXPX=2400;          // lengste kant på bileta som går til Claude
const KI_PARALLELT=3;         // samtidige førespurnader i steg 2
const aiOverlay=document.getElementById('aiOverlay');
const aiLog=document.getElementById('aiLog');
const aiGo=document.getElementById('aiGo');
let kiKoyring=0;              // aukar ved avbrot — svar frå ei gammal køyring vert kasta
let kiSteg=null;              // 'soner' | 'opningar' medan eit forslag ligg framme
let kiVidareTilOpningar=false;
let kiUtkast=null;            // Map etasje → soneforslag (draftZones er forslaget for den aktive)
let kiFasadeInfo=null;        // det som vart lese av fasadeteikningane, sjå kiLesFasadar
let kiInnst={};               // vala frå dialogen for køyringa som går
let kiHoyderBrukt=false;
let kiStoppaAuto=false;       // «Gå rett gjennom» vart stoppa (kalibreringa stemde ikkje)      // etasjehøgdene vert lagde inn éin gong, ved fyrste «Godta»

// Etasjen som eit sjølvstendig ark. saveFloorState() må ha gått, så den
// aktive etasjen sitt bilete og soneliste ligg på etasjeobjektet.
function kiArk(f){return{f,img:f.bgImg,mpp:mppForFloor(f),zones:f.zones};}
// Arka køyringa gjeld: alle med planteikning, eller berre den aktive
function kiMaal(bygg){return bygg?floors.filter(f=>f.bgImg):[curFloor()];}
const kiFasadeArk=()=>fasadar.filter(a=>a&&a.bgImg);

function logAi(t){aiLog.textContent+=t+'\n';aiLog.scrollTop=aiLog.scrollHeight;}
function kiKnappar(stadfest,tekst){
  document.getElementById('aiMainBtns').style.display=stadfest?'none':'flex';
  document.getElementById('aiConfirmBtns').style.display=stadfest?'flex':'none';
  if(tekst)document.getElementById('aiAccept').textContent=tekst;
  aiOverlay.classList.toggle('review',!!stadfest);
  // Soneforslaget vert sett over plan for plan (kiTeiknSoneListe)
  const val=!!stadfest&&kiSteg==='soner';
  aiOverlay.classList.toggle('ki-soner',val);
  document.getElementById('aiSoneVal').style.display=val?'':'none';
  if(val){kiSett.add(curFloor());kiTeiknSoneListe();}
  kiTeiknEtasjar(!!stadfest&&!val);
}
// Knapperad med etasjane forslaget dekkjer. Eit trykk byter etasje på
// lerretet — forslaget for etasjen kjem fram av seg sjølv (kiEtterEtasjebyte).
function kiTeiknEtasjar(vis){
  const el=document.getElementById('aiEtasjar');
  const tal=new Map();
  if(kiSteg==='soner'&&kiUtkast)kiUtkast.forEach((arr,f)=>tal.set(f,arr.length));
  if(kiSteg==='opningar')kiDraftWins.forEach(d=>{
    const f=floors.find(x=>x.zones.includes(d.z)||(x===curFloor()&&zones.includes(d.z)));
    if(f)tal.set(f,(tal.get(f)||0)+(d.antal||1));
  });
  if(!vis||tal.size<2){el.style.display='none';return;}
  el.innerHTML='';el.style.display='';
  floors.filter(f=>tal.has(f)).forEach(f=>{
    const b=document.createElement('button');
    b.textContent=arkNamn(f)+' · '+tal.get(f);
    b.className=f===curFloor()?'on':'';
    b.onclick=()=>{const i=floors.indexOf(f);if(i>=0&&i!==activeFloor)switchFloor(i);};
    el.appendChild(b);
  });
}
function kiEtterEtasjebyte(){
  if(kiSteg==='soner'&&kiUtkast)draftZones=kiUtkast.get(curFloor())||[];
  if(kiSteg)kiKnappar(true);
  draw();
}
function kiOppdaterVal(){
  const bygg=(document.querySelector('input[name="aiOmfang"]:checked')||{}).value==='bygg';
  const maal=kiMaal(bygg);
  const soner=document.getElementById('aiSoner').checked;
  const opn=document.getElementById('aiOpn');
  document.getElementById('aiDelRow').classList.toggle('off',!soner);
  // Skalaen må vere sett for hand fyrst. KI-en treng han for å leggje
  // sonekantane på innsida av veggen og måle vindauga — og ei kalibrering KI-en
  // gjorde sjølv var ikkje til å stole på (prøvd i v5.11.0, fjerna att).
  const utan=maal.filter(f=>!mppForFloor(f));
  const fa=kiFasadeArk();
  const brukFa=fa.length&&(opn.checked||document.getElementById('aiHoyder').checked);
  const utanF=brukFa?fa.filter(a=>!a.mmPerImgPx):[];
  kiVisKalibrering(maal,brukFa?fa:[],utan,utanF);
  const n=maal.reduce((s,f)=>s+f.zones.length,0),notar=[];
  if(soner&&n)notar.push((bygg?'Etasjane':'Etasjen')+' har alt '+n+' sone'+(n===1?'':'r')+'. Nye soner kjem i tillegg.');
  if(!soner&&opn.checked&&!n)notar.push('Det finst ingen soner å finne opningar på.');
  if(brukFa)notar.push(fa.length+' fasadeteikning'+(fa.length===1?'':'ar')+' vert lesne fyrst.');
  // Fasadane vert kopla til veggane etter himmelretning — nord må vere sett
  if(opn.checked&&!(parseFloat(northI.value)||0))notar.push('Nord står på 0° — sjekk at det stemmer før du startar.');
  document.getElementById('aiNote').textContent=notar.join(' ');
  aiGo.disabled=!!utan.length||!(soner||(opn.checked&&n)||(fa.length&&document.getElementById('aiHoyder').checked));
}
// Kalibreringa av kvart ark køyringa les, som ei liste med status og ein
// «Kalibrer»-knapp per ark som manglar skala. Planteikningar utan skala sperrar
// Start (raud). Fasadeteikningar utan skala sperrar ikkje — skalaen kan hentast
// frå kotene — men vert viste like tydeleg (gul), for kotene gir grovare mål.
function kiVisKalibrering(plan,fasade,utan,utanF){
  const krav=document.getElementById('aiKalKrav');
  const ark=[...plan.map(f=>({f,fasade:false,ok:!utan.includes(f)})),
             ...fasade.map(a=>({f:a,fasade:true,ok:!utanF.includes(a)}))];
  krav.style.display=ark.length?'':'none';
  krav.classList.toggle('bor',!utan.length&&!!utanF.length);
  krav.classList.toggle('ok',!utan.length&&!utanF.length);
  document.getElementById('aiKalKravTekst').innerHTML=utan.length
    ?'<b>Kalibrer planteikning'+(utan.length===1?'a':'ane')+' fyrst.</b> Utan skala kan ikkje KI-en leggje sonekantane på innsida av veggen eller måle vindauga.'
     +(utanF.length?' Kalibrer fasadeteikningane òg.':'')
    :utanF.length
      ?'<b>Kalibrer fasadeteikning'+(utanF.length===1?'a':'ane')+' òg.</b> Utan skala vert høgdene henta frå kotene på teikninga, som gir grovare vindaugshøgder og etasjehøgder.'
      :'<b>Alle teikningane er kalibrerte.</b>';
  const liste=document.getElementById('aiKalListe');
  liste.innerHTML='';
  ark.forEach(x=>{
    const rad=document.createElement('div');rad.className='ai-kalrad';
    rad.innerHTML='<span class="k-st">'+(x.ok?'✓':x.fasade?'!':'✕')+'</span>'
      +'<span class="k-namn"></span><span class="k-type">'+(x.fasade?'fasade':'plan')+'</span>';
    rad.querySelector('.k-namn').textContent=x.fasade?x.f.name:arkNamn(x.f);
    if(!x.ok){
      const b=document.createElement('button');b.textContent='Kalibrer';
      b.onclick=()=>kiKalibrerArk(x.f,x.fasade);
      rad.appendChild(b);
    }
    liste.appendChild(rad);
  });
}
// Lukk KI-ruta, gå til arket og opne kalibreringa der
function kiKalibrerArk(f,fasade){
  kiLukk();
  if(fasade){
    setViewMode('fasade');
    const i=fasadar.indexOf(f);if(i>=0&&i!==activeFasade)switchFasade(i);
  }else{
    setViewMode('plan');
    const i=floors.indexOf(f);if(i>=0&&i!==activeFloor)switchFloor(i);
  }
  calBtn.click();
}
['aiSoner','aiOpn','aiHoyder'].forEach(id=>{document.getElementById(id).onchange=kiOppdaterVal;});
document.querySelectorAll('input[name="aiOmfang"]').forEach(r=>{r.onchange=kiOppdaterVal;});

document.getElementById('aiBtn').onclick=()=>{
  if(!inPi()){hintText.textContent='KI-oppteikninga går gjennom EntroPi og er berre tilgjengeleg der.';return;}
  if(viewMode!=='plan'){hintText.textContent='KI-oppteikninga verkar på planteikningar.';return;}
  if(!bgImg){hintText.textContent='Last opp ei planteikning først.';return;}
  saveFloorState();
  // Ei etasje med soner har truleg fått dei teikna for hand — då er det
  // opningane ein er ute etter.
  document.getElementById('aiSoner').checked=!zones.length;
  const plan=floors.filter(f=>f.bgImg).length,fa=kiFasadeArk().length;
  document.getElementById('aiOmfangRow').style.display=(plan>1||fa)?'':'none';
  document.getElementById('aiOmfangEtg').textContent='Denne etasjen ('+arkNamn(curFloor())+')';
  document.getElementById('aiOmfangBygg').textContent='Heile bygget — '+plan+' planteikning'+(plan===1?'':'ar')
    +(fa?', '+fa+' fasadeteikning'+(fa===1?'':'ar'):'');
  document.querySelector('input[name="aiOmfang"][value="'+(plan>1?'bygg':'etasje')+'"]').checked=true;
  document.getElementById('aiHoyderRow').style.display=fa?'':'none';
  document.getElementById('aiHoyder').checked=!!fa;
  aiLog.textContent='';
  kiKnappar(false);
  aiGo.textContent='Start ✦';
  kiOppdaterVal();
  aiOverlay.classList.add('show');
};
function kiLukk(){
  kiKoyring++;kiSteg=null;
  draftZones=[];kiDraftWins=[];kiUtkast=null;kiFasadeInfo=null;
  aiOverlay.classList.remove('show','review','ki-soner');
  draw();
}
document.getElementById('aiClose').onclick=kiLukk;

// ── Bilete til Claude ──
// Utsnittet rect (biletpikslar) skalert til maks KI_MAXPX, som JPEG. teikn(g,s)
// kan teikne oppå (s = skjerm/bilete-skalaen i utsnittet).
function kiBilete(img,rect,teikn){
  const s=Math.min(1,KI_MAXPX/Math.max(rect.w,rect.h));
  const W=Math.max(1,Math.round(rect.w*s)),H=Math.max(1,Math.round(rect.h*s));
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d',{willReadFrequently:true});
  g.fillStyle='#fff';g.fillRect(0,0,W,H);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(!(s<0.5&&kiNedskalerStrek(g,img,rect,W,H)))g.drawImage(img,rect.x,rect.y,rect.w,rect.h,0,0,W,H);
  kiKontrast(g,W,H);
  if(teikn)teikn(g,s);
  return{mediaType:'image/jpeg',data:c.toDataURL('image/jpeg',0.9).split(',')[1]};
}
// Kraftig nedskalering (eit A1-ark ned til KI_MAXPX) jamnar ut tynne strekar
// til blass grått. Via eit mellomsteg i dobbel storleik: kvar utpiksel er
// snittet av det mørkaste og gjennomsnittet i 2×2-blokka, så ein strek på
// éin piksel held seg mørk. Returnerer false om pikslane ikkje kan lesast.
function kiNedskalerStrek(g,img,rect,W,H){
  try{
    const c2=document.createElement('canvas');c2.width=W*2;c2.height=H*2;
    const g2=c2.getContext('2d',{willReadFrequently:true});
    g2.fillStyle='#fff';g2.fillRect(0,0,W*2,H*2);
    g2.imageSmoothingEnabled=true;g2.imageSmoothingQuality='high';
    g2.drawImage(img,rect.x,rect.y,rect.w,rect.h,0,0,W*2,H*2);
    const d=g2.getImageData(0,0,W*2,H*2).data,ut=g.createImageData(W,H),o=ut.data,W2=W*2;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const i0=((2*y)*W2+2*x)*4,i1=i0+4,i2=i0+W2*4,i3=i2+4,k=(y*W+x)*4;
      for(let ch=0;ch<3;ch++){
        const a=d[i0+ch],b=d[i1+ch],e=d[i2+ch],f=d[i3+ch];
        o[k+ch]=(Math.min(a,b,e,f)+((a+b+e+f)>>2))>>1;
      }
      o[k+3]=255;
    }
    g.putImageData(ut,0,0);
    return true;
  }catch(e){return false;}
}
// Foto av ei teikning (og skann med skugge frå bokryggen) har ujamt lys:
// papiret er kvitt i eitt hjørne og grått i eit anna, så éin felles terskel
// et opp strekane i det mørke hjørnet. Papirnivået vert difor rekna per rute
// (90-persentilen, robust mot strekar), jamna og interpolert, og kvar piksel
// delt på det. Berre når papiret faktisk varierer — eit jamt ark er urørt.
function kiJamnLys(p,W,H){
  const B=Math.max(24,Math.round(Math.max(W,H)/40));
  const nx=Math.ceil(W/B),ny=Math.ceil(H/B),bg=new Float32Array(nx*ny);
  const hist=new Uint32Array(256);
  for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++){
    hist.fill(0);let tal=0;
    for(let y=by*B;y<Math.min(H,(by+1)*B);y+=2)for(let x=bx*B;x<Math.min(W,(bx+1)*B);x+=2){
      const i=(y*W+x)*4;hist[(p[i]*77+p[i+1]*150+p[i+2]*29)>>8]++;tal++;
    }
    let a=0,v=255;for(;v>0;v--){a+=hist[v];if(a>=tal*0.1)break;}
    bg[by*nx+bx]=v;
  }
  // Mørk botn (blåkopi) vert handsama av den globale snuinga
  const s=Array.from(bg).sort((a,b)=>a-b),med=s[s.length>>1];
  if(med<110||s[Math.floor(s.length*0.95)]-s[Math.floor(s.length*0.05)]<35)return;
  // Ruter som er heilt dekte av teikning (svart felt) har lågt «papir» — bruk naboen
  const j=new Float32Array(bg.length);
  for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++){
    let m=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const X=bx+dx,Y=by+dy;if(X>=0&&Y>=0&&X<nx&&Y<ny)m=Math.max(m,bg[Y*nx+X]);
    }
    j[by*nx+bx]=Math.max(40,m);
  }
  for(let y=0;y<H;y++){
    const fy=Math.min(ny-1,Math.max(0,(y+0.5)/B-0.5)),y0=Math.floor(fy),y1=Math.min(ny-1,y0+1),ty=fy-y0;
    for(let x=0;x<W;x++){
      const fx=Math.min(nx-1,Math.max(0,(x+0.5)/B-0.5)),x0=Math.floor(fx),x1=Math.min(nx-1,x0+1),tx=fx-x0;
      const b=(j[y0*nx+x0]*(1-tx)+j[y0*nx+x1]*tx)*(1-ty)+(j[y1*nx+x0]*(1-tx)+j[y1*nx+x1]*tx)*ty;
      const k=255/b,i=(y*W+x)*4;
      p[i]=Math.min(255,p[i]*k);p[i+1]=Math.min(255,p[i+1]*k);p[i+2]=Math.min(255,p[i+2]*k);
    }
  }
}
// Dårlege skann, foto og blåkopiar: grått papir, blasse strekar, mørk
// bakgrunn. Strekk nivåa så papiret vert kvitt og streken mørk, og snu
// biletet om papiret er mørkt (kvite strekar på mørk botn). Ei teikning som
// alt har god kontrast vert ikkje rørt.
function kiKontrast(g,W,H){
  let d;
  try{d=g.getImageData(0,0,W,H);}catch(e){return;}
  const p=d.data,n=W*H,hist=new Uint32Array(256);
  kiJamnLys(p,W,H);
  for(let i=0;i<n;i++)hist[(p[i*4]*77+p[i*4+1]*150+p[i*4+2]*29)>>8]++;
  const fraMork=f=>{let a=0;for(let v=0;v<256;v++){a+=hist[v];if(a>=n*f)return v;}return 255;};
  const fraLys=f=>{let a=0;for(let v=255;v>=0;v--){a+=hist[v];if(a>=n*f)return v;}return 0;};
  // Papiret er det meste av arket: medianen seier om botnen er lys eller mørk
  const snu=fraMork(0.5)<110;
  let lo,hi;
  if(snu){lo=255-fraLys(0.01);hi=255-fraMork(0.30);}
  else{lo=fraMork(0.01);hi=fraLys(0.30);}
  if(!snu&&lo<=30&&hi>=225)return;           // god kontrast alt
  if(hi-lo<25)return;                       // tomt eller einsfarga utsnitt
  const k=255/(hi-lo),lut=new Uint8ClampedArray(256);
  for(let v=0;v<256;v++){const u=snu?255-v:v;lut[v]=Math.round((u-lo)*k);}
  for(let i=0;i<n*4;i+=4){p[i]=lut[p[i]];p[i+1]=lut[p[i+1]];p[i+2]=lut[p[i+2]];}
  g.putImageData(d,0,0);
}
// Normaliserte KI-koordinatar (0–1000 langs kvar akse i utsnittet) → biletpikslar
const kiTilBilete=(p,rect)=>({x:rect.x+(+p.x/1000)*rect.w,y:rect.y+(+p.y/1000)*rect.h});
const kiTilNorm=(p,rect)=>({x:Math.round((p.x-rect.x)/rect.w*1000),y:Math.round((p.y-rect.y)/rect.h*1000)});
// Eitt nytt forsøk når kallet feila av ein grunn som kan gå over: tidsavbrot,
// nettfeil, eit svar som ikkje kunne lesast, eller eit avkorta svar (då med
// dobbelt så mange token). Ikkje når verten manglar eller Claude avslo.
async function kiSpor(o){
  let siste='ukjend feil';
  for(let forsok=0;forsok<2;forsok++){
    const run=kiKoyring;
    const r=await window.EntroHost.askAi(o);
    if(r.ok&&r.result&&typeof r.result==='object')return r.result;
    siste=(r&&r.message)||'tomt svar';
    if(run!==kiKoyring||/svarte ikkje|Ikkje kopla|avslo/i.test(siste))break;
    if(/avkorta|max_tokens/i.test(siste))o={...o,maxTokens:Math.min(32000,(o.maxTokens||16000)*2)};
    await new Promise(res=>setTimeout(res,1500));
  }
  throw new Error(siste);
}

// ── Steg 1: soner ──
// Funksjon, ikkje konstant: BYGKAT_SXI vert definert lenger ned i fila.
const KI_ARKTYPAR=['plan','fasade','snitt','situasjonsplan','anna'];
const KI_ARKTYPE_NAMN={fasade:'ei fasadeteikning',snitt:'eit snitt',situasjonsplan:'ein situasjonsplan',anna:'noko anna enn ei planteikning'};
// Felles for alle prompta: kva som er bygg og kva som berre er teikneteknikk
const KI_LES_TEIKNING=[
  'TEIKNINGA kan vere ein rein CAD-plot, eit dårleg skann, eit foto, ein gammal blåkopi, ei handteikning eller ei',
  'enkel skisse — skeiv, blass, flekkete, med stempel og handskrivne merknader. Les ho like grundig uansett.',
  'Skil BYGGET frå teikneteknikken rundt:',
  '- Målelinjer: tynne linjer med små skråstrekar, prikkar eller piler i endane og eit tal (mm) over — ofte i',
  '  rekkjer utanfor bygget. Dei er IKKJE veggar, kantar eller opningar, men tala kan brukast til å sjekke mål.',
  '- Aksesystem: lange tynne strek-prikk-linjer med bokstav eller tal i ein sirkel i enden. Ikkje veggar.',
  '- Kotemerke (trekant/pil med «+12,60»), nivålinjer, høgdemål og snittmarkeringar (pil med bokstav, A–A).',
  '- Terreng, skravering, møblar, sanitær, kjøkeninnreiing, trær, bilar, personar, nordpil, målestokk, rutenett.',
  '- Tittelfelt, revisjonsfelt, teiknforklaring, stempel og merknader.'
].join('\n');
const kiSkjemaSoner=()=>({
  type:'object',additionalProperties:false,required:['arkType','analyse','kontrollMaal','soner'],
  properties:{
    arkType:{type:'string',enum:KI_ARKTYPAR},
    analyse:{type:'string'},
    kontrollMaal:{type:'object',additionalProperties:false,required:['mm','a','b'],properties:{
      mm:{type:'integer'},
      a:{type:'object',additionalProperties:false,required:['x','y'],properties:{x:{type:'number'},y:{type:'number'}}},
      b:{type:'object',additionalProperties:false,required:['x','y'],properties:{x:{type:'number'},y:{type:'number'}}}}},
    soner:{type:'array',items:{
      type:'object',additionalProperties:false,required:['namn','bruk','byggeaar','pts'],
      properties:{
        namn:{type:'string'},
        byggeaar:{type:'integer'},
        bruk:{type:'string',enum:[...Object.keys(BYGKAT_SXI),'Ukjend']},
        pts:{type:'array',items:{type:'object',additionalProperties:false,required:['x','y'],
          properties:{x:{type:'number'},y:{type:'number'}}}}
      }}}
  }
});
function kiPromptSoner(del){
  return [
    'Biletet skal vere ei planteikning av éin etasje i eit bygg. Teikn opp energisonene for energimerking i SIMIEN.',
    '',
    'FYRST: `arkType` — kva teikninga faktisk er. «plan» = planteikning sett ovanfrå (romnamn, veggar i plan,',
    'dørslag). «fasade» = oppriss av ytterveggen. «snitt» = bygget skore loddrett gjennom (etasjeskilje og tak skorne',
    'og skraverte, ein ser inn i romma). «situasjonsplan» = bygget på tomta med nabobygg/vegar. Er det ikkje «plan»,',
    'gi tom `soner` og seg kort kvifor i `analyse`.',
    '',
    KI_LES_TEIKNING,
    '',
    'KOORDINATAR: normaliserte tal 0–1000 langs kvar akse — x frå venstre kant, y frå øvre kant av biletet.',
    '',
    'KVAR SONE er eitt polygon langs INNSIDA av ytterveggen, der golvarealet byrjar. Ytterveggen er det tjukke bandet',
    '(grått, svart eller skravert, eller to parallelle strekar) som går rundt bygget. Polygonkanten skal liggje på',
    'romsida av bandet — aldri ute i veggen eller utanfor fasaden. På ei enkel skisse eller eit dårleg skann kan',
    'veggen vere ein einaste strek; då ligg kanten på streken. Følg veggen si faktiske retning: er bygget skeivt',
    'eller har skrå fasadar, skal polygonet vere det òg. Gi hjørna i rekkjefølgje rundt sona, med alle knekkpunkt i',
    'veggen, men utan dører, vindaugsnisjar og søyler.',
    'Trapperom, heissjakter, sjakter og tekniske rom INNE i bygget høyrer med i sona — ikkje lag hòl for dei.',
    'Ta ikkje med balkongar, terrassar, svalgangar, utvendige trapper, carport, eller bodar, vareheisar og rom som',
    'ligg utanpå fasaden som eigne små tilbygg.',
    '',
    del==='bruk'
      ?'INNDELING: del bygget slik ein energirådgjevar gjer det for SIMIEN. Same bygningskategori i same etasje '
       +'skal i hovudsak vere ÉI sone — også når fleire leigetakarar eller einingar deler henne. Ny sone berre der '
       +'(1) bygningskategorien skiftar, (2) byggetrinnet skiftar så byggeåret er eit anna — tilbygg, årstal som '
       +'«Tilbygg 1997» eller «oppgradert 2025», eller (3) ein del er uisolert eller kald, t.d. «Lager – uisolert». '
       +'Følg skiljeveggane mellom delane, også når dei har sprang. Ikkje del i einskilde rom. Nabosoner skal dele '
       +'vegg nøyaktig: bruk same koordinatar på felles hjørne, og legg skiljet midt i skiljeveggen.'
      :'INNDELING: éi sone per samanhengande bygningskropp. Ikkje del i rom.',
    '',
    '`bruk` er bygningskategorien sona truleg har, ut frå romnamn og planløysing. «Ukjend» når teikninga ikkje seier det.',
    '`namn`: bruk namnet som står på teikninga for delen («Tilbygg 1997», «Personaldel»), elles kort etter bruken,',
    't.d. «Kontor», «Butikk» eller «Bustad».',
    '`byggeaar` er byggeåret for delen når teikninga seier det (t.d. 1997 for «Tilbygg 1997», 2025 for «oppgradert',
    '2025»). 0 når teikninga ikkje seier noko.',
    '',
    'Ignorer tittelfelt, målsetjing, aksesystem, situasjonsplan, snitt og detaljar. Er det fleire etasjeplanar på same ark,',
    'ta berre med den største.',
    'Skriv kort i `analyse` kva du ser: bygningsform, kva som er teke med og kva som er halde utanfor.',
    '',
    '`kontrollMaal`: det LENGSTE påskrivne totalmålet på teikninga (målelinja over heile bygget eller ei heil',
    'fasade), med talet i mm og dei to endepunkta `a`/`b` der målelinja byrjar og sluttar (ved skråstreken/pila).',
    'Programmet brukar det til å sjekke at teikninga er rett kalibrert. Finst det ikkje noko totalmål: mm 0.',
    '',
    'SLIK GÅR DU FRAM: (1) finn ytterkonturen av bygget, (2) gå rundt han hjørne for hjørne med klokka og ta med',
    'kvart sprang og kvar knekk som er større enn om lag 30 cm, (3) sjekk at polygonet ikkje kuttar hjørne, ikkje',
    'tek med balkongar eller trapper utanfor, og at det lukkar seg der det byrja, (4) del i soner til slutt.'
  ].join('\n');
}

function kiRyddPolygon(pts,tol){
  let p=pts.filter(q=>isFinite(q.x)&&isFinite(q.y));
  for(let gong=0;gong<4;gong++){
    const ut=[];
    for(let i=0;i<p.length;i++){
      const a=ut.length?ut[ut.length-1]:p[p.length-1],q=p[i];
      if(Math.hypot(q.x-a.x,q.y-a.y)<tol)continue;      // duplikat
      ut.push(q);
    }
    // Rette punkt midt på ein vegg: avstanden til linja mellom naboane er liten
    const ut2=ut.filter((q,i)=>{
      const a=ut[(i-1+ut.length)%ut.length],b=ut[(i+1)%ut.length];
      const L=Math.hypot(b.x-a.x,b.y-a.y);
      if(L<1e-9||ut.length<=3)return true;
      return Math.abs((b.x-a.x)*(q.y-a.y)-(b.y-a.y)*(q.x-a.x))/L>=tol/2;
    });
    if(ut2.length===p.length){p=ut2;break;}
    p=ut2;
  }
  return p;
}
function kiNaerastePaaKant(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy;
  if(!L2)return{t:0,d:Math.hypot(p.x-a.x,p.y-a.y),x:a.x,y:a.y};
  const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/L2;
  const x=a.x+t*dx,y=a.y+t*dy;
  return{t,d:Math.hypot(p.x-x,p.y-y),x,y};
}
// ── Kanttilpassing mot ytterveggen ──
// KI-en treffer sjeldan innsida av veggen: kanten kan liggje ein meter ute
// i fasaden eller vere nokre grader skeiv. Hjørnesnappinga (_linjeKryss)
// hjelper ikkje på teikningar der veggane er tjukke, grå band — ho leitar
// etter tynne strekar som kryssar. Difor vert kvar fasadekant tilpassa som
// HEIL linje: tvers over kanten vert teikninga lesen på mange stader, og
// innsida av veggbandet (eller den indre av to tynne veggstrekar) gir eit
// kandidatpunkt. Ei Hough-røysting over små vinklar finn linja flest
// punkt er einige om — møblar, tekst og dørslag kjem på tilfeldige stader
// og vert røysta ut. Hjørna vert så krysset mellom nabokantane.
let _kiGraa=null;
// Gråtonekopi av planteikninga, nedskalert til maks 4096 px, med papirnivået.
function kiGraa(img){
  if(_kiGraa&&_kiGraa.img===img)return _kiGraa;
  const k=Math.min(1,4096/Math.max(img.width,img.height));
  const W=Math.max(1,Math.round(img.width*k)),H=Math.max(1,Math.round(img.height*k));
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  x.drawImage(img,0,0,W,H);
  let d;
  try{d=x.getImageData(0,0,W,H).data;}catch(e){return null;}
  const g=new Uint8Array(W*H),hist=new Uint32Array(256);
  for(let i=0;i<W*H;i++){const v=(d[i*4]*77+d[i*4+1]*150+d[i*4+2]*29)>>8;g[i]=v;hist[v]++;}
  // Kvite strekar på mørk botn (blåkopi, invertert skann): snu, så «mørk» er strek
  {let a=0,med=0;for(let v=0;v<256;v++){a+=hist[v];if(a>=W*H/2){med=v;break;}}
   if(med<110){hist.fill(0);for(let i=0;i<W*H;i++){g[i]=255-g[i];hist[g[i]]++;}}}
  // Papiret: det lysaste tiandeparten av arket. Mørkare enn papir − 40 er strek.
  let acc=0,papir=255;
  for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=W*H*0.10){papir=v;break;}}
  _kiGraa={img,k,W,H,g,mork:Math.max(60,papir-40)};
  return _kiGraa;
}
// Tilpass kanten a→b (biletpikslar) til innsida av veggen. inn = einingsnormal
// mot innsida av sona. M = mål i biletpikslar (S søk, vegg, maxVegg, steg).
// Returnerer {p,q} (ny linje gjennom to punkt) eller null når teikninga ikkje
// gir ei einig linje — då står KI-kanten. midt: legg linja midt i veggen i
// staden for på innsida (skiljevegg mellom to soner).
function kiTilpassKant(G,a,b,inn,M,midt){
  const k=G.k;
  const ax=a.x*k,ay=a.y*k,dx=(b.x-a.x)*k,dy=(b.y-a.y)*k,L=Math.hypot(dx,dy);
  if(L<1)return null;
  const ux=dx/L,uy=dy/L,S=Math.max(4,Math.round(M.S*k));
  const minV=Math.max(2,M.vegg*k),maxV=Math.max(minV+2,M.maxVegg*k);
  // Strekar med under ~20 cm mellomrom er same vegg: skravering, og ein
  // vegg teikna med tette strekar. Veggstrekar lenger frå kvarandre vert
  // fanga av par-regelen under.
  const hol=Math.max(1,Math.round(M.hol*k));
  const n=Math.max(8,Math.min(60,Math.round(L/Math.max(4,M.steg*k))));
  const kand=[];
  for(let j=0;j<n;j++){
    const s=L*(0.06+0.88*j/(n-1)),bx=ax+ux*s,by=ay+uy*s;
    const runs=[];let start=null,sist=null;   // u kan vere negativ — null tyder «ingen»
    for(let u=-S;u<=S;u++){
      const px=Math.round(bx+inn.x*u),py=Math.round(by+inn.y*u);
      const mork=px>=0&&py>=0&&px<G.W&&py<G.H&&G.g[py*G.W+px]<G.mork;
      if(!mork)continue;
      if(start===null||u-sist>hol+1){if(start!==null)runs.push([start,sist]);start=u;}
      sist=u;
    }
    if(start!==null)runs.push([start,sist]);
    runs.forEach((r,i)=>{
      const bredd=r[1]-r[0]+1;
      // Tjukke veggar tel meir: ytterveggen er som regel tjukkare enn innerveggane
      if(bredd>=minV&&bredd<=maxV*1.5){kand.push({j,s,u:midt?(r[0]+r[1])/2:r[1]+0.5,w:2*Math.sqrt(bredd/minV)});return;}
      // Veggen teikna som to tynne strekar: den indre streken er innsida
      const o=runs[i-1];
      if(o&&bredd<minV&&o[1]-o[0]+1<minV){
        const tjukn=r[1]-o[0]+1;
        if(tjukn>=minV&&tjukn<=maxV)kand.push({j,s,u:midt?(o[0]+r[1])/2:r[1]+0.5,w:1.5});
      }
    });
  }
  if(kand.length<4)return null;
  const bw=Math.max(1.5,minV/3),mid=L/2;
  let best=null;const alle=[];
  for(let deg=-4;deg<=4.001;deg+=0.5){
    const t=Math.tan(deg*Math.PI/180),bin=new Map();
    kand.forEach(c=>{const o=Math.round((c.u-(c.s-mid)*t)/bw);bin.set(o,(bin.get(o)||0)+c.w);});
    bin.forEach((v,o)=>{
      const sum=v+0.5*((bin.get(o-1)||0)+(bin.get(o+1)||0));
      const sc=sum*(1-0.3*Math.abs(o*bw)/S);           // nær KI-kanten vinn ein jamn kamp
      const e={sc,t,o:o*bw};alle.push(e);
      if(!best||sc>best.sc)best=e;
    });
  }
  // Ein fasade er det YTSTE veggbandet. Ein heil korridorvegg rett innanfor
  // kan få fleire røyster enn ytterveggen, som er broten av vindauge — difor
  // vinn eit band lenger ute så lenge det har over halvparten av røystene.
  if(!midt){
    const ref=best;
    alle.forEach(e=>{if(e.sc>=0.5*ref.sc&&e.o<ref.o-2*minV&&(best===ref||e.o<best.o))best=e;});
  }
  // Nok av kanten må vere einig — elles er det møblar og tekst, ikkje ein vegg
  const naer=kand.filter(c=>Math.abs(c.u-(c.s-mid)*best.t-best.o)<=2*bw);
  if(new Set(naer.map(c=>c.j)).size<Math.max(4,0.35*n))return null;
  // Minste kvadrat på punkta nær den vinnande linja: u = α + β·(s−mid)
  let sw=0,ss=0,su=0,sss=0,ssu=0;
  naer.forEach(c=>{const x=c.s-mid;sw++;ss+=x;su+=c.u;sss+=x*x;ssu+=x*c.u;});
  const det=sw*sss-ss*ss;
  const beta=Math.abs(det)>1e-9?(sw*ssu-ss*su)/det:best.t;
  const alfa=(su-beta*ss)/sw;
  if(Math.abs(beta)>Math.tan(5*Math.PI/180))return null;
  const P=s=>{const u=alfa+beta*(s-mid);return{x:(ax+ux*s+inn.x*u)/k,y:(ay+uy*s+inn.y*u)/k};};
  return{p:P(0),q:P(L)};
}
function kiLinjeKryss(l1,l2){
  const d1x=l1.q.x-l1.p.x,d1y=l1.q.y-l1.p.y,d2x=l2.q.x-l2.p.x,d2y=l2.q.y-l2.p.y;
  const kr=d1x*d2y-d1y*d2x,n1=Math.hypot(d1x,d1y),n2=Math.hypot(d2x,d2y);
  if(!n1||!n2||Math.abs(kr)/(n1*n2)<Math.sin(8*Math.PI/180))return null;  // nesten parallelle
  const t=((l2.p.x-l1.p.x)*d2y-(l2.p.y-l1.p.y)*d2x)/kr;
  return{x:l1.p.x+t*d1x,y:l1.p.y+t*d1y};
}
// Ligg kanten a→b mot ei anna sone (KI-forslag eller ei som alt finst)? Då er
// han ein skiljevegg: skiljet skal stå midt i veggen, ikkje på innsida.
function kiDeltKant(a,b,andre,tol){
  const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2},L=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const ux=(b.x-a.x)/L,uy=(b.y-a.y)/L;
  return andre.some(pts=>{
    if(kiInniPolygon(m,pts))return true;
    for(let i=0;i<pts.length;i++){
      const p=pts[i],q=pts[(i+1)%pts.length],l=Math.hypot(q.x-p.x,q.y-p.y);
      if(!l)continue;
      const par=Math.abs(ux*(q.x-p.x)/l+uy*(q.y-p.y)/l)>0.95;
      const r=kiNaerastePaaKant(m,p,q);
      if(par&&r.d<tol&&r.t>-0.05&&r.t<1.05)return true;
    }
    return false;
  });
}
// Fasadekantane i alle sonene inn til innsida av veggen. Returnerer talet på
// kantar som vart tilpassa, og merkjer hjørna som ligg på ein tilpassa kant.
function kiTilpassFasadar(soner,ark){
  const G=kiGraa(ark.img),mpp=ark.mpp;
  if(!G)return{kantar:0,av:0};
  const D=Math.max(ark.img.width,ark.img.height);
  const M=mpp?{S:2000/mpp,hol:200/mpp,vegg:80/mpp,maxVegg:700/mpp,steg:250/mpp,minKant:800/mpp,deltTol:600/mpp}
             // Ukalibrert: eit ark er typisk 30–80 m breitt i verkelegheita
             :{S:0.04*D,hol:0.005*D,vegg:0.002*D,maxVegg:0.015*D,steg:0.004*D,minKant:0.01*D,deltTol:0.01*D};
  const finst=ark.zones.filter(z=>(z.pts||[]).length>=3).map(z=>z.pts);
  let kantar=0,av=0;
  soner.forEach(s=>{
    const pts=s.pts,m=pts.length;
    if(m<3)return;
    const andre=[...soner.filter(o=>o!==s).map(o=>o.pts),...finst];
    const linjer=[],tilpassa=[];
    for(let i=0;i<m;i++){
      const a=pts[i],b=pts[(i+1)%m],L=Math.hypot(b.x-a.x,b.y-a.y);
      linjer[i]={p:a,q:b};tilpassa[i]=false;
      if(L<M.minKant)continue;
      // Skiljevegg mot ei anna sone: midt i veggen, så begge sonene får same
      // linje. Fasade: innsida av veggen.
      const delt=kiDeltKant(a,b,andre,M.deltTol);
      if(!delt)av++;
      let inn={x:-(b.y-a.y)/L,y:(b.x-a.x)/L};
      const e=Math.max(1,L*0.01);
      if(!kiInniPolygon({x:(a.x+b.x)/2+inn.x*e,y:(a.y+b.y)/2+inn.y*e},pts))inn={x:-inn.x,y:-inn.y};
      const r=kiTilpassKant(G,a,b,inn,M,delt);
      if(r){linjer[i]=r;tilpassa[i]=true;if(!delt)kantar++;}
    }
    s.pts=pts.map((p,i)=>{
      const f=(i-1+m)%m;
      if(!tilpassa[f]&&!tilpassa[i])return p;
      let x=kiLinjeKryss(linjer[f],linjer[i]);
      // Nesten rett vidare: legg hjørnet på den tilpassa kanten
      if(!x){const l=tilpassa[i]?linjer[i]:linjer[f];const r=kiNaerastePaaKant(p,l.p,l.q);x={x:r.x,y:r.y};}
      if(Math.hypot(x.x-p.x,x.y-p.y)>3*M.S)return p;   // eit kryss langt ute er feil, ikkje betre
      return{x:x.x,y:x.y,_fit:1};
    });
  });
  return{kantar,av};
}

// Rettar KI-polygona mot teikninga og mot kvarandre. Returnerer statistikk.
function kiRettSoner(soner,ark){
  const img=ark.img,D=Math.max(img.width,img.height),mpp=ark.mpp;
  // Søkeradius for veggkrysset: ~1 % av arket, men aldri meir enn ~0,6 m.
  let R=Math.round(D*0.01);
  if(mpp)R=Math.min(R,Math.round(600/mpp));
  R=Math.max(10,Math.min(160,R));
  const slaa=mpp?Math.max(3,Math.min(R,400/mpp)):R;   // hjørne nærare enn dette er same hjørne
  let snappa=0,tal=0;
  soner.forEach(s=>{s.pts=kiRyddPolygon(s.pts,Math.max(2,slaa/4));});
  const fit=kiTilpassFasadar(soner,ark);
  soner.forEach(s=>{
    s.pts=s.pts.map(p=>{
      tal++;
      if(p._fit){snappa++;return{x:p.x,y:p.y,_s:1};}   // ligg alt på innsida av veggen
      const r=_linjeKryss(img,p,R);
      if(!r)return{x:p.x,y:p.y};
      snappa++;
      // Grovt søk fyrst, så eit fint rundt treffet — det grove vindauget er
      // nedskalert til 81 px og gir berre eit par pikslar nøyaktigheit.
      const f=_linjeKryss(img,r,Math.max(10,Math.round(R/6)))||r;
      return{x:f.x,y:f.y,_s:1};
    });
  });
  // Slå saman hjørne på tvers av soner (union-find). Snappa hjørne vinn.
  const alle=[];
  soner.forEach((s,si)=>s.pts.forEach(p=>alle.push({p,si})));
  const far=alle.map((_,i)=>i);
  const rot=i=>far[i]===i?i:(far[i]=rot(far[i]));
  for(let i=0;i<alle.length;i++)for(let j=i+1;j<alle.length;j++){
    if(alle[i].si===alle[j].si)continue;
    if(Math.hypot(alle[i].p.x-alle[j].p.x,alle[i].p.y-alle[j].p.y)<slaa)far[rot(i)]=rot(j);
  }
  const grupper=new Map();
  alle.forEach((e,i)=>{const r=rot(i);if(!grupper.has(r))grupper.set(r,[]);grupper.get(r).push(e.p);});
  let slegne=0;
  grupper.forEach(g=>{
    if(g.length<2)return;
    slegne++;
    const kj=g.some(p=>p._s)?g.filter(p=>p._s):g;
    const x=kj.reduce((s,p)=>s+p.x,0)/kj.length,y=kj.reduce((s,p)=>s+p.y,0)/kj.length;
    g.forEach(p=>{p.x=x;p.y=y;});
  });
  // Hjørne som ligg på kanten av ei nabosone (T-kryss) vert lagt på kanten.
  soner.forEach((s,si)=>s.pts.forEach(p=>{
    let best=null;
    soner.forEach((o,oi)=>{
      if(oi===si)return;
      for(let k=0;k<o.pts.length;k++){
        const q=kiNaerastePaaKant(p,o.pts[k],o.pts[(k+1)%o.pts.length]);
        if(q.t>0.001&&q.t<0.999&&q.d<slaa&&(!best||q.d<best.d))best=q;
      }
    });
    if(best&&best.d>0){p.x=best.x;p.y=best.y;}
  }));
  soner.forEach(s=>{s.pts=kiRyddPolygon(s.pts,1).map(p=>({x:p.x,y:p.y}));});
  return{snappa,tal,slegne,kantar:fit.kantar,av:fit.av};
}

// Soneforslaget for eitt ark. Returnerer {drafts, analyse, st, fjerna}.
// Eit stort ark (A1 med tittelfelt, teiknforklaring, situasjonsplan …) vert
// fyrst sett på i heilskap: kva slags teikning er det, og kvar står planen?
// Så går berre planen til sonesteget, i full oppløysing.
const KI_SKJEMA_PLAN_OVERSIKT={type:'object',additionalProperties:false,required:['arkType','x0','y0','x1','y1'],
  properties:{arkType:{type:'string',enum:KI_ARKTYPAR},x0:{type:'number'},y0:{type:'number'},x1:{type:'number'},y1:{type:'number'}}};
async function kiPlanUtsnitt(ark){
  const img=ark.img,heile={x:0,y:0,w:img.width,h:img.height};
  if(Math.max(img.width,img.height)<=KI_MAXPX*1.3)return{rect:heile};
  try{
    const res=await kiSpor({oppgave:'soner',images:[kiBilete(img,heile)],schema:KI_SKJEMA_PLAN_OVERSIKT,maxTokens:3000,
      meta:{etasje:arkNamn(ark.f),steg:'oversikt'},prompt:[
      'Biletet er eit heilt teikningsark. Seg kva teikninga er (`arkType`): «plan» = planteikning av ein etasje sett',
      'ovanfrå, «fasade» = oppriss, «snitt» = loddrett snitt gjennom bygget, «situasjonsplan» = bygget på tomta,',
      '«anna» = noko anna.',
      'Er det ein plan: gi ei ramme `x0,y0,x1,y1` (normalisert 0–1000, x frå venstre, y frå toppen) rundt den STØRSTE',
      'etasjeplanen — heile bygget med ytterveggane, men utan tittelfelt, teiknforklaring, situasjonsplan, snitt og',
      'detaljar. Ta med målelinjene rundt. Hellar heller litt for stor enn for lita. Er det ikkje ein plan: 0,0,1000,1000.'
    ].join('\n')});
    if(res.arkType&&res.arkType!=='plan')return{rect:heile,arkType:res.arkType};
    const x0=Math.max(0,Math.min(res.x0,res.x1)),x1=Math.min(1000,Math.max(res.x0,res.x1));
    const y0=Math.max(0,Math.min(res.y0,res.y1)),y1=Math.min(1000,Math.max(res.y0,res.y1));
    if(!(x1-x0>=50&&y1-y0>=50))return{rect:heile};
    const mx=(x1-x0)*0.05+8,my=(y1-y0)*0.05+8;
    const a=Math.max(0,x0-mx),b=Math.max(0,y0-my),c=Math.min(1000,x1+mx),d=Math.min(1000,y1+my);
    // Planen fyller nesten heile arket — då er det ingenting å vinne
    if((c-a)*(d-b)>850000)return{rect:heile};
    return{rect:{x:a/1000*img.width,y:b/1000*img.height,w:(c-a)/1000*img.width,h:(d-b)/1000*img.height},utsnitt:true};
  }catch(e){return{rect:heile};}
}
// Kalibreringssjekk: det lengste påskrivne totalmålet mot det same målt med
// skalaen. Programmet kalibrerer aldri sjølv (prøvd og fjerna i v5.11.1) —
// men seier frå når skalaen og teikninga ikkje stemmer.
function kiSjekkKalibrering(km,rect,mpp){
  if(!km||!(km.mm>=2000)||!mpp)return null;
  const a=kiTilBilete(km.a,rect),b=kiTilBilete(km.b,rect);
  const maalt=Math.hypot(b.x-a.x,b.y-a.y)*mpp;
  if(!(maalt>500))return null;
  const avvik=(maalt-km.mm)/km.mm;
  return{mm:km.mm,maalt,avvik};
}
// Forslaget teikna oppå planen, nummerert, som bilete 2 i kontrollrunden
const KI_KONTROLL_FARGAR=['#dc2626','#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#be185d','#4d7c0f'];
async function kiKontrollSoner(img,rect,soner,del){
  const merka=kiBilete(img,rect,(g,s)=>{
    const P=p=>({x:(p.x-rect.x)*s,y:(p.y-rect.y)*s});
    soner.forEach((z,i)=>{
      const f=KI_KONTROLL_FARGAR[i%KI_KONTROLL_FARGAR.length];
      g.beginPath();z.pts.forEach((p,j)=>{const q=P(p);j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.closePath();
      g.fillStyle=f+'22';g.fill();g.strokeStyle=f;g.lineWidth=3;g.stroke();
      z.pts.forEach(p=>{const q=P(p);g.beginPath();g.arc(q.x,q.y,4,0,Math.PI*2);g.fillStyle=f;g.fill();});
      const c=P(flateMerkepunkt(z.pts));
      g.beginPath();g.arc(c.x,c.y,15,0,Math.PI*2);g.fillStyle='#fff';g.fill();g.strokeStyle=f;g.lineWidth=2.5;g.stroke();
      g.fillStyle=f;g.font='bold 16px Inter,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(i+1),c.x,c.y+1);
    });
  });
  const liste=soner.map((z,i)=>'  sone '+(i+1)+' «'+(z.namn||'')+'» ('+(z.bruk||'Ukjend')+(z.byggeaar?', '+z.byggeaar:'')+'): '
    +z.pts.map(p=>{const q=kiTilNorm(p,rect);return'('+q.x+', '+q.y+')';}).join(' '));
  const res=await kiSpor({oppgave:'soner',images:[kiBilete(img,rect),merka],schema:kiSkjemaKontroll(),maxTokens:16000,
    meta:{steg:'kontroll',soner:soner.length},prompt:[
    'Bilete 1 er ei planteikning. Bilete 2 er den same teikninga med eit FORSLAG til energisoner teikna oppå i fargar,',
    'nummererte. Du er kontrollør: samanlikn forslaget nøye med teikninga.',
    '',
    'Sjekk særleg:',
    '- Følgjer kvar sone INNSIDA av ytterveggen heile vegen rundt? Hjørne som er kutta, sprang og knekkar som manglar,',
    '  kantar som ligg ute i veggen eller utanfor fasaden, eller inne i rommet.',
    '- Manglar delar av bygget (ein fløy, eit tilbygg, eit hjørne), eller er noko med som ikkje skal vere der',
    '  (balkong, terrasse, utvendig trapp, carport, nabobygg, målelinjer eller tittelfelt teke for vegg)?',
    '- Er inndelinga rett: '+(del==='bruk'?'ny sone berre der bygningskategori eller byggetrinn skiftar, eller ein del er uisolert':'éi sone per bygningskropp')+'?',
    '- Deler nabosoner vegg nøyaktig, utan glipe og utan overlapp?',
    '',
    KI_LES_TEIKNING,
    '',
    'Er forslaget rett (avvik under om lag 30 cm): `ok` true, tom `soner`, og ein kort `kommentar`.',
    'Er noko feil: `ok` false, skriv i `kommentar` kva du retta, og gi HEILE den retta lista i `soner` (alle soner,',
    'også dei som var rette), i same format og same koordinatar (0–1000 for biletet, x frå venstre, y frå toppen).',
    '',
    'Forslaget, hjørne for hjørne:',
    ...liste
  ].join('\n')});
  return{ok:!!res.ok,kommentar:String(res.kommentar||'').trim().replace(/[.\s]+$/,''),soner:res.soner||[]};
}
// Funksjon, ikkje konstant: BYGKAT_SXI vert definert lenger ned i fila
const kiSkjemaKontroll=()=>({type:'object',additionalProperties:false,required:['ok','kommentar','soner'],properties:{
  ok:{type:'boolean'},kommentar:{type:'string'},
  soner:{type:'array',items:{type:'object',additionalProperties:false,required:['namn','bruk','byggeaar','pts'],
    properties:{namn:{type:'string'},byggeaar:{type:'integer'},
      bruk:{type:'string',enum:[...Object.keys(BYGKAT_SXI),'Ukjend']},
      pts:{type:'array',items:{type:'object',additionalProperties:false,required:['x','y'],
        properties:{x:{type:'number'},y:{type:'number'}}}}}}}}});
async function kiSonerForArk(ark,del){
  const img=ark.img,mpp=ark.mpp;
  const u=await kiPlanUtsnitt(ark);
  if(u.arkType)return{analyse:'',st:{},fjerna:0,drafts:[],ikkjePlan:u.arkType};
  const rect=u.rect;
  const res=await kiSpor({oppgave:'soner',prompt:kiPromptSoner(del),images:[kiBilete(img,rect)],
    schema:kiSkjemaSoner(),maxTokens:16000,meta:{etasje:arkNamn(ark.f)}});
  if(res.arkType&&res.arkType!=='plan')return{analyse:res.analyse||'',st:{},fjerna:0,drafts:[],ikkjePlan:res.arkType};
  const minAreal=mpp?2e6/(mpp*mpp):(img.width*img.height*1e-4);   // 2 m², elles 0,01 % av arket
  const soner=(res.soner||[]).map(s=>({namn:String(s.namn||'').trim(),bruk:s.bruk,
    byggeaar:(s.byggeaar>=1800&&s.byggeaar<=2100)?Math.round(s.byggeaar):null,
    pts:(s.pts||[]).map(p=>kiTilBilete(p,rect))})).filter(s=>s.pts.length>=3);
  let st=kiRettSoner(soner,ark);
  let gode=soner.filter(s=>s.pts.length>=3&&kiAreal(s.pts)>=minAreal);
  const kal=kiSjekkKalibrering(res.kontrollMaal,rect,mpp);
  // Kontrollrunde: Claude ser forslaget teikna oppå planen og rettar det
  let kontroll=null;
  if(gode.length){
    try{
      const k=await kiKontrollSoner(img,rect,gode,del);
      if(k&&!k.ok&&k.soner.length){
        const nye=k.soner.map(s=>({namn:String(s.namn||'').trim(),bruk:s.bruk,
          byggeaar:(s.byggeaar>=1800&&s.byggeaar<=2100)?Math.round(s.byggeaar):null,
          pts:(s.pts||[]).map(p=>kiTilBilete(p,rect))})).filter(s=>s.pts.length>=3);
        const a0=gode.reduce((s,z)=>s+kiAreal(z.pts),0),a1=nye.reduce((s,z)=>s+kiAreal(z.pts),0);
        // Ei retting som endrar totalarealet med meir enn 40 % er ikkje ei retting
        if(nye.length&&a1>0.6*a0&&a1<1.4*a0){
          const st2=kiRettSoner(nye,ark);
          const g2=nye.filter(s=>s.pts.length>=3&&kiAreal(s.pts)>=minAreal);
          if(g2.length){gode=g2;st=st2;kontroll={retta:true,tekst:k.kommentar,da:(a1-a0)/a0};}
        }else kontroll={retta:false,tekst:'Rettinga endra arealet for mykje ('+Math.round((a1-a0)/a0*100)+' %) og vart ikkje brukt.'};
      }else if(k)kontroll={retta:false,ok:true,tekst:k.kommentar};
    }catch(e){kontroll={retta:false,tekst:'Kontrollrunden feila ('+e.message+').'};}
  }
  return{analyse:res.analyse||'',st,fjerna:soner.length-gode.length,utsnitt:!!u.utsnitt,kal,kontroll,
    drafts:gode.map(s=>({name:s.namn||'KI-sone',bruk:s.bruk,byggeaar:s.byggeaar,pts:s.pts}))};
}
// Køyr KI-arbeid på ei liste med høgst KI_PARALLELT i gang samstundes.
async function kiPool(liste,fn){
  let neste=0;
  const arb=async()=>{while(neste<liste.length){const x=liste[neste++];await fn(x);}};
  await Promise.all(Array.from({length:Math.min(KI_PARALLELT,liste.length)},arb));
}
async function kiKoyrSoner(maal){
  const run=kiKoyring;
  const del=kiInnst.del;
  logAi('Steg 1 — soner ('+(del==='bruk'?'delt etter bruk, leigetakar og byggetrinn':'éi per bygningskropp')+')'
    +(maal.length>1?' på '+maal.length+' etasjar':'')+'…');
  logAi('Claude les teikningane. Det tek gjerne eitt til to minutt.');
  const utkast=new Map();let feil=0;
  await kiPool(maal,async f=>{
    try{
      const r=await kiSonerForArk(kiArk(f),del);
      if(run!==kiKoyring)return;
      if(r.ikkjePlan){
        logAi('\n⚠ '+arkNamn(f)+' ser ut til å vere '+(KI_ARKTYPE_NAMN[r.ikkjePlan]||'noko anna')+', ikkje ei planteikning — hoppa over.'
          +(r.ikkjePlan==='fasade'||r.ikkjePlan==='snitt'?' Flytt arket til Fasade-visinga, så vert det lese som '+(r.ikkjePlan==='snitt'?'snitt':'fasade')+' neste gong.':'')
          +(r.analyse?'\n  KI: '+r.analyse:''));
        return;
      }
      utkast.set(f,r.drafts);
      const mpp=mppForFloor(f),sum=r.drafts.reduce((s,d)=>s+kiAreal(d.pts),0);
      logAi('\n'+arkNamn(f)+': '+r.drafts.length+' sone'+(r.drafts.length===1?'':'r')
        +(mpp?', '+(sum*mpp*mpp/1e6).toFixed(0)+' m²':''));
      if(r.analyse)logAi('  KI: '+r.analyse);
      if(r.kontroll)logAi(r.kontroll.retta
        ?'  ✓ Kontrollrunde: forslaget vart retta'+(r.kontroll.tekst?' — '+r.kontroll.tekst:'')+'.'
        :r.kontroll.ok?'  ✓ Kontrollrunde: forslaget stemmer'+(r.kontroll.tekst?' — '+r.kontroll.tekst:'')+'.'
          :'  ℹ Kontrollrunde: '+r.kontroll.tekst);
      if(r.kal){
        const pst=Math.round(r.kal.avvik*1000)/10;
        // Feil skala gjer alt feil — då skal ingenting gå rett inn
        if(Math.abs(r.kal.avvik)>0.04&&kiInnst.auto){kiInnst.auto=false;kiStoppaAuto=true;}
        logAi(Math.abs(r.kal.avvik)>0.04
          ?'  ⚠ KALIBRERINGA STEMMER IKKJE: totalmålet '+r.kal.mm+' mm på teikninga er '+Math.round(r.kal.maalt)+' mm med skalaen ('+(pst>0?'+':'')+pst+' %). Sjekk kalibreringa — alle areal og mål vert like mykje feil.'
          :'  ✓ Kalibreringa stemmer med totalmålet på teikninga ('+r.kal.mm+' mm, avvik '+pst+' %).');
      }
      r.drafts.forEach(d=>logAi('  ✓ '+d.name+(mpp?' — '+(kiAreal(d.pts)*mpp*mpp/1e6).toFixed(1)+' m²':'')
        +(d.bruk&&d.bruk!=='Ukjend'?' · '+d.bruk:'')+(d.byggeaar?' · byggeår '+d.byggeaar+' (frå teikninga)':'')));
      if(r.fjerna)logAi('  ⚠ '+r.fjerna+' sone(r) vart for små eller degenererte og er tekne bort.');
      if(r.st.av)logAi('  '+r.st.kantar+' av '+r.st.av+' fasadekantar lagde på innsida av veggen'
        +(r.st.kantar<r.st.av?' (resten står der KI-en sette dei — sjå over dei)':'')+'.');
    }catch(e){
      if(run!==kiKoyring)return;
      feil++;logAi('\n⚠ '+arkNamn(f)+': '+e.message);
    }
  });
  if(run!==kiKoyring)return;
  // Etasjane i same rekkjefølgje som i prosjektet, utan dei som ikkje fekk noko
  kiUtkast=new Map(floors.filter(f=>(utkast.get(f)||[]).length).map(f=>[f,utkast.get(f)]));
  if(!kiUtkast.size){
    logAi('\nFann ingen soner.');
    kiUtkast=null;
    kiKnappar(false);aiGo.textContent='Prøv igjen';aiGo.disabled=false;
    return;
  }
  if(feil)logAi('\n⚠ '+feil+' etasje'+(feil===1?'':'r')+' kunne ikkje analyserast — køyr på nytt for dei.');
  logAi('\nSjå over forslaget plan for plan'+(kiUtkast.size>1?' — ‹ › eller piltastane byter plan':'')
    +'. Hjørna kan justerast etterpå med ⊹ Rediger.');
  kiSteg='soner';kiSoneHist.clear();kiSett.clear();
  // Same kategori i same etasje er som regel éi sone
  if(kiInnst.slaaKat){logAi('');kiSlaaSamanKategoriAlle(true);}
  // Vis ein etasje som har forslag — den aktive om han har det
  if(!kiUtkast.has(curFloor())){switchFloor(floors.indexOf([...kiUtkast.keys()][0]));}
  draftZones=kiUtkast.get(curFloor())||[];
  const n=[...kiUtkast.values()].reduce((s,a)=>s+a.length,0);
  if(kiStoppaAuto)logAi('\n⏸ «Gå rett gjennom» er stoppa fordi kalibreringa ikkje stemmer med målet på teikninga. Sjå over, eller forkast og kalibrer på nytt.');
  kiKnappar(true,'✓ Godta '+n+' sone'+(n===1?'':'r'));
  kiAutoVidare();
  if(kiInnst.kople)logAi('Soner med same kategori vert kopla (SIMIEN-gruppe) når du godtek.');
  kiTilpassVising();
}
// Sonene i eitt forslag inn i den AKTIVE etasjen (zones), utan angre-steg.
function kiLeggInnSoner(nye,laga){
  const tatt=new Set();
  floors.forEach((f,i)=>(i===activeFloor?zones:f.zones).forEach(z=>tatt.add(z.name)));
  let sk=0;
  nye.forEach(d=>{
    const namn=_unikNamn(d.name&&d.name!=='KI-sone'?d.name:'Sone '+(++_nextZoneId),tatt);
    tatt.add(namn);
    const mn=/^Sone (\d+)$/.exec(namn);
    if(mn)_nextZoneId=Math.max(_nextZoneId,+mn[1]);
    const nz={name:namn,pts:d.pts.map(p=>({x:p.x,y:p.y})),windows:[],skillevegg:new Set(),
      zoneConnections:new Map(),takflater:[],gulvflater:[],gavlflater:[]};
    if(d.bruk&&BYGKAT_SXI[d.bruk])nz.bygkat=d.bruk;
    // Byggeåret som står på teikninga for DENNE delen (tilbygg, oppgradering)
    // slår byggeåret til heile bygget frå EntroPi — det styrer U-verdiane.
    if(d.byggeaar)nz.byggeaar=d.byggeaar;
    else if(piBygg.byggeaar)nz.byggeaar=piBygg.byggeaar;
    zones.push(nz);
    if(laga)laga.push(nz);
    sk+=autoSkilleveggForNySone(nz);
  });
  return{n:nye.length,sk};
}
// Alle etasjane i forslaget som eitt angre-steg. autoSkilleveggForNySone
// arbeider på den aktive etasjen, så vi går innom kvar etasje og tilbake.
function kiGodtaSoner(){
  if(kiUtkast)kiUtkast.set(curFloor(),draftZones);
  const opp=kiUtkast?[...kiUtkast].map(([f,arr])=>[f,arr.filter(d=>d.pts.length>=3)]).filter(([,a])=>a.length):[];
  kiSteg=null;draftZones=[];kiUtkast=null;
  if(!opp.length)return 0;
  saveFloorState();
  snapshot();markDirty();
  const start=curFloor(),vis={sc,offX,offY};
  let n=0,sk=0;const laga=[];
  opp.forEach(([f,arr])=>{
    const i=floors.indexOf(f);
    if(i<0)return;
    if(i!==activeFloor)switchFloor(i);
    const r=kiLeggInnSoner(arr,laga);n+=r.n;sk+=r.sk;
  });
  const hm=kiBrukHoyder();
  const kopla=kiInnst.kople?kiKopleKategoriar(laga):0;
  if(curFloor()!==start){switchFloor(floors.indexOf(start));sc=vis.sc;offX=vis.offX;offY=vis.offY;}
  saveFloorState();
  updateResults();renderTable();draw();
  hintText.textContent=n+' sone'+(n===1?'':'r')+' lagt til frå KI-forslaget'
    +(opp.length>1?' på '+opp.length+' etasjar':'')+'.'
    +(sk?' '+sk+' felles vegg'+(sk===1?'':'ar')+' vart skiljekonstruksjon.':'')
    +(kopla?' '+kopla+' gruppe'+(kopla===1?'':'r')+' med same kategori kopla.':'')+(hm?' '+hm:'');
  return n;
}
// Kople dei nye sonene med same bygningskategori og byggeår til éi SIMIEN-gruppe
// (groupId) — på tvers av etasjane, og innanfor ein etasje når sonene ikkje
// deler vegg. Berre same kategori, som all kopling. Uisolerte/kalde delar og
// soner som alt er kopla, står for seg. Returnerer talet på grupper.
function kiKopleKategoriar(laga){
  const per=new Map();
  laga.forEach(z=>{
    // Ukjend kategori står for seg: utan bygkat vert sona rekna som kontor, og
    // ei kopling på det grunnlaget ville vore ei gjetting
    if(z.groupId||!z.bygkat||/uisolert|kald\b|kaldt/i.test(z.name))return;
    // Same regel som samanslåinga: eit tilbygg med anna byggeår står for seg
    const k=z.bygkat+'|'+(z.byggeaar||'');
    if(!per.has(k))per.set(k,[]);
    per.get(k).push(z);
  });
  let n=0;
  per.forEach(l=>{
    if(l.length<2)return;
    const g='g'+(++_nextGroupId);
    l.forEach(z=>{z.groupId=g;});
    n++;
  });
  return n;
}

// Farge per bygningskategori i forslaget — så ein ser kva som høyrer saman
const KI_KAT_FARGAR=['#2563eb','#d97706','#059669','#db2777','#7c3aed','#0891b2','#ca8a04',
  '#dc2626','#4f46e5','#65a30d','#c2410c','#0d9488','#9333ea'];
function kiKatFarge(bruk){
  const i=Object.keys(BYGKAT_SXI).indexOf(bruk);
  return i<0?'#6b7280':KI_KAT_FARGAR[i%KI_KAT_FARGAR.length];
}
// Kort blink rundt ei sone som nettopp vart slegen saman
function kiBlink(d){
  d._blink=performance.now();
  [0,150,300,450,600,750,900,1050,1200,1350,1500,1650].forEach(t=>setTimeout(draw,t));
}

// ── Slå saman soner i forslaget ──
// KI-en deler gjerne finare enn ein vil ha det. Under gjennomsynet kan
// brukaren krysse av soner (i lista eller ved å klikke i teikninga) og slå
// dei saman til éi. Den største av dei valde gir namn, bruk og byggeår.
// Samanslåinga skjer berre i forslaget — det er «Godta» som legg det inn.
// Forslaget før kvar samanslåing, for «Angre» — per etasje, så eit etasjebyte
// ikkje tek med seg angre-historikken til ein annan etasje
const kiSoneHist=new Map();
const kiHist=f=>{if(!kiSoneHist.has(f))kiSoneHist.set(f,[]);return kiSoneHist.get(f);};
const kiAreal=pts=>Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p.x*q.y-q.x*p.y;},0))/2;
// Planane som er viste under gjennomsynet — får ✓ i stegraden
const kiSett=new Set();
const kiPlanar=()=>kiUtkast?[...kiUtkast.keys()]:[curFloor()];
function kiTeiknSoneListe(){
  const el=document.getElementById('aiSoneListe');
  el.innerHTML='';
  const mpp=mppForFloor(curFloor());
  // Stegrada: éin knapp per plan med forslag, ‹ › for å gå fram og tilbake
  const planar=kiPlanar(),pi=planar.indexOf(curFloor());
  const rad=document.getElementById('kiEtgRad');rad.innerHTML='';
  planar.forEach(f=>{
    const b=document.createElement('button');
    const n=(f===curFloor()?draftZones:kiUtkast.get(f)||[]).length;
    b.className=(f===curFloor()?'on ':'')+(kiSett.has(f)?'sett':'');
    b.innerHTML='<span class="n"></span><span class="t"></span>';
    b.querySelector('.n').textContent=arkNamn(f);
    b.querySelector('.t').textContent=n+' sone'+(n===1?'':'r');
    b.onclick=()=>kiGaaTilPlan(f);
    rad.appendChild(b);
    if(f===curFloor())requestAnimationFrame(()=>b.scrollIntoView({block:'nearest',inline:'nearest'}));
  });
  document.getElementById('kiSteg').style.display=planar.length>1?'':'none';
  document.getElementById('kiForre').disabled=pi<=0;
  document.getElementById('kiNeste').disabled=pi<0||pi>=planar.length-1;
  const sum=mpp?draftZones.reduce((s,d)=>s+kiAreal(d.pts),0)*mpp*mpp/1e6:0;
  document.getElementById('kiEtgNamn').textContent=arkNamn(curFloor())
    +(planar.length>1&&pi>=0?'  ('+(pi+1)+' av '+planar.length+')':'');
  document.getElementById('kiEtgInfo').textContent=draftZones.length+' sone'+(draftZones.length===1?'':'r')
    +(sum?' · '+sum.toFixed(0)+' m²':'');
  if(!draftZones.length){
    const t=document.createElement('div');t.className='ki-tom';
    t.textContent='Ingen soner i forslaget for denne planen.';
    el.appendChild(t);
  }
  draftZones.forEach(d=>{
    const r=document.createElement('div');
    const farge=kiKatFarge(d.bruk);
    r.className='ki-kort'+(d._valt?' valt':'');
    r.style.borderLeftColor=d._valt?farge:'transparent';
    const sw=document.createElement('span');sw.className='sw';
    sw.style.background=farge;sw.textContent=d._valt?'✓':'';
    const tx=document.createElement('div');tx.className='tx';
    const nm=document.createElement('span');nm.className='nm';nm.textContent=d.name;
    const sub=document.createElement('div');sub.className='sub';
    // Kategorien kan rettast her — «⊕ Same kategori» slår saman etter han
    const kat=document.createElement('select');
    [...Object.keys(BYGKAT_SXI),'Ukjend'].forEach(k=>{const o=document.createElement('option');o.value=k;
      o.textContent=k==='Ukjend'?'(ukjend kategori)':k;if(k===(d.bruk||'Ukjend'))o.selected=true;kat.appendChild(o);});
    kat.onclick=e=>e.stopPropagation();   // å velje kategori skal ikkje velje kortet
    kat.onchange=()=>{d.bruk=kat.value;kiTeiknSoneListe();draw();};
    sub.appendChild(kat);
    if(d.byggeaar){const y=document.createElement('span');y.className='ar';y.style.marginLeft='0';y.textContent=d.byggeaar;sub.appendChild(y);}
    tx.append(nm,sub);
    const ar=document.createElement('span');ar.className='ar';
    ar.textContent=mpp?(kiAreal(d.pts)*mpp*mpp/1e6).toFixed(1)+' m²':'';
    r.append(sw,tx,ar);
    r.onclick=()=>{d._valt=!d._valt;kiTeiknSoneListe();draw();};
    r.onmouseenter=()=>{d._hover=true;draw();};
    r.onmouseleave=()=>{d._hover=false;draw();};
    el.appendChild(r);
  });
  kiOppdaterSlaa();
}
// Byt til ein plan i forslaget og vis heile forslaget for han
function kiGaaTilPlan(f){
  const i=floors.indexOf(f);
  if(i<0)return;
  draftZones.forEach(d=>{d._hover=false;});
  if(i!==activeFloor)switchFloor(i);
  kiSett.add(f);
  kiTilpassVising();
  kiKnappar(true);
}
function kiStegPlan(dir){
  const planar=kiPlanar(),i=planar.indexOf(curFloor())+dir;
  if(i>=0&&i<planar.length)kiGaaTilPlan(planar[i]);
}
document.getElementById('kiForre').onclick=()=>kiStegPlan(-1);
document.getElementById('kiNeste').onclick=()=>kiStegPlan(1);
// Zoom så forslaget for planen fyller lerretet ved sida av ruta
function kiTilpassVising(){
  const pts=draftZones.flatMap(d=>d.pts);
  if(!pts.length||!bgImg){fitImage();return;}
  const r=cwrap.getBoundingClientRect();
  const panel=document.getElementById('aiPanel').getBoundingClientRect();
  const hogre=Math.max(0,Math.min(r.right,panel.right+12)-Math.max(r.left,panel.left-12));
  // På ein smal skjerm dekkjer ruta det meste — då får planen heile breidda
  const w=r.width-hogre>r.width*0.45?r.width-hogre:r.width,pad=50;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  if(x1-x0<1||y1-y0<1)return;
  sc=Math.max(0.02,Math.min(50,Math.min((w-pad*2)/(x1-x0),(r.height-pad*2)/(y1-y0))));
  const d=_arkOffset();
  offX=w/2-((x0+x1)/2+d.x)*sc;
  offY=r.height/2-((y0+y1)/2+d.y)*sc;
  saveFloorState();draw();
}

// Nabopar i forslaget for den aktive planen: soner som deler ein vegg og let
// seg slå saman. Kvar får ein ⊕-knapp midt på den felles veggen. Rekna éin
// gong per forslag (arrayen vert bytt ut ved kvar samanslåing og angring).
// var: draw() les kiParHover, og draw() kan gå før denne linja er nådd
var kiParMinne={arr:null,n:-1,par:[]},kiParHover=null;
// Lengste felles stykke mellom kantane til a og b (parallelle, innanfor tol)
function kiFellesKant(a,b,tol){
  let best=null;
  for(let i=0;i<a.length;i++){
    const p=a[i],q=a[(i+1)%a.length];
    const ux=q.x-p.x,uy=q.y-p.y,L=Math.hypot(ux,uy);
    if(L<1)continue;
    for(let j=0;j<b.length;j++){
      const r=b[j],s=b[(j+1)%b.length];
      const vx=s.x-r.x,vy=s.y-r.y,M=Math.hypot(vx,vy);
      if(M<1||Math.abs(ux*vy-uy*vx)/(L*M)>0.09)continue;
      const dr=Math.abs((r.x-p.x)*uy-(r.y-p.y)*ux)/L,ds=Math.abs((s.x-p.x)*uy-(s.y-p.y)*ux)/L;
      if(dr>tol||ds>tol)continue;
      const tr=((r.x-p.x)*ux+(r.y-p.y)*uy)/(L*L),ts=((s.x-p.x)*ux+(s.y-p.y)*uy)/(L*L);
      const lo=Math.max(0,Math.min(tr,ts)),hi=Math.min(1,Math.max(tr,ts));
      const len=(hi-lo)*L;
      if(len>0&&(!best||len>best.len)){const t=(lo+hi)/2;best={len,x:p.x+ux*t,y:p.y+uy*t};}
    }
  }
  return best;
}
function kiNabopar(){
  if(kiParMinne.arr===draftZones&&kiParMinne.n===draftZones.length)return kiParMinne.par;
  const par=[];
  const mpp=mppForFloor(curFloor());
  if(bgImg&&kiSteg==='soner'){
    const tol=mpp?400/mpp:0.005*Math.max(bgImg.width,bgImg.height);
    const minL=mpp?500/mpp:tol;   // under 0,5 m felles vegg er eit hjørne, ikkje ein vegg
    for(let i=0;i<draftZones.length;i++)for(let j=i+1;j<draftZones.length;j++){
      const a=draftZones[i],b=draftZones[j];
      if(a.pts.length<3||b.pts.length<3)continue;
      const k=kiFellesKant(a.pts,b.pts,tol);
      if(!k||k.len<minL)continue;
      const pts=kiSlaaSamanTo(a.pts,b.pts,tol);
      if(pts)par.push({a,b,x:k.x,y:k.y,pts});
    }
  }
  kiParMinne={arr:draftZones,n:draftZones.length,par};
  return par;
}
// ⊕-knappane og «Slå saman (n)» oppå teikninga. Kalla frå draw(), så dei
// følgjer zoom og panorering.
function kiPlasserHandtak(){
  const box=document.getElementById('kiHandtak');
  if(!box)return;
  if(kiSteg!=='soner'||viewMode!=='plan'||!aiOverlay.classList.contains('show')){
    if(box.childElementCount)box.innerHTML='';kiParHover=null;return;
  }
  const par=kiNabopar();
  if(box._par!==par){
    box.innerHTML='';box._par=par;
    par.forEach(p=>{
      const b=document.createElement('button');b.className='ki-h';b.textContent='+';
      b.title='Slå saman «'+p.a.name+'» og «'+p.b.name+'»';
      b.onmouseenter=()=>{kiParHover=p;draw();};
      b.onmouseleave=()=>{if(kiParHover===p){kiParHover=null;draw();}};
      b.onclick=()=>{kiParHover=null;kiSlaaSamanValde([p.a,p.b]);};
      b.onwheel=e=>{e.preventDefault();cv.dispatchEvent(new WheelEvent('wheel',e));};
      b._p=p;box.appendChild(b);
    });
    const fl=document.createElement('button');fl.className='ki-flyt';fl.id='kiFlyt';
    fl.onclick=()=>kiSlaaSamanValde();
    box.appendChild(fl);
  }
  [...box.querySelectorAll('.ki-h')].forEach(b=>{
    const s=i2s(b._p.x,b._p.y);b.style.left=s.x+'px';b.style.top=s.y+'px';
  });
  // «Slå saman (n)» under lappen til den største valde sona — midt i utvalet
  // ville han ofte dekt ein ⊕ på den felles veggen
  const fl=document.getElementById('kiFlyt'),valde=draftZones.filter(d=>d._valt);
  if(valde.length>=2){
    const st=valde.reduce((a,b)=>kiAreal(b.pts)>kiAreal(a.pts)?b:a);
    const m=flateMerkepunkt(st.pts),s=i2s(m.x,m.y);
    fl.style.display='';fl.style.left=s.x+'px';fl.style.top=(s.y+40)+'px';
    fl.textContent='⊕ Slå saman '+valde.length+' soner';
  } else fl.style.display='none';
}
// Tastatur under gjennomsynet. Fangar før resten av programmet, så Ctrl+Z
// angrar i forslaget og ikkje i prosjektet.
window.addEventListener('keydown',e=>{
  if(kiSteg!=='soner'||!aiOverlay.classList.contains('show'))return;
  const t=e.target;
  if(t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
  let tok=true;
  if(e.key==='ArrowRight'&&!e.ctrlKey)kiStegPlan(1);
  else if(e.key==='ArrowLeft'&&!e.ctrlKey)kiStegPlan(-1);
  else if((e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z'))document.getElementById('aiAngreSlaa').click();
  else if(e.key==='Enter'&&draftZones.filter(d=>d._valt).length>=2)kiSlaaSamanValde();
  else if(e.key==='Escape'&&draftZones.some(d=>d._valt)){draftZones.forEach(d=>{d._valt=false;});kiTeiknSoneListe();draw();}
  else tok=false;
  if(tok){e.preventDefault();e.stopImmediatePropagation();}
},true);
function kiOppdaterSlaa(){
  const n=draftZones.filter(d=>d._valt).length,b=document.getElementById('aiSlaa');
  b.disabled=n<2;
  b.textContent='⊕ Slå saman'+(n>=2?' ('+n+')':'');
  document.getElementById('aiAngreSlaa').disabled=!kiHist(curFloor()).length;
  if(kiUtkast)kiUtkast.set(curFloor(),draftZones);
  // Kor mange samanslåingar «Same kategori» ville gjort i alle etasjane
  let kn=0;
  if(kiUtkast)kiUtkast.forEach((arr,f)=>{kn+=kiSlaaSamanKategori(arr,mppForFloor(f),f.bgImg||bgImg).linjer.length;});
  const kb=document.getElementById('aiSlaaKatBtn');
  kb.textContent='⊕ Same kategori'+(kn?' ('+kn+')':'');kb.disabled=!kn;
  const alle=kiUtkast?[...kiUtkast.values()].reduce((s,a)=>s+a.length,0):draftZones.length;
  document.getElementById('aiAccept').textContent='✓ Godta '+alle+' sone'+(alle===1?'':'r')
    +(kiUtkast&&kiUtkast.size>1?' på '+kiUtkast.size+' etasjar':'');
}
// To polygon til eitt. Er den felles veggen nesten, men ikkje heilt, felles
// (KI-en har ikkje alltid same hjørne i begge), vert hjørna til den eine lagde
// på hjørna eller kanten til den andre innanfor tol, og så prøver vi igjen.
// _slaaSamanPolygon sjekkar arealet — null tyder at dei ikkje heng saman.
function kiSlaaSamanTo(a,b,tol){
  const r=_slaaSamanPolygon(a,b);
  if(r)return r;
  const tilpass=(pts,mot)=>pts.map(p=>{
    let best=null;
    mot.forEach(q=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<tol&&(!best||d<best.d))best={d,x:q.x,y:q.y};});
    if(best)return{x:best.x,y:best.y};
    for(let i=0;i<mot.length;i++){
      const k=kiNaerastePaaKant(p,mot[i],mot[(i+1)%mot.length]);
      if(k.t>0&&k.t<1&&k.d<tol&&(!best||k.d<best.d))best={d:k.d,x:k.x,y:k.y};
    }
    return best?{x:best.x,y:best.y}:{x:p.x,y:p.y};
  });
  const b2=tilpass(b,a),a2=tilpass(a,b2);
  return _slaaSamanPolygon(a2,b2);
}
// liste: sonene som skal slåast saman (⊕ på ein felles vegg), elles dei valde
function kiSlaaSamanValde(liste){
  const valde=(liste||draftZones.filter(d=>d._valt)).slice();
  if(valde.length<2)return;
  const mpp=mppForFloor(curFloor());
  const tol=mpp?400/mpp:0.005*Math.max(bgImg.width,bgImg.height);
  valde.sort((a,b)=>kiAreal(b.pts)-kiAreal(a.pts));
  // Ein og ein inn, så lenge nokon deler vegg med det som alt er slege saman —
  // rekkjefølgja i lista skal ikkje avgjere om A+C+B går når A og C ikkje rører.
  let pts=valde[0].pts;
  const med=[valde[0]];
  let rest=valde.slice(1),framgang=true;
  while(rest.length&&framgang){
    framgang=false;
    for(const d of rest){
      const r=kiSlaaSamanTo(pts,d.pts,tol);
      if(r){pts=r;med.push(d);rest=rest.filter(x=>x!==d);framgang=true;break;}
    }
  }
  if(med.length<2){
    logAi('⚠ Dei valde sonene deler ingen vegg og kan ikkje slåast saman.');
    return;
  }
  kiHist(curFloor()).push(kiKopiUtkast(draftZones));
  const ny={...valde[0],pts:kiRyddPolygon(pts,1).map(q=>({x:q.x,y:q.y})),_valt:false,_hover:false};
  const plass=draftZones.indexOf(valde[0]);
  draftZones=draftZones.filter(d=>!med.includes(d));
  draftZones.splice(Math.min(plass,draftZones.length),0,ny);
  kiBlink(ny);
  const aar=new Set(med.map(d=>d.byggeaar||0));
  logAi('⊕ '+med.map(d=>d.name).join(' + ')+' → '+ny.name
    +(aar.size>1?' (ulike byggeår på teikninga — '+(ny.byggeaar||'byggeåret til bygget')+' står)':''));
  if(rest.length)logAi('⚠ '+rest.map(d=>d.name).join(', ')+' deler ingen vegg med dei andre og står for seg.');
  if(kiUtkast)kiUtkast.set(curFloor(),draftZones);
  kiKnappar(true);
  draw();
}
document.getElementById('aiSlaa').onclick=()=>kiSlaaSamanValde();
const kiKopiUtkast=arr=>arr.map(d=>({...d,pts:d.pts.map(q=>({x:q.x,y:q.y}))}));
// Nøkkelen soner må dele for å slåast saman av seg sjølv: same kategori og
// same byggeår. Ein uisolert eller kald del held seg for seg sjølv — han
// skal ha andre konstruksjonar i SIMIEN.
const kiKatNokkel=d=>/uisolert|kald\b|kaldt/i.test(d.name||'')?null:(d.bruk||'Ukjend')+'|'+(d.byggeaar||'');
// Slå saman nabosoner med same nøkkel i eitt forslag (éin etasje). Returnerer
// {arr, linjer}. Soner som ikkje deler vegg, står for seg — dei kan koplast.
function kiSlaaSamanKategori(arr,mpp,img){
  const tol=mpp?400/mpp:0.005*Math.max(img.width,img.height);
  let ut=arr.map(d=>({...d,_med:[d]})),endra=true;const linjer=[];
  while(endra){
    endra=false;
    outer:for(let i=0;i<ut.length;i++){
      const ki=kiKatNokkel(ut[i]);if(ki==null)continue;
      for(let j=i+1;j<ut.length;j++){
        if(kiKatNokkel(ut[j])!==ki)continue;
        const r=kiSlaaSamanTo(ut[i].pts,ut[j].pts,tol);
        if(!r)continue;
        const [st,li]=kiAreal(ut[i].pts)>=kiAreal(ut[j].pts)?[ut[i],ut[j]]:[ut[j],ut[i]];
        linjer.push(st.name+' + '+li.name+(st.bruk&&st.bruk!=='Ukjend'?' ('+st.bruk+')':''));
        const ny={...st,pts:kiRyddPolygon(r,1).map(q=>({x:q.x,y:q.y})),_valt:false,_hover:false,
          _med:[...ut[i]._med,...ut[j]._med]};
        ut=ut.filter(d=>d!==ut[i]&&d!==ut[j]);
        ut.splice(Math.min(i,ut.length),0,ny);
        endra=true;break outer;
      }
    }
  }
  // grupper: originalane som gjekk inn i kvar samanslegen sone (førehandsvisinga)
  const grupper=ut.filter(d=>d._med.length>1).map(d=>d._med);
  ut.forEach(d=>{if(d._med.length>1)d._blink=performance.now();delete d._med;});
  return{arr:ut,linjer,grupper};
}
// Alle etasjane i forslaget. Kvar etasje får eit angre-steg.
// stille: kalla rett etter skannet, før forslaget er vist — då er draftZones
// ikkje sett enno og skal ikkje skrivast over forslaget for etasjen.
function kiSlaaSamanKategoriAlle(stille){
  if(!kiUtkast)return 0;
  if(!stille)kiUtkast.set(curFloor(),draftZones);
  let n=0;
  kiUtkast.forEach((arr,f)=>{
    const r=kiSlaaSamanKategori(arr,mppForFloor(f),f.bgImg||bgImg);
    if(!r.linjer.length)return;
    kiHist(f).push(kiKopiUtkast(arr));
    kiUtkast.set(f,r.arr);
    if(f===curFloor())r.arr.filter(d=>d._blink).forEach(kiBlink);
    n+=r.linjer.length;
    logAi('⊕ '+(kiUtkast.size>1?arkNamn(f)+': ':'')+r.linjer.join(', '));
  });
  draftZones=kiUtkast.get(curFloor())||[];
  if(!n&&!stille)logAi('Ingen nabosoner med same kategori og byggeår å slå saman.');
  if(n)logAi('↶ «Angre» deler dei att, etasje for etasje.');
  return n;
}
document.getElementById('aiSlaaKatBtn').onclick=()=>{
  kiForhand(false);
  kiSlaaSamanKategoriAlle(false);
  kiKnappar(true);draw();
};
// Musa over «⊕ Same kategori»: vis kva sonene i denne etasjen som vil verte
// slegne saman, før ein trykkjer. Eit tørrlaup — forslaget vert ikkje endra.
function kiForhand(vis){
  draftZones.forEach(d=>{delete d._forhand;});
  if(vis&&kiUtkast){
    const r=kiSlaaSamanKategori(draftZones,mppForFloor(curFloor()),bgImg);
    r.grupper.forEach((g,i)=>g.forEach(d=>{d._forhand=i;}));
  }
  draw();
}
document.getElementById('aiSlaaKatBtn').onmouseenter=()=>kiForhand(true);
document.getElementById('aiSlaaKatBtn').onmouseleave=()=>kiForhand(false);
document.getElementById('aiAngreSlaa').onclick=()=>{
  const hist=kiHist(curFloor());
  if(!hist.length)return;
  draftZones=hist.pop();
  if(kiUtkast)kiUtkast.set(curFloor(),draftZones);
  logAi('↶ Samanslåinga er angra.');
  kiKnappar(true);
  draw();
};
// Klikk i ei forslagssone i teikninga vel henne. Berre eit klikk — ei
// panorering (musa flytta seg) skal ikkje velje noko.
(function(){
  let ned=null,svelg=false;
  cv.addEventListener('pointerdown',e=>{
    ned=(kiSteg==='soner'&&draftZones.length>1)?{x:e.clientX,y:e.clientY}:null;
  },true);
  cv.addEventListener('pointerup',e=>{
    if(!ned||kiSteg!=='soner')return;
    const flytta=Math.hypot(e.clientX-ned.x,e.clientY-ned.y);
    ned=null;
    if(flytta>4)return;
    const r=cv.getBoundingClientRect(),ip=s2i(e.clientX-r.left,e.clientY-r.top);
    const d=draftZones.slice().sort((a,b)=>kiAreal(a.pts)-kiAreal(b.pts)).find(d=>kiInniPolygon(ip,d.pts));
    if(!d)return;
    d._valt=!d._valt;svelg=true;
    kiTeiknSoneListe();draw();
  },true);
  // Klikket har valt ei forslagssone — det skal ikkje òg opne sona under
  cv.addEventListener('click',e=>{if(svelg){svelg=false;e.stopImmediatePropagation();e.preventDefault();}},true);
})();

// ── Fasadeteikningane ──
// Kvar fasadeteikning vert lesen éin gong: retninga (frå tittelen), golvnivået
// til kvar etasje og alle opningar med breidd, høgd og brystning. Måla vert
// rekna frå teikninga med skalaen til arket, eller — på eit ukalibrert ark —
// frå kotene: to golv med kjend kote gir mm per eining loddrett. Påskrivne
// mål vert brukte når dei stemmer med det målte (eller når ingenting kan
// målast). Resultatet går inn i opningsforslaga som tekst per etasje, og gir
// etasjehøgdene (golv til golv — den øvste etasjen har ikkje noko golv over
// seg, så ho står urørt).
const kiSkjemaFasade=()=>{
  const xy={type:'number'};
  return{type:'object',additionalProperties:false,required:['fasadar'],properties:{
    fasadar:{type:'array',items:{type:'object',additionalProperties:false,
      required:['type','tittel','retning','byggX0','byggX1','etasjar','opningar'],properties:{
      type:{type:'string',enum:['fasade','snitt','anna']},
      tittel:{type:'string'},
      retning:{type:'string',enum:[...DIRS,'Ukjend']},
      byggX0:xy,byggX1:xy,
      etasjar:{type:'array',items:{type:'object',additionalProperties:false,required:['namn','golvY','koteMm'],
        properties:{namn:{type:'string'},golvY:xy,koteMm:{type:'integer'}}}},
      opningar:{type:'array',items:{type:'object',additionalProperties:false,
        required:['etasje','type','x0','x1','yTopp','yBotn','breddeMm','hoydeMm','brystningMm'],
        properties:{etasje:{type:'integer'},type:{type:'string',enum:['vindauge','dor']},
          x0:xy,x1:xy,yTopp:xy,yBotn:xy,
          breddeMm:{type:'integer'},hoydeMm:{type:'integer'},brystningMm:{type:'integer'}}}}
    }}}}};
};
// Fyrste runde på eit ark: berre kvar fasadane står. Eit A1-ark med fire
// fasadar skalert ned til KI_MAXPX gir ~3 px per vindaugskarm — difor vert
// kvar fasade lesen for seg i full oppløysing etterpå (kiPromptFasade).
const KI_SKJEMA_FASADE_OVERSIKT={type:'object',additionalProperties:false,required:['fasadar'],properties:{
  fasadar:{type:'array',items:{type:'object',additionalProperties:false,
    required:['type','tittel','retning','x0','y0','x1','y1'],properties:{
    type:{type:'string',enum:['fasade','snitt']},
    tittel:{type:'string'},retning:{type:'string',enum:[...DIRS,'Ukjend']},
    x0:{type:'number'},y0:{type:'number'},x1:{type:'number'},y1:{type:'number'}}}}}};
const KI_FASADE_ELLER_SNITT=[
  'FASADE eller SNITT? Begge er loddrette teikningar, men:',
  '- Ei FASADE (oppriss) viser ytterflata av bygget sett utanfrå: kledning/mur, vindauge og dører med karm,',
  '  taket sett frå sida. Tittel som «Fasade nord», «Fasade mot sør», «Oppriss A», «Østfasade».',
  '- Eit SNITT viser bygget skore loddrett gjennom: etasjeskilje, tak, ytterveggar og fundament er SKORNE (fylte,',
  '  skraverte eller tjukke), og ein ser INN i romma — innerveggar, dører i innerveggar, trapper, himlingar,',
  '  romnamn, ofte isolasjon og terreng skravert under bakken. Tittel som «Snitt A-A», «Snitt 1», «Section».',
  '- Eit snitt gir etasjehøgdene, men opningane i det er IKKJE fasadeopningar.'
].join('\n');
function kiPromptFasadeOversikt(){
  return [
    'Biletet er eit teikningsark som skal innehalde fasadeteikningar (oppriss) av eit bygg — men det kan òg stå',
    'snitt, planar, perspektiv og detaljar på arket.',
    'Finn kvar fasade og kvart snitt (`type`). Ta ikkje med planar, perspektiv, 3D-bilete, detaljar, tittelfelt.',
    '',
    KI_FASADE_ELLER_SNITT,
    '',
    'KOORDINATAR: normaliserte tal 0–1000 for heile biletet — x frå venstre kant, y frå øvre kant.',
    '',
    'For kvar fasade: `tittel` (teksten som namngir han, t.d. «Fasade nord», «Fasade mot vest», «Oppriss A»),',
    '`retning` (kva veg fasaden vender ut frå tittelen — «Fasade nord» vender mot nord; «Ukjend» når tittelen ikkje',
    'seier det; eit snitt får «Ukjend»), og ei ramme `x0,y0,x1,y1` rundt HEILE teikninga: bygget frå terreng til mønet, kotene og',
    'etasjenemningane ved sida av, og tittelen. Hellar heller litt for stor enn for lita.'
  ].join('\n');
}
function kiPromptFasade(tittel){
  return [
    tittel
      ?'Biletet er eit utsnitt av ei fasadeteikning (oppriss) — fasaden «'+tittel+'». Gi berre denne fasaden, også om'
       +' bitar av andre fasadar syner i kanten av utsnittet.'
      :'Biletet er ei fasadeteikning (oppriss) av eit bygg. Det kan stå fleire fasadar på same ark — gi kvar for seg.',
    '',
    KI_FASADE_ELLER_SNITT,
    '`type`: «fasade», «snitt», eller «anna» når teikninga ikkje er nokon av dei (plan, perspektiv, detalj). For eit',
    'snitt: gi berre `etasjar` (golvnivåa), tom `opningar`, `retning` «Ukjend» og byggX0/byggX1 0.',
    '',
    KI_LES_TEIKNING,
    'Målelinjer og kotelinjer går ofte vassrett tvers over fasaden ved kvar etasje — dei er ikkje kantar på',
    'vindauge. Skravert terreng og fundament under bakken er ikkje fasade.',
    '',
    'KOORDINATAR: normaliserte tal 0–1000 for heile biletet — x frå venstre kant, y frå øvre kant. Ver nøyaktig:',
    'koordinatane vert brukte til å måle opningane og til å finne att kvar opning i planteikninga.',
    '',
    'For kvar fasade:',
    '- `tittel`: teksten som namngir fasaden (t.d. «Fasade nord», «Fasade mot vest»).',
    '- `retning`: kva veg fasaden vender, ut frå tittelen. «Ukjend» når tittelen ikkje seier det.',
    '- `byggX0`/`byggX1`: x for venstre og høgre ytterkant av bygningskroppen (fasadelivet ved bakken, utan',
    '  takutstikk, rekkverk, trapper og terreng).',
    '- `etasjar`: golvnivået til kvar etasje fasaden viser, frå NEDSTE til ØVSTE. `golvY` er y for overkant golv',
    '  (etasjeskiljet) — sjå etter kotelinjer, stipla etasjeskilje eller der vindaugsrekkjene byrjar. `koteMm` er',
    '  kota som står skriven ved golvet, i mm (t.d. «+12.600» → 12600, «c +3,60» → 3600), 0 når inga kote står der.',
    '  `namn` er namnet om det står (t.d. «1. etasje», «U.etg»), elles «Etasje 1», «Etasje 2» … nedanfrå.',
    '- `opningar`: ALLE vindauge og ytterdører på fasaden, éi oppføring per opning i veggen. `etasje` er indeksen i',
    '  `etasjar` (0 = nedste). `x0`/`x1` er venstre og høgre kant av karmen, `yTopp`/`yBotn` overkant og underkant.',
    '  `breddeMm`, `hoydeMm` og `brystningMm` (golv til underkant vindauge) berre når dei står skrivne som mål på',
    '  teikninga, elles 0.',
    '',
    'SLIK KJENNER DU DEI ATT:',
    '- Vindauge: rektangel med karm (dobbel strek rundt), ofte med rammer, postar, sprosser eller ein diagonal «V»',
    '  som viser opningsretning. Eit vindaugsfelt med fleire rammer side om side i éi opning er EITT vindauge; to',
    '  opningar med vegg (murflate, kledning) imellom er to. Eit samanhengande vindaugsband eller ei glasfasade er',
    '  éi opning per etasje og samanhengande glasflate.',
    '- Dør: opning som går ned til golvet eller trappa, ofte med dørblad, handtak, glasfelt eller overlys. Port,',
    '  garasjeport og glasdør i eit glasfelt er òg `dor`. Overlys over døra høyrer til døra.',
    '- Kjellarvindauge over terreng skal med. Ta IKKJE med takvindauge, takoppbygg, ventilasjonsrister, skilt,',
    '  rekkverk, stipla (skjulte) opningar bak, refleksjonar eller skuggar.',
    '- Tel ein etasje om gongen, frå venstre mot høgre, og sjekk at kvar like vindaugsrekkje har fått med alle.',
    '',
    'Ignorer tittelfelt, snitt, planar og detaljar.'
  ].join('\n');
}
function kiEtgNr(namn){
  const s=String(namn||'').toLowerCase();
  if(/kjell[ae]r|underetasje|u\.?\s*etg|sokkel/.test(s))return 0;
  const m=/(\d+)/.exec(s);
  return m?+m[1]:null;
}
// Etasjane på ein fasade (nedanfrå) → hovudetasjane i prosjektet. Etter
// nummeret i namnet når begge sider har det, elles nedanfrå i rekkjefølgje.
function kiMappEtasjar(etg){
  const hov=floors.filter(f=>!erDelplan(f));
  const nF=etg.map(e=>kiEtgNr(e.namn)),nP=hov.map(f=>kiEtgNr(f.name));
  if(nF.every(n=>n!=null)&&nP.every(n=>n!=null)&&new Set(nP).size===nP.length)
    return{map:nF.map(n=>hov[nP.indexOf(n)]||null),sikker:true};
  return{map:etg.map((e,i)=>hov[i]||null),sikker:etg.length===hov.length};
}
// Kvar fasade på arket i eigen førespurnad, utsnitt i full oppløysing.
// Fell oversikta gjennom (feil, eller ingen fasadar funne), vert heile arket
// lese i éin førespurnad som før.
async function kiFasadeUtsnitt(a){
  const img=a.bgImg,heile=[{rect:{x:0,y:0,w:img.width,h:img.height},tittel:null}];
  // Eit lite ark tapar ingenting på å gå heilt — det sparar ein førespurnad
  if(Math.max(img.width,img.height)<=KI_MAXPX*1.3)return heile;
  try{
    const res=await kiSpor({oppgave:'fasade',prompt:kiPromptFasadeOversikt(),images:[kiBilete(img,heile[0].rect)],
      schema:KI_SKJEMA_FASADE_OVERSIKT,maxTokens:4000,meta:{ark:a.name,steg:'oversikt'}});
    const ut=(res.fasadar||[]).map(b=>{
      const x0=Math.min(b.x0,b.x1),x1=Math.max(b.x0,b.x1),y0=Math.min(b.y0,b.y1),y1=Math.max(b.y0,b.y1);
      if(!(x1-x0>=20&&y1-y0>=20))return null;
      // 6 % luft rundt: KI-ramma er grov, og kotene står gjerne heilt ute i kanten
      const mx=(x1-x0)*0.06+10,my=(y1-y0)*0.06+10;
      const nx0=Math.max(0,x0-mx),ny0=Math.max(0,y0-my),nx1=Math.min(1000,x1+mx),ny1=Math.min(1000,y1+my);
      return{tittel:b.tittel||(b.type==='snitt'?'Snitt':'Fasade'),retningOversikt:b.retning,typeOversikt:b.type,
        rect:{x:nx0/1000*img.width,y:ny0/1000*img.height,w:(nx1-nx0)/1000*img.width,h:(ny1-ny0)/1000*img.height}};
    }).filter(Boolean);
    return ut.length?ut:heile;
  }catch(e){
    logAi('  ⚠ '+a.name+': fann ikkje fasadane på arket ('+e.message+') — les heile arket.');
    return heile;
  }
}
async function kiLesFasadar(){
  const run=kiKoyring,ark=kiFasadeArk();
  logAi('Fasadane — les '+ark.length+' fasadeteikning'+(ark.length===1?'':'ar')+'…');
  const info={opn:new Map(),hoyder:new Map(),usikker:false,fasadar:[]};
  // Fyrst kvar fasadane står, så kvar fasade for seg
  const jobbar=[];
  await kiPool(ark,async a=>{
    const u=await kiFasadeUtsnitt(a);
    if(run!==kiKoyring)return;
    if(u.length>1||u[0].tittel)logAi('  '+a.name+': '+u.length+' teikning'+(u.length===1?'':'ar')+' — '+u.map(x=>x.tittel).join(', '));
    u.forEach(x=>jobbar.push({a,...x}));
    const ns=u.filter(x=>x.typeOversikt==='snitt').length;
    if(ns)logAi('  '+ns+' av dei er snitt — gir berre etasjehøgder.');
  });
  if(run!==kiKoyring)return null;
  await kiPool(jobbar,async({a,rect,tittel,retningOversikt,typeOversikt})=>{
    try{
      const img=a.bgImg;
      const res=await kiSpor({oppgave:'fasade',prompt:kiPromptFasade(tittel),images:[kiBilete(img,rect)],
        schema:kiSkjemaFasade(),maxTokens:16000,meta:{ark:a.name,fasade:tittel||null}});
      if(run!==kiKoyring)return;
      // Utsnittet av éin fasade: berre den fyrste — resten er bitar av naboen
      const liste=(res.fasadar||[]).slice(0,tittel?1:undefined);
      liste.forEach(fa=>{
        if(fa.type==='anna'){logAi('  '+(fa.tittel||tittel||a.name)+': ikkje ei fasade eller eit snitt — hoppa over.');return;}
        // Eit snitt gir golvnivå (etasjehøgder), aldri opningar eller posisjonar
        const snitt=fa.type==='snitt'||typeOversikt==='snitt';
        if(snitt){fa.opningar=[];fa.byggX0=fa.byggX1=0;}
        if(tittel&&(fa.retning==='Ukjend'||!fa.retning)&&retningOversikt)fa.retning=retningOversikt;
        const etg=(fa.etasjar||[]).map((e,i)=>({...e,i})).sort((x,y)=>y.golvY-x.golvY);  // nedste fyrst
        const {map,sikker}=kiMappEtasjar(etg);
        if(!sikker)info.usikker=true;
        // Skala i mm per normalisert eining i utsnittet: frå kalibreringa,
        // elles frå kotene (loddrett), og kvadratiske pikslar for vassrett
        let sY=a.mmPerImgPx?rect.h*a.mmPerImgPx/1000:null;
        if(!sY){
          const s=[];
          for(let i=0;i+1<etg.length;i++)
            if(etg[i].koteMm>0&&etg[i+1].koteMm>0&&etg[i].golvY-etg[i+1].golvY>5)
              s.push((etg[i+1].koteMm-etg[i].koteMm)/(etg[i].golvY-etg[i+1].golvY));
          if(s.length)sY=s.sort((x,y)=>x-y)[Math.floor(s.length/2)];
        }
        const sX=sY?sY*rect.w/rect.h:null;
        for(let i=0;i+1<etg.length;i++){
          const f=map[i];if(!f)continue;
          let hM=null;
          if(etg[i].koteMm>0&&etg[i+1].koteMm>0)hM=(etg[i+1].koteMm-etg[i].koteMm)/1000;
          else if(sY)hM=(etg[i].golvY-etg[i+1].golvY)*sY/1000;
          if(hM>=2.2&&hM<=8){if(!info.hoyder.has(f))info.hoyder.set(f,[]);info.hoyder.get(f).push(hM);}
        }
        // Bygningskroppen i fasaden: opningane får ein relativ posisjon langs
        // han (0 = venstre kant, 1 = høgre), så dei kan finnast att i planen
        // (kiFasadeKople). Breidda i meter (når skalaen er kjend) avgjer om
        // posisjonane kan stolast på.
        const bx0=Math.min(fa.byggX0,fa.byggX1),bx1=Math.max(fa.byggX0,fa.byggX1);
        const harBygg=isFinite(bx0)&&isFinite(bx1)&&bx1-bx0>=30;
        const fas={id:info.fasadar.length,tittel:fa.tittel||tittel||a.name,retning:fa.retning,
          breiddeM:harBygg&&sX?(bx1-bx0)*sX/1000:null,harBygg,ark:a.name};
        info.fasadar.push(fas);
        // Påskrive mål er eksakt, men vert berre teke når det stemmer med det
        // målte — elles har KI-en lese eit anna mål enn det som høyrer til.
        const vel=(tekst,maalt)=>maalt?((tekst>0&&Math.abs(tekst-maalt)<=0.25*maalt)?tekst:maalt):(tekst>0?tekst:0);
        let tel=0;
        (fa.opningar||[]).forEach(o=>{
          const ei=etg.findIndex(e=>e.i===o.etasje),f=ei>=0?map[ei]:null;
          if(!f)return;
          const type=o.type==='dor'?'dor':'vindauge';
          const b=vel(o.breddeMm,sX?Math.abs(o.x1-o.x0)*sX:0);
          const hh=vel(o.hoydeMm,sY?Math.abs(o.yBotn-o.yTopp)*sY:0);
          const br=type==='dor'?0:vel(o.brystningMm,sY?Math.max(0,(etg[ei].golvY-o.yBotn)*sY):0);
          if(!(hh>=300&&hh<=6000))return;
          if(b&&!(b>=200&&b<=12000))return;
          const xc=(o.x0+o.x1)/2;
          const r=harBygg?(xc-bx0)/(bx1-bx0):null;
          if(!info.opn.has(f))info.opn.set(f,[]);
          info.opn.get(f).push({retning:fa.retning,type,b,h:hh,br,r,
            rB:harBygg?Math.abs(o.x1-o.x0)/(bx1-bx0):null,fas:fas.id});
          tel++;
        });
        if(snitt){logAi('  '+fas.tittel+' (snitt): '+etg.length+' etasjenivå — berre etasjehøgder');return;}
        logAi('  '+fas.tittel+' ('+fa.retning+'): '+tel+' opningar, '+etg.length+' etasjenivå'
          +(fas.breiddeM?', '+fas.breiddeM.toFixed(1)+' m brei':'')
          +(sY?'':' — utan skala eller koter, berre påskrivne mål'));
      });
    }catch(e){if(run===kiKoyring)logAi('  ⚠ '+(tittel||a.name)+': '+e.message);}
  });
  if(run!==kiKoyring)return null;
  if(info.usikker)logAi('  ⚠ Etasjane på fasadane let seg ikkje kople sikkert til etasjane i prosjektet — dei er kopla nedanfrå.');
  const hoyder=kiHoyderFraFasade(info);
  if(hoyder.length)logAi('  Etasjehøgder: '+hoyder.map(x=>x.f.name+' '+x.m.toFixed(2)+' m'
    +(Math.abs(x.no-x.m)>=0.05?' (no '+x.no.toFixed(2)+')':'')).join(', ')
    +(kiInnst.hoyder?' — vert lagde inn når du godtek.':' (ikkje valt)'));
  logAi('');
  return info;
}
// ── Fasade ↔ plan ──
// Ei opning på fasaden «Nord» står på ein nordvegg i planen, og plasseringa
// hennar frå venstre mot høgre på fasaden er den same som langs bygget sett
// nordanfrå. Difor kan kvar opning planen fann koplast til opninga på fasaden
// som står på same stad — og få høgd og brystning derfrå, utan at KI-en må
// gjette kva som høyrer saman. Opningar fasaden viser, men planen ikkje fann,
// vert lagde på den fremste veggen i den retninga.
//
// Posisjonen er relativ til ytterkantane av bygget (0–1), så han treng ingen
// skala på fasadearket. Men han krev at fasaden viser heile bygget: er
// fasadebreidda kjend og avvik meir enn 15 % frå planen, vert posisjonane ikkje
// brukte for den fasaden (sjå logg).
//
// Retningsvektorar i biletkoordinatar (y ned): ein vegg med utvendig normal
// i asimut az har normalen i biletvinkel az+nord−90 (sjå calcSegments).
// Sett utanfrå mot ein fasade med asimut az går «høgre» mot asimut az−90.
function kiFasadeAkse(retning){
  const i=DIRS.indexOf(retning);if(i<0)return null;
  const nd=parseFloat(northI.value)||0,az=i*45;
  const r=(az+nd-180)*Math.PI/180,v=(az+nd-90)*Math.PI/180;
  return{u:{x:Math.cos(r),y:Math.sin(r)},v:{x:Math.cos(v),y:Math.sin(v)}};
}
// Biletpunkt på arket f → verda i meter (same formel som 3D og delplanane)
function kiVerd(p,f){
  const m=(mppForFloor(f)||10)/1000;
  return{x:(p.x+(f.floorDxImg||0))*m,y:(p.y+(f.floorDyImg||0))*m};
}
const _kiSonerPaa=f=>{const i=floors.indexOf(f);return(i===activeFloor?zones:f.zones)||[];};
// Utstrekninga av heile bygget langs aksen (alle etasjar — fasaden viser silhuetten)
function kiPlanSpenn(ax){
  let lo=Infinity,hi=-Infinity;
  floors.forEach(f=>{
    if(!mppForFloor(f))return;
    _kiSonerPaa(f).forEach(z=>{
      if(z.skjult)return;
      (z.pts||[]).forEach(p=>{const w=kiVerd(p,f),s=w.x*ax.u.x+w.y*ax.u.y;if(s<lo)lo=s;if(s>hi)hi=s;});
    });
  });
  return hi>lo?{lo,hi,W:hi-lo}:null;
}
// raw: [{z,f,segs,mpp,segIdx,dir,t0,t1,type,breddeMm,...}] — forslaga frå planen,
// ugrupperte. soner: [{z,f,segs,mpp}] — sonene køyringa gjeld. Endrar dei på staden og returnerer nye forslag berre frå fasaden.
function kiFasadeKople(raw,soner,info,maal){
  const res={kopla:0,nye:[],avviste:[]};
  if(!info||!info.opn.size)return res;
  const stol=new Map();   // fasade-id → {ax,sp} når posisjonane kan brukast
  info.fasadar.forEach(fa=>{
    if(!fa.harBygg)return;
    const ax=kiFasadeAkse(fa.retning);if(!ax)return;
    const sp=kiPlanSpenn(ax);if(!sp)return;
    if(fa.breiddeM&&Math.abs(fa.breiddeM-sp.W)>0.15*sp.W){
      res.avviste.push(fa.tittel+' ('+fa.breiddeM.toFixed(1)+' m på fasaden, '+sp.W.toFixed(1)+' m i planen)');
      return;
    }
    stol.set(fa.id,{ax,sp,fa});
  });
  const hovud=new Set(maal.map(hovudEtasje));
  hovud.forEach(h=>{
    const fo=(info.opn.get(h)||[]).filter(o=>o.r!=null&&stol.has(o.fas));
    if(!fo.length)return;
    const ark=new Set(etasjeArk(h));
    const plan=raw.filter(d=>ark.has(d.f));
    // Alle par innanfor toleransen, næraste fyrst, ein-til-ein
    const par=[];
    plan.forEach(d=>{
      const sg=d.segs[d.segIdx];if(!sg)return;
      const tc=(d.t0+d.t1)/2,bM=d.breddeMm/1000;
      const pc=kiVerd({x:sg.p1.x+(sg.p2.x-sg.p1.x)*tc,y:sg.p1.y+(sg.p2.y-sg.p1.y)*tc},d.f);
      fo.forEach((o,oi)=>{
        if(o.retning!==d.dir)return;
        const {ax,sp}=stol.get(o.fas);
        const s=pc.x*ax.u.x+pc.y*ax.u.y;
        const dist=Math.abs((s-sp.lo)-o.r*sp.W);
        const oB=o.b?o.b/1000:o.rB*sp.W;
        if(dist>Math.max(0.5,0.6*Math.max(bM,oB)))return;
        if(oB&&Math.abs(oB-bM)>0.4*Math.max(oB,bM)+0.15)return;
        par.push({d,oi,dist});
      });
    });
    par.sort((a,b)=>a.dist-b.dist);
    const brukD=new Set(),brukO=new Set();
    par.forEach(({d,oi})=>{
      if(brukD.has(d)||brukO.has(oi))return;
      brukD.add(d);brukO.add(oi);
      const o=fo[oi];
      d.hoyMm=Math.round(o.h/10)*10;
      d.brystningMm=o.type==='dor'?null:Math.round(o.br/10)*10;
      // Fasaden ser om opninga går ned til golvet — planen gjer det ikkje alltid
      if(o.type!==d.type){d.type=o.type;if(o.type==='dor')d.brystningMm=null;}
      d.fraFasade=true;d.fasadeKopla=true;res.kopla++;
    });
    // Fasadeopningar planen ikkje fann: fremste fasadevegg i den retninga
    fo.forEach((o,oi)=>{
      if(brukO.has(oi))return;
      const {ax,sp}=stol.get(o.fas);
      const bM=o.b?o.b/1000:null;if(!bM)return;
      const s=sp.lo+o.r*sp.W;
      let best=null;
      soner.forEach(x=>{
        if(!ark.has(x.f))return;
        const sk=x.z.skillevegg||new Set();
        x.segs.forEach(sg=>{
          if(sk.has(sg.idx)||sg.dir!==o.retning||!(sg.lenM>=bM))return;
          const a=kiVerd(sg.p1,x.f),b=kiVerd(sg.p2,x.f);
          const sa=a.x*ax.u.x+a.y*ax.u.y,sb=b.x*ax.u.x+b.y*ax.u.y;
          if(Math.abs(sb-sa)<1e-6)return;
          const t=(s-sa)/(sb-sa);
          const halv=bM/2/sg.lenM;
          if(t<halv-0.02||t>1-halv+0.02)return;
          const djup=((a.x+b.x)/2)*ax.v.x+((a.y+b.y)/2)*ax.v.y;
          if(!best||djup>best.djup)best={x,sg,t,djup};
        });
      });
      if(!best)return;
      const {x,sg}=best,span=fitSpanT(best.t,o.b/x.mpp,sg.lenPx);
      // Ikkje oppå noko som står der frå før eller vart funne i planen
      const opptekne=[...raw.filter(d=>d.z===x.z&&d.segIdx===sg.idx),...res.nye.filter(d=>d.z===x.z&&d.segIdx===sg.idx),
        ...(x.z.windows||[]).filter(w=>w.segIdx===sg.idx).flatMap(w=>winSpansPx(w,sg.lenPx,x.mpp))];
      if(opptekne.some(q=>Math.min(q.t1,span.t1)-Math.max(q.t0,span.t0)>0))return;
      res.nye.push({z:x.z,f:x.f,segs:x.segs,mpp:x.mpp,segIdx:sg.idx,dir:sg.dir,t0:span.t0,t1:span.t1,type:o.type,
        breddeMm:Math.round(o.b/10)*10,hoyMm:Math.round(o.h/10)*10,
        brystningMm:o.type==='dor'?null:Math.round(o.br/10)*10,fraFasade:true,berreFasade:true});
    });
  });
  return res;
}
// Medianen av etasjehøgdene fasadane gir, per hovudetasje
function kiHoyderFraFasade(info){
  if(!info)return[];
  return floors.filter(f=>info.hoyder.has(f)).map(f=>{
    const s=info.hoyder.get(f).slice().sort((a,b)=>a-b);
    return{f,m:Math.round(s[Math.floor(s.length/2)]*100)/100,no:f.defaultHoyde??3};
  });
}
// Legg etasjehøgdene inn. Éin gong per køyring, innanfor angre-steget til
// den fyrste «Godta». Returnerer ei setning til hintlinja.
function kiBrukHoyder(){
  if(kiHoyderBrukt||!kiInnst.hoyder)return'';
  kiHoyderBrukt=true;
  const endra=kiHoyderFraFasade(kiFasadeInfo).filter(x=>Math.abs(x.no-x.m)>=0.05);
  endra.forEach(x=>{
    etasjeArk(x.f).forEach(a=>{a.defaultHoyde=x.m;});   // delplanane deler høgda
    if(hovudEtasje(curFloor())===x.f)fhI.value=x.m;
  });
  return endra.length?'Etasjehøgd frå fasadane: '+endra.map(x=>x.f.name+' '+x.m.toFixed(2)+' m').join(', ')+'.':'';
}
// Opningane fasadane viser i etasjen til f, som tekst til opningsforslaget
function kiFasadeTekst(f){
  const l=kiFasadeInfo&&kiFasadeInfo.opn.get(hovudEtasje(f));
  if(!l||!l.length)return'';
  const r50=v=>Math.round(v/50)*50,per=new Map();
  l.forEach(o=>{
    if(!per.has(o.retning))per.set(o.retning,new Map());
    const k=o.type+'|'+r50(o.b)+'|'+r50(o.h)+'|'+r50(o.br),m=per.get(o.retning);
    m.set(k,(m.get(k)||0)+1);
  });
  const ut=[];
  per.forEach((m,ret)=>ut.push('  Fasade '+ret+': '+[...m].map(([k,n])=>{
    const [t,b,hh,br]=k.split('|');
    return n+' × '+(t==='dor'?'dør':'vindauge')+' '+(+b?b:'?')+'×'+hh+(t==='dor'?'':', brystning '+br);
  }).join('; ')));
  return ut.join('\n');
}

// ── Steg 2: vindauge og dører ──
const KI_SKJEMA_OPN={
  type:'object',additionalProperties:false,required:['opningar'],
  properties:{
    opningar:{type:'array',items:{
      type:'object',additionalProperties:false,required:['vegg','type','a','b','merke','maalMm','hoydeMm','brystningMm'],
      properties:{
        vegg:{type:'integer'},
        maalMm:{type:'integer'},
        hoydeMm:{type:'integer'},
        brystningMm:{type:'integer'},
        type:{type:'string',enum:['vindauge','dor']},
        a:{type:'object',additionalProperties:false,required:['x','y'],properties:{x:{type:'number'},y:{type:'number'}}},
        b:{type:'object',additionalProperties:false,required:['x','y'],properties:{x:{type:'number'},y:{type:'number'}}},
        merke:{type:'string'}
      }}}
  }
};
function kiPromptOpn(vegger,fTekst){
  return [
    'Bilete 1 er eit utsnitt av ei planteikning. Bilete 2 er det same utsnittet, der ei energisone er teikna inn med raud',
    'strek og fasadeveggane hennar er nummererte i raude sirklar.',
    '',
    'Finn alle vindauge og ytterdører i dei nummererte veggane. Ta ikkje med innvendige dører, opningar i veggar utan',
    'nummer, eller noko du ikkje er sikker på. Eit felt med fleire glas side om side er eitt vindauge når det står i',
    'éi opning; to opningar med vegg imellom er to. Gå langs kvar nummerert vegg frå ende til ende, så ingen vert gløymde.',
    '',
    KI_LES_TEIKNING,
    'Ei målelinje langs veggen med skråstrekar ved kvar karm er IKKJE vindauge — men ho viser ofte nøyaktig kvar',
    'opningane byrjar og sluttar, og tala er breiddene i mm.',
    '',
    'SLIK SER DEI UT I PLANEN:',
    '- Vindauge: veggbandet (fylt, skravert eller to strekar) er broten, og i opninga står 2–3 tynne strekar',
    '  PARALLELT med veggen (glas og karm), ofte med ein strek for vassbrett/benk. Karmane er korte strekar tvers',
    '  over veggen i kvar ende av opninga.',
    '- Ytterdør: veggen er broten heilt, med dørblad og ein kvartsirkel (slagbogen) som viser opningsretninga, eller',
    '  ei skyvedør (to forskotne strekar). Port og garasjeport: brei opning, ofte med stipla linje. Dobbeldør er éi dør.',
    '- Ein vindaugsnisje eller eit innhakk i veggen utan glasstrekar er IKKJE ei opning. Ei innvendig dør i ein',
    '  skiljevegg skal ikkje med.',
    '',
    'For kvar opning: veggnummeret, typen, og dei to endepunkta av opninga (karmopninga) langs veggen — `a` og `b` —',
    'i normaliserte koordinatar 0–1000 for utsnittet (x frå venstre, y frå toppen). Endepunkta skal liggje på veggen,',
    'ved karmen i kvar ende — ikkje midt på glaset.',
    '`merke` er vindaugsmerkinga om teikninga har ho (t.d. «10x12», som tyder 1000×1200 mm), elles tom.',
    '`maalMm` er breidda på opninga slik ho står i målekjeda langs fasaden (talet mellom dei to skråstrekane ved',
    'karmane), i mm. 0 når det ikkje står eit mål for akkurat denne opninga.',
    '',
    ...(fTekst?[
      'FASADETEIKNINGANE viser desse opningane i denne etasjen (breidd × høgd og brystning i mm):',
      fTekst,
      'Bruk dei til å sjekke at du har fått med alle opningane i kvar retning. Gi `hoydeMm` og `brystningMm` for kvar',
      'opning du finn, frå den opninga på fasadeteikninga som høyrer til — same fasaderetning som veggen og om lag same',
      'breidd. 0 når du ikkje finn noko som passar.',
      ''
    ]:['`hoydeMm` og `brystningMm`: 0 (det finst ingen fasadeteikningar).','']),
    'Dei nummererte veggane, med retninga fasaden vender og endepunkt i same koordinatar:',
    ...vegger.map(v=>'  vegg '+v.nr+' (mot '+v.dir+'): ('+v.a.x+', '+v.a.y+') → ('+v.b.x+', '+v.b.y+')')
  ].join('\n');
}
function kiInniPolygon(p,pts){
  let inn=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[i],b=pts[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inn=!inn;
  }
  return inn;
}
// ── Karmane i teikninga ──
// KI-endepunkta bommar gjerne 10–30 cm. Ved kvar ende av ei opning sluttar
// veggen: anten sluttar det fylte bandet, eller det står ein karmstrek tvers
// over veggen. Begge gir ein lang mørk strek TVERS over veggen like ved
// kanten av opninga — glas, karm og vassbrett i opninga går langs veggen.
// Difor: langs veggen, mål lengste samanhengande mørke strek på tvers
// (frå litt inne i rommet til 0,6 m ut). Ein ende vert flytt til næraste
// overgang mellom «vegg» og «opning» innanfor ±0,3 m — elles står han.
function kiKarmProfil(G,sg,ut,mpp){
  const k=G.k,mmPx=mpp/k;   // mm per piksel i gråtonekopien
  const ax=sg.p1.x*k,ay=sg.p1.y*k,dx=(sg.p2.x-sg.p1.x)*k,dy=(sg.p2.y-sg.p1.y)*k,L=Math.hypot(dx,dy);
  if(L<4)return null;
  const ux=dx/L,uy=dy/L,nx=ut.x,ny=ut.y;
  const fra=Math.round(-40/mmPx),til=Math.round(600/mmPx);
  const n=Math.ceil(L),run=new Float32Array(n+1);
  for(let i=0;i<=n;i++){
    const cx=ax+ux*i,cy=ay+uy*i;let best=0,cur=0;
    for(let j=fra;j<=til;j++){
      const x=Math.round(cx+nx*j),y=Math.round(cy+ny*j);
      const mork=x>=0&&y>=0&&x<G.W&&y<G.H&&G.g[y*G.W+x]<G.mork;
      if(mork){cur++;if(cur>best)best=cur;}else cur=0;
    }
    run[i]=best*mmPx;
  }
  return{run,n,L,mmPx};
}
// Flytt t0/t1 (0–1 langs segmentet) til næraste karm. Returnerer {t0,t1,snappa}.
function kiSnapKarm(P,t0,t1){
  if(!P)return{t0,t1,snappa:0};
  const {run,n,mmPx}=P,HOG=Math.max(80,3*mmPx);
  const hoy=i=>i>=0&&i<=n&&run[i]>=HOG;
  const sok=Math.round(300/mmPx);
  // fall: vegg på venstre side, opning på høgre (starten av opninga)
  const finn=(t,fall)=>{
    const c=Math.round(t*n);let best=null;
    for(let d=0;d<=sok;d++)for(const i of d?[c-d,c+d]:[c]){
      if(i<1||i>n-1)continue;
      const kant=fall?(hoy(i-1)&&!hoy(i)):(!hoy(i-1)&&hoy(i));
      if(kant){best=i;break;}
    }
    return best;
  };
  // Ei opning skal vere «låg» det meste av vegen mellom endane
  let a=finn(t0,true),b=finn(t1,false);
  const lagDel=(i0,i1)=>{let l=0;for(let i=i0;i<i1;i++)if(!hoy(i))l++;return i1>i0?l/(i1-i0):0;};
  let snappa=0;
  const nt0=a!=null?a/n:t0,nt1=b!=null?b/n:t1;
  if(nt1-nt0<=0||lagDel(Math.round(nt0*n),Math.round(nt1*n))<0.75)return{t0,t1,snappa:0};
  if(a!=null)snappa++;if(b!=null)snappa++;
  return{t0:nt0,t1:nt1,snappa};
}
// Store soner vert delte i fleire utsnitt, så teikninga kjem fram til Claude
// med minst om lag 14 mm per piksel (eitt vindaugsteikn er då ~5–10 px tjukt).
// Lange veggar vert delte i bitar som overlappar 1,5 m; ei opning høyrer til
// den biten senteret hennar ligg i.
const KI_MM_PX=14;
function kiOpnUtsnitt(z,fasade,mpp){
  const Lmax=KI_MAXPX*KI_MM_PX/mpp,marg=1500/mpp,olap=1500/mpp;
  const bitar=[];
  fasade.forEach(sg=>{
    const nb=Math.max(1,Math.ceil(sg.lenPx/(Lmax-2*marg-olap)));
    for(let i=0;i<nb;i++){
      const tA=i/nb,tB=(i+1)/nb,e=olap/2/sg.lenPx;
      const sA=i?Math.max(0,tA-e):0,sB=i<nb-1?Math.min(1,tB+e):1;
      const P=t=>({x:sg.p1.x+(sg.p2.x-sg.p1.x)*t,y:sg.p1.y+(sg.p2.y-sg.p1.y)*t});
      bitar.push({sg,tA,tB,a:P(sA),b:P(sB),sA,sB});
    }
  });
  // Grådig: bitar etter kvarandre rundt sona i same utsnitt så lenge det held
  const grupper=[];let g=null;
  const boks=l=>{const xs=l.flatMap(b=>[b.a.x,b.b.x]),ys=l.flatMap(b=>[b.a.y,b.b.y]);
    return{x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};};
  bitar.forEach(b=>{
    if(g){const bb=boks([...g,b]);if(Math.max(bb.x1-bb.x0,bb.y1-bb.y0)+2*marg<=Lmax){g.push(b);return;}}
    g=[b];grupper.push(g);
  });
  // Heile sona i eitt utsnitt når ho får plass — då ser Claude samanhengen
  const xs=z.pts.map(p=>p.x),ys=z.pts.map(p=>p.y);
  const heil={x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};
  if(Math.max(heil.x1-heil.x0,heil.y1-heil.y0)+2*marg<=Lmax||grupper.length<=1){
    const m=Math.max(0.08*Math.max(heil.x1-heil.x0,heil.y1-heil.y0),marg);
    return[{bitar,boks:heil,marg:m}];
  }
  return grupper.map(l=>({bitar:l,boks:boks(l),marg}));
}
// Opningane i éi sone, ugrupperte. Returnerer {raw, segs, avvist, snappa}.
async function kiOpningarForSone(z,ark,fTekst){
  const mpp=ark.mpp,img=ark.img;
  const segs=calcSegments(z.pts,null,mpp)||[];
  const sk=z.skillevegg||new Set();
  const fasade=segs.filter(s=>!sk.has(s.idx)&&s.lenM>=0.5);
  if(!fasade.length)return{raw:[],segs,avvist:0,snappa:0,utsnitt:0};
  const G=kiGraa(img);
  const utsnitt=kiOpnUtsnitt(z,fasade,mpp);
  const forslag=[];let avvist=0,snappa=0;
  for(const u of utsnitt){
    const rx=Math.max(0,u.boks.x0-u.marg),ry=Math.max(0,u.boks.y0-u.marg);
    const rect={x:rx,y:ry,w:Math.min(img.width,u.boks.x1+u.marg)-rx,h:Math.min(img.height,u.boks.y1+u.marg)-ry};
    // Éin vegg kan ha fleire bitar i same utsnitt berre når sona er heil — då
    // står heile veggen der, og endepunkta er segmentet sine
    const heil=utsnitt.length===1;
    const vegger=[...new Map(u.bitar.map(b=>[b.sg.idx,b])).values()].map(b=>({nr:b.sg.idx+1,dir:b.sg.dir,
      a:kiTilNorm(heil?b.sg.p1:b.a,rect),b:kiTilNorm(heil?b.sg.p2:b.b,rect)}));
    const merka=kiBilete(img,rect,(g,s)=>{
      const P=p=>({x:(p.x-rect.x)*s,y:(p.y-rect.y)*s});
      g.beginPath();
      z.pts.forEach((p,i)=>{const q=P(p);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});
      g.closePath();g.strokeStyle='rgba(220,38,38,.75)';g.lineWidth=3;g.stroke();
      u.bitar.forEach(bit=>{
        const sg=bit.sg;
        if(!heil){   // biten som gjeld, tydelegare
          const qa=P(bit.a),qb=P(bit.b);g.beginPath();g.moveTo(qa.x,qa.y);g.lineTo(qb.x,qb.y);
          g.strokeStyle='rgba(220,38,38,.35)';g.lineWidth=9;g.stroke();
        }
        if(heil&&bit.tA>0)return;   // nummeret éin gong per vegg
        const mx=heil?sg.midImgX:(bit.a.x+bit.b.x)/2,my=heil?sg.midImgY:(bit.a.y+bit.b.y)/2;
        const m=P({x:mx,y:my});
        const dx=sg.p2.x-sg.p1.x,dy=sg.p2.y-sg.p1.y,L=Math.hypot(dx,dy)||1;
        let nx=-dy/L,ny=dx/L;
        // Nummeret står UTANFOR sona, så det ikkje dekkjer vindaugsteiknet
        if(kiInniPolygon({x:mx+nx*4/s,y:my+ny*4/s},z.pts)){nx=-nx;ny=-ny;}
        const c={x:m.x+nx*28,y:m.y+ny*28};
        g.beginPath();g.arc(c.x,c.y,13,0,Math.PI*2);
        g.fillStyle='#fff';g.fill();g.strokeStyle='#dc2626';g.lineWidth=2.5;g.stroke();
        g.fillStyle='#dc2626';g.font='bold 15px Inter,sans-serif';g.textAlign='center';g.textBaseline='middle';
        g.fillText(String(sg.idx+1),c.x,c.y+1);
      });
    });
    const res=await kiSpor({oppgave:'opningar',prompt:kiPromptOpn(vegger,fTekst),images:[kiBilete(img,rect),merka],
      schema:KI_SKJEMA_OPN,maxTokens:16000,meta:{sone:z.name,etasje:arkNamn(ark.f),vegger,fasade:!!fTekst,
        utsnitt:utsnitt.length>1?(utsnitt.indexOf(u)+1)+'/'+utsnitt.length:null}});
    const tolPx=Math.max(800/mpp,0.03*Math.max(rect.w,rect.h));
    (res.opningar||[]).forEach(o=>{
      const sg=fasade.find(s=>s.idx+1===o.vegg);
      if(!sg){avvist++;return;}
      const a=kiNaerastePaaKant(kiTilBilete(o.a,rect),sg.p1,sg.p2);
      const b=kiNaerastePaaKant(kiTilBilete(o.b,rect),sg.p1,sg.p2);
      if(Math.max(a.d,b.d)>tolPx){avvist++;return;}
      let t0=Math.max(0,Math.min(a.t,b.t)),t1=Math.min(1,Math.max(a.t,b.t));
      // Berre den biten av veggen dette utsnittet eig (overlappen gir elles dobbelt)
      if(!heil){
        const tc=(t0+t1)/2;
        if(!u.bitar.some(bit=>bit.sg===sg&&tc>=bit.tA&&tc<bit.tB+(bit.tB>=1?1e-9:0)))return;
      }
      const type=o.type==='dor'?'dor':'vindauge';
      // Endane til næraste karm i teikninga
      if(G){
        let ut={x:-(sg.p2.y-sg.p1.y)/sg.lenPx,y:(sg.p2.x-sg.p1.x)/sg.lenPx};
        if(kiInniPolygon({x:sg.midImgX+ut.x*4,y:sg.midImgY+ut.y*4},z.pts))ut={x:-ut.x,y:-ut.y};
        if(!sg._karm)sg._karm=kiKarmProfil(G,sg,ut,mpp);
        const s=kiSnapKarm(sg._karm,t0,t1);
        const nyMm=(s.t1-s.t0)*sg.lenPx*mpp,gmlMm=(t1-t0)*sg.lenPx*mpp;
        if(s.snappa&&nyMm>=300&&Math.abs(nyMm-gmlMm)<=Math.max(250,0.35*gmlMm)){t0=s.t0;t1=s.t1;snappa+=s.snappa;}
      }
      const maaltMm=(t1-t0)*sg.lenPx*mpp;
      if(maaltMm<300){avvist++;return;}
      // «10x12» er desimeter. Merket er eksakt, så det vinn over det målte —
      // men berre når dei stemmer nokolunde, elles har KI-en lese feil merke.
      let bredde=Math.round(maaltMm/10)*10,hoyde=type==='dor'?2100:1200,fraMerke=false;
      const m=/(\d{1,2})\s*[x×X*]\s*(\d{1,2})/.exec(o.merke||'');
      if(m){
        const bm=+m[1]*100,hm=+m[2]*100;
        if(bm>0&&Math.abs(bm-maaltMm)<=0.3*maaltMm){bredde=bm;hoyde=hm;fraMerke=true;}
      }
      // Målekjeda er eksakt for breidda — same regel som merket
      if(!fraMerke&&o.maalMm>=300&&o.maalMm<=12000&&Math.abs(o.maalMm-maaltMm)<=0.25*maaltMm){
        bredde=Math.round(o.maalMm/10)*10;fraMerke=true;
      }
      // Høgd og brystning frå fasadeteikninga, når KI-en fann den opninga der
      let brystning=null,fraFasade=false;
      if(o.hoydeMm>=300&&o.hoydeMm<=6000){
        hoyde=Math.round(o.hoydeMm/10)*10;fraFasade=true;
        if(type!=='dor'&&o.brystningMm>=0&&o.brystningMm<=3000)brystning=Math.round(o.brystningMm/10)*10;
      }
      const span=fitSpanT((t0+t1)/2,bredde/mpp,sg.lenPx);
      forslag.push({z,f:ark.f,segs,mpp,segIdx:sg.idx,dir:sg.dir,t0:span.t0,t1:span.t1,type,breddeMm:bredde,hoyMm:hoyde,
        brystningMm:brystning,fraMerke,fraFasade});
    });
  }
  segs.forEach(sg=>{delete sg._karm;});
  // Same opning to gonger, eller oppå eit vindauge som alt står der
  const finst=(z.windows||[]).filter(w=>w.segIdx!=null).flatMap(w=>{
    const s=segs[w.segIdx];if(!s)return[];
    return winSpansPx(w,s.lenPx,mpp).map(sp=>({segIdx:w.segIdx,t0:sp.t0,t1:sp.t1}));
  });
  const raw=[];
  forslag.forEach(f=>{
    const kryss=[...finst,...raw].some(o=>o.segIdx===f.segIdx
      &&Math.min(o.t1,f.t1)-Math.max(o.t0,f.t0)>0.5*Math.min(o.t1-o.t0,f.t1-f.t0));
    if(kryss){avvist++;return;}
    raw.push(f);
  });
  return{raw,segs,avvist,snappa,utsnitt:utsnitt.length};
}
async function kiKoyrOpningar(maal){
  const run=kiKoyring;
  saveFloorState();
  const utan=maal.filter(f=>!mppForFloor(f));
  const liste=maal.filter(f=>mppForFloor(f)).flatMap(f=>{
    const ark=kiArk(f),fTekst=kiFasadeTekst(f);
    return f.zones.filter(z=>!z.skjult&&(z.pts||[]).length>=3).map(z=>({z,ark,fTekst}));
  });
  logAi('Steg 2 — vindauge og dører på '+liste.length+' sone'+(liste.length===1?'':'r')
    +(maal.length>1?' i '+(maal.length-utan.length)+' etasjar':'')+'…');
  if(utan.length)logAi('ℹ '+utan.map(arkNamn).join(', ')+' er ikkje kalibrert'+(utan.length===1?'':'e')+' og vert hoppa over.');
  const raw=[],soner=[];let avvist=0,feil=0,snappa=0;
  await kiPool(liste,async({z,ark,fTekst})=>{
    try{
      const r=await kiOpningarForSone(z,ark,fTekst);
      if(run!==kiKoyring)return;
      raw.push(...r.raw);avvist+=r.avvist;snappa+=r.snappa;
      soner.push({z,f:ark.f,segs:r.segs,mpp:ark.mpp});
      const nd=r.raw.filter(f=>f.type==='dor').length;
      logAi('✓ '+(maal.length>1?arkNamn(ark.f)+' · ':'')+z.name+': '
        +(r.raw.length-nd)+' vindauge, '+nd+(nd===1?' dør':' dører')
        +(r.utsnitt>1?' ('+r.utsnitt+' utsnitt)':''));
    }catch(e){
      if(run!==kiKoyring)return;
      feil++;logAi('⚠ '+z.name+': '+e.message);
    }
  });
  if(run!==kiKoyring)return;
  // Fasadeteikningane: høgd, brystning og type etter posisjon, og opningar planen ikkje fann
  const kop=kiFasadeKople(raw,soner,kiFasadeInfo,maal);
  if(kop.avviste.length)logAi('⚠ Breidda stemmer ikkje med planen, så posisjonane på desse fasadane er ikkje brukte: '
    +kop.avviste.join('; ')+'. Er nord rett, og viser fasaden heile bygget?');
  if(kop.kopla)logAi('Fasadane: '+kop.kopla+' opning'+(kop.kopla===1?'':'ar')+' i planen fann att på fasaden (høgd og brystning derfrå).');
  if(kop.nye.length)logAi('Fasadane: '+kop.nye.length+' opning'+(kop.nye.length===1?'':'ar')
    +' synte berre på fasaden og er lagde på den fremste veggen i den retninga — merkte ◇. Sjå særleg over dei.');
  raw.push(...kop.nye);
  // Like vindauge på same vegg vert éi gruppe — etter at fasaden har gitt høgdene
  const forslag=[];
  soner.forEach(s=>{
    const l=raw.filter(d=>d.z===s.z);
    if(l.length)forslag.push(...kiGrupperVindauge(l,s.segs,s.mpp));
  });
  if(avvist)logAi('ℹ '+avvist+' opning'+(avvist===1?'':'ar')+' låg ikkje på ein fasadevegg, var for smal eller fanst frå før, og er hoppa over.');
  if(snappa)logAi('ℹ '+snappa+' opningskantar er flytte til karmen i teikninga.');
  if(feil)logAi('⚠ '+feil+' sone'+(feil===1?'':'r')+' kunne ikkje analyserast — køyr på nytt, eller teikn opningane der for hand.');
  if(!forslag.length){
    logAi('\nFann ingen nye opningar.');
    kiKnappar(false);aiGo.textContent='Prøv igjen';aiGo.disabled=false;
    return;
  }
  const stk=forslag.reduce((s,f)=>s+(f.antal||1),0),grupper=forslag.filter(f=>f.antal>1).length;
  const st=k=>forslag.filter(f=>f[k]).reduce((s,f)=>s+(f.antal||1),0);
  const fas=st('fraFasade'),merka=st('fraMerke');
  logAi('\n'+stk+' opningar funne'+(grupper?', samla i '+forslag.length+' element ('+grupper+' grupper av like vindauge)':'')+'.');
  if(fas)logAi('Høgd'+(forslag.some(f=>f.fraFasade&&f.brystningMm!=null)?' og brystning':'')+' frå fasadeteikningane på '+fas+' av '+stk+'.');
  if(merka)logAi(merka+' med mål frå vindaugsmerkinga i planen.');
  if(fas+merka<stk)logAi('Resten har standardhøgd (vindauge 1,2 m, dør 2,1 m) — sjå over i sonekorta.');
  kiDraftWins=forslag;
  kiSteg='opningar';
  kiKnappar(true,'✓ Godta '+stk+' opningar');
  draw();
  kiAutoVidare();
}
// Like vindauge på same vegg vert éi gruppe (antal + posT), slik
// energirådgjevarane teiknar dei: «Vindauge 8 ×10» er eitt SIMIEN-element,
// ikkje ti. Like = same høgd og breidd innanfor 10 % (minst 10 cm) — dei
// treng ikkje stå side om side. Dører vert aldri grupperte.
function kiGrupperVindauge(liste,segs,mpp){
  const ut=[],grupper=[];
  liste.slice().sort((a,b)=>(a.t0+a.t1)-(b.t0+b.t1)).forEach(f=>{
    const c=(f.t0+f.t1)/2;
    if(f.type!=='vindauge'){ut.push(Object.assign(f,{antal:1,spans:[{t0:f.t0,t1:f.t1}]}));return;}
    const g=grupper.find(g=>g.segIdx===f.segIdx&&!!g.berreFasade===!!f.berreFasade&&Math.abs(g.hoyMm-f.hoyMm)<=50
      &&Math.abs((g.brystningMm??-999)-(f.brystningMm??-999))<=50
      &&Math.abs(g.sum/g.n-f.breddeMm)<=Math.max(100,0.1*g.sum/g.n));
    if(g){g.n++;g.sum+=f.breddeMm;g.c.push(c);g.fraMerke=g.fraMerke||f.fraMerke;g.fraFasade=g.fraFasade||f.fraFasade;g.berreFasade=g.berreFasade||f.berreFasade;}
    else grupper.push({z:f.z,segIdx:f.segIdx,dir:f.dir,type:'vindauge',hoyMm:f.hoyMm,brystningMm:f.brystningMm,
      n:1,sum:f.breddeMm,c:[c],fraMerke:f.fraMerke,fraFasade:f.fraFasade,berreFasade:f.berreFasade});
  });
  grupper.forEach(g=>{
    const bredde=Math.round(g.sum/g.n/10)*10,segLen=segs[g.segIdx].lenPx,wPx=bredde/mpp;
    const posT=g.c.slice().sort((a,b)=>a-b);
    const w={z:g.z,segIdx:g.segIdx,dir:g.dir,type:'vindauge',breddeMm:bredde,hoyMm:g.hoyMm,
      brystningMm:g.brystningMm,antal:g.n,posT:g.n>1?posT:null,fraMerke:g.fraMerke,fraFasade:g.fraFasade,berreFasade:g.berreFasade};
    const anker=fitSpanT(posT.reduce((s,t)=>s+t,0)/posT.length,wPx,segLen);
    w.t0=anker.t0;w.t1=anker.t1;
    w.spans=posT.map(t=>fitSpanT(t,wPx,segLen));
    ut.push(w);
  });
  return ut;
}
function kiGodtaOpningar(){
  const alle=new Set(floors.flatMap((f,i)=>i===activeFloor?zones:f.zones));
  // Angre byter ut soneobjekta — eit forslag til ei sone som ikkje finst lenger hoppar vi over
  const nye=kiDraftWins.filter(d=>alle.has(d.z)&&d.z.pts.length>d.segIdx);
  kiDraftWins=[];
  if(!nye.length)return 0;
  saveFloorState();
  snapshot();markDirty();
  const hm=kiBrukHoyder();
  nye.forEach(d=>{
    const z=d.z;z.windows=z.windows||[];
    const typeL=d.type==='dor'?'Dør':'Vindauge';
    const nr=z.windows.filter(w=>w.type===d.type).length+1;
    const n=d.antal||1;
    // posT er ein ny array — forslaget og vindauget skal ikkje dele han
    z.windows.push({segIdx:d.segIdx,dir:d.dir,t0:d.t0,t1:d.t1,breddeMm:d.breddeMm,hoyMm:d.hoyMm,
      antal:n,type:d.type,name:typeL+' '+nr,brystningMm:d.brystningMm??null,posT:n>1&&d.posT?d.posT.slice():null});
  });
  updateResults();renderTable();draw();
  const stk=nye.reduce((s,d)=>s+(d.antal||1),0);
  hintText.textContent=stk+' opningar ('+nye.length+' element) lagt til frå KI-forslaget. Sjå over høgdene i sonekorta.'+(hm?' '+hm:'');
  return nye.length;
}

aiGo.onclick=async()=>{
  const opnEl=document.getElementById('aiOpn');
  kiInnst={
    bygg:(document.querySelector('input[name="aiOmfang"]:checked')||{}).value==='bygg',
    soner:document.getElementById('aiSoner').checked,
    del:(document.querySelector('input[name="aiDel"]:checked')||{}).value||'ein',
    slaaKat:document.getElementById('aiSlaaKat').checked,
    kople:document.getElementById('aiKople').checked,
    opn:opnEl.checked&&!opnEl.disabled,
    hoyder:document.getElementById('aiHoyder').checked&&!!kiFasadeArk().length,
    auto:document.getElementById('aiAuto').checked
  };
  kiVidareTilOpningar=kiInnst.opn;kiHoyderBrukt=false;kiFasadeInfo=null;kiStoppaAuto=false;
  aiGo.disabled=true;aiGo.textContent='Arbeider…';aiLog.textContent='';
  document.getElementById('aiClose').textContent='Avbryt';
  const run=++kiKoyring;
  try{
    saveFloorState();
    const maal=kiMaal(kiInnst.bygg);
    // Fasadane fyrst: dei gir høgd og brystning til opningane og etasjehøgdene
    if(kiFasadeArk().length&&(kiInnst.opn||kiInnst.hoyder)){
      kiFasadeInfo=await kiLesFasadar();
      if(run!==kiKoyring)return;
    }
    if(kiInnst.soner)await kiKoyrSoner(maal);
    else if(kiInnst.opn)await kiKoyrOpningar(maal);
    else kiVisHoyder();
  }catch(e){
    if(run!==kiKoyring)return;
    logAi('Feil: '+e.message);
    kiKnappar(false);aiGo.disabled=false;aiGo.textContent='Prøv igjen';
  }
  document.getElementById('aiClose').textContent='Lukk';
};
// «Gå rett gjennom»: forslaget vert godteke av seg sjølv etter eit augneblink
// (så brukaren ser det kome). Kvar «Godta» er eit eige angre-steg som før.
function kiAutoVidare(){
  if(!kiInnst.auto)return;
  const steg=kiSteg,run=kiKoyring;
  setTimeout(()=>{if(kiSteg===steg&&run===kiKoyring)document.getElementById('aiAccept').click();},700);
}
// Slutten på ei køyring. Med «gå rett gjennom» står loggen att, så ein kan
// lese kva som vart gjort; elles lukkar ruta seg som før.
function kiAvslutt(){
  if(!kiInnst.auto){kiLukk();return;}
  kiSteg=null;draftZones=[];kiDraftWins=[];kiUtkast=null;
  kiKnappar(false);
  logAi('\n✓ Ferdig. '+hintText.textContent+'\nAlt kan angrast med Ctrl+Z. Sjå over sonekorta.');
  aiGo.disabled=false;aiGo.textContent='Køyr på nytt';
  document.getElementById('aiClose').textContent='Lukk';
  draw();
}
// Berre etasjehøgder: eit eige lite forslag å godta
function kiVisHoyder(){
  const endra=kiHoyderFraFasade(kiFasadeInfo).filter(x=>Math.abs(x.no-x.m)>=0.05);
  if(!endra.length){
    logAi('Fasadane gav ingen etasjehøgder som skil seg frå dei som står.');
    kiKnappar(false);aiGo.disabled=false;aiGo.textContent='Prøv igjen';
    return;
  }
  kiSteg='hoyder';
  kiKnappar(true,'✓ Godta etasjehøgdene');
  kiAutoVidare();
}
document.getElementById('aiAccept').onclick=async()=>{
  if(kiSteg==='soner'){
    const n=kiGodtaSoner();
    if(n)loggAuto('KI: '+hintText.textContent);
    // Sonene er godtekne — «Prøv igjen» etter dette skal gjelde opningane
    document.getElementById('aiSoner').checked=false;
    if(n&&kiVidareTilOpningar){
      kiKnappar(false);aiGo.disabled=true;aiGo.textContent='Arbeider…';
      if(kiInnst.auto)logAi('\n✓ '+hintText.textContent+'\n');else aiLog.textContent='';
      const run=++kiKoyring;
      try{await kiKoyrOpningar(kiMaal(kiInnst.bygg));}
      catch(e){if(run===kiKoyring){logAi('Feil: '+e.message);aiGo.disabled=false;aiGo.textContent='Prøv igjen';}}
      return;
    }
    kiAvslutt();
    return;
  }
  if(kiSteg==='opningar'){kiGodtaOpningar();loggAuto('KI: '+hintText.textContent);}
  if(kiSteg==='hoyder'){
    saveFloorState();snapshot();markDirty();
    const t=kiBrukHoyder();
    updateResults();renderTable();draw();
    hintText.textContent=t||'Ingen etasjehøgder endra.';
  }
  kiAvslutt();
};
document.getElementById('aiReject').onclick=()=>{
  draftZones=[];kiDraftWins=[];kiUtkast=null;kiSteg=null;draw();
  logAi('Forkasta.');
  kiKnappar(false);aiGo.disabled=false;aiGo.textContent='Prøv igjen';
};

