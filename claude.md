# Entro — Prosjektkontekst for ny Claude-sesjon
**Programnamn:** SXI-generatoren  
**Firma:** Entro AS  
**Versjon:** 4.4.1 | Single-file HTML applikasjon

---

## Prosjektoversikt

SXI-generatoren er eit nettbasert oppmålingsverktøy frå Entro AS for energimerking av norske bygg. Brukaren lastar opp ei planteikning, teiknar soner som polygon, og eksporterer ein SXI-fil til SIMIEN (norsk energiberegningsprogram).

**Arkitektur:** Éi enkelt HTML-fil (`index.html`, ~9800 linjer) med all kode inline. Ingen bygg-steg. Eksterne avhengigheiter frå CDN: Three.js r128 (3D), pdf.js 3.11 (PDF), Mapbox GL (kart, inlina i fila).

Fila har **to** inline `<script>`-blokker — syntaks-sjekken må sjekke begge.

---

## Utviklingsworkflow

**Arbeid direkte i denne mappa.** Ingen kopiering til andre stader (den gamle `/home/claude/`-flyten gjeld ikkje lenger).

### Greiner

- `dev` — alt arbeid skjer her
- `main` — publiserer til GitHub Pages automatisk

Repo: `entroknut/energimerking-2` (jobbkontoen, knut.nedkvitne@entro.no)  
Live: https://entroknut.github.io/energimerking-2/

**Alt arbeid skjer her.** Den gamle privatkontoen `nedkvitneknut-sketch` har eit
frose snapshot på commit `bb76381` (19. august 2026) som framleis ligg live på
si eiga Pages-adresse. Det skal ikkje oppdaterast: ikkje push dit, og ikkje bruk
den adressa til verifisering — den blir gradvis utdatert.

### Syntaks-sjekk etter kvar endring

```bash
python -c "
import re, subprocess, tempfile, os
with open('index.html', encoding='utf-8') as f: html = f.read()
blocks = re.findall(r'<script>((?:(?!</script>)[\s\S])*)</script>', html)
for i, js in enumerate(blocks):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js); fname = f.name
    r = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
    print(f'block {i}:', 'OK' if r.returncode==0 else r.stderr[:400])
    os.unlink(fname)
"
```

### Testing i nettlesar

Start lokal server og test mot han — ikkje `file://` (localStorage kan vere sperra):

```bash
python -m http.server 8742
```

`.claude/launch.json` finst, så Claude Code kan starte forhandsvisninga direkte.

### Publisering

Brukaren seier eksplisitt frå når noko skal publiserast. Då: bump versjonsnummer i `index.html` (søk `v3.`), commit på `dev`, merge til `main`, push.

**Verifiser alltid live-adressa etterpå** — ikkje meld «publisert» berre fordi pushen gjekk gjennom. GitHub Pages-bygget kan feile (det skjedde 6. august: deploy-steget timeout-a etter 10 min, to gonger på rad, og trong eit tredje forsøk).

Grep-mønsteret må **ankrast på `</span>`**. To feller, begge observerte:

- Ein hardkoda `v2\.`-prefiks gir tom output etter ein major-bump — det ser ut som
  ein feila publisering sjølv når alt gjekk bra.
- Eit ope `v[0-9]+\.[0-9]+\.[0-9]+` treffer `draco_decoder_gltf_v1.5.6.wasm` i
  Mapbox GL-blokka på line 46, som ligg **før** appversjonen i fila. Du får
  `v1.5.6` og trur publiseringa feila.

Appversjonen står som `>v3.4.0</span>` (line 630), så ankeret er det som gjer
kommandoen påliteleg:

```bash
curl -s "https://entroknut.github.io/energimerking-2/index.html?cb=$(date +%s)" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+</span>' | head -1 | sed 's|</span>||'
```

Byggestatus (anonymt API, `gh` er ikkje innlogga):
```bash
curl -s "https://api.github.com/repos/entroknut/energimerking-2/actions/runs?per_page=3"
```

---

## Datamodell

```javascript
floors = [{
  id, name,
  bgImg,          // Image/ImageBitmap (ikkje i JSON — lagrast som base64)
  bgImgData,      // base64 for lagring
  pdfDoc, pdfPage, totalPages,
  mmPerImgPx,     // kalibrering per etasje (null = brukar global)
  ownCal,         // boolean — eigen kalibrering i staden for global
  defaultHoyde,   // etasjehøgde i meter (styrar 3D-stakkinga)
  sc, offX, offY, // zoom/pan for canvas
  floorDxImg,     // ghost-forskyving i BILETpikslar (ikkje skjermpikslar!)
  floorDyImg,
  paperWMm,       // papirformat, for målestokk-kalibrering
  paperHMm,
  paperSource,    // 'pdf' | 'dpi' | null
  measurements,   // [{p1:{x,y}, p2:{x,y}}] — kontrollmål i biletkoordinatar.
                  // measureResults er eit ALIAS til denne (som zones) — aldri
                  // tildel measureResults=[], det bryt aliaset. Lengda reknast
                  // på nytt ved teikning, så omkalibrering slår gjennom.
  zones: [...]
}]

zones = [{
  name,
  pts: [{x, y}],  // biletepiksel-koordinatar
  windows: [...],
  skillevegg: Set([segIdx, ...]),   // veggar som er skiljeveggar
  segOverrides: {segIdx: {...}},    // manuelle lengd/areal per segment
  skMergedGroups: [{segs:[], name}],// samanslåtte skiljeveggar
  yvMergedGroups: [{segs:[], name}],// samanslåtte ytterveggar
  takflater: [{id, pts, type, name, vinkel, retning, uverdi}],
                  // oppdeling av taket — `type` er ein av TAK_TYPER.
                  // vinkel/retning berre på type 'Tak'. Tom liste = udelt.
  gulvflater: [{id, pts, type, name, uverdi}],   // det same for golvet
  gavlflater: [{segIdx, profile, area, lenM, dir}],
  groupId,        // kopling mellom soner (berre SIMIEN-gruppering)
  tekniskeSystem, // [{id,namn,kategori}] frå EntroPi (beta) — ikkje i SXI
  bygkat, hoyde, himling, gulvtype, taktype, takvinkel, byggeaar,
  areaOverride, perimOverride,
  uVegg, uTak, uGulv, uVindu, n50
}]

windows = [{
  type,           // 'vindauge' eller 'dor'
  name, breddeMm, hoyMm, antal,
  t0, t1,         // 0-1 relativ posisjon langs segmentet
  segIdx,         // indeks i calcSegments()
  dir, uVerdi, brystningMm
}]
```

**Globale variablar:**
```javascript
let globalNorth = 0;
let globalMmPerImgPx = null;
let prosjektAdresse = '';      // bygget si adresse — framlegg til filnamn
let activeFloor = 0;
let zones = [];                // alias til floors[activeFloor].zones
let mmPerImgPx = null;         // alias — GJELD BERRE AKTIV ETASJE
let snapEnabled = true;
```

---

## Kritiske invariantar

Desse har vore kjelde til reelle feil. Bryt dei ikkje.

### 1. Per-etasje kalibrering

`mmPerImgPx` er eit alias som **berre gjeld aktiv etasje**. All rekning som kryssar etasjar (SXI-eksport, BRA-summar, sidepanel, tabell, 3D, fasadevising) må slå opp skalaen for sona si eiga etasje:

```javascript
mppForFloor(f)   // f.ownCal ? f.mmPerImgPx : (globalMmPerImgPx ?? f.mmPerImgPx)
mppForZone(z)    // finn sona si etasje og kallar mppForFloor
```

`calcAreaM2(pts, mpp)`, `calcPerimM(pts, mpp)` og `calcSegments(pts, fhM, mpp)` tek alle ein valfri skala-parameter. Brukar du dei i ei løkke over fleire etasjar, **må** du sende han.

### 2. segIdx-bokføring

Vindauge (`segIdx`), skiljeveggar, `segOverrides` og `skMergedGroups` refererer alle veggsegment via indeks. Når `z.pts` endrar seg, forskyv indeksane seg:

```javascript
remapSegsAfterInsert(z, i, t) // kall ETTER z.pts.splice(i+1,0,pt).
                              // t = kvar på segmentet punktet hamna (0-1);
                              // utelaten t tyder midtpunktet.
remapSegsBeforeDelete(z, pi)  // kall FØR z.pts.splice(pi,1) — treng gamle lengder
sanitizeZoneSegRefs(z)        // rydd ugyldige referansar ved lasting
```

### 3. Punkt under teikning må lagrast i biletkoordinatar

