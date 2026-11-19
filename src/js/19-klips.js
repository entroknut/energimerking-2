// ── 2f. Klips — energimerkingsassistenten ────────────────────────
// Ein binders med Entro-hjelm nede til venstre på lerretet. Han seier frå om
// ting som gjer energimerket feil (manglande skala, for store opningar,
// kategori, nord) og har elles nokre «visste du»-tips når ein klikkar på han.
// Berre visning: han les tilstanden og trykkjer på dei same knappane som
// brukaren, og endrar aldri prosjektet sjølv.
//
// Reglane er med vilje varsame — den opphavlege Clippy vart hata fordi han
// avbraut. Difor: ingen tips medan brukaren teiknar, drar eller nettopp har
// gjort noko (KLIPS_ROLEG), minst KLIPS_PAUSE mellom to automatiske tips,
// «Seinare» gjeld til økta er slutt, og «Slå av» vert hugsa i nettlesaren.
(function(){
  const rot=document.getElementById('klips');if(!rot)return;
  const fig=document.getElementById('klipsFig'),boble=document.getElementById('klipsBoble');
  const k3=lagKlips3D(()=>Date.now()-sistAktiv);
  if(k3){rot.insertBefore(k3.el,fig);rot.classList.add('k3d');}
  // Figuren som faktisk står framme: 3D-lerretet, eller SVG-en som reserve
  const figEl=()=>k3&&rot.classList.contains('k3d')?k3.el:fig;
  const tittelEl=document.getElementById('klipsTittel'),tekstEl=document.getElementById('klipsTekst'),knappEl=document.getElementById('klipsKnappar');
  const KLIPS_ROLEG=2500,KLIPS_PAUSE=20000,KLIPS_TAKT=1500;
  const lsHent=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
  const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(e){}};
  let sistAktiv=Date.now(),sistTips=0,vist=null,vdIdx=0;
  const vistNo=new Set();   // kontekst-tips vist ved klikk i denne runden, før vi går over til «visste du»
  const utsett=new Set();   // regel-nøklar brukaren har sagt «Seinare» til i denne økta

  // Alle soner på alle etasjar. Den aktive etasjen les `zones`-aliaset (same
  // fella som _fyllFraPi), og fasadevisinga har ingen soner på lerretet.
  const alleSoner=()=>floors.flatMap((f,i)=>(i===activeFloor&&viewMode==='plan'?zones:f.zones)||[]);
  const tilSone=z=>{if(viewMode==='plan')saveFloorState();visSonekort(z);};
  const trykk=id=>{const b=document.getElementById(id);if(b)b.click();};

  // Trønder-modus (bart-knappen i toppen av boblen): bart, skinnvest og
  // stereotypisk trøndersk. Kvar tekst har ein `tr`-variant ved sida av seg;
  // knappane går gjennom BT. Vert hugsa i nettlesaren (klipsTrond).
  let trond=lsHent('klipsTrond')==='1';
  const TR=(nn,tr)=>trond?tr:nn;
  const BT={'Kjekt å vite':'Det va greit å vit','Kalibrer no':'Kalibrer no, gutt','Gå til arket':'Gå tel arke',
    'Vis sonekortet':'Vis sonekorte','Det er kontor':'Det e kontor','Legg til vindauge':'Legg tel vindu','Det stemmer':'Det stemme',
    'Nord stemmer alt':'Nord stemme alt','Opne KI-oppteikning':'Åpn KI-oppteikning','Opne Kople soner':'Åpn Kople soner',
    'Takk':'Takk skal du ha','Fleire tips':'Fler tips','Seinare':'Seinar','Slå av Klips':'Skru\'n av','Takk, Klips':'Takk, Klips, rai-rai!'};
  const bt=t=>trond&&BT[t]||t;

  // Prioritert: den fyrste regelen som slår til vert vist. `key` skil mellom
  // ulike tilfelle av same regel (eitt ark, éi sone), så eit nytt problem
  // kjem fram sjølv om brukaren har utsett eit liknande.
  const REGLAR=[
    {id:'helsa',sjekk:()=>!lsHent('klipsHelsa')&&{key:'helsa',
      tittel:TR('Hei, eg er Klips!','Æ e han Klips!'),
      tekst:TR('Eg er energimerkingsassistenten til Entro. Eg seier frå når noko kan gjere energimerket feil, og elles held eg meg i ro. Klikk på meg om du vil ha eit tips.',
        'Æ e energimerkingshjelpern tel Entro, rett fra Trondhjæm. Æ sei ifra når nåkka kan gjør energimerke feil, og ellers e æ still som ei kjerkemus. Klikk på mæ om du vil ha et tips.'),
      knappar:[{t:'Kjekt å vite',hovud:true,gjer:()=>lsSet('klipsHelsa','1')}],utanSeinare:true}},
    {id:'skala',sjekk:()=>bgImg&&!mmPerImgPx&&mode!=='calibrate'&&{key:'skala:'+viewMode+':'+(viewMode==='plan'?curFloor().id:activeFasade),
      tittel:TR('Det ser ut som du har lasta opp ei teikning!','Nei se, ei tegning!'),
      tekst:TR((viewMode==='fasade'?'Fasadearket':'Teikninga')+' manglar skala, så alle areal og veggengder vert feil i energimerket. Kalibrer fyrst. Det tek ti sekund.',
        (viewMode==='fasade'?'Fasadearke':'Tegninga')+' mangle skala, og da blir alle areala og vegglengdan feil i energimerke. Kalibrer først, det tar ti sekund. Rai-rai!'),
      knappar:[{t:'Kalibrer no',hovud:true,gjer:()=>trykk('calBtn')}]}},
    {id:'arkSkala',sjekk:()=>{
      if(viewMode!=='plan')return null;
      const i=floors.findIndex((f,j)=>j!==activeFloor&&(f.bgImg||f.bgImgData)&&!mppForFloor(f));
      if(i<0)return null;const f=floors[i];
      return {key:'arkSkala:'+f.id,tittel:arkNamn(f)+TR(' manglar skala',' mangle skala'),
        tekst:TR('Areala på det arket vert ikkje rekna rett før det er kalibrert, og dei går rett inn i energimerket.',
          'Areala på det arke blir itj rekna rett før det e kalibrert, og dæm går rett inn i energimerke.'),
        knappar:[{t:'Gå til arket',hovud:true,gjer:()=>switchFloor(i)}]};}},
    {id:'opningar',sjekk:()=>{
      for(const z of alleSoner()){
        const g=fasadarMedForStoreOpningar(z);
        if(!g.length)continue;
        const a=g[0].opn.toFixed(1).replace('.',',')+' m² mot '+g[0].area.toFixed(1).replace('.',',')+' m²';
        return {key:'opn:'+_zuk(z),tittel:TR('Vindauga får ikkje plass','Vinduan får itj plass'),
          tekst:TR('I «'+z.name+'» er opningane større enn fasaden '+g[0].namn+' ('+a+'). SXI-eksporten stoppar til det er retta.',
            'I «'+z.name+'» e åpningan større enn fasaden '+g[0].namn+' ('+a+'). Det får du itj inn sjøl med vinsjan på kaia. SXI-eksporten stoppe tel det e retta.'),
          knappar:[{t:'Vis sona',hovud:true,gjer:()=>tilSone(z)}]};
      }
      return null;}},
    {id:'overlapp',sjekk:()=>{
      const o=sonerOverlapp()[0];if(!o)return null;
      const a=o.areal.toFixed(1).replace('.',',')+' m²';
      return {key:'ovl:'+_zuk(o.a)+':'+_zuk(o.b),tittel:TR('To soner ligg oppå kvarandre','To sona ligg oppå kvarandre'),
        tekst:TR('«'+o.a.name+'» og «'+o.b.name+'» overlappar med '+a+'. Det arealet vert rekna to gonger i energimerket. Overlappen er raud i teikninga.',
          '«'+o.a.name+'» og «'+o.b.name+'» overlappe med '+a+'. Det arealet blir rekna to gong i energimerke, og det e itj nå å tøys med. Overlappen e rau i tegninga.'),
        knappar:[{t:'Vis sona',hovud:true,gjer:()=>tilSone(o.a)}]};}},
    {id:'kategori',sjekk:()=>{
      const s=alleSoner();if(!s.length||s.some(z=>z.bygkat))return null;
      return {key:'kat',tittel:TR('Kva slags bygg er dette?','Ka slags bygg e dette her?'),
        tekst:TR('Ingen av sonene har fått bygningskategori, så alle går til SIMIEN som kontorbygg. Er det ikkje eit kontorbygg, vert energimerket feil.',
          'Ingen tå sonan har fått bygningskategori, så alt går tel SIMIEN som kontorbygg. E det itj kontor, blir energimerke feil, og det e itj bra.'),
        knappar:[{t:'Vis sonekortet',hovud:true,gjer:()=>tilSone(s[0])},{t:'Det er kontor',gjer:()=>utsett.add('kat')}],utanSeinare:true};}},
    {id:'vindauge',sjekk:()=>{
      const s=alleSoner();if(s.length<1||s.some(z=>(z.windows||[]).length)||mode==='window')return null;
      return {key:'vindauge',tittel:TR('Neste steg: vindauge og dører','Neste steg: vindu og dørr'),
        tekst:TR('Sonene er på plass. Legg inn vindauge og dører på fasadane, så får SIMIEN rett glasandel og varmetap.',
          'Sonan e på plass. Legg inn vindu og dørr på fasadan, så får SIMIEN rett glassandel og varmetap. Det handle jo om lys og varme, som Åge sa.'),
        knappar:[{t:'Legg til vindauge',hovud:true,gjer:()=>trykk('winBtn')}]};}},
    {id:'nord',sjekk:()=>{
      if(globalNorth!==0||!alleSoner().some(z=>(z.windows||[]).length))return null;
      return {key:'nord',tittel:TR('Peikar nord rett opp?','Pæke nord rett opp?'),
        tekst:TR('Nordpila står på 0°. Fasaderetningane, og dermed soltilskotet i SIMIEN, følgjer pila. Dra kompasset nede til høgre om teikninga ikkje har nord opp.',
          'Nordpila står på 0°. Fasaderetningan, og dermed soltilskudde i SIMIEN, følge pila. Dra kompasse nede tel høyre om tegninga itj har nord opp.'),
        knappar:[{t:'Det stemmer',hovud:true,gjer:()=>utsett.add('nord')}],utanSeinare:true};}},
  ];
  // Tips knytte til det brukaren held på med. Dei kjem BERRE når brukaren
  // klikkar på figuren — av seg sjølv seier Klips berre frå om problem
  // (REGLAR). Få og konkrete med vilje: ei lang liste vart mas.
  // `tr` = [tittel, tekst] på trøndersk.
  const kal=()=>!!(bgImg&&mmPerImgPx);
  const KONTEKST=[
    {id:'ki-start',naar:()=>inPi()&&viewMode==='plan'&&!!bgImg&&!alleSoner().length,tittel:'La KI-en teikne for deg',
      get tekst(){return '✦ KI-oppteikning teiknar soner, vindauge og dører frå planteikninga på nokre minutt. Du ser forslaget på lerretet og rettar eller godtek det før noko vert lagt inn.'
        +(kal()?'':' Teikninga må vere kalibrert fyrst, og dialogen hjelper deg med det.');},
      get tr(){return ['La KI-en tegn for dæ','✦ KI-oppteikning tegne sona, vindu og dørr fra plantegninga på nån minutta. Du ser forslage på lerrete og rette eller godtar det før nåkka blir lagt inn.'
        +(kal()?' Sett på litt Åge mens du vente.':' Tegninga må vær kalibrert først, og dialogen hjelpe dæ med det.')];},
      knappar:[{t:'Opne KI-oppteikning',hovud:true,gjer:()=>trykk('aiBtn')}]},
    {id:'nord-fyrst',naar:()=>viewMode==='plan'&&kal()&&!alleSoner().length&&globalNorth===0,tittel:'Set himmelretninga før du teiknar',
      tekst:'Dra nordpila nede til høgre så ho peikar mot nord i teikninga. Fasaderetningane og soltilskotet i SIMIEN følgjer ho, og det er lettare å få rett no enn når alt er teikna.',
      tr:['Sett himmelretninga før du tegne','Dra nordpila nede tel høyre så ho pæke mot nord i tegninga. Fasaderetningan og soltilskudde i SIMIEN følge ho, og det e lettar å få rett no enn når alt e tegna.']},
    {id:'teikn',naar:()=>mode==='draw'&&viewMode==='plan',tittel:'Teiknetips',
      tekst:'Klikk hjørna langs innsida av ytterveggen. Enter eller dobbeltklikk avsluttar, Esc avbryt. Hald Shift for rette vinklar, og ⌖ Snap festar punktet til veggkryss i teikninga.',
      tr:['Tegnetips','Klikk hjørnan langs innsida tå ytterveggen. Enter eller dobbeltklikk avslutte, Esc avbryt. Hold Shift for rette vinkla, og ⌖ Snap feste punkte tel veggkryss i tegninga.']},
    {id:'vindauge',naar:()=>mode==='window',tittel:'Vindaugstips',
      tekst:'Klikk to punkt langs ein fasadevegg for breidda. Har veggen fleire like vindauge, set antal i staden for å teikne kvart: det blir éitt element i SIMIEN. Ctrl+C og Ctrl+V kopierer eit vindauge til ein annan vegg.',
      tr:['Vindustips','Klikk to punkt langs en fasadevegg for bredda. Har veggen fler like vindu, sett antall istedenfor å tegn dæm ett og ett, så blir det ett element i SIMIEN. Ctrl+C og Ctrl+V kopiere et vindu tel en anna vegg.']},
    {id:'eksport',naar:()=>alleSoner().filter(z=>(z.windows||[]).length).length>=2,tittel:'Før du eksporterer',
      tekst:'Sjekk kategori, byggeår og etasjehøgd i sonekorta, og at nordpila stemmer. I eksportdialogen kan du òg leggje inn tiltak, som etterisolering og vindaugsbyte, så reknar SIMIEN lønnsemda.',
      tr:['Før du eksportere','Sjekk kategori, byggeår og etasjehøyde i sonekortan, og at nordpila stemme. I eksportdialogen kan du og legg inn tiltak, som etterisolering og vindusbytte, så rekne SIMIEN ut lønnsomheta.']},
  ];
  const passar=k=>{try{return !!k.naar();}catch(e){return false;}};
  const kTittel=k=>trond&&k.tr?k.tr[0]:k.tittel,kTekst=k=>trond&&k.tr?k.tr[1]:k.tekst;

  // pi:true = berre i EntroPi (KI-oppteikninga finst berre der).
  // tr = trøndersk; berreTr:true = berre i trønder-modus.
  // Kvart tips skal vere eit råd ein kan gjere noko med, ikkje ei funksjonsliste.
  const VISSTE_DU=[
    {t:'Du kan la ✦ KI-oppteikning teikne opp soner, vindauge og dører for deg. Kalibrer teikninga og set nordpila fyrst, så får forslaget rette mål og fasaderetningar.',pi:true,
     tr:'Du kan la ✦ KI-oppteikning tegn opp sona, vindu og dørr for dæ. Kalibrer tegninga og sett nordpila først, så får forslage rette mål og fasaderetninga.'},
    {t:'Gå gjennom KI-forslaget plan for plan med ← og →, og slå saman soner med ⊕ på den felles veggen. Ingenting vert lagt inn før du trykkjer «Godta».',pi:true,
     tr:'Gå gjennom KI-forslage plan for plan med ← og →, og slå sammen sona med ⊕ på den felles veggen. Ingenting blir lagt inn før du trykke «Godta».'},
    {t:'Kalibrer på det lengste målet du finn i teikninga. 1 cm feil på ein strek på 10 m gir 0,2 % feil i arealet, men på ein strek på 1 m gir han 2 %.',
     tr:'Kalibrer på det lengste måle du finn i tegninga. 1 cm feil på en strek på 10 m gir 0,2 % feil i areale, men på en strek på 1 m gir det 2 %.'},
    {t:'Mål ei dør eller eit anna kjent mål med «Mål» etter kalibreringa. Bommar det med meir enn nokre centimeter, er skalaen feil, og alle areala med han.',
     tr:'Mål ei dør eller et anna kjent mål med «Mål» etter kalibreringa. Bomme det med mer enn nån centimeter, e skalaen feil, og alle areala med han.'},
    {t:'Teikn sonekanten langs innsida av ytterveggen. Det er oppvarma BRA SIMIEN skal ha, og langs utsida vert arealet for stort.',
     tr:'Tegn sonekanten langs innsida tå ytterveggen. Det e oppvarma BRA SIMIEN skal ha, og langs utsida blir areale for stort. Itj utsida, gutt.'},
    {t:'Hald Shift medan du teiknar, så låser linja seg til 90° og 45°.',
     tr:'Hold Shift mens du tegne, så låse linja sæ tel 90° og 45°. Rett som muran på Nidarosdomen.'},
    {t:'Teikn den neste sona kant i kant med den førre. Då blir den felles veggen skiljekonstruksjon i begge sonene av seg sjølv, og han går ikkje til SIMIEN som yttervegg.',
     tr:'Tegn den neste sona kant i kant med den forrige. Da blir den felles veggen skillekonstruksjon i begge sonan tå sæ sjøl, og han går itj tel SIMIEN som yttervegg.'},
    {t:'Er det fleire like vindauge på same vegg, teikn eitt og set antal. Det blir éitt element i SIMIEN, og stykka vert spreidde jamt utover veggen.',
     tr:'E det fler like vindu på samme vegg, tegn ett og sett antall. Det blir ett element i SIMIEN, og stykkan blir spredd jamt utover veggen.'},
    {t:'Har sona mange ytterveggar mot same himmelretning, slå dei saman med ⊞ Fasadar. Då vert SXI-fila langt enklare å gå gjennom i SIMIEN.',
     tr:'Har sona mange yttervegga mot samme himmelretning, slå dæm sammen med ⊞ Fasadar. Da blir SXI-fila mye enklar å gå gjennom i SIMIEN.'},
    {t:'Ctrl+S lagrar, Ctrl+Z angrar, og «?» viser alle snarvegane.',
     tr:'Ctrl+S lagre, Ctrl+Z angre, og «?» vise alle snarveian.'},
    {berreTr:true,tr:'Åge Aleksandersen sang om lys og varme. Det e akkurat det SIMIEN rekne på, men vinduan må du nok tegn sjøl.'},
    {berreTr:true,tr:'Levva livet, men kalibrer først.'},
  ];

  function aktivtTips(){
    for(const r of REGLAR){
      let t=null;try{t=r.sjekk();}catch(e){t=null;}
      if(t&&!utsett.has(t.key))return t;
    }
    return null;
  }
  function vis(t,auto){
    vist=t;sistTips=Date.now();
    tittelEl.textContent=t.tittel;tekstEl.textContent=t.tekst;tekstEl.classList.toggle('k-svar',!!t.svar);
    knappEl.textContent='';
    const lukk=()=>{if(t.key&&!t.utanSeinare)utsett.add(t.key);skjul();};
    (t.knappar||[]).forEach(k=>{
      const b=document.createElement('button');b.textContent=bt(k.t);if(k.hovud)b.className='k-hovud';
      b.onclick=()=>{skjul();if(t.key&&t.utanSeinare)utsett.add(t.key);k.gjer();};
      knappEl.appendChild(b);
    });
    if(t.key&&!t.utanSeinare){const b=document.createElement('button');b.textContent=bt('Seinare');b.onclick=lukk;knappEl.appendChild(b);}
    const av=document.createElement('button');av.className='k-av';av.textContent=bt('Slå av Klips');av.onclick=()=>settAv(true);knappEl.appendChild(av);
    document.getElementById('klipsLukk').onclick=()=>{if(t.key==='helsa')lsSet('klipsHelsa','1');if(t.key)utsett.add(t.key);skjul();};
    rot.classList.add('prat');
    const VED_KLIKK=['vift','nikk','vift','kortsnu','blunk1','salutt','djupbukk'];
    spel(auto?'inn':VED_KLIKK[Math.floor(Math.random()*VED_KLIKK.length)]);
    sjaaPaa(1,-1,1400);   // ser opp mot boblen ei stund
  }
  function skjul(){vist=null;rot.classList.remove('prat');}
  function spel(k){
    if(k3&&rot.classList.contains('k3d')){k3.spel(k);return;}
    if(!['inn','vift','feir'].includes(k))return;   // SVG-reserven har berre desse tre
    rot.classList.remove('inn','vift','feir');void rot.offsetWidth;rot.classList.add(k);
  }

  // Står det ein dialog eller eit overlegg oppå figuren, held han seg stille.
  // 3D-lerretet har pointer-events:none utanfor figuren, så det må slåast på
  // eit augneblink — elles finn elementFromPoint det som ligg under.
  function dekt(){
    const f=figEl(),r=f.getBoundingClientRect();if(!r.width)return true;
    const pe=f.style.pointerEvents;if(f!==fig)f.style.pointerEvents='auto';
    const el=f===fig?document.elementFromPoint(r.left+r.width/2,r.top+r.height*0.6)
      :document.elementFromPoint(r.left+r.width*k3.midt[0],r.top+r.height*k3.midt[1]);
    f.style.pointerEvents=pe;
    return !el||!rot.contains(el);
  }
  function roleg(){
    return Date.now()-sistAktiv>KLIPS_ROLEG&&!dragging&&!curPts.length&&!calPts.length&&!measurePts.length
      &&document.visibilityState==='visible'&&!dekt();
  }
  // Han reagerer på det brukaren får til, utan boble: nikkar når ei ny sone
  // kjem til, og tek ein snurr når teikninga vert kalibrert.
  let sistSoner=-1,sistKal=null;
  function reager(){
    const n=alleSoner().length,k=!!(bgImg&&mmPerImgPx);
    if(!vist&&sistKal===false&&k)spel('snurr');
    else if(!vist&&sistSoner>=0&&n>sistSoner)spel('nikk');
    sistSoner=n;sistKal=k;
  }
  setInterval(()=>{
    if(rot.classList.contains('av'))return;
    try{reager();}catch(e){}
    if(vist&&vist.key){
      // Problemet er løyst (t.d. kalibrert) — boblen går bort av seg sjølv
      const no=aktivtTips();if(!no||no.key!==vist.key){if(vist.key!=='helsa')skjul();}
      return;
    }
    // Eit kontekst-tips går bort når brukaren har gått vidare (t.d. ut av teiknemodus)
    if(vist&&vist.naar){if(!passar(vist))skjul();return;}
    // Av seg sjølv: berre helsinga og problem. Tips kjem når ein klikkar.
    if(vist||Date.now()-sistTips<KLIPS_PAUSE||!roleg())return;
    const t=aktivtTips();
    if(t)vis(t,true);
  },KLIPS_TAKT);

  ['pointerdown','keydown','wheel'].forEach(ev=>window.addEventListener(ev,e=>{if(!rot.contains(e.target))sistAktiv=Date.now();},true));

  const klikkFig=()=>figEl().dispatchEvent(new Event('click'));
  const vedKlikk=fn=>{fig.addEventListener('click',fn);if(k3)k3.el.addEventListener('click',fn);};
  // Klikkar ein fort mange gonger, vert han svimmel (og seier frå at eitt klikk er nok)
  let klikkT=[];
  vedKlikk(()=>{
    const no=Date.now();klikkT=klikkT.filter(t=>no-t<1800);klikkT.push(no);
    if(klikkT.length>=4){
      klikkT=[];
      const s={tittel:TR('Oi oi oi …','Æ e heilt ør!'),
        tekst:TR('Alt går rundt. Eitt klikk er nok — då kjem det eit tips.','Itj klikk så fort, gutt. Ett klikk e nok, så kjæm det et tips.'),knappar:[]};
      vis(s,false);spel('svimmel');
      setTimeout(()=>{if(vist===s)skjul();},4500);
      return;
    }
    if(vist){skjul();spel('blunk1');return;}
    // Eitt klikk er nok: helsinga vert hoppa over, og vi går rett til eit tips
    lsSet('klipsHelsa','1');
    const t=aktivtTips();
    if(t){vis(t,false);return;}
    const fleire={t:'Fleire tips',hovud:true,gjer:()=>setTimeout(klikkFig,0)};
    // Fyrst det som passar til det brukaren held på med, så dei generelle
    const k=KONTEKST.find(k=>!vistNo.has(k.id)&&passar(k));
    if(k){vistNo.add(k.id);
      vis({tittel:kTittel(k),tekst:kTekst(k),knappar:k.knappar?[...k.knappar,{...fleire,hovud:false}]:[fleire]},false);return;}
    vistNo.clear();
    const liste=VISSTE_DU.filter(v=>(!v.pi||inPi())&&(!v.berreTr||trond));
    const v=liste[vdIdx++%liste.length];
    vis({key:null,tittel:TR('Visste du at …','Visst du at …'),tekst:trond?v.tr:v.t,knappar:[fleire]},false);
  });

  // Auga følgjer musa — litt, slik Clippy gjorde
  const pL=document.getElementById('klipsPupL'),pR=document.getElementById('klipsPupR');
  let laastTil=0,rafP=0,mx=0,my=0;
  function sjaaPaa(dx,dy,ms){
    if(k3)k3.sjaa(dx,dy,ms);
    laastTil=Date.now()+ms;const s=`translate(${dx*3.5} ${dy*4.5})`;pL.setAttribute('transform',s);pR.setAttribute('transform',s);
  }
  // 3D-figuren følgjer musa sjølv (auga, og kroppen snur seg litt)
  window.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    if(rafP||rot.classList.contains('av')||rot.classList.contains('k3d'))return;
    rafP=requestAnimationFrame(()=>{rafP=0;
      if(Date.now()<laastTil)return;
      const r=fig.getBoundingClientRect();if(!r.width)return;
      const cx=r.left+r.width*0.62,cy=r.top+r.height*0.31;
      const dx=mx-cx,dy=my-cy,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/160);
      const s=`translate(${(dx/d*3.5*k).toFixed(2)} ${(dy/d*4*k).toFixed(2)})`;
      pL.setAttribute('transform',s);pR.setAttribute('transform',s);
    });
  });

  function settAv(av){
    rot.classList.toggle('av',av);lsSet('klipsAv',av?'1':null);
    if(av){skjul();if(typeof hintText!=='undefined')hintText.textContent='Klips er slått av. Klikk på binderset nede til venstre for å slå han på att.';}
    else{sistTips=0;spel('inn');}
  }
  document.getElementById('klipsMini').onclick=()=>settAv(false);
  rot.classList.toggle('av',lsHent('klipsAv')==='1');

  // Trønder-modus: bart-knappen i toppen av boblen
  const trondKnapp=document.getElementById('klipsTrond'),underEl=document.getElementById('klipsUnder');
  const sporInn=document.getElementById('klipsSporIn');
  function brukTrond(){
    trondKnapp.setAttribute('aria-pressed',trond?'true':'false');
    trondKnapp.title=trond?'Tilbake til nynorsk':'Trønder-modus';
    underEl.textContent=TR('Entro energimerking','Entro, Trondhjæm');
    if(sporInn)sporInn.placeholder=TR('Spør om programmet …','Spør mæ om programme …');
    if(k3)k3.trond(trond);
  }
  trondKnapp.onclick=e=>{
    e.stopPropagation();
    trond=!trond;lsSet('klipsTrond',trond?'1':null);brukTrond();
    vis({key:null,tittel:TR('Tilbake til nynorsk','Hei på dæ!'),
      tekst:TR('Bart og vest er lagde bort. Eg snakkar nynorsk att.',
        'No har æ fått på mæ barten og skinnvesten, så no blir det trøndersk. Sett på litt Åge, så tegne vi nåkka fint i lag. Rai-rai!'),
      knappar:[{t:'Takk',hovud:true,gjer:()=>{}}]},false);
    spel(trond?'snurr':'vift');
  };
  brukTrond();
  if(!rot.classList.contains('av'))spel('inn');

  window.Klips={
    // Kalla etter ein vellukka SXI-eksport
    feir(){
      if(rot.classList.contains('av'))return;
      vis({key:null,tittel:TR('SXI-fila er klar!','SXI-fila e klar!'),tekst:TR('Lukke til med energimerket. Hugs å sjekke resultatet i SIMIEN før du sender det inn.',
        'Lykke tel med energimerke! Sjekk resultate i SIMIEN før du sende det inn. Og så har du fortjent litt DDE. Levva livet!'),
        knappar:[{t:'Takk, Klips',hovud:true,gjer:()=>{}}]},false);
      spel('feir');
    },
    vis:klikkFig,
    spel,   // spel ei rørsle ved namn (til testing frå konsollen)
  };

  // ── Spør Klips (berre i EntroPi) ──
  // Går gjennom same kanal som KI-oppteikninga (EntroHost.askAi), men som
  // oppgåva 'hjelp': ingen bilete, eit kort kunnskapsgrunnlag og eit lite
  // svarvindauge. Verten vel den billegaste modellen for 'hjelp' — sjå
  // docs/entropi-integrasjon.md. Spørsmål om anna enn programmet vert avviste
  // av modellen (omProgrammet:false). Like spørsmål i same økt vert ikkje
  // sende på nytt (svarMinne), og berre eitt spørsmål går om gongen.
  const KLIPS_KUNNSKAP=`SXI-generatoren (Entro AS) er eit nettbasert oppmålingsverktøy for energimerking av norske bygg. Brukaren lastar opp planteikningar, teiknar soner som polygon og eksporterer ei SXI-fil til SIMIEN.
Arbeidsgang: 1) «↑ Last opp» (PDF, bilete eller .entro; fleire filer/sider vert fleire etasjar, med dialog for type og namn). 2) «⊕ Kalibrer»: lengd (klikk to punkt, tast mm), areal (klikk ei sone) eller målestokk (1:100 osv., papirformat frå PDF). Utan skala vert alle areal feil. Global skala som standard, «Eiga» skala per etasje i skalabadgen. 3) «Sone»: klikk hjørne, Enter/dobbeltklikk avsluttar, Esc avbryt, Shift låser til 90°/45°. «⌖ Snap» snappar til veggkryss i teikninga. 4) «Vindauge»: klikk to punkt på ein fasadevegg, vel breidd/høgd/antal/U-verdi. Antal>1 er éitt SIMIEN-element. Ctrl+C/V kopierer. 5) Sonekortet i sidepanelet: bygningskategori (standard kontor), byggeår, etasjehøgd, takvinkel, golv- og taktype, U-verdiar, n50. 6) «⬇ SXI»: eksportdialog med klimastad, kommunenr og tiltak; eksporten stoppar om vindauga er større enn fasaden.
Anna: «Rediger» flyttar hjørne (høgreklikk slettar punkt). Høgreklikk på sone: del sone, kopier, skjul, vis sonekort. Nabosoner får felles vegg som skiljekonstruksjon (SK) automatisk; vegg kan gjerast om til fasade i sonekortet. «⊞ Fasadar» slår saman ytterveggar til éin fasade. «⇌ Kople» koplar soner med same kategori til éi SIMIEN-sone. Tak og golv kan delast i flater med eigen type (✂). Nordpila (nede til høgre) styrer fasaderetningane; «Nord-sjekk» roterer visinga. «Rett ut» rettar skeive skann (to kjende mål eller rektangel). «Roter» roterer 90°. Delplanar: fleire teikningar for same etasje, plassert med ⌖. Fasadeteikningar: eige lag berre for måling (Plan/Fasade, Side om side). «Mål» tek kontrollmål. «☰ Liste» redigerer mange vindauge/soner samstundes. 3D-visning og kart. «✦ KI-oppteikning» teiknar soner, vindauge og dører frå teikninga (krev kalibrering). Ho les òg fasadeteikningar (vindaugshøgd, brystning, etasjehøgd) og kan køyre heile bygget i éi køyring. Forslaget vert gått gjennom plan for plan (← →), og soner kan slåast saman med ⊕ før «Godta». Mange teikningar, òg fasadar, kan sleppast inn samstundes og vert sorterte automatisk. Lagring: «Lagre» lagrar på bygget i EntroPi (autolagring kvart 2. minutt), ⬇ lastar ned .entro. Ctrl+Z/Ctrl+Y angrar/gjer om. «?» viser tastatursnarvegar. Høgreklikk på etasjefana: kopier etasje, slett fleire, gjer til delplan. Mørk modus følgjer innstillinga i EntroPi (måne/sol-knappen øvst i EntroPi); programmet har ingen eigen brytar.`;
  const svarMinne=new Map();
  let spurde=false;
  const sporForm=document.getElementById('klipsSpor'),sporIn=document.getElementById('klipsSporIn');
  sporIn.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')skjul();});
  function tilstand(){
    const s=alleSoner();
    return `Tilstand no: ${floors.length} etasjar, ${s.length} soner, ${s.reduce((n,z)=>n+(z.windows||[]).length,0)} vindauge/dører, `
      +`aktivt ark ${bgImg?(mmPerImgPx?'kalibrert':'IKKJE kalibrert'):'utan teikning'}, visning ${viewMode}, verktøy ${mode}.`;
  }
  sporForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const q=sporIn.value.trim().replace(/\s+/g,' ');
    if(q.length<3||spurde)return;
    const nokkel=(trond?'tr:':'')+q.toLowerCase();
    const visSvar=s=>vis({key:null,svar:true,tittel:TR('Klips svarar','Klips svare'),tekst:s,knappar:[]},false);
    if(svarMinne.has(nokkel)){sporIn.value='';visSvar(svarMinne.get(nokkel));return;}
    spurde=true;sporForm.querySelector('button').disabled=true;rot.classList.add('tenk');
    vis({key:null,tittel:TR('Augneblink …','Vent litt, æ tenke …'),tekst:'«'+q+'»',knappar:[]},false);
    let r;
    try{
      r=await window.EntroHost.askAi({oppgave:'hjelp',maxTokens:700,images:[],meta:{sporsmal:q.length},
        schema:{type:'object',additionalProperties:false,required:['omProgrammet','svar'],
          properties:{omProgrammet:{type:'boolean'},svar:{type:'string'}}},
        prompt:'Du er Klips, hjelpefiguren i SXI-generatoren frå Entro AS. Svar BERRE på spørsmål om korleis ein brukar dette programmet, eller om energimerking slik programmet gjer det. '
          +'Er spørsmålet om noko anna, set omProgrammet=false og svar med éi kort setning om at du berre kan hjelpe med SXI-generatoren. '
          +(trond?'Svar på overdriven, stereotypisk trøndersk dialekt med bokmål som grunnlag, ikkje nynorsk (tegning, høyde, gulv, fra, bare, samme; Æ, itj, mæ, dæ, sæ, fali, gutt, apokope), gjerne med ei lita tilvising til DDE eller Åge Aleksandersen, men hald innhaldet korrekt. Byrj gjerne med «Æ e han Klips». Kort og konkret (høgst 4 setningar eller ei kort punktliste), med namna på knappane slik dei står under. Finst ikkje svaret i grunnlaget, seier du det i staden for å gjette.\n\n'
            :'Svar på nynorsk, kort og konkret (høgst 4 setningar eller ei kort punktliste), med namna på knappane slik dei står under. Finst ikkje svaret i grunnlaget, seier du det i staden for å gjette.\n\n')
          +'GRUNNLAG:\n'+KLIPS_KUNNSKAP+'\n\n'+tilstand()+'\n\nSPØRSMÅL: '+q});
    }catch(err){r={ok:false,message:err.message};}
    spurde=false;sporForm.querySelector('button').disabled=false;rot.classList.remove('tenk');
    if(!r.ok){vis({key:null,tittel:TR('Det gjekk ikkje','Det gikk itj'),tekst:r.message||TR('Fekk ikkje svar frå EntroPi.','Fikk itj svar fra EntroPi.'),knappar:[]},false);return;}
    const svar=String(r.result.svar||'').trim()||TR('Det veit eg dessverre ikkje.','Det veit æ itj, gutt.');
    svarMinne.set(nokkel,svar);sporIn.value='';
    visSvar(svar);
  });
  // I EntroPi opnar eit klikk på figuren med spørjefeltet klart
  vedKlikk(()=>{if(vist&&inPi())setTimeout(()=>sporIn.focus(),0);});

  // ── Klips i 3D ──
  // Same figur som SVG-en — binders, Entro-hjelm, energimerket i handa — men
  // bygd i Three.js med ekte metall, blank hjelm og fjører på alt som rører
  // seg: kroppen snur seg mot musa, hjelmen ligg laus og heng etter i hoppa,
  // og han vinkar med merket, tek av seg hjelmen og tek salto når SXI-fila er
  // klar. SVG-en står att som reserve: utan WebGL, eller om konteksten vert
  // mista. Animasjonane er lag oppå kvarandre: ro (pust, svai), tilstand
  // (prat, tenk, mus over), og éin handling om gongen (`akt`). Alt går
  // gjennom fjører, så overgangane vert mjuke utan at kvar handling må
  // tenkje på kvar den førre slutta.
  // stille() = ms sidan brukaren sist gjorde noko (til døsinga).
  function lagKlips3D(stille){
    if(typeof THREE==='undefined')return null;
    const cv=document.createElement('canvas');cv.id='klipsGL';
    cv.setAttribute('role','img');cv.setAttribute('aria-label','Klips — klikk for eit tips');cv.title='Klips — klikk for eit tips';
    let R;
    try{R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){return null;}
    const W=240,H=270;
    R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.setSize(W,H,false);
    R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1;
    R.setClearColor(0,0);
    const RO=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new THREE.Scene();
    // r128 les hex-fargar som lineære; utan omrekninga vert alt bleikt i sRGB-utdata
    const lin=h=>new THREE.Color(h).convertSRGBToLinear();
    const MAAL=new THREE.Vector3(-.47,2.2,0);
    const cam=new THREE.PerspectiveCamera(26,W/H,1,80);
    cam.position.set(MAAL.x+2.4,MAAL.y+4,23.8);cam.lookAt(MAAL);

    // Miljøkart til metallet: grå-kvit kuppel med tre «softboksar»
    {const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene();
     const sg=new THREE.SphereGeometry(10,24,12),p=sg.attributes.position,c=[];
     const a=new THREE.Color(0x5d666b),b=new THREE.Color(0xf4f6f7),t=new THREE.Color();
     for(let i=0;i<p.count;i++){t.copy(a).lerp(b,(p.getY(i)/10+1)/2);c.push(t.r,t.g,t.b);}
     sg.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
     es.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
     const lys=(x,y,z,w,h,k,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);};
     lys(-5,6,5,5,3,3,0xffffff);lys(7,1,3,1.5,7,2.2,0xffffff);lys(0,-1,-8,9,2,1.6,0x9fd0d4);
     scene.environment=pm.fromScene(es,0.03).texture;pm.dispose();}
    scene.add(new THREE.HemisphereLight(0xffffff,lin(0x9aa6b0),.5));
    const key=new THREE.DirectionalLight(0xffffff,.8);key.position.set(-4,7,8);scene.add(key);
    const rim=new THREE.DirectionalLight(lin(0xa8dde0),.8);rim.position.set(6,3,-7);scene.add(rim);

    // Koordinatane er dei same som i SVG-en, så figuren held forma si
    const P=(x,y,z=0)=>new THREE.Vector3((x-189)/50,(240-y)/50,z);
    const LOGO=new Path2D(document.getElementById('kLogo').getAttribute('d'));
    const ani=R.capabilities.getMaxAnisotropy();
    const tekstur=c=>{const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=ani;return t;};
    const mTraad=new THREE.MeshStandardMaterial({color:lin(0xd4d4ce),metalness:1,roughness:.17});
    const mHjelm=new THREE.MeshPhysicalMaterial({color:lin(0x32595e),roughness:.32,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:.45});
    const mHjelmMork=new THREE.MeshStandardMaterial({color:lin(0x162b2d),roughness:.7});
    const mKvit=new THREE.MeshPhysicalMaterial({color:lin(0xf2f2f0),roughness:.25,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:.4});
    const mPupil=new THREE.MeshPhysicalMaterial({color:lin(0x0c0c0b),roughness:.25,clearcoat:1,envMapIntensity:.5});
    const mGlans=new THREE.MeshBasicMaterial({color:lin(0xffffff)});
    const mBryn=new THREE.MeshStandardMaterial({color:lin(0x2a2927),roughness:.55});

    const FOT=P(190,362),HJ=P(192,112);
    const rotG=new THREE.Group();rotG.position.copy(FOT);scene.add(rotG);   // hopp, snu, salto
    const hallG=new THREE.Group();rotG.add(hallG);                          // helling
    const sqG=new THREE.Group();hallG.add(sqG);                             // klem og strekk
    const modell=new THREE.Group();modell.position.set(-FOT.x,-FOT.y,0);sqG.add(modell);
    const treff=[];

    // Binderset: same bane som #kTraad, som eitt rundt røyr
    const bane=new THREE.CurvePath();
    const L=(a,b)=>bane.add(new THREE.LineCurve3(P(...a),P(...b)));
    const Q=(a,c,b)=>bane.add(new THREE.QuadraticBezierCurve3(P(...a),P(...c),P(...b)));
    L([178,176],[178,300]);Q([178,300],[178,318],[191,318]);Q([191,318],[204,318],[204,300]);L([204,300],[204,140]);
    Q([204,140],[204,116],[182,116]);Q([182,116],[160,116],[160,140]);L([160,140],[160,326]);
    Q([160,326],[160,356],[189,356]);Q([189,356],[218,356],[218,326]);L([218,326],[218,160]);
    const RT=.085;
    const traad=new THREE.Mesh(new THREE.TubeGeometry(bane,460,RT,14,false),mTraad);modell.add(traad);treff.push(traad);
    const ende=new THREE.SphereGeometry(RT,14,10);
    [P(178,176),P(218,160)].forEach(p=>{const m=new THREE.Mesh(ende,mTraad);m.position.copy(p);modell.add(m);});

    // Auga: kvite ellipsoidar, pupillen glid langs overflata
    const Z=new THREE.Vector3(0,0,1),DIR=new THREE.Vector3();
    function lagAuge(sx,sy){
      const g=new THREE.Group();g.position.copy(P(sx,sy,.2));
      const kv=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mKvit);g.add(kv);treff.push(kv);
      const pup=new THREE.Group();
      const pm=new THREE.Mesh(new THREE.SphereGeometry(.46,24,16),mPupil);pm.scale.z=.35;pup.add(pm);
      const gl=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),mGlans);gl.position.set(.15,.17,.16);pup.add(gl);
      const gl2=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),mGlans);gl2.position.set(-.14,-.16,.15);pup.add(gl2);
      g.add(pup);modell.add(g);
      return {g,pup};
    }
    const augeL=lagAuge(170,154),augeR=lagAuge(212,154);
    function settPupil(a,u,v){
      const w=Math.sqrt(Math.max(.05,1-u*u-v*v));
      a.pup.position.set(u*.9,v*.9,w*.9);DIR.set(u,v,w).normalize();a.pup.quaternion.setFromUnitVectors(Z,DIR);
    }
    function lagBryn(a,c,b){
      const kurve=new THREE.QuadraticBezierCurve3(P(...a,.36),P(...c,.36),P(...b,.36));
      const midt=kurve.getPoint(.5);
      const geo=new THREE.TubeGeometry(kurve,20,.055,8,false);geo.translate(-midt.x,-midt.y,-midt.z);
      const g=new THREE.Group();g.position.copy(midt);g.add(new THREE.Mesh(geo,mBryn));
      [kurve.getPoint(0),kurve.getPoint(1)].forEach(p=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),mBryn);s.position.copy(p).sub(midt);g.add(s);});
      modell.add(g);return {g,y:midt.y};
    }
    const brynL=lagBryn([152,128],[164,118],[181,125]),brynR=lagBryn([200,121],[215,112],[230,120]);
    // Raude kinn når han vert kilen eller blyg (usynlege elles)
    const mKinn=new THREE.MeshBasicMaterial({color:lin(0xe8737a),transparent:true,opacity:0,depthWrite:false});
    const kinn=[P(168,186,.3),P(214,186,.3)].map(p=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.2,16,10),mKinn);
      m.position.copy(p);m.scale.set(1,.55,.3);m.visible=false;modell.add(m);return m;});

    // Armen og energimerket. Kortet heng i handa, så det kan vifte rundt grepet.
    const skulder=new THREE.Group();skulder.position.copy(P(160,268,.02));modell.add(skulder);
    const s0=P(160,268),hand=P(128,258).sub(s0);
    const armKurve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),P(142,270).sub(s0),hand);
    skulder.add(new THREE.Mesh(new THREE.TubeGeometry(armKurve,24,RT*.9,10,false),mTraad));
    const handG=new THREE.Group();handG.position.copy(hand);handG.rotation.y=.32;skulder.add(handG);
    const knoke=new THREE.Mesh(new THREE.SphereGeometry(RT*1.25,14,10),mTraad);handG.add(knoke);
    const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
    const kortC=document.createElement('canvas');kortC.width=392;kortC.height=544;
    const bakC=document.createElement('canvas');bakC.width=196;bakC.height=272;
    function teiknKort(){
      const g=kortC.getContext('2d');g.setTransform(4,0,0,4,0,0);g.clearRect(0,0,98,136);
      const gr=g.createLinearGradient(0,0,0,136);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#eaeef2');
      g.fillStyle=gr;g.fillRect(0,0,98,136);
      g.save();g.translate(9,7);g.scale(.07,.07);g.fillStyle='#32595e';g.fill(LOGO);g.restore();
      g.fillStyle='#32595e';g.font='600 9px Inter, system-ui, sans-serif';g.textBaseline='alphabetic';g.fillText('Energimerke',22,18);
      const F=['#3B6D11','#639922','#97C459','#FAC775','#EF9F27','#D85A30','#A32D2D'],T=['#fff','#fff','#173404','#412402','#412402','#fff','#fff'];
      F.forEach((f,i)=>{const y=28+i*15,w=34+i*8;
        g.fillStyle=f;rr(g,8,y,w,12,2);g.fill();
        g.fillStyle='rgba(255,255,255,.25)';rr(g,8,y,w,4,2);g.fill();
        g.beginPath();g.moveTo(8+w,y);g.lineTo(8+w+5,y+6);g.lineTo(8+w,y+12);g.fillStyle=f;g.fill();
        g.fillStyle=T[i];g.font='700 9px Inter, system-ui, sans-serif';g.fillText('ABCDEFG'[i],12,y+9.5);});
      g.fillStyle='#32595e';g.beginPath();g.moveTo(72,43);g.lineTo(86,43);g.lineTo(92,49);g.lineTo(86,55);g.lineTo(72,55);g.fill();
      const b=bakC.getContext('2d');b.setTransform(2,0,0,2,0,0);
      const gb=b.createLinearGradient(0,0,98,136);gb.addColorStop(0,'#3d6a70');gb.addColorStop(1,'#1d3739');
      b.fillStyle=gb;b.fillRect(0,0,98,136);
      b.save();b.translate(49-124*.3/2,40);b.scale(.3,.3);b.fillStyle='#fff';b.fill(LOGO);b.restore();
      b.fillStyle='rgba(255,255,255,.85)';b.font='600 9px Inter, system-ui, sans-serif';b.textAlign='center';b.fillText('Entro',49,118);
    }
    teiknKort();
    const kortT=tekstur(kortC),bakT=tekstur(bakC);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{teiknKort();kortT.needsUpdate=bakT.needsUpdate=true;});
    const mKant=new THREE.MeshStandardMaterial({color:lin(0xd5dce2),roughness:.6,envMapIntensity:.3});
    const kort=new THREE.Mesh(new THREE.BoxGeometry(1.96,2.72,.045),[mKant,mKant,mKant,mKant,
      new THREE.MeshStandardMaterial({map:kortT,color:lin(0xe4e4e4),roughness:.5,envMapIntensity:.3}),new THREE.MeshStandardMaterial({map:bakT,roughness:.5,envMapIntensity:.3})]);
    kort.position.set(-.98,-.46,0);kort.rotation.z=.14;handG.add(kort);treff.push(kort);

    // Hjelmen ligg laus på hovudet (eiga fysikk, sjå ramme())
    const hjelmPiv=new THREE.Group();hallG.add(hjelmPiv);
    const hjelm=new THREE.Group();hjelm.rotation.z=.17;hjelmPiv.add(hjelm);
    const hForm=new THREE.Group();hForm.scale.z=.82;hjelm.add(hForm);
    const kuppel=new THREE.Mesh(new THREE.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),mHjelm);kuppel.scale.set(.86,.95,.86);hForm.add(kuppel);treff.push(kuppel);
    const bremPkt=[[.8,.05],[.98,-.01],[1.15,-.07],[1.18,-.11],[1.13,-.135],[.95,-.095],[.8,-.04],[.8,.05]].map(([x,y])=>new THREE.Vector2(x,y));
    const brem=new THREE.Mesh(new THREE.LatheGeometry(bremPkt,64),mHjelm);hForm.add(brem);treff.push(brem);
    // To ryggar, ein på kvar side, så logoen midt framme står fri
    {const ryggG=new THREE.Group();ryggG.scale.copy(kuppel.scale);hForm.add(ryggG);
     const ryggGeo=new THREE.TorusGeometry(Math.sqrt(1-.52*.52)+.02,.055,10,48,Math.PI);
     [-.52,.52].forEach(x=>{const m=new THREE.Mesh(ryggGeo,mHjelm);m.rotation.y=Math.PI/2;m.position.x=x;ryggG.add(m);});}
    const under=new THREE.Mesh(new THREE.CircleGeometry(.84,40),mHjelmMork);under.rotation.x=Math.PI/2;under.position.y=-.02;hForm.add(under);
    {const c=document.createElement('canvas');c.width=160;c.height=256;const g=c.getContext('2d');
     const s=Math.min(160/124,256/199)*.78;
     g.translate((160-124*s)/2,(256-199*s)/2);g.scale(s,s);
     g.save();g.translate(4,6);g.fillStyle='rgba(16,30,32,.45)';g.fill(LOGO);g.restore();
     g.fillStyle='#fff';g.fill(LOGO);
     const merke=new THREE.Mesh(new THREE.SphereGeometry(1.008,20,14,Math.PI/2-.42,.84,.28,.88),
       new THREE.MeshPhysicalMaterial({map:tekstur(c),transparent:true,roughness:.32,clearcoat:1,depthWrite:false,envMapIntensity:.45}));
     merke.scale.copy(kuppel.scale);hForm.add(merke);}

    // Trønder-utstyr: bart og skinnvest med frynser. Ligg i modellen, så det
    // klemmer og strekkjer seg med kroppen; synleg berre i trønder-modus.
    const trondG=new THREE.Group();trondG.visible=false;modell.add(trondG);
    const frynser=[],treffTrond=[];   // stråletesten ser ikkje på .visible, så vesten har eiga liste
    {const mHaar=new THREE.MeshStandardMaterial({color:lin(0x5e3d22),roughness:.9,envMapIntensity:.2});
     const mLaer=new THREE.MeshStandardMaterial({color:lin(0x1c1b1a),roughness:.42,envMapIntensity:.6});
     const kule=new THREE.SphereGeometry(1,14,10),mx=.04;
     // Barten: to tjukke halvdelar som heng ned i endane (kvalross), bygd av kuler
     [-1,1].forEach(s=>{
       const k=new THREE.CubicBezierCurve3(new THREE.Vector3(mx,1.2,.4),new THREE.Vector3(mx+s*.32,1.24,.4),
         new THREE.Vector3(mx+s*.6,1.08,.33),new THREE.Vector3(mx+s*.66,.68,.24));
       for(let i=0;i<=18;i++){const t=i/18,p=k.getPoint(t),r=.21*(1-t)+.06*t+.03*Math.sin(t*Math.PI);
         [[0,0],[.07,-.03*s],[-.07,.03*s]].forEach(([dy,dz],j)=>{if(j&&i>14)return;
           const m=new THREE.Mesh(kule,mHaar);m.position.set(p.x,p.y+dy,p.z+dz);m.scale.set(r,r*(j?.75:.9),r*.8);trondG.add(m);});}
     });
     // Vesten: to framstykke med V-hals, ekstrudert så han har tjukkleik rundt binderset
     [-1,1].forEach(s=>{
       const sh=new THREE.Shape(),X=x=>x*s;
       sh.moveTo(X(.07),.2);sh.lineTo(X(.38),.86);sh.lineTo(X(.7),.82);
       sh.quadraticCurveTo(X(.62),.2,X(.84),.02);sh.lineTo(X(.84),-1.5);sh.lineTo(X(.07),-1.5);sh.lineTo(X(.07),.2);
       const g=new THREE.ExtrudeGeometry(sh,{depth:.34,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:10});
       const m=new THREE.Mesh(g,mLaer);m.position.z=-.19;trondG.add(m);treffTrond.push(m);
       // Lyse stingar langs kanten framme
       const sting=new THREE.Mesh(new THREE.BoxGeometry(.012,1.62,.01),new THREE.MeshBasicMaterial({color:lin(0x8a8780)}));
       sting.position.set(X(.13),-.66,.18);trondG.add(sting);
       for(let i=0;i<9;i++){
         const geo=new THREE.BoxGeometry(.035,.34,.03);geo.translate(0,-.17,0);
         const f=new THREE.Mesh(geo,mLaer);f.position.set(X(.13+i*.087),-1.52,.13);trondG.add(f);frynser.push(f);
       }
     });
     // Knapp på brystet med «Æ»
     const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
     g.fillStyle='#f4efe4';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.lineWidth=8;g.strokeStyle='#b0332c';g.stroke();
     g.fillStyle='#b0332c';g.font='800 72px Inter, system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('Æ',64,70);
     const pin=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.03,28),[new THREE.MeshStandardMaterial({color:lin(0xc9a84a),metalness:1,roughness:.3}),
       new THREE.MeshStandardMaterial({map:tekstur(c),roughness:.4}),new THREE.MeshStandardMaterial({color:lin(0xc9a84a),metalness:1,roughness:.3})]);
     pin.rotation.set(Math.PI/2,0,0);pin.position.set(-.45,.2,.19);trondG.add(pin);}

    // Tenkjeprikkar som går i ring over hjelmen
    const tenkG=new THREE.Group();hallG.add(tenkG);tenkG.visible=false;
    const prikkar=[0,1,2].map(i=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.12,14,10),mHjelm);tenkG.add(m);return m;});

    // Skugge på golvet, skalert etter kor høgt han er
    const skC=document.createElement('canvas');skC.width=128;skC.height=64;
    {const g=skC.getContext('2d'),gr=g.createRadialGradient(64,32,0,64,32,64);
     gr.addColorStop(0,'rgba(16,24,40,.42)');gr.addColorStop(.5,'rgba(16,24,40,.16)');gr.addColorStop(1,'rgba(16,24,40,0)');
     g.fillStyle=gr;g.fillRect(0,0,128,64);}
    const skugge=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tekstur(skC),transparent:true,depthWrite:false}));
    skugge.rotation.x=-Math.PI/2;skugge.position.set(FOT.x-.95,FOT.y-.05,0);scene.add(skugge);

    // Konfetti i fargane frå energimerket
    const KF=[0x32595e,0x3B6D11,0x639922,0x97C459,0xFAC775,0xEF9F27,0xD85A30,0x6a979c];
    const konfGeo=new THREE.PlaneGeometry(.2,.11);
    const konf=Array.from({length:56},(_,i)=>{const m=new THREE.Mesh(konfGeo,new THREE.MeshBasicMaterial({color:lin(KF[i%KF.length]),side:THREE.DoubleSide,transparent:true}));
      m.visible=false;scene.add(m);return {m,v:new THREE.Vector3(),rv:new THREE.Vector3(),liv:0};});
    function konfetti(){
      const o=new THREE.Vector3(FOT.x-.6,FOT.y+5.4,.3);
      konf.forEach(k=>{const a=Math.random()*Math.PI*2,f=3+Math.random()*6;
        k.m.position.copy(o);k.v.set(Math.cos(a)*f*.7,6+Math.random()*7,Math.sin(a)*f*.5);
        k.rv.set(Math.random()*14-7,Math.random()*14-7,Math.random()*14-7);k.liv=1.8+Math.random()*.9;k.m.visible=true;});
    }

    // ── Leiketøy: det han finn fram når ingen har gjort noko på ei stund ──
    // Rubikskube i handa. Lag vert vridne ved å flytte bitane inn i `rubPiv`,
    // rotere, og bake rotasjonen inn att (posisjonen rundast til rutenettet).
    const rubikG=new THREE.Group();rubikG.visible=false;handG.add(rubikG);
    const rubPiv=new THREE.Group();rubikG.add(rubPiv);
    const RS=.27,rubBitar=[];
    {const mf=c=>new THREE.MeshStandardMaterial({color:lin(c),roughness:.35,envMapIntensity:.4});
     const SVART=mf(0x141414),FARGE=[0xc8102e,0xff6a13,0xf4f4f4,0xffd100,0x009a44,0x0051ba].map(mf);
     const geo=new THREE.BoxGeometry(RS*.94,RS*.94,RS*.94);
     for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){
       const ms=[i===1,i===-1,j===1,j===-1,k===1,k===-1].map((ut,f)=>ut?FARGE[f]:SVART);
       const m=new THREE.Mesh(geo,ms);m.position.set(i*RS,j*RS,k*RS);m.userData.heim=m.position.clone();
       rubikG.add(m);rubBitar.push(m);}}
    rubikG.position.set(.62,.42,.38);
    const AKS=['x','y','z'];
    function rubVri(tr,p){   // p 0–1 for eit lag; p=1 bakar inn
      if(!rubPiv.children.length){rubPiv.rotation.set(0,0,0);
        rubBitar.filter(b=>Math.round(b.position[tr.ax]/RS)===tr.lag).forEach(b=>rubPiv.add(b));}
      rubPiv.rotation[tr.ax]=tr.dir*Math.PI/2*Math.min(1,p);
      if(p>=1){rubPiv.updateMatrix();
        [...rubPiv.children].forEach(b=>{b.applyMatrix4(rubPiv.matrix);rubikG.add(b);
          b.position.set(Math.round(b.position.x/RS)*RS,Math.round(b.position.y/RS)*RS,Math.round(b.position.z/RS)*RS);});
        rubPiv.rotation.set(0,0,0);}
    }
    let rubTrekk=[],rubGjort=0;
    function rubStokk(){   // stokkar med n tilfeldige vridingar; løysinga er dei same baklengs
      rubPiv.rotation.set(0,0,0);[...rubPiv.children].forEach(b=>rubikG.add(b));
      rubBitar.forEach(b=>{b.position.copy(b.userData.heim);b.quaternion.set(0,0,0,1);});
      const st=[];let sist='';
      for(let i=0;i<7;i++){let ax;do ax=AKS[Math.floor(Math.random()*3)];while(ax===sist);sist=ax;
        const tr={ax,lag:Math.floor(Math.random()*3)-1,dir:Math.random()<.5?1:-1};rubVri(tr,1);st.push(tr);}
      rubTrekk=st.reverse().map(t=>({...t,dir:-t.dir}));rubGjort=0;
    }

    // Saksofon (alt): koniske røyr — hals med S-boge, rett kropp, boge nede og
    // ein utsvinga trakt med kant. Klaffar med perlemorknappar framme,
    // stong langs sida, oktavklaff på halsen og svart munnstykke med ligatur.
    const saxG=new THREE.Group();saxG.visible=false;modell.add(saxG);
    const saxMunn=new THREE.Vector3();   // midt i trakta, der notane kjem ut
    {const mMess=new THREE.MeshPhysicalMaterial({color:lin(0xd6a63a),metalness:1,roughness:.2,clearcoat:.7,clearcoatRoughness:.15,envMapIntensity:1.1});
     const mInni=new THREE.MeshStandardMaterial({color:lin(0x8a6420),metalness:1,roughness:.35,side:THREE.BackSide});
     const mPerle=new THREE.MeshPhysicalMaterial({color:lin(0xf4eee2),roughness:.25,clearcoat:1,envMapIntensity:.6});
     const mSvart=new THREE.MeshStandardMaterial({color:lin(0x121212),roughness:.3});
     const mSolv=new THREE.MeshStandardMaterial({color:lin(0xdadde0),metalness:1,roughness:.18});
     const V=(x,y,z)=>new THREE.Vector3(x,y,z);
     // Røyr der radien følgjer rFn(u): TubeGeometry med radius 1, skalert ring for ring
     const kon=(kurve,seg,rad,rFn)=>{const g=new THREE.TubeGeometry(kurve,seg,1,rad,false),p=g.attributes.position,c=new THREE.Vector3(),v=new THREE.Vector3();
       for(let i=0;i<=seg;i++){kurve.getPointAt(i/seg,c);const r=rFn(i/seg);
         for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;v.fromBufferAttribute(p,k).sub(c).multiplyScalar(r).add(c);p.setXYZ(k,v.x,v.y,v.z);}}
       return g;};
     const hals=new THREE.CatmullRomCurve3([V(.1,1.17,.5),V(-.06,1.3,.6),V(-.28,1.27,.68),V(-.42,1.08,.73),V(-.46,.9,.75)]);
     saxG.add(new THREE.Mesh(kon(hals,40,14,u=>.034+.03*u),mMess));
     const kropp=new THREE.CatmullRomCurve3([V(-.46,.9,.75),V(-.48,0,.75),V(-.5,-.95,.75),V(-.46,-1.3,.75),V(-.3,-1.47,.75),V(-.1,-1.42,.76),V(.01,-1.2,.77),V(.08,-.9,.79),V(.15,-.6,.84)]);
     saxG.add(new THREE.Mesh(kon(kropp,120,18,u=>.064+.13*Math.pow(u,1.5)),mMess));
     // Trakta: utsvinga, retta etter enden av kroppen, med ein rulla kant
     {const ende=kropp.getPointAt(1),tan=kropp.getTangentAt(1),PR=[[.194,0],[.205,.08],[.228,.16],[.27,.24],[.33,.3],[.4,.335],[.44,.345]];
      const prof=PR.map(([x,y])=>new THREE.Vector2(x,y)),g=new THREE.LatheGeometry(prof,40);
      const tg=new THREE.Group();tg.position.copy(ende);tg.quaternion.setFromUnitVectors(V(0,1,0),tan);saxG.add(tg);
      tg.add(new THREE.Mesh(g,mMess));tg.add(new THREE.Mesh(g,mInni));
      const kant=new THREE.Mesh(new THREE.TorusGeometry(.44,.022,8,48),mMess);kant.rotation.x=Math.PI/2;kant.position.y=.345;tg.add(kant);
      saxMunn.copy(ende).addScaledVector(tan,.36);}
     // Munnstykke og ligatur
     {const g=new THREE.Group();g.position.set(.1,1.17,.5);g.quaternion.setFromUnitVectors(V(0,1,0),hals.getTangentAt(0).negate());saxG.add(g);
      const mu=new THREE.Mesh(new THREE.CylinderGeometry(.026,.04,.24,14),mSvart);mu.position.y=.12;g.add(mu);
      const lig=new THREE.Mesh(new THREE.CylinderGeometry(.044,.044,.05,14,1,true),mSolv);lig.position.y=.07;g.add(lig);}
     // Klaffar: kopp i messing og perlemorknapp framme, festa til ei stong langs sida
     const kopp=new THREE.CylinderGeometry(.072,.072,.03,20),perle=new THREE.CylinderGeometry(.042,.046,.03,18);
     [.06,.13,.2,.3,.37,.44].forEach(u=>{const p=kropp.getPointAt(u),r=.064+.13*Math.pow(u,1.5);
       const k=new THREE.Mesh(kopp,mMess);k.rotation.x=Math.PI/2;k.position.set(p.x+.02,p.y,p.z+r+.02);saxG.add(k);
       const pe=new THREE.Mesh(perle,mPerle);pe.rotation.x=Math.PI/2;pe.position.set(p.x+.02,p.y,p.z+r+.045);saxG.add(pe);});
     {const a=kropp.getPointAt(.03),b=kropp.getPointAt(.5),l=a.distanceTo(b);
      const st=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,l,8),mMess);
      st.position.copy(a).lerp(b,.5);st.position.x+=.1;st.position.z+=.07;st.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());saxG.add(st);}
     // Store klaffar på sida nede ved bogen
     [.6,.68].forEach(u=>{const p=kropp.getPointAt(u),r=.064+.13*Math.pow(u,1.5);
       const k=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.03,22),mMess);k.rotation.z=Math.PI/2;k.position.set(p.x-r-.01,p.y,p.z+.03);saxG.add(k);});
     // Oktavklaff: ein liten boge over halsen
     {const ok=new THREE.Mesh(new THREE.TorusGeometry(.09,.012,6,16,Math.PI),mMess);ok.position.copy(hals.getPointAt(.45));ok.position.z+=.03;ok.rotation.z=-.4;saxG.add(ok);}}
    // Notar som stig opp frå trakta
    const noteC=document.createElement('canvas');noteC.width=64;noteC.height=96;
    {const g=noteC.getContext('2d');g.fillStyle='#32595e';
     g.save();g.translate(20,78);g.rotate(-.35);g.beginPath();g.ellipse(0,0,15,10,0,0,7);g.fill();g.restore();
     g.fillRect(31,10,5,68);g.beginPath();g.moveTo(36,10);g.quadraticCurveTo(58,26,50,50);g.quadraticCurveTo(52,32,36,28);g.fill();}
    const noteGeo=new THREE.PlaneGeometry(.5,.75),noteT=tekstur(noteC);
    const notar=Array.from({length:6},()=>{const m=new THREE.Mesh(noteGeo,new THREE.MeshBasicMaterial({map:noteT,transparent:true,depthWrite:false}));
      m.visible=false;scene.add(m);return {m,t0:-1};});

    // Fotball: kvit med svarte felt (femkantar som rundingar på eit ekvirektangulært kart)
    const ballC=document.createElement('canvas');ballC.width=512;ballC.height=256;
    {const g=ballC.getContext('2d');g.fillStyle='#f6f6f4';g.fillRect(0,0,512,256);g.fillStyle='#1b1b1b';
     g.fillRect(0,0,512,22);g.fillRect(0,234,512,22);
     [[26.6,0],[-26.6,36]].forEach(([lat,l0])=>{for(let i=0;i<6;i++){const lon=l0+i*72;
       const x=lon/360*512,y=(90-lat)/180*256;
       [x,x-512,x+512].forEach(xx=>{g.beginPath();g.ellipse(xx,y,30/Math.cos(lat*Math.PI/180),28,0,0,7);g.fill();});}});}
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.36,28,20),new THREE.MeshStandardMaterial({map:tekstur(ballC),roughness:.45,envMapIntensity:.4}));
    ball.visible=false;scene.add(ball);
    const BR=.36,BALL_FOT=FOT.y+.62,BALL_HODE=HJ.y+.9+BR;
    // Triksinga: kva tid ballen er borti foten eller hovudet
    const TRIKS=[[.75,'f'],[1.35,'f'],[1.95,'f'],[2.85,'h'],[3.55,'h'],[4.45,'f'],[5.05,'f'],[5.6,'f'],[6.2,'f']];
    const ballPos=(kind)=>kind==='h'?new THREE.Vector3(HJ.x-.05,BALL_HODE,.25):new THREE.Vector3(FOT.x-.35,BALL_FOT,1.05);

    // ── Rørsle ──
    const fj=(x,k,d)=>({x,v:0,m:x,k,d});
    const steg=(f,dt)=>{f.v+=(f.k*(f.m-f.x)-f.d*f.v)*dt;f.x+=f.v*dt;};
    const F={yaw:fj(0,60,11),lean:fj(0,80,9),sq:fj(1,260,9),arm:fj(0,90,11),kort:fj(0,160,10),
      bryn:fj(0,140,12),skeiv:fj(0,120,12),auge:fj(1,220,18),eu:fj(0,160,16),ev:fj(0,160,16),tilt:fj(0,90,7),vipp:fj(0,110,9),
      bukk:fj(0,90,10),raud:fj(0,60,12)};
    const glatt=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
    const hald=(e,a,b,r)=>glatt(a,a+r,e)*(1-glatt(b-r,b,e));
    const hopp=(e,a,b,h)=>{if(e<a||e>b)return 0;const p=(e-a)/(b-a);return 4*h*p*(1-p);};
    let T=0,akt=null,sistAkt='',nesteRo=6+Math.random()*6,nesteBlunk=2,blunkT=-1;
    let hover=false,hoverT=0,hoverBort=0,hoverSteg=0,sistHoverAkt=-9,laastTil=0,laasU=0,laasV=0,mus={x:-1e4,y:-1e4},rekt=null;   // rekt: lerretet på skjermen, lese ved musrørsle
    window.addEventListener('resize',()=>{rekt=null;});
    let hY=0,hV=0,kroppY=0,kroppV=0,konfLaus=false,landa=[];
    // Handlingane: e = sekund sidan start, o = måla for denne ramma.
    // Returnerer false når dei er ferdige. `landa` gir eitt støyt per landing.
    const lande=(e,t,id,k)=>{if(e>=t&&!landa.includes(id)){landa.push(id);F.sq.v-=k;}};
    const AKT={
      inn(e,o){
        const p=Math.min(1,e/.55);
        o.y=e<.55?5.5*(1-p*p):0;o.spin=-Math.PI*2*(1-p)*(1-p);o.hjelmLyft=e<.7?.7:0;
        lande(e,.55,'a',6);
        if(e>.75&&e<.95)o.auge=.1;
        o.bryn+=.12*hald(e,.9,1.6,.15);o.arm-=.5*hald(e,.9,1.6,.2);o.kort+=.35*Math.sin(e*16)*hald(e,1,1.55,.1);
        return e<1.7;},
      vift(e,o){
        lande(e,0,'a',-2.5);
        o.arm-=1*hald(e,0,1.4,.2);o.kort+=.5*Math.sin((e-.15)*15)*hald(e,.15,1.25,.1);
        o.bryn+=.1*hald(e,0,1.4,.2);o.lean+=.07*hald(e,0,1.4,.25);
        return e<1.45;},
      feir(e,o){
        if(e<.2){o.sq=.8;o.y=-.05;}
        o.y+=hopp(e,.2,.95,2.1)+hopp(e,1.15,1.65,1.1);
        if(e>.2&&e<.95)o.flip=Math.PI*2*glatt(.25,.9,e);   // hjulslag mot venstre
        if(e>1.15&&e<1.65)o.spin=Math.PI*2*glatt(1.15,1.65,e);
        if(e>.5&&!konfLaus){konfLaus=true;konfetti();}
        lande(e,.95,'a',6);lande(e,1.65,'b',4.5);
        if(e>.95&&e<1.15)o.sq=.88;
        o.arm-=1.15*hald(e,.15,2.7,.25);o.kort+=.4*Math.sin(e*13)*hald(e,1.7,2.7,.15);
        o.auge=.5;o.bryn+=.14;o.hjelmLyft=.5*hald(e,.45,.9,.15);
        return e<2.8;},
      hatt(e,o){   // tek hjelmen av og på att, som ei helsing
        o.hjelmLyft=.95*hald(e,.1,1.3,.3);o.hjelmSnu=.3*hald(e,.1,1.3,.3);o.hjelmVipp=.75*hald(e,.25,1.2,.3);
        o.bryn+=.1*hald(e,.1,1.3,.3);o.ev=.35*hald(e,.1,1.3,.3);o.lean-=.05*hald(e,.1,1.3,.3);
        return e<1.6;},
      sjaa(e,o){   // ser seg rundt
        const u=-.62*hald(e,.1,1,.2)+.62*hald(e,1,1.9,.2);o.eu=u;o.ev=.05;o.yaw+=u*.6;
        return e<2.1;},
      kort(e,o){   // beundrar energimerket
        const h=hald(e,.1,2,.35);o.eu=-.7*h;o.ev=-.35*h;o.yaw-=.35*h;o.arm-=.45*h;o.kort+=.18*h+.06*Math.sin(e*6)*h;o.bryn+=.08*h;
        return e<2.2;},
      snurr(e,o){
        o.y+=hopp(e,.12,.8,.75);o.spin=Math.PI*2*glatt(.12,.8,e);lande(e,.8,'a',3.5);
        if(e<.12)o.sq=.9;
        return e<1.2;},
      strekk(e,o){ // strekk og gjesp
        const h=hald(e,.1,1.4,.4);o.sq=1+.13*h;o.arm-=.6*h;o.auge=1-.85*h;o.bryn+=.1*h;
        return e<1.7;},
      nikk(e,o){   // eit lite bukk, når noko gjekk bra
        o.bukk=.2*hald(e,.05,.45,.12)+.14*hald(e,.5,.9,.12);o.auge=.8;o.bryn+=.08*hald(e,0,1,.2);
        return e<1.2;},
      dans(e,o){   // ein liten dans på staden
        const h=hald(e,.1,3.1,.35),b=e*7.5;
        o.lean+=.16*Math.sin(b)*h;o.y+=.28*Math.abs(Math.sin(b))*h;o.yaw+=.35*Math.sin(b/2)*h;
        o.arm-=(.55+.35*Math.sin(b*2))*h;o.kort+=.3*Math.sin(b*2)*h;o.sq+=.05*Math.sin(b*2)*h;
        o.auge=1-.25*h;o.bryn+=.1*h;
        return e<3.3;},
      kortsnu(e,o){   // kastar energimerket opp, det snurrar, og han fangar det
        o.arm-=.5*hald(e,0,1.3,.15);o.ev=.5*hald(e,.15,1.1,.1);
        o.kortY=hopp(e,.25,1.05,2.4);o.kortSnu=Math.PI*4*glatt(.25,1.05,e);
        if(e<.25)o.sq=.94;lande(e,1.05,'a',2.5);
        if(e>1.05&&e<1.6){o.bryn+=.12;o.auge=1.15;}
        return e<1.7;},
      hikk(e,o){   // hikke, tre gonger
        for(let i=0;i<3;i++){const t=.2+i*.6;o.y+=hopp(e,t,t+.2,.32);if(e>t&&e<t+.25){o.auge=1.25;o.bryn+=.14;}lande(e,t+.2,'h'+i,2);}
        return e<2;},
      kikk(e,o){   // lener seg ut og kikkar på teikninga
        const h=hald(e,.15,2.2,.35);o.lean-=.2*h;o.eu=.6*h;o.ev=.15*h;o.yaw+=.35*h;o.skeiv=.1*h;o.bukk=.06*h;
        return e<2.5;},
      sov(e,o){   // døser av når ingen gjer noko, og skvett opp att
        const h=hald(e,.2,3.6,.7);
        if(e<3.6){o.auge=1-.94*h;o.bukk=.16*h;o.lean+=.05*h;o.sq+=.03*Math.sin(e*2.4)*h;}
        else{o.y+=hopp(e,3.6,3.95,.6);o.auge=1.3;o.bryn+=.16;o.hjelmLyft=.5*hald(e,3.6,3.9,.05);}
        lande(e,3.95,'a',3);
        return e<4.5;},
      // ── Svar på musa og klikk ──
      skvett(e,o){   // skvett når peikaren kjem brått på
        o.y+=hopp(e,0,.35,.55);lande(e,.35,'a',3);
        o.auge=1+.4*hald(e,0,.7,.06);o.bryn+=.2*hald(e,0,.75,.08);o.hjelmLyft=.6*hald(e,0,.3,.05);
        o.arm-=.6*hald(e,0,.6,.1);
        return e<.95;},
      blunk1(e,o){   // blunkar med eitt auge
        const h=hald(e,.1,.75,.12);o.augeL=1-.93*h;o.skeiv=-.08*h;o.bryn+=.05*h;o.lean-=.04*h;o.yaw+=.15*h;
        return e<1;},
      kile(e,o){   // kilen: fniser og vrir seg når musa vert verande
        const h=hald(e,.05,1.6,.15);
        o.lean+=.09*Math.sin(e*31)*h;o.sq+=.05*Math.sin(e*23)*h;o.y+=.08*Math.abs(Math.sin(e*11))*h;
        o.auge=1-.7*h;o.bryn+=.12*h;o.raud=.8*h;o.arm-=.35*h;o.kort+=.15*Math.sin(e*19)*h;
        return e<1.8;},
      blyg(e,o){   // blyg: snur seg bort og gøymer seg bak energimerket
        const h=hald(e,.1,2.4,.35);
        o.yaw-=.6*h;o.eu=-.5*h;o.ev=-.35*h;o.arm-=.75*h;o.kort+=.25*h;o.raud=h;o.bukk=.08*h;o.sq-=.04*h;
        if(e>1.4&&e<1.9){o.eu=.45;o.ev=.1;}   // kikkar fram ein augneblink
        return e<2.6;},
      salutt(e,o){   // helsar med energimerket
        const h=hald(e,.1,1.3,.15);lande(e,.1,'a',-2);
        o.arm-=.95*h;o.kort+=.55*h+.12*Math.sin(e*9)*hald(e,.4,1.1,.1);o.sq+=.04*h;o.bryn-=.03*h;o.auge=1-.1*h;
        return e<1.5;},
      djupbukk(e,o){   // eit djupt bukk, hjelmen vippar med
        const h=hald(e,.1,1.5,.3);o.bukk=.5*h;o.hjelmVipp=.5*h;o.arm+=.3*h;o.auge=1-.5*h;
        return e<1.7;},
      svimmel(e,o){   // for mange klikk: snurrar, og så går alt rundt
        o.spin=Math.PI*4*glatt(0,.6,e);
        const h=hald(e,.6,2.7,.3),a=e*8;
        o.eu=.5*Math.cos(a)*h;o.ev=.45*Math.sin(a)*h;
        o.lean+=.13*Math.sin(e*4)*h;o.bukk+=.08*Math.cos(e*4)*h;o.hjelmSnu=.35*h;o.auge=1-.15*h;o.skeiv=.12*h;
        if(e>2.35)o.sq=1-.06*hald(e,2.35,2.9,.1);
        return e<2.9;},
      // ── Leik når det er stille lenge ──
      rubik(e,o){   // løyser rubikskuben, lag for lag, og jublar når han er ferdig
        const D=.55,t0=.5,slutt=t0+rubTrekk.length*D;
        o.prop='rubik';o.arm-=.55;o.kort-=.15;o.eu=-.55;o.ev=-.42;o.bukk=.08;o.yaw-=.15;o.bryn+=.04;o.skeiv=.06*Math.sin(e*1.3);
        const i=Math.floor((e-t0)/D);
        while(rubGjort<Math.min(i,rubTrekk.length)){rubVri(rubTrekk[rubGjort],1);rubGjort++;}
        if(e>t0&&i<rubTrekk.length){const p=glatt(0,.75,(e-t0-i*D)/D);rubVri(rubTrekk[i],Math.min(.999,p));o.kort+=.06*Math.sin(e*20);}
        if(e>slutt){   // ferdig: held kuben opp og hoppar
          const h=hald(e,slutt,slutt+1.5,.2);o.arm-=.75*h;o.eu=-.3*h;o.ev=.2*h;o.auge=1-.6*h;o.bryn+=.14*h;o.bukk=0;
          o.y+=hopp(e,slutt+.15,slutt+.6,.6);lande(e,slutt+.6,'a',3.5);}
        return e<slutt+1.7;},
      sax(e,o){   // saksofonsolo med augo att, svaiar i takt
        const h=hald(e,.3,6.2,.4),b=e*4.2;o.prop='sax';
        o.arm-=.6*h;o.lean+=.09*Math.sin(b/2)*h;o.bukk=(.06+.07*Math.sin(b))*h;o.yaw+=.12*Math.sin(b/2)*h;
        o.auge=1-.85*h;o.bryn+=(.1+.06*Math.sin(b))*h;o.sq+=.035*Math.sin(b)*h;
        saxG.rotation.z=.06*Math.sin(b/2+.6)*h;   // trakta svingar litt etter kroppen
        if(e>4.3&&e<5.4){o.lean-=.18*hald(e,4.3,5.4,.2);o.bukk-=.18*hald(e,4.3,5.4,.2);}   // det høge tonen, bakover
        notar.forEach((n,i)=>{const s=.7+i*.82;if(e>=s&&n.t0<s){n.t0=s;n.alder=0;n.dx=.7+Math.random()*.6;n.m.visible=true;
          saxG.updateMatrixWorld();n.m.position.copy(saxG.localToWorld(saxMunn.clone()));}});
        return e<6.6;},
      fotball(e,o){   // triksar med fotballen: fot, fot, hovud … og eit langt spark til slutt
        o.prop='ball';
        const tider=TRIKS,sisteT=tider[tider.length-1][0];
        let pos;
        if(e<tider[0][0]){   // ballen dett inn frå venstre
          const p=e/tider[0][0],a=new THREE.Vector3(FOT.x-3.6,6.4,.9),b=ballPos('f');
          pos=a.lerp(b,p);pos.y=6.4+(BALL_FOT-6.4)*p*p;
        }else if(e<sisteT){
          let i=0;while(e>=tider[i+1][0])i++;
          const [ta,ka]=tider[i],[tb,kb]=tider[i+1],d=tb-ta,p=(e-ta)/d;
          const a=ballPos(ka),b=ballPos(kb);pos=a.clone().lerp(b,p);pos.y+=4*(14*d*d/8)*p*(1-p);
        }else{   // det store sparket, opp og ut til høgre
          const p=(e-sisteT)/1.4,a=ballPos('f');pos=new THREE.Vector3(a.x+6*p,a.y+9*p-6*p*p,a.z-.4*p);
        }
        ball.position.copy(pos);ball.rotation.z-=.16;ball.rotation.x+=.05;
        tider.forEach(([t,k],j)=>{
          if(k==='f'){o.y+=hopp(e,t-.1,t+.12,.14);lande(e,t+.12,'f'+j,2);o.lean+=.07*hald(e,t-.15,t+.1,.05);}
          else{o.bukk-=.14*hald(e,t-.12,t+.12,.05);if(e>=t&&!landa.includes('h'+j)){landa.push('h'+j);hV+=3;}}
        });
        if(e>sisteT-.15&&e<sisteT+.3){o.lean+=.15;o.y+=.1;}
        // Auga følgjer ballen
        const hx=HJ.x,hy=HJ.y-.85;o.eu=Math.max(-.6,Math.min(.6,(pos.x-hx)/2.5));o.ev=Math.max(-.55,Math.min(.55,(pos.y-hy)/3));
        if(e>sisteT+.8){o.auge=1-.5*hald(e,sisteT+.8,sisteT+1.6,.15);o.bryn+=.12;}
        return e<sisteT+1.7;},
    };
    // Kalla når ei handling startar: set rekvisitten i startstilling
    const INIT={
      rubik:rubStokk,
      sax(){notar.forEach(n=>{n.t0=-1;n.m.visible=false;});},
    };
    const RO_AKT=['hatt','sjaa','kort','snurr','strekk','dans','kortsnu','hikk','kikk'];
    const HOVER_AKT=['skvett','blunk1','vift','skvett','nikk'];
    const LEIK_AKT=['rubik','sax','fotball'];
    function start(n){if(RO||!AKT[n])return;akt={n,t:0};landa=[];konfLaus=false;sistAkt=n;if(INIT[n])INIT[n]();}

    function ramme(dt){
      T+=dt;
      const prat=rot.classList.contains('prat'),tenk=rot.classList.contains('tenk');
      const o={yaw:0,lean:0,sq:1,y:0,arm:0,kort:0,bryn:0,skeiv:0,auge:1,eu:0,ev:0,hjelmLyft:0,hjelmSnu:0,hjelmVipp:0,spin:0,flip:0,bukk:0,kortY:0,kortSnu:0,augeL:1,augeR:1,raud:0,prop:null};
      // Mus: auga følgjer peikaren, kroppen snur seg litt etter
      const hode=augeL.g.getWorldPosition(new THREE.Vector3()).project(cam),r=rekt||(rekt=cv.getBoundingClientRect());
      const hx=r.left+(hode.x+1)/2*r.width,hy=r.top+(1-hode.y)/2*r.height;
      const dx=mus.x-hx,dy=mus.y-hy,d=Math.hypot(dx,dy)||1,kk=Math.min(1,d/160);
      if(performance.now()<laastTil){o.eu=laasU;o.ev=laasV;}
      else{o.eu=dx/d*.52*kk;o.ev=-dy/d*.45*kk;}
      o.yaw=Math.max(-1,Math.min(1,dx/520))*.42;
      if(!RO){
        o.sq+=Math.sin(T*2.1)*.014;o.lean+=Math.sin(T*.9)*.035;o.y+=Math.sin(T*1.8)*.035;
        if(prat){o.yaw+=.32;o.bryn+=.07;o.lean+=Math.sin(T*2.6)*.03;o.sq+=Math.sin(T*8.5)*.012;}
        if(tenk){o.eu=-.42;o.ev=.5;o.bryn+=.03;o.skeiv=.14;o.lean+=Math.sin(T*1.5)*.06;o.yaw-=.2;}
        if(hover){o.auge=1.1;o.bryn+=.08;o.lean-=.04;}
        // Står musa på han ei stund, vert han kilen — og etter lenge blyg
        // (han rører seg sjølv, så eit kort augneblink utanfor tel ikkje som at musa gjekk)
        if(hover&&!prat){hoverT+=dt;hoverBort=0;
          if(!akt&&hoverSteg===0&&hoverT>2.2){hoverSteg=1;start('kile');}
          else if(!akt&&hoverSteg===1&&hoverT>7){hoverSteg=2;start('blyg');}}
        else if((hoverBort+=dt)>.8||prat){hoverT=0;hoverSteg=0;}
        if(akt){akt.t+=dt;if(!AKT[akt.n](akt.t,o))akt=null;}
        else if(!prat&&!tenk&&!hover&&T>nesteRo){
          // Har ingen gjort noko på eit minutt, døser han av (éin gong om gongen)
          // Etter 20 s utan noko finn han oftast fram noko å leike med
          const st=stille?stille():0,doser=st>60000&&sistAkt!=='sov',leik=!doser&&st>20000&&Math.random()<.7;
          const val=(leik?LEIK_AKT:RO_AKT).filter(n=>n!==sistAkt);start(doser?'sov':val[Math.floor(Math.random()*val.length)]);
          nesteRo=T+(leik?12:9)+Math.random()*9;}
        // Blunk, av og til to gonger
        if(T>nesteBlunk){blunkT=0;nesteBlunk=T+2.2+Math.random()*4+(Math.random()<.2?-1.95:0);}
      }
      let blunk=1;if(blunkT>=0){blunkT+=dt;blunk=blunkT<.14?1-Math.sin(Math.PI*blunkT/.14)*.95:1;if(blunkT>=.14)blunkT=-1;}
      F.yaw.m=o.yaw;F.lean.m=o.lean;F.sq.m=o.sq;F.arm.m=o.arm;F.kort.m=o.kort;F.bryn.m=o.bryn;F.skeiv.m=o.skeiv;
      F.auge.m=o.auge;F.eu.m=o.eu;F.ev.m=o.ev;F.vipp.m=o.hjelmVipp;F.bukk.m=o.bukk;F.raud.m=o.raud;
      for(const k in F)steg(F[k],dt);
      // Kroppen: y direkte (hopp er ballistiske), alt anna gjennom fjørene
      const nyY=o.y,nyV=(nyY-kroppY)/Math.max(dt,1e-3),akk=Math.max(-250,Math.min(250,(nyV-kroppV)/Math.max(dt,1e-3)));
      kroppY=nyY;kroppV=nyV;
      const c=2.6;   // hjulslaget går rundt midten av kroppen, ikkje rundt føtene
      const px=-.9,cf=Math.cos(o.flip),sf=Math.sin(o.flip);   // midt mellom kortet og binderset
      rotG.position.set(FOT.x+px-(px*cf-c*sf),FOT.y+kroppY+c-(px*sf+c*cf),0);
      rotG.rotation.set(0,F.yaw.x+o.spin,o.flip,'ZYX');
      hallG.rotation.set(F.bukk.x,0,F.lean.x);
      const sq=Math.max(.6,F.sq.x);sqG.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));
      skulder.rotation.z=F.arm.x;handG.rotation.z=F.kort.x;
      kort.position.y=-.46+o.kortY;kort.rotation.y=o.kortSnu;
      // Leiketøyet: berre det handlinga brukar er synleg, og kortet vert lagt bort når handa trengst
      rubikG.visible=o.prop==='rubik';saxG.visible=o.prop==='sax';ball.visible=o.prop==='ball';
      kort.visible=o.prop!=='rubik'&&o.prop!=='sax';
      let notarAktiv=false;
      notar.forEach(n=>{if(!n.m.visible)return;n.alder+=dt;if(n.alder>2.4){n.m.visible=false;return;}notarAktiv=true;
        n.m.position.y+=dt*1.15;n.m.position.x+=dt*n.dx+Math.cos(n.alder*5)*dt*.5;n.m.rotation.z=.3*Math.sin(n.alder*4);
        n.m.material.opacity=Math.min(1,n.alder/.2,(2.4-n.alder)/.7);});
      const ay=Math.max(.04,F.auge.x*blunk);
      augeL.g.scale.set(.34,.42*Math.max(.04,ay*o.augeL),.22);augeR.g.scale.set(.34,.42*Math.max(.04,ay*o.augeR),.22);
      mKinn.opacity=Math.max(0,Math.min(.7,F.raud.x*.7));kinn.forEach(m=>{m.visible=mKinn.opacity>.01;});
      const eu=Math.max(-.6,Math.min(.6,F.eu.x)),ev=Math.max(-.55,Math.min(.55,F.ev.x));
      settPupil(augeL,eu+.04,ev);settPupil(augeR,eu-.04,ev);
      brynL.g.position.y=brynL.y+F.bryn.x+F.skeiv.x;brynR.g.position.y=brynR.y+F.bryn.x-F.skeiv.x*.4;
      brynL.g.rotation.z=-F.skeiv.x*1.2;brynR.g.rotation.z=F.bryn.x*.6;
      // Hjelmen: laus på hovudet. Kroppen si akselerasjon gir ei skinkraft,
      // ei fjør dreg han mot hovudet (eller dit handlinga løftar han), og han
      // kan aldri gå gjennom hovudet — då sprett han litt.
      const hodeY=(HJ.y-FOT.y)*sq;
      hV+=(-akk*.9+190*(o.hjelmLyft-hY)-13*hV)*dt;hY+=hV*dt;
      if(hY<0){hY=0;if(hV<0)hV=-hV*.28;}
      hjelmPiv.position.set((HJ.x-FOT.x)/Math.sqrt(sq),hodeY+hY,0);
      F.tilt.m=o.hjelmSnu-F.lean.v*.12+hY*.25;
      hjelm.rotation.set(F.vipp.x,0,.17+F.tilt.x);
      // Tenkjeprikkar
      if(trondG.visible)frynser.forEach((f,i)=>{
        f.rotation.z=Math.sin(T*2.6+i*.7)*.06-F.lean.v*.5-F.yaw.v*.15;
        f.rotation.x=Math.max(-.7,Math.min(.7,kroppV*.06));});
      tenkG.visible=tenk&&!RO;
      if(tenkG.visible){tenkG.position.set(HJ.x-FOT.x,hodeY+hY+1.35,0);
        prikkar.forEach((m,i)=>{const a=T*2.4+i*2.094;m.position.set(Math.cos(a)*.62,Math.sin(T*3+i)*.08,Math.sin(a)*.62);m.scale.setScalar(.75+.35*Math.sin(T*4+i*1.3));});}
      // Skugga krympar og blekner når han er i lufta
      const lyft=Math.max(0,rotG.position.y-FOT.y),sk=1/(1+lyft*.35);
      skugge.scale.set(4.6*sk,1.3*sk,1);skugge.material.opacity=sk;
      // Konfetti
      let konfAktiv=false;
      konf.forEach(k=>{if(!k.m.visible)return;konfAktiv=true;k.liv-=dt;
        if(k.liv<=0){k.m.visible=false;return;}
        k.v.y-=14*dt;k.v.multiplyScalar(1-1.6*dt);k.m.position.addScaledVector(k.v,dt);
        k.m.rotation.x+=k.rv.x*dt;k.m.rotation.y+=k.rv.y*dt;k.m.rotation.z+=k.rv.z*dt;
        k.m.material.opacity=Math.min(1,k.liv/.5);});
      return !!(akt||hover||prat||tenk||konfAktiv||notarAktiv||blunkT>=0||Math.abs(F.sq.v)+Math.abs(F.yaw.v)+Math.abs(F.eu.v)+Math.abs(F.ev.v)+Math.abs(hV)>.01);
    }

    // Stråletest: lerretet tek berre imot musa når peikaren står på figuren
    const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
    let rafM=0,inni=false;
    function treffTest(){
      const r=rekt=cv.getBoundingClientRect();let paa=false;
      inni=!!r.width&&mus.x>=r.left&&mus.x<=r.right&&mus.y>=r.top&&mus.y<=r.bottom;
      if(inni){
        ndc.set((mus.x-r.left)/r.width*2-1,-((mus.y-r.top)/r.height)*2+1);
        ray.setFromCamera(ndc,cam);paa=ray.intersectObjects(trondG.visible?treff.concat(treffTrond):treff,false).length>0;
      }
      if(paa!==hover){hover=paa;cv.style.pointerEvents=paa?'auto':'none';
        if(paa&&!akt&&!RO){F.sq.v+=2.2;
          // Ein liten reaksjon når musa kjem på — ikkje kvar gong, og ikkje tett i tett
          if(T-sistHoverAkt>4&&Math.random()<.65){sistHoverAkt=T;start(HOVER_AKT[Math.floor(Math.random()*HOVER_AKT.length)]);}}}
    }
    window.addEventListener('mousemove',e=>{
      mus.x=e.clientX;mus.y=e.clientY;
      if(rafM||rot.classList.contains('av'))return;
      rafM=requestAnimationFrame(()=>{rafM=0;treffTest();});
    },{passive:true});

    let sist=performance.now(),rolegRamme=0,daud=false,n=0;
    cv.addEventListener('webglcontextlost',e=>{e.preventDefault();daud=true;rot.classList.remove('k3d');});
    function loop(no){
      if(daud)return;
      requestAnimationFrame(loop);
      if(rot.classList.contains('av'))return;
      const dt=Math.min(.05,(no-sist)/1000);
      // I ro: 30 bilete i sekundet er nok til pust og svai
      if(!akt&&!hover&&!rot.classList.contains('prat')&&!rot.classList.contains('tenk')&&(no-sist)<30)return;
      sist=no;
      const rorer=ramme(dt);
      // Figuren kan flytte seg under ein musepeikar som står i ro
      if(inni&&++n%8===0)treffTest();
      if(RO&&!rorer&&rolegRamme++>2)return;
      if(rorer)rolegRamme=0;
      R.render(scene,cam);
    }
    requestAnimationFrame(loop);

    return {
      el:cv,
      midt:[.55,.62],   // kroppen sin plass i lerretet, til dekt()
      // Inngangen og feiringa vert ikkje avbrotne av noko mindre
      spel(k){if(akt&&(akt.n==='inn'||akt.n==='feir')&&k!=='feir')return;start(k);},
      trond(paa){trondG.visible=!!paa;},
      sjaa(dx,dy,ms){laastTil=performance.now()+ms;laasU=dx*.5;laasV=-dy*.45;},
    };
  }
})();

// Siste linja i hovudskriptet. Feilar noko ved lasting (t.d. ein konstant
// som vert lesen før han finst), kjem vi aldri hit — testane sjekkar merket.
window.__sxiKlar=true;