`curPts`, `calPts`, `measurePts` og `winPts` held alle **biletkoordinatar**, ikkje
skjermkoordinatar. Elles flyttar punkta seg om brukaren panorerer eller zoomar
mellom to klikk. Dette var ein reell feil i vindaugs-/dørverktøyet: `winPts`
lagra skjermposisjonen, så vindauget hamna feil stad på veggen om ein flytta
lerretet mellom første og andre klikk. Same gjeld `winSnapPreview` — han må
reknast på nytt frå `mouse` ved kvar teikning, ikkje gjenbrukast frå siste
musrørsle (zoom flyttar ikkje musa).

### 4. Ghost-forskyving

`floorDxImg`/`floorDyImg` er i **biletpikslar**. Dei gamle felta `floorDx`/`floorDy` (skjermpikslar) finst ikkje lenger — dei vert berre lesne ved migrering av gamle `.entro`-filer. All teikning skjer på `(ix + floorDxImg) * sc + offX`, så alt som reknar skjermposisjon må ta med forskyvinga (dette råka både kartet og `zoomToZone`).

### 5. XML-escaping

All brukarstyrt tekst i SXI-eksporten må gjennom `xesc()`. Eit prosjektnamn med `&` gir elles ugyldig XML som SIMIEN nektar å opne.

### 6. `breddeMm` er sanninga — `t0`/`t1` er berre senteret

Eit vindauge lagrar breidda i millimeter (`breddeMm`) og posisjonen som `t0`/`t1`
langs segmentet. Dei to blir **ikkje** halde i sync: endrar brukaren breidda i
dialogen, står `t0`/`t1` att. Difor må kvar visning rekne utstrekninga på nytt:

```javascript
fitSpanT(centreT, width, segLen)   // width og segLen i SAME eining (px eller m)
winSpanPx(w, segLenPx, mpp)        // for eit vindaugsobjekt, i biletpikslar
```

Bruk aldri `w.t1-w.t0` som breidde. Det var feil i teikninga, treff-testinga,
draginga, «Del sone» og alle fire limeinn-vegane. `expandWindows()` gjer det same
for fasadevising/3D.

Begge hjelparane **skyv** vindauget inn på veggen når det ikkje er plass frå
senteret — dei klipper ikkje éi side. Ei einsidig klipping viste ei anna breidde
på skjermen enn den som gjekk til SIMIEN.

### 7. `antal` er eitt SIMIEN-element og mange stk på veggen

Eit vindauge med `antal>1` er framleis **eitt** `<window number="antal">` i
SXI-en, men på veggen står det som `antal` stykk — i planteikninga, i
fasadevisinga og i 3D-modellen. Plasseringa av kvar stk ligg i `w.posT`, ei
liste med senterposisjonar (0–1 langs segmentet), ei per stk.

`posT` er **valfri**. Manglar ho, vert stykka fordelte jamnt utover **heile**
veggen: kvar stk får si eiga rute på `segLen/n` og står midt i ruta. Då er
avstanden mellom stykka lik overalt, med halve avstanden ned til kvar ende —
slik ein fasade med like vindauge faktisk ser ut.

**Ei ny gruppe får `posT` med ein gong** (`winPosFraKlikk`, frå vindaugsdialogen
og når `winSetAntal` aukar frå 1): stykket brukaren teikna står der det vart
teikna, og dei n-1 andre vert spreidde utover veggen derifrå — lik luft mellom
stykka, halv luft ned mot hjørnet, og sidefordelinga som gir mest luft på den
trongaste sida. Klikk midt i ei rute i den jamne rekkja gir eksakt den jamne
rekkja. Er det ikkje plass rundt det teikna stykket, vert `posT` null og gruppa
jamnt fordelt (hintlinja seier frå).

Ei tidlegare utgåve klumpa stykka saman rundt klikkpunktet med ein liten
luftavstand; det gav ein 3D-modell som ikkje likna på bygget, og på ein kort
vegg hamna stykka oppå kvarandre. Difor vert resten **spreidde over heile
veggen**, ikkje lagde tett inntil det teikna.

Ruteinndelinga er dessutan den **tettaste** fordelinga som finst for n stk, så
er det plass i det heile (`n*breidde <= segLen`), ligg dei aldri oppå kvarandre.
Er gruppa breiare enn veggen, kan ingen plassering hjelpe — `winForTrongt()`
seier frå i sonekortet, i redigeringsdialogen (medan brukaren skriv) og i
hintlinja når gruppa vert laga. Aldri sil det i stillheit: tala går rett inn i
energimerket.

```javascript
winCount(w)                       // antal, minst 1
winHasPos(w)                      // posT finst OG har rett lengd
winCentres(w, width, segLen)      // senter for kvar stk — posT eller jamn rekkje
winForTrongt(w, width, segLen)    // breiare enn veggen? då MÅ stykka overlappe
winSpansPx(w, segLenPx, mpp)      // {t0,t1} per stk, i biletpikslar
winGeom(z, w)                     // {seg, segLen, width, mpp} i biletpikslar
winFreezePos(w, width, segLen)    // frys den jamne rekkja til faktiske posisjonar
winSetAntal(w, n, width, segLen)  // endra antal og ta vare på plasseringa
winPosFraKlikk(c, n, width, segLen) // ny gruppe: teikna stk står, resten spreidd — eller null
winSyncAnchor(w, width, segLen)   // t0/t1 = snittet av posT
```

Invariantar:

- **`t0`/`t1` er framleis gruppa sitt anker**, ikkje ei stk. Det er senteret ei
  jamn rekkje vert bygd rundt, og det `remapSegsAfterInsert`,
  `remapSegsBeforeDelete`, «Del sone» og kopieringa les. Endrar `posT` seg, må
  ankeret følgje snittet (`winSyncAnchor`) — elles ville gruppa hoppe tilbake
  til den gamle staden om `posT` fall bort.
- **Alle stk ligg på same segment.** Gruppa er eitt `<window>` inne i éin
  `<facade>`; spreidde vi stykka over fleire veggar, ville det ikkje lenger
  finnast éin fasade å leggje elementet i.
- **`posT` følgjer aldri med ein kopi.** Kopier, limeinn og «Del sone» set
  `posT:null` — plasseringa gjeld kjeldeveggen, og ein annan vegg har annan
  lengd. Utan dette ville kopiane dessutan dele same array som originalen.
- **Endra antal går gjennom `winSetAntal`**, aldri `w.antal=n`. Nye stk vert
  lagde etter den siste med ei halv vindaugsbreidde i luft; er det ikkje plass,
  fell heile gruppa tilbake til jamn fordeling.
- **Segment-remappinga tek `posT` med** (`_mapWinPos`, same lineære omrekning
  som `t0`/`t1`). Hamnar ei stk utanfor den nye veggen, fell gruppa tilbake til
  jamn fordeling — å klemme dei inn mot kanten ville stabla dei oppå kvarandre.
- **Plasseringa når aldri SXI-en.** Ho er berre visning; SIMIEN får `number` og
  målet på éin.
- Å løyse ut ei stk (`loysUtStk`) gjer gruppa til `number="n-1"` og legg det
  utløyste vindauget ved sida av som eit eige element med `number="1"`, på same
  plass. `loysOppGruppe` gjer heile gruppa til n sjølvstendige element — det
  endrar SXI-en frå eitt til n `<window>`, og er difor eit eige val, ikkje noko
  som skjer av seg sjølv når brukaren flyttar på stykka.
- `expandWindows()` er den eine vegen inn til fasadevising, 3D og kartet; han
  les `winCentres` og treng ingen eigen kunnskap om `posT`.

### 8. Omkalibrering: alt som er teikna må følgje bygget

Endrar brukaren skalaen etter å ha teikna, ligg teikninga i ro — det er **måla**
som endrar seg. Sonearealer, veggengder og kontrollmål reknast frå biletpikslar
ved kvar teikning og følgjer med av seg sjølv. To ting gjer det ikkje:

- `w.breddeMm` — måla langs veggen med to klikk, men lagra i mm
- `z.gavlflater[].area` / `.lenM` — cacha i meter

Begge blir handterte av `reskalerVedNyKalibrering(fl, oldMpp, newMpp)`. Kall
`_snapshotMpp()` **før** skalaen blir bytta, og `_reskalerAlleEtasjar(gammal)`
etterpå. Det er hekta på **to** stader: `calOk` og «Eiga/Global»-vekslaren i
skalabadgen (som òg endrar effektiv skala for etasjen).

Høgd, brystning og etasjehøgde er **tasta inn**, aldri henta frå planteikninga —
dei står urørte. Same for `areaOverride`, `perimOverride` og `segOverrides`:
tasta fasit skal ikkje skalerast.

---

## Snapping

`unifiedSnap(sx, sy, ownPts)` — prioritert rekkjefølgje:

1. Eigne punkt i den pågåande teikninga
2. Sonehjørne
3. **Veggkryss i sjølve planteikninga** (`imgLineSnap`)
4. Sonekant

`imgLineSnap` leitar etter **lange samanhengande strekar** i eit vindauge rundt peikaren og snappar til krysset mellom ein vassrett og ein loddrett. Den måler *lengste ubrotne strek* per rad/kolonne, ikkje talet på mørke pikslar — ei tekstlinje har like mange mørke pikslar som ein vegg, berre oppstykka. Terskel `LINE_MIN_FRAC = 0.35`.

Ein Harris-hjørnedetektor vart prøvd og **forkasta**: på tette skanna teikningar låste den seg like gjerne til bokstavar og møblar som til veggar. Linjekrysset er både meir presist (0,4–3,5 px mot 3–12) og 10–50× raskare.

Krev både vassrett og loddrett strek, så skrå veggar får ikkje snap. Det er med vilje — ingen snap er betre enn feil snap. `⌖ Snap`-knappen slår det av.

`orthoSnap()` låser til næraste 45°-akse når Shift er halden. Verkar i teikning, kalibrering, måling og begge klippeverktøya.

---

## Automatisk skiljekonstruksjon

Ei nyteikna sone som ligg inntil ei eksisterande får den felles veggen sett til
skiljekonstruksjon i **begge** sonene (`autoSkilleveggForNySone`, kalla frå
`finishZone`). Ligg berre ein del av naboveggen inntil, vert naboveggen delt i
tre — fasade, SK, fasade — ved at det vert sett inn punkt i `z.pts`.

- Toleranse `_naboTolPx()` ≈ 8 cm, minste overlapp `_naboMinOverlapPx()` = 25 cm.
  Ei berøring på nokre få centimeter tel altså ikkje.
- Vi berre **set** `skillevegg`, aldri fjernar. Slår brukaren ein vegg tilbake
  til fasade, står det valet fast sjølv om ei ny sone vert teikna seinare.
- Berre den nye sona utløyser skanninga. Å flytte eit hjørne i etterkant gjer
  ingen ting automatisk — det ville overraska meir enn det hjelpte.
- Kutta går gjennom `remapSegsAfterInsert(z,i,t)`, så vindauge, `segOverrides`
  og samanslåingsgrupper i nabosona følgjer med. `gavlflater` vert rekna på
  nytt (`_syncGavlflater`), sidan dei peikar på segmentindeksar.

## Samanslåing av skiljeveggar

`skMergedGroups` er ei liste med `{segs:[segIdx], name}`. Eit sett treng **ikkje**
dekkje heile nabogruppa frå `getSkAdjacentGroups()` — brukaren kan plukke ut nokre
av veggane, og same nabogruppa kan ha fleire sett side om side.

Difor: slå **aldri** opp ei samanslåing på gruppenøkkel (`grp.map(s=>s.idx).join(',')`).
Bruk medlemskap — `skMergedGroups.find(g => g.segs.includes(segIdx))`. Det gjeld både
sidepanelet og SXI-eksporten; begge hadde nøkkeloppslag før og ville stille slutta å
finne delvise sett.

- Eit segment kan berre liggje i **eitt** sett. `mergeSegs()` fjernar det frå andre først.
- Eit sett med færre enn to segment vert oppløyst.
- Namna er automatiske: `SK samla 1`, `SK samla 2` … Prefikset er med vilje ulikt
  fasadelappane (`SK1`, `SK2`), sidan dei no står side om side i same sone og begge
  endar som elementnamn i SIMIEN.
- «Slå saman» slår saman alle **ledige** SK-veggar i nabogruppa (eitt klikk, som før).
  «Vel…» opnar plukk-modus: avkryssingsboksar rett i radene, med ein handlingsstripe
  under. Plukk-modus byggjer **ikkje** sidepanelet på nytt — han manipulerer dei radene
  som alt står der, og først samanslåinga utløyser `updateResults()`.

---

## Kalibrering

**Tre metodar:**
1. **Lengde** — klikk start→slutt, tast inn mm
2. **Areal** — klikk på eksisterande sone
3. **Målestokk** — vel 1:100, 1:200 osv. Ingen klikking på teikninga.

Målestokk-metoden treng papirformatet, som vert oppdaga automatisk ved opplasting:
- **PDF:** fysisk sidestorleik frå MediaBox via pdf.js — eksakt
- **PNG/JPEG:** DPI frå `pHYs`- eller `JFIF`-metadata om det finst
- **Elles:** brukaren vel format (A0–A4), A3 som framlegg

```
mmPerImgPx = (papirbreidde_mm / biletbreidde_px) * målestokk
```

**Viktig:** kalibreringspunkta (`calPts`) lagrast i **biletkoordinatar**. Låg dei i skjermkoordinatar, vart skalaen stille feil om brukaren panorerte eller zooma mellom dei to klikka.

---

## Ytelse

Målt med 36 soner. Berre ~3 ms av tida i `updateResults` er rekning. Av dei
~180 ms det tok før var ~30 ms DOM-bygging og **~145 ms style/layout**, utløyst
synkront av scroll-gjenopprettinga på slutten (`_spanel.scrollTop=_savedScroll`
tvingar fram layout av heile panelet på 5300 noder). Mål alltid der før du
optimaliserer bygginga — det er layouten som dominerer, ikkje `createElement`.

Etter tiltaka under: **18 ms opne kort, 2 ms samanslegne** ved 36 soner.

Fallgruver som er retta, og som ikkje må innførast på nytt:

- **Kompass-draginga** kalla `updateResults()` + `renderTable()` på kvar musrørsle (110 ms per steg). Teiknar no berre lerretet under draginga; full oppdatering på slepp.
- **Etg.høgde/Nord-felta** bygde alt på kvart tastetrykk. No strupt via `tungOppdateringSnart()` (220 ms), med straks oppdatering på blur/Enter.
- **Tabellfana** er skjult som standard. `renderTable()` returnerer med ein gong når `#tablePanel` er skjult; fanebytet renderer.

- **Sonekorta byggjer berre header når kortet er samanslege.** Kroppen ligg som
  ein `_buildBody`-closure på kortet og vert kalla av chevron-handlaren og
  `_toggleAllZcards()` fyrste gongen kortet vert opna. Ikkje flytt kode ut av
  closuren, og hugs at eit `return` på toppnivå der no returnerer frå kroppen,
  ikkje frå `forEach`-callbacken.
- **`.zcard{content-visibility:auto}`** lèt nettlesaren hoppe over layout for
  kort utanfor synsfeltet. Sidan korta vert bygde på nytt kvar gong, forsvinn
  storleiken nettlesaren hugsar — difor les `updateResults()` `offsetHeight`
  frå førre runde inn i `window._zcardH` og set `contain-intrinsic-size`
  eksplisitt. Utan det hoppar rullelista. To følgjer å hugse: `innerText` på
  eit hoppa-over kort gir tom streng (bruk `textContent`), og
  `getBoundingClientRect()` gir plasshaldarstorleiken til kortet har vore
  synleg i eit frame.
- **Bakgrunnsbiletet vert enkoda éin gong per bilete, ikkje per lagring.**
  `serialiserProsjekt()` held `f._bgCache={img,nokkel,data}`; nøkkelen er
  biletobjektet + mime/kvalitet, så eit nytt bilete gir bom av seg sjølv.
  Éin plass per etasje. Ei PDF-side på ~48 Mpx tek ~600 ms i `toDataURL`, og
  autolagringa gjekk kvart minutt så lenge noko som helst var endra — det var
  eit sekundlangt frys per etasje ved kvar autolagring. Feltet vert aldri
  serialisert (`serFloors` byggjer `obj` felt for felt).

`draw()` og snapping er raske (1–2 ms per musrørsle) — ikkje bruk tid der.
`drawImage` av bakgrunnen er GPU-akselerert og kostar under 1 ms sjølv ved
64 Mpx, så den adaptive renderskalaen gjer *ikkje* teikninga treigare.

**Står att:** ei vanleg redigering byggjer framleis alle sonekorta på nytt. Med
lat kropp + `content-visibility` er det no billeg nok, så det å byggje om berre
det endra kortet er ikkje verdt risikoen — ein mellomlagringsmekanisme kan gi
utdaterte tal om ein bommar på eit felt (t.d. `getTotalAreaM2`, som avheng av
*andre* soner).

---

## SXI-eksport — kritiske detaljar

### Dørformat (VIKTIG — vart feil tidlegare)
```xml
<!-- RIKTIG -->
<door uvalue="2.50" area="2.50" type="Standardvalg" gate="no" id="door#1" name="Dør 1" comment=""></door>

<!-- FEIL (gamle format) -->
<door number="1" height="2.100" width="0.900" ...></door>
```

### makeProfile() — kritisk feil som vart fiksa
Siste slot MÅ vere `2345-0000`, IKKJE `2345-2400`. Feil her gjer at SIMIEN ikkje les profilen.

### Energimerke per bygningskategori
Éin `<energymark26>` per unik `building_type`. Namn: `"Energimerke Kontor"`, `"Energimerke Skole"` osv. `total_floor_area` er summen av soner i den kategorien.

### Bygningskategoriar (z.bygkat → SIMIEN)
```javascript
'Småhus'      → type:'Småhus',      subtype:'Enebolig'
'Boligblokker'→ type:'Boligblokk',  subtype:'Leilighet'
'Barnehager'  → type:'Barnehage',   subtype:'Barnehagebygning'
'Kontorbygg'  → type:'Kontorbygning', subtype:'Kontorer, enkle'
'Skolebygg'   → type:'Skolebygning',  subtype:'Undervisningslokaler'
// ... (sjå BYGKAT_SXI i koden)
```

### Panelovnar
50 W/m² — `capacity` i kW = `totalBra * 0.05`

---

### Tiltak (`<measure>`)

Seks tiltak kan veljast i eksportdialogen. Eit `<measure>` er ein **syskin til
`<zone>`** som inneheld KOPIAR av dei elementa tiltaket råkar. Kopien har ein ny
unik id, ein `measure_id` som peikar på originalen, og éin endra verdi. Alt anna
— areal, retning, konstruksjon — står ord for ord som i originalen. Kjelde:
`_Copy_Heiane 2` (SIMIEN 8.1.1.12), som byggjer på TEK17-krava.

| Tiltak | Element | Verdi |
|---|---|---|
| Etterisolere fasader | `<facade>` | `uvalue="0.18"` |
| Etterisolere tak | `<roof>` | `uvalue="0.13"` |
| Etterisolere gulv | `<floor>` | `uvalue="0.1"` |
| Bytte vindu | `<window>` | `uvalue="0.8"` |
| Bytte dører | `<door>` | `uvalue="1.2"` |
| Lekkasjetall 1,5 | `<zone>` | `n50="1.5"` |

Lista er **éin** konstant, `SXI_TILTAK`, som både dialogen og eksporten les —
dei kan ikkje komme i utakt.

`buildTiltakXml()` **les zonesXml tilbake med DOMParser** i staden for å føre
eit register gjennom sonebygginga. Det er med vilje: `facXml+=`-greinene er
mange (samanslegne YV-grupper, gavlflater, kjellervegg-hopp, kopla soner over
fleire etasjar), og eit register ville før eller seinare mista ei av dei. Fila
er nettopp generert av oss, så ho er gyldig XML.

Invariantar:

- **Kopiane har ingen born.** Fasadekopien tek ikkje med vindauga sine — difor
  ber dørkopien `parentId` (fasade-id) og `postfix="(Sonenamn , Fasadenamn)"`
  slik SIMIEN skriv dei. Vindaugskopiane har det **ikkje**; det er asymmetrisk
  i referansefila, og vi speglar referansefila.
- **Attributtrekkjefølgja er ulik per tag** og er kopiert frå referansefila:
  `measure_id` sist på `facade`/`roof`/`zone`, rett etter `id` på
  `floor`/`window`, og heilt først på `door` (der `id`-en dessutan står midt i
  lista, mellom `gate` og `name`). Difor byter vi verdien på den plassen
  `id` faktisk står, i staden for å fjerne og leggje til på nytt.
- **Berre verifiserte elementtypar vert kopierte.** Ei sone med himling eller
  gulv mot ei anna sone ligg som `<partition>`, og eit kjellargolv som
  `<cellar>` — dei står urørte. Eit valt tiltak som ikkje fann eitt einaste
  element vert **ikkje** lagt inn, og brukaren får ein `confirm()` som seier
  kva som mangla og kvifor. Aldri sil i stillheit.
- **Tre ting utanfor sjølve `<measure>` må følgje med**, elles reknar SIMIEN
  ikkje på tiltaka:
  1. `include_measures="yes"` i `<energymark26>`.
  2. Eitt `<included_measures_ids tiltak_id="measure#N">` per tiltak, inne i
     kvart `<energymark26>`, etter `<included_zone>`. Attributtet heiter
     `tiltak_id` (norsk), ikkje `measure_id`.
  3. Eitt `<profitsim>` (lønnsemdvurdering) på slutten av fila.
     `buildProfitsimXml()`. **id-prefikset er `profit-evaluation`, ikkje
     taggnamnet** — SIMIEN slår opp elementtype på prefikset, same felle som
     `partition`/`roof`. Verdiane (kalkrente 4 %, inflasjon 2 %, levetid 20 år
     …) er SIMIEN sine eigne standardverdiar frå referansefila; vi finn dei
     ikkje opp for brukaren.
  Difor må tiltaka byggjast **før** energimerket (og etter sonene), og
  `buildTiltakXml()` returnerer `{xml, ids}` — id-ane treng energimerket.
- Rekkjefølgja i fila er `zone*`, `measure*`, `energymark26*`, `profitsim`.
- Eit tiltak dekkjer element frå **alle** soner, så alle tiltaka vert lista i
  **alle** energimerka når prosjektet har fleire bygningskategoriar. Det er
  SIMIEN som plukkar ut dei elementa som høyrer til sonene i kvart merke.
  Det finst berre **eitt** `<profitsim>` uansett kor mange energimerke.
- **Utan valde tiltak er fila teikn for teikn den same som før** — `tiltakXml`
  og `profitXml` er tomme strengar, `include_measures="no"`, ingen
  `included_measures_ids`.
- Valet er per eksport og vert **ikkje** lagra — det slepp den femdelte
  lagringsregelen.

## Kopling av soner (groupId)

- `groupId` er ein string (`'g1'`, `'g2'` osv.)
- Berre SIMIEN-gruppering — geometri og areal bereknast per sone
- Berre soner med **same bygningskategori** kan koplast
- Kvar kopla sone kan ha **eigen tak- og gulvtype**
- Kopla soner vises med lilla boks i sidepanelet

---

## Del sone

Høgreklikk på ei sone (eller knappen i sidepanelet) → teikn ei linje tvers gjennom → sona vert delt i to. Gjenbruker `_splitPolygonByPolyline` frå takklippen.

Segmenta som kjem frå klippelinja vert automatisk skiljekonstruksjon i **begge** dei nye sonene. Kva som er klippelinje avgjerast **geometrisk** (ligg midtpunktet på ein av dei opphavlege veggane?), ikkje via indeksrekning.

Vindauge fordelast til den sona veggen deira hamna i. `takflater`, `gavlflater`, `segOverrides` og samanslåtte grupper vert nullstilte — dei peikar på segmentindeksar som ikkje finst lenger.

---

## Lagring

All serialisering går gjennom **to** delte funksjonar — `serialiserProsjekt(opts)`
og `lastProsjekt(proj, opts)`. Manuell lagring, autolagring og EntroPi-brua
brukar dei same to, så dei kan ikkje lenger komme i utakt. Per etasje kallar dei
`serialiserEtasje(f, opts)` / `deserialiserEtasje(f)`, som etasje-klippbordet òg
brukar — eit nytt etasje- eller sonefelt skal difor leggjast der, ikkje i
prosjektfunksjonane.

**Manuell (.entro):** `showSaveFilePicker` der nettlesaren støttar det, så brukaren vel mappe og namn. Framlegg til filnamn er `foreslaaFilnamn()` (adressa utan postnummer/poststad). Fallback til vanleg nedlasting.

**Autolagring (localStorage):** `serialiserProsjekt({mime:'image/jpeg',qual:0.85})`, kvart 60. sekund når `isDirty`. `markClean()` **må** kallast etter lagring — elles re-enkodar den alle bileta i full oppløysing kvart minutt for alltid.

**EntroPi (iframe):** brua sender PNG — fila på bygget er den einaste kopien, og JPEG ville tapt kvalitet på nytt for kvar opne-lagre-runde.

Alle felt som skal overleve må leggjast til **fem** stader: `snapshot()`, `applyHistoryState()`, `getCurrentState()`, `serialiserEtasje()` og `deserialiserEtasje()` (eller `serialiserProsjekt()`/`lastProsjekt()` for felt på prosjektnivå).

`.entro`-fila og lokalkopien er stempla med `_eigar {kjelde,byggId,byggNamn}`
frå `serialiserProsjekt()`. Det er både lokalkopi-stempelet (sjå EntroPi-brua)
og den einaste måten etasje-importen kan sjå om tekniske system i fila framleis
høyrer til bygget vi står på.

---

## EntroPi-bru (innbygd modus)

Programmet køyrer som verktøy i ein iframe inne i EntroPi. Då lagrar «Lagre»
prosjektet rett på bygget i staden for å laste ned ei fil, og prosjektet på
bygget kjem inn med ei `sxi:init`-melding. Nedlastinga forsvinn ikkje — ho får
ein eigen knapp (`#dlBtn`) ved sida av lagreknappen, slik at ein kan ta med seg
ein `.entro`-kopi ut av EntroPi (`Ctrl+Shift+S`). Utanfor iframe er han skjult. Brua ligg i `index.html` under
`// ── 2b. EntroPi-bru` og er heilt passiv utanfor ein iframe.

Full protokoll, EntroPi-sida (React) og lagringsråd: `docs/entropi-integrasjon.md`.
Testvert som implementerer heile protokollen: `docs/entropi-test-host.html`
(opne `http://localhost:8742/docs/entropi-test-host.html`).

**Funksjonar som berre gjeld EntroPi** har to mekanismar, og ingen andre:

- **Vising:** `data-embed` vert sett på `<html>` av `applyEmbedUI()` når
  `sxi:init` har kome. Klassene `.embed-only` og `.local-only` gjer resten, så
  ein ny EntroPi-berre-knapp er rein markup — ikkje ei ny linje i
  `applyEmbedUI()`. Brikker og merkelappar legg til `.eo-inline` (standard er
  `flex`, som `.btn`).
- **Logikk:** `inPi()` — éin gate. Sann først etter `sxi:init`, aldri berre av
  at vi ligg i ein iframe. Ikkje gjenta `window.EntroHost&&…active()`.
- **Verdiar frå bygget:** `piBygg` (adresse, byggeår) held det EntroPi sender i
  `sxi:init`; brua er einaste skrivar. `_fyllFraPi()` fyller **berre tomme**
  felt — brukaren sitt tal vert aldri overskrive. Verdiane vert ikkje
  serialiserte (dei kjem på nytt ved kvar opning), så dei slepp den femdelte
  lagringsregelen. Nytt felt av same slag: `piBygg` + `_fyllFraPi()`, pluss
  `finishZone()` om nye soner skal arve det.
  NB: `floors[activeFloor].zones` er ikkje same array som `zones` før eit
  `saveFloorState()`/`syncFloorState()` har gått, så `_fyllFraPi()` les
  `i===activeFloor?zones:fl.zones`. Andre løkker over alle soner har same
  fella, men vert i praksis redda av autolagringa som flusher kvart minutt.
- **Tekniske system (beta):** «⚙ Hent tekniske systemer» opnar eit eige
  vindauge (`#sysOverlay`, koden under `// ── 2c.`) der systema på bygget vert
  dregne over på soner. Lista kjem frå verten (`sxi:request-systems` →
  `sxi:systems`) og vert cacha i brua; **koplinga** er vår og ligg på sona som
  `z.tekniskeSystem=[{id,namn,kategori}]`.
  - Namn og kategori vert lagra saman med `id` med vilje: eit system som vert
    sletta i EntroPi skal framleis vere leseleg i prosjektet (det står med
    stipla kant i vindauget).
  - **Kopla soner er éi sone** her — endringar går til alle instansane via
    `getLinkedZones()`, elles ville koplinga komme i utakt mellom etasjar.
  - Vindauget kallar `saveFloorState()` når det opnar, elles ser det ein gammal
    kopi av den aktive etasjen (same fella som `_fyllFraPi()`).
  - `snapshot()` før kvar endring gir angre. Angre byter ut soneobjekta, så
    vindauget teiknar seg på nytt frå ein wrapper rundt `applyHistoryState`.
  - Berre **ventilasjon, varme og kjøling** vert viste. Verten sender heile
    lista si; filteret (`relevant()`) står i vindauget, og talet på sila
    system vert vist — aldri sil i stillheit. `alle` (rålista) vert brukt til
    å avgjere om ei kopling framleis finst, `systems` (sila) til det som kan
    dragast; elles ville ei gammal belysningskopling blitt merkt som sletta.
  - **Ventilasjonstala går inn i SXI-en** (`ventSysForZone`, `ventSpesLuft`,
    `V`-objektet i `buildSXI`): luftmengd, redusert luftmengd, gjenvinningsgrad
    og SFP. Invariantar:
    - Blanding skjer **per felt** — manglar eitt tal, står normverdien for det
      eine. Utan system er fila teikn for teikn som før (difor står `sfp_100`
      framleis som `String(sfp)`, ikkje `toFixed(2)`, på normvegen).
    - m³/h vert delt på **arealet anlegget betjener** (`ventAreaForSys`, alle
      soner det er lagt på, over alle etasjar). `luft.per` fortel at verten
      alt sende m³/(h·m²).
    - Redusert luftmengd vert **ikkje** skalert ned frå norma etter design —
      ei nattsenking vi ikkje veit om ville gjort energimerket for godt. Utan
      tal: norm, klipt til å ikkje vere større enn designluftmengda.
    - Dellastkurvene er **skalerte** frå referansefila (SFP 90/80/70/60 %,
      gjenvinningskurva som forhold til 0,80), aldri nyoppfunne.
    - Namnet på `<ventilation>` kjem frå EntroPi (gjennom `xesc`), men
      **id-prefikset `cav#` står** — SIMIEN slår opp elementtype på prefikset.
    - Tala vert lagra på sona (`kopi()`), så eksporten verkar utan EntroPi.
      `oppdaterLagra()` friskar dei opp ved kvar henting og markerer prosjektet
      ulagra, men lagar **ikkje** eit angre-steg — brukaren gjorde ingenting.
  - Varme og kjøling går **ikkje** inn i SXI-en enno (varme er framleis
    panelovnar 50 W/m²). Kva som må til: sjå «Verdiar som skal med i SXI-fila
    seinare» i `docs/entropi-integrasjon.md`.
- Ny melding = ny metode på `window.EntroHost`; `postMessage` bur berre i brua.
  Kvar melding inn i tre filer: brua, protokolltabellen i doc-en, og testverten.
- Test **begge** modus: `index.html` direkte (skal vere uendra) og
  `docs/entropi-test-host.html`.

- Verktøyet eig **inga** lagring og har ingen API-nøklar. Vertssida gjer all
  autentisering og opplasting — difor kan hostinga på GitHub Pages stå som ho er.
- `window.EntroHost` er heile API-et mot resten av koden: `framed`, `active()`,
  `willLoadProject()`, `notifyDirty()`, `saveToHost({auto,requestId})`,
  `sendSxi(xml, filnamn, meta)`. Alle kall utanfrå må vere vakta med
  `if(window.EntroHost)` — brua vert definert etter `markDirty`/`markClean`.
- Opphavslista i brua avgjer kven vi snakkar med. Nytt domene på EntroPi ⇒
  utvid lista, elles blir brua ståande stille utan feilmelding.
- `?embed=1` i iframe-URL-en slår på handtrykket. Utan flagget sender brua inga
  melding og endrar ingenting — difor kan ho liggje i produksjon før vertssida
  er klar. Verktøylinja endrar seg fyrst når `sxi:init` har kome, så knappen
  aldri viser «Lagre på bygget» medan lagringa framleis lastar ned fila.
- `.entro`-fila går som **Blob**, ikkje streng — han går rett vidare til
  opplasting utan ein ekstra kopi i minnet.
- `sxi:state {dirty}` finst fordi `beforeunload` ikkje fyrer når ein iframe vert
  fjerna. Det er einaste måten EntroPi kan åtvare om ulagra endringar. Sjølve
  åtvaringsdialogen må byggjast på vertssida — verktøyet kan ikkje stoppe
  navigasjon i EntroPi.
- Kvar `sxi:request-save` **må** ende i ein `sxi:save` med same `requestId`.
  Kjem han medan ei lagring går, vert han lagd i kø (`queuedReq`) og send når
  den fyrste er ferdig — elles ville «Lagre og gå ut» på vertssida hengt for
  alltid. Dette var ein reell feil: `saveToHost` returnerte berre `false`.
- **Autolagring til bygget står på som standard** (2 min, `autosaveMs` overstyrer,
  `0` slår av). Fyrste endringa i økta går etter 10 s, og **berre den fyrste** —
  elles ville kvar lagring gjere prosjektet reint, neste endring skulle lagrast
  straks, og intervallet vart i praksis 10 s for resten av økta.
  Den lokale autolagringa til localStorage står ned medan dette er på
  (`EntroHost.autosaves()`). Dei kan ikkje køyre side om side: `autosave()`
  kallar `markClean()`, så lokalkopien ville nulla `isDirty` før lagringa til
  bygget fekk sjå han, og bygget ville aldri blitt oppdatert.
- **Lokalkopien er eit nett under lagringa til bygget, ikkje eit sidespor.**
  Heile livsløpet heng saman med `sxi:save`:
  - `autosave()` stemplar kopien med `_eigar={kjelde,byggId,byggNamn}` frå
    `_autolagringEigar()`. `localStorage`-nøkkelen er den same for heile
    nettlesaren, så **utan stempelet kunne arbeid på eitt bygg blitt tilbode
    att på eit anna**.
  - `sxi:save-result {ok:true}` ⇒ `slettAutolagring()`. Bygget har fila, og ein
    kopi som ligg att ville blitt tilbydd som «ulagra arbeid».
  - `sxi:init`/`sxi:load` ⇒ `tilbyLokalKopi(hostSavedAt)`. Feil bygg: la kopien
    liggje (han høyrer heime ein annan stad). Eldre enn fila frå verten: slett.
    Rett bygg og nyare: brikke, og «Hent inn att» kallar `markDirty()` så
    arbeidet går vidare **til bygget**, ikkje tilbake til localStorage.
  - Oppstartsstien (`setTimeout` → `restoreAutosave()`) held seg heilt unna når
    `EntroHost.embedRequested()` er sann. `willLoadProject()` åleine var ikkje
    nok: eit bygg **utan** prosjekt gjorde han usann, og eit seint `sxi:init`
    tapte kappløpet mot tidsavbrotet — då kunne brukaren fått tilbod om arbeid
    frå eit heilt anna bygg. `sxi:init` kallar dessutan `hideToast()` uansett.
  - `restoreAutosave(opts)` tek `byggId`, `nyareEnn`, `tekst`, `knapp` og
    `etterpaa`. Utan opts er han som før — det er den frittståande vegen.
    Utanfor EntroPi vert ein byggstempla kopi framleis tilbydd, men merkt med
    byggnamnet; å halde brukaren sitt eige arbeid tilbake i stillheit ville
    vore verre.

---

## Kopier etasje mellom prosjekt

Ein heil etasje kan hentast frå eitt prosjekt inn i eit anna (`// ── 2a.`).
Inne i EntroPi ligg prosjekta på kvart sitt bygg og kan ikkje vere opne
samstundes, så det må gå gjennom eit lager som lever mellom to sideopningar.
Difor to berarar, som begge endar i `importerEtasjar(serFloors, meta)`:

- **Klippbord** — IndexedDB (`sxiEtasjeKlipp`) på vårt eige origin. Høgreklikk
  på etasjefana → «Kopier etasje»; `+ Etasje` → «Lim inn kopiert etasje».
  `localStorage` duger **ikkje**: ei PDF-side på 48 Mpx sprengjer 5 MB-kvoten,
  og eit JPEG-mellomsteg ville blassa ut dei tynne strekane `imgLineSnap`
  leitar etter. IndexedDB tek ein PNG-Blob direkte. Nettlesaren partisjonerer
  lageret på **toppnivå-sida** (EntroPi), ikkje på iframe-URL-en, så det same
  klippbordet gjeld frå bygg til bygg. Er lageret blokkert, seier meldinga frå
  og peikar på fil-vegen — ingen stille andre-mekanisme.
- **Prosjektfil** — `+ Etasje` → «Hent etasje frå prosjektfil»: vel ei
  `.entro`-fil, plukk éin eller alle etasjar. Einaste vegen mellom to maskiner.

`importerEtasjar` eig alle omreknings-reglane, og desse er dei som har gjort
skade om dei blir gjorde feil:

- **Kalibreringa som gjaldt for etasjen i kjeldeprosjektet er den einaste som
  gir rette mål.** Er ho ulik den globale her, får etasjen `ownCal=true` med
  kjelde-skalaen. Utan det ville alle areala endra seg i det etasjen kom inn —
  utan at nokon rørte teikninga. Same skala som den globale ⇒ `ownCal=false`,
  så badgen ikkje lyg om at etasjen er spesiell.
- **`groupId` er berre meiningsfull innanfor eitt prosjekt.** Ei kopling som
  ligg heilt inne i importen vert med under nye id-ar; peikar ho ut av det vi
  hentar, fell ho bort (som ved sletting av ei etasje). Å ta id-ane med som dei
  er ville kopla soner til framande grupper i målprosjektet.
- **`tekniskeSystem` vert tekne bort med mindre byggId er stadfesta lik.** Dei
  peikar på system-id-ar på eit bestemt bygg, og ventilasjonstala som ligg
  lagra på sona går rett inn i SXI-en — energimerket ville blitt rekna med
  luftmengder frå ein heilt annan bygning. Talet vert vist, aldri stille.
- **Nord er globalt per prosjekt.** Vi endrar det ikkje, men melder avviket:
  fasadane står no mot andre himmelretningar enn dei gjorde i kjeldeprosjektet.
- Namnekollisjonar på etasje og sone går gjennom `_unikNamn` («Sone 7 (2)»),
  og `_nextZoneId` vert dregen forbi importerte «Sone N» så neste nye sone
  ikkje får same namnet.
- `snapshot()` fyrst, så heile importen er eitt angre-steg (og markerer
  prosjektet ulagra, slik at det går vidare til bygget i EntroPi).
- Eit heilt tomt startprosjekt («Etasje 1», ingen soner, inga teikning) vert
  fjerna når importen kjem inn.

## Oppdeling av tak og golv

Taket og golvet i ei sone kan delast opp i fleire flater, og **kvar flate har sin
eigen konstruksjonstype**. Halve taket kan vere tak mot det fri og den andre
halvdelen himling mot eit kaldt loft; halve golvet kan vere golv på grunn og
resten kjellergolv. Utan oppdeling gjeld sona sin eigen `taktype`/`gulvtype` for
heile flata — det er framleis normaltilfellet.

`FLATE[kind]` (`kind` = `'tak'` | `'gulv'`) held alt som skil dei to laga, så UI,
teikning og eksport deler kode. Legg eit nytt lag inn der, ikkje som ein ny
kodeveg.

```javascript
flateListe(z,kind)          // z.takflater / z.gulvflater
flateType(z,kind,fl)        // fl.type, elles sona sin type (migrering av gamle filer)
flateAreaM2(z,fl)
flateKantLenM(z,fl,pred)    // lengda av flatekanten som ligg på sona sin ytterkant
eksportFlater(z,kind)       // ALLTID minst éi oppføring — udelt og oppdelt i same løkka
flateAvvikM2(z,kind)        // sonearealet minus summen av flatene
initFlater(z,kind)          // start oppdelinga: éi flate = heile sona
startKlippFlate(z,kind,i,fi)
slettFlate(z,kind,i)        // slettar OG gir arealet til naboflata
_fjernFlateoppdeling(z,kind)// største flata gir sona sin type; lista vert tom
byggFlateSeksjon(z,kind,fi,zi,settings)
_splitPolygonByHole(poly,loop)   // klipp ut ein bit midt i flata
_unionPolygons(a,b) / _slaaSamanPolygon(a,b)
flateKonturar(pts)          // konturane utan nøkkelhòl-brua
flateMerkepunkt(pts)        // eit punkt godt inne i flata, til merkelappen
```

Invariantar:

- **Udelt sone gir teikn for teikn same SXI som før.** `eksportFlater` returnerer
  då `{fl:null, …}`, og eksporten fell tilbake på `getTakAreal`, `direction="100"`,
  `getUtvOmkrets` og `getKjellerVeggLen` — nøyaktig dei gamle uttrykka. Dette er
  verifisert med ein full XML-samanlikning mot førre versjon; bryt han ikkje.
- **Gamle takflater manglar `type`.** `flateType` fell difor tilbake på sona sin
  `taktype`. Ikkje migrer feltet ved lasting — fallbacken er den som held gamle
  prosjekt uendra.
- **Elementtypen kjem av typen, ikkje av laget.** Ei himling vert `<partition>`
  med `nextId('partition')`, eit tak `<roof>`, eit kjellergolv `<cellar>`. Same
  felle som alltid: SIMIEN slår opp elementtype på id-prefikset.
- **Perimeter og kjellervegg vert rekna per delflate** med `flateKantLenM`. Ei
  delflate midt inne i sona har ingen ytterkant — då er både perimeteren og
  kjellerveggen 0, og det er rett svar. Utan dette ville kvar delflate fått heile
  sona sin omkrets.
- **Sum av flatene mot sonearealet vert vist, aldri sila bort.** Slettar
  brukaren ei flate, står arealet att som eit avvik i sonekortet og i tabellen —
  det ville elles forsvunne stille ut av energimerket.
- **`uverdi` per flate.** Ei himling mot ei varm sone har ein heilt annan U-verdi
  enn taket ved sida av. Blank = sona sin.
- **Berre eitt lag vert teikna oppå planen** (`flateLag`). Tak og golv ligg på
  same koordinatar, og to fyllfargar over kvarandre er uleseleg. Varm palett for
  taket, kald og prikka kant for golvet.
- **Klippeverktøyet er felles.** `klippTakflateTarget={z,tfi,kind}` — `kind` må
  med overalt som slår opp flatelista (`_snapKlippPt`, `draw`, `_finishKlipp`).
- **Berre `type==='Tak'` med vinkel > 0 gir gavlflater** og skrå flate i 3D. Ei
  himling er flat og får ein dempa gråtone i modellen.
- **`isKjeller(z)`** ser på golvflatene når dei finst, elles på `z.gulvtype`.
  Alt anna kjellerarbeid (KJ/YV/SK-rollene på veggane, oppfylling) er uendra og
  ligg framleis på sona.
- Del sone og kopiering mellom etasjar nullstiller begge listene — dei peikar på
  den gamle soneforma.

**Sona skal alltid vere heilt dekt av tak og golv.** Difor forsvinn ei flate
aldri berre: `slettFlate` gir arealet tilbake til den naboflata ho deler lengst
kant med (`_felleskantLen`), og den siste flata tek med seg heile oppdelinga
(`_fjernFlateoppdeling`) i staden for å late sona stå utan tak. Lèt
samanslåinga seg ikkje gjere, står flata att og brukaren får beskjed —
`flateAvvikM2`-varselet er difor berre eit nett for gamle prosjekt og for soner
som har fått endra geometri etter oppdelinga.

- **`_unionPolygons` er kantkansellering**, ikkje ein generell boolsk operasjon:
  kantar som finst i begge polygona i kvar si retning er innvendige og fell
  bort. Kantane vert fyrst delte ved motpartens hjørne, og då set vi inn
  motpartens PUNKT — ikkje projeksjonen — så nøklane matchar eksakt.
- **`_slaaSamanPolygon` har fasitsjekk**: arealet av resultatet må vere summen av
  dei to innanfor 0,5 %. Slår det ikkje til, returnerer han null. Eit polygon vi
  ikkje stolar på skal aldri inn i energimerket.

**Eit hòl midt i flata er eit nøkkelhòl, ikkje ein ekstra ring.** Teiknar
brukaren ei lukka sløyfe heilt inne i ei flate (klikk tilbake på startpunktet),
vert sløyfa ei eiga flate, og restflata får ei smal bru ut til hòlet, hòlet
gjennomløpt **andre vegen**, og bru tilbake.

- Motsett omløp er heile poenget: shoelace (`calcAreaM2`) trekkjer då hòlet frå,
  og canvas-fyllet med nonzero winding lèt hòlet stå tomt. Datamodellen er
  framleis éin `pts`-ring, så teikning, 3D, eksport og lagring er urørte.
- `flateKantLenM` tel berre kantar som ligg på sona sin ytterkant, så både brua
  og hòlkanten gir 0 — ein bit midt i sona har rett nok ingen perimeter.
- **Brua skal aldri teiknast.** Ho er to motsette kantar oppå kvarandre og ville
  vist seg som ein strek tvers over flata. `flateKonturar()` finn kantane som
  har ein motsett tvilling i same ringen og hoppar over dei; fyllet brukar
  framleis heile ringen. Same hjelparen i 3D.
- Tyngdepunktet til eit nøkkelhòl-polygon kan hamne midt i hòlet — difor
  `flateMerkepunkt()`, som søkjer opp eit punkt godt inne i flata.
- Samanslåinga treng ingen særhandsaming av nøkkelhòl: brua er to motsette
  kantar og kansellerer seg sjølv når hòlet vert lagt tilbake. Ein bit som vert
  sletta gir difor eksakt det opphavlege polygonet tilbake.

Sidepanelet — plassen er knapp, så seksjonen veks med behovet:

- **Udelt lag = éi rad**, same rytme som Kategori/Byggeår/Etg.høgde over:
  `Golv [type ▾] ✂` og `Tak [type ▾] [30]° ✂`. Takvinkelen ligg inline; den
  gamle avkryssingsboksen «Skråtak» er borte fordi han aldri skilde mellom noko
  — `getTakvinkel()` les både `null` og `0` som flatt. Tomt felt = flatt tak.
- **Oppdelt lag** veks til ein kollapsbar `.sub-sec` med eitt kompakt kort per
  flate (namn/areal/✂/✕, så type + U-verdi, og på tak mot det fri vinkel +
  fallretning på ei tredje rad).
- Kollapstilstanden ligg i ``window._flateCollapsed[`fl_<fi>_<zi>_<kind>`]`` og
  overlever dei hyppige rebuildane. Lister lengre enn `FLATELIST_AUTO_COLLAPSE`
  startar samanslegne, så eit oppdelt lag kan vere éi linje det òg.
- **Samandraget står i headeren** (`.sub-count`): «n flater», og gul pille med ⚠
  når flatene ikkje dekkjer sonearealet. Poenget er at ein ser kva som ligg der
  utan å opne seksjonen — elles ville det å gøyme han vore å gøyme informasjon.
- **Alt+klikk på headeren** set same tilstand på alle soner. Eit prosjekt med 30
  soner skal kunne ryddast med eitt klikk, ikkje eitt per sonekort.
- Sum og «↺ Slå saman» deler botnrada; klippeknappen bur i headeren. Ingen av
  dei får ei eiga full-breidde rad — dei fleste soner vert aldri delte opp.
- `_finishKlipp` ryddar `klippTakflatePts`/`klippTakflateTarget` og går ut av
  klippemodus **før** `draw()`. Gjer han det etterpå, blir den raude
  forhandsvisninga ståande att på lerretet til noko anna utløyser ei ny
  teikning. Bomskot (linja treffer ikkje flata) held derimot på målet, så
  brukaren kan prøve igjen utan å starte på nytt.

## Skjulte soner

`z.skjult` tek sona ut av **visinga**: planteikninga (inkludert ghost-laget frå
naboetasjen), 3D-modellen og kartet. Tabellen, BRA-summane, sonekortet og
SXI-eksporten er urørte — å skjule er eit visingsval, ikkje ei sletting.

- **Snapping og treff-testing må hoppe over skjulte soner** òg (`unifiedSnap`,
  `snapToSegment`, `findWindowAtScreen`, hover/Ctrl+C, høgreklikk-oppslaget,
  arealkalibreringa). Elles snappar eller treff brukaren ei sone han ikkje ser.
- Ei skjult sone kan ikkje redigerast: `setSkjult()` går ut av edit-modus om
  sona som vert skjult er den som ligg i `editZoneIdx`.
- Feltet vert med i lagring og angre av seg sjølv — soner vert serialiserte
  med spread (`{...z}`) i alle fem stadene. Som dei andre felta i sonekortet
  lagar toggelen **ikkje** eit eige angre-steg, men han kallar `markDirty()`.
- UI: auge-ikon i headeren på sonekortet (per sone) og «Skjul alle soner /
  Vis alle (n skjulte)» i verktøylinja over sonelista, pluss «Skjul sona» i
  høgreklikk-menyen. Kortet vert dempa med `.zcard.skjult` og namnet
  overstroke, så det aldri ser ut som ein feil at sona manglar i teikninga.
- 3D-legenda og verdssentrum i 3D/kart reknast frå dei synlege sonene, så
  modellen sentrerer på det som faktisk vert vist.

## Fasadeteikningar

Eit **fasadeark** er ei teikning som berre vert målt på. Det ligg VED SIDA AV
planteikningane, ikkje som ein etasje: ingen soner, ingen vindauge, inga
kopling til 3D-modellen, kartet eller SXI-eksporten. `floors` er framleis
modellen, og alt som reknar på bygget skal halde fram med å sjå berre den
arrayen. Arka ligg i `fasadar[]` med `activeFasade`/`_nextFasadeId`.

```javascript
fasadar = [{
  id, name,
  bgImg, bgImgData, pdfDoc, pdfPage, totalPages,
  paperWMm, paperHMm, paperSource,
  mmPerImgPx,        // EIGA kalibrering — ingen global, ingen ownCal
  sc, offX, offY,
  measurements       // [{p1,p2}] i biletkoordinatar, som på ein etasje
}]
```

**Lerret-globalane peikar på det aktive arket i begge visingar.** Det er heile
poenget: måleverktøyet, kalibreringa, zoom/pan og `imgLineSnap` verkar på eit
fasadeark utan ein einaste ny kodeveg. `viewMode` ('plan' | 'fasade') seier
kven som eig dei, og `curArk()` gir arket (etasje eller fasade) for det som
høyrer til teikninga — papirformat, PDF-sider, bakgrunnsbilete.

Invariantar:

- **`saveFloorState()` skriv til fasadearket når det er framme**, ikkje til
  etasjen. Autolagringa kallar han kvart minutt; utan vakta ville fasadebiletet
  og fasadeskalaen hamna på den aktive etasjen.
- **`syncFloorState()` set berre `zones`-aliaset i fasadevisinga.** Aliaset må
  likevel følgje med — elles ville ei angring late det stå att på den gamle
  arrayen, og neste `saveFloorState()` ville skrive den utdaterte sonelista
  tilbake på etasjen.
- **Fasadearket har inga ghost-forskyving.** `_arkOffset()` gir `{0,0}` der, så
  etasjen si forskyving ikkje forskyv fasademåla.
- **Alt som slår opp soner må hoppe over fasadevisinga**: `unifiedSnap`
  (sonehjørne og sonekant — `imgLineSnap` skal derimot verke), `snapToSegment`,
  `findWindowAtScreen`, hover for Ctrl+C, høgreklikk-oppslaget, sone-løkka i
  `draw()` og ghost-laget. Sonene ligg på heilt andre koordinatar på eit anna
  ark, så eit treff ville vore reint tilfeldig.
- **Kvart ark har si eiga kalibrering.** Ei fasadeteikning er sjeldan i same
  målestokk som planen, og det finst ingen global fasadeskala å arve.
  `calOk` har ei eiga grein: ingen `_reskalerAlleEtasjar`, sidan arket ikkje
  har noko lagra i millimeter — måla vert rekna frå biletpikslar ved kvar
  teikning og følgjer omkalibreringa av seg sjølv.
- **Arealkalibrering er skjult** i fasadevisinga (ho krev ei sone).
- **Ei ny teikning på arket tømmer måla** (`.length=0`, ikkje ei ny array —
  `measureResults`-aliaset). Dei var målte på det biletet som vart bytta ut.
- UI: `data-view` på `<html>` frå `applyViewUI()`. Klassene `.plan-only` og
  `.fasade-only` gjer resten, så ein ny fasade-berre kontroll er rein markup.
  Reglane MÅ stå etter `.embed-only`-reglane — lik spesifisitet, siste vinn,
  slik at ein embed-only-knapp som òg er plan-only forsvinn i fasadevisinga.
- **Lagring:** `fasadar`, `activeFasade` og `_nextFasadeId` er felt på
  prosjektnivå og ligg i `serialiserProsjekt()`/`lastProsjekt()` +
  `snapshot()`/`applyHistoryState()`/`getCurrentState()` (via `_fasadeMinne`).
  Eit prosjekt vert alltid opna i planvisinga. Bakgrunnsbiletet går gjennom
  same `_serBgInn()`-mellomlager som etasjane.
- Etasje-klippbordet og etasjeimporten tek **ikkje** med fasadeark — dei
  kopierer etasjar.

## Kjende manglar / ikkje implementert

- Import av eksisterande SXI
- Validering av overlappande soner
- Snap til skrå veggar (krev både vassrett og loddrett strek)
- PDF-rapport / eksport til rekneark
- Offline-modus (Three.js og pdf.js krev CDN)

---

## Easter egg — Lumon Industries

Aktiverast ved å rotere nord-kompassen **3 fulle runder samanhengande (1080°)**. Kontinuerleg rotasjon — hopp >90° nullstillar teljaren. Deaktiverast ved **1 runde (360°)** i Lumon-modus.

`window._trackNorthRotation(newNorth)` vert kalla frå `setGlobalNorth()`. Kart-modulen definerer same funksjonen på nytt — den **må** kalle vidare til den originale, elles sluttar easter-egget å verke.

---

## Prosjektinstruks til Claude

```
Eg jobbar med SXI-generatoren, eit nettbasert oppmålingsverktøy (single-file HTML) for
energimerking av norske bygg. Programmet integrerer med SIMIEN via SXI-eksport.

Programnamn: SXI-generatoren (firmaet heiter Entro AS, ikkje programmet)

Prinsipp:
- Sonekopling (groupId) påverkar berre SIMIEN-gruppering, ikkje geometri
- Global kalibrering som standard, per-etasje som opt-in — men all rekning som
  kryssar etasjar må bruke mppForZone/mppForFloor, ikkje mmPerImgPx direkte
- SXI-output må validerast mot referansefiler — SIMIEN er kresen på feltnamn
- UI-forenkling er foretrekt framfor kompleksitet
- Alltid syntax-sjekk med node --check etter endringar
- Test i nettlesar mot lokal server før du seier at noko fungerer
- Verifiser live-adressa etter publisering — ikkje stol på at pushen gjekk

Domene: sone, etasje, takvinkel, kalibrering, fasade, skiljevegg,
SXI-eksport, himling, bygningskategori, SIMIEN, energimerking

Viktig bughistorikk:
- Dørformat: <door uvalue area type gate> (IKKJE number/height/width)
- makeProfile(): siste slot = 2345-0000 (IKKJE 2345-2400)
- findWindowAtScreen() må berre søke i aktiv etasje
- bgImgScale er fjerna — autolagring og manuell lagring er no identiske
- Himling mot varm sone: type="himling" (IKKJE "vegg") — feil type gjorde at SIMIEN hang seg opp
- Alle partition-element: construction="Betongvegg, 150 mm" internal_layer="Gips 13 mm" (referanseverdi frå Test1000.sxi)
- SXI-versjon: "8.1.0.15" (ikkje "8.0.34.3") — oppdater ved kvar ny SIMIEN-versjon
- himling/gulv-partisjonar: bruk nextId('partition') — IKKJE nextId('roof')/nextId('floor'). SIMIEN brukar ID-prefiksen til å slå opp elementtype, og roof#/floor# prefiks på ein <partition> gjer at SIMIEN heng ved sletting
- calPts må lagrast i biletkoordinatar, ikkje skjermkoordinatar
- floorDx/floorDy finst ikkje lenger — bruk floorDxImg/floorDyImg (biletpikslar)
- Utjamningsfilter må kopiere kanten av vindauget, ikkje la han stå som nullar
- Vindaugsbreidde: bruk fitSpanT/winSpanPx, ALDRI w.t1-w.t0 (som berre er senteret)
- Vindauge med antal>1 er EITT SIMIEN-element, men antal stk på veggen. Kvar stk
  har si plassering i w.posT; bruk winCentres/winSpansPx, og endra antal berre
  gjennom winSetAntal. posT skal ALDRI følgje med ein kopi (kopi/limeinn/del sone
  set posT:null) — sjå «antal er eitt SIMIEN-element og mange stk på veggen»
- Ei ny gruppe: det teikna stykket står der det vart teikna, resten vert spreidde
  utover HEILE veggen derifrå (winPosFraKlikk). Utan posT: jamn rekkje (rute på
  segLen/n, stk midt i ruta), aldri klumpa rundt klikkpunktet. Det er den tettaste fordelinga som
  finst, så stykka overlappar aldri når dei får plass — og når dei ikkje får
  plass, seier winForTrongt frå tre stader i staden for å teikne ein stabel
- Omkalibrering må skalere w.breddeMm og rekne gavlflater på nytt — elles slutta
  vindauga å følgje bygget, og glasandelen i SXI vart stille feil
- PDF-renderskala er adaptiv (pdfRenderScale): eit fast 4.0 gav 288 DPI uansett
  papirformat, så ei tett teikning pressa ned på 800×600 pt fekk berre 3200×2400 px
  og strekar på 0,07 pt vart blass gråtone. No siktar vi på ~48 Mpx uansett format
- renderFasadeView() er daud kode: det finst ingen #fasadeWrap i DOM-en
- Autolagringa enkoda bakgrunnsbiletet på nytt ved kvar lagring. Med den
  adaptive PDF-skalaen (48 Mpx) vart det ~600 ms frys per etasje kvart minutt.
  Sjå `f._bgCache` i `serialiserProsjekt()`
- updateResults() sin verkelege kostnad er layout, ikkje DOM-bygging — sjå
  «Ytelse» før du prøver å optimalisere `createElement`-løkkene
- Etasje henta inn frå eit anna prosjekt må ta med skalaen sin (ownCal), elles
  endrar areala seg av seg sjølve. groupId og tekniskeSystem må IKKJE følgje
  med som dei er — sjå «Kopier etasje mellom prosjekt»
- Tiltak (<measure>) les zonesXml tilbake med DOMParser i staden for eit
  register. Kopiane har ingen born, og attributtrekkjefølgja er ulik per tag —
  sjå «Tiltak (<measure>)». <partition>/<cellar> vert ikkje råka; eit tomt
  tiltak skal meldast, aldri silast bort i stillheit
- Tiltak utan included_measures_ids + <profitsim> blir ståande urekna i SIMIEN.
  profitsim har id-prefiks `profit-evaluation`, ikkje taggnamnet
- Fasadeark er IKKJE etasjar. saveFloorState/syncFloorState har vakter for
  viewMode, og alt som slår opp soner må hoppe over fasadevisinga — sjå
  «Fasadeteikningar»
- Tak og golv kan delast opp i flater med kvar sin type. Udelt sone MÅ gi
  identisk SXI som før (verifisert med full XML-samanlikning) — sjå «Oppdeling
  av tak og golv». Ei himling er <partition>, ikkje <roof>, uansett kva lag ho
  ligg i, og perimeter/kjellervegg reknast per delflate med flateKantLenM
- Ei tak- eller golvflate som vert sletta skal ALDRI berre forsvinne — arealet
  går til naboflata, elles ville sona stått utan tak eller golv i SXI-fila utan
  at nokon såg det. Eit hòl midt i flata er eit nøkkelhòl med motsett omløp;
  brua skal ikkje teiknast (flateKonturar)
```
