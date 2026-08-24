# Entro — Prosjektkontekst for ny Claude-sesjon
**Programnamn:** SXI-generatoren  
**Firma:** Entro AS  
**Versjon:** 3.6.0 | Single-file HTML applikasjon

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
  takflater: [{pts, vinkel, retning, name}],
  gavlflater: [{segIdx, profile, area, lenM, dir}],
  groupId,        // kopling mellom soner (berre SIMIEN-gruppering)
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

### 7. Omkalibrering: alt som er teikna må følgje bygget

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

Målt med 36 soner. Berre ~2 ms av 110 ms i `updateResults` er rekning — resten er DOM-bygging (~3 ms per sonekort).

Fallgruver som er retta, og som ikkje må innførast på nytt:

- **Kompass-draginga** kalla `updateResults()` + `renderTable()` på kvar musrørsle (110 ms per steg). Teiknar no berre lerretet under draginga; full oppdatering på slepp.
- **Etg.høgde/Nord-felta** bygde alt på kvart tastetrykk. No strupt via `tungOppdateringSnart()` (220 ms), med straks oppdatering på blur/Enter.
- **Tabellfana** er skjult som standard. `renderTable()` returnerer med ein gong når `#tablePanel` er skjult; fanebytet renderer.

`draw()` og snapping er raske (1–2 ms per musrørsle) — ikkje bruk tid der.

**Står att:** ei vanleg redigering byggjer alle sonekorta på nytt (~96 ms ved 36 soner). Å fikse det krev at berre det endra kortet vert bygd om. Vurdert, men ikkje gjort — ein mellomlagringsmekanisme kan gi utdaterte tal om ein bommar på eit felt (t.d. `getTotalAreaM2`, som avheng av *andre* soner).

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
brukar dei same to, så dei kan ikkje lenger komme i utakt.

**Manuell (.entro):** `showSaveFilePicker` der nettlesaren støttar det, så brukaren vel mappe og namn. Framlegg til filnamn er `foreslaaFilnamn()` (adressa utan postnummer/poststad). Fallback til vanleg nedlasting.

**Autolagring (localStorage):** `serialiserProsjekt({mime:'image/jpeg',qual:0.85})`, kvart 60. sekund når `isDirty`. `markClean()` **må** kallast etter lagring — elles re-enkodar den alle bileta i full oppløysing kvart minutt for alltid.

**EntroPi (iframe):** brua sender PNG — fila på bygget er den einaste kopien, og JPEG ville tapt kvalitet på nytt for kvar opne-lagre-runde.

Alle felt som skal overleve må leggjast til **fem** stader: `snapshot()`, `applyHistoryState()`, `getCurrentState()`, `serialiserProsjekt()` og `lastProsjekt()`.

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
  fjerna. Det er einaste måten EntroPi kan åtvare om ulagra endringar.
- **Autolagring til bygget står på som standard** (2 min, `autosaveMs` overstyrer,
  `0` slår av). Fyrste endringa i økta går etter 10 s, og **berre den fyrste** —
  elles ville kvar lagring gjere prosjektet reint, neste endring skulle lagrast
  straks, og intervallet vart i praksis 10 s for resten av økta.
  Den lokale autolagringa til localStorage står ned medan dette er på
  (`EntroHost.autosaves()`). Dei kan ikkje køyre side om side: `autosave()`
  kallar `markClean()`, så lokalkopien ville nulla `isDirty` før lagringa til
  bygget fekk sjå han, og bygget ville aldri blitt oppdatert.

---

## Kjende manglar / ikkje implementert

- Import av eksisterande SXI
- Validering av overlappande soner
- Snap til skrå veggar (krev både vassrett og loddrett strek)
- PDF-rapport / eksport til rekneark
- Kopier heile etasjen (må gjerast sone for sone)
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
- Omkalibrering må skalere w.breddeMm og rekne gavlflater på nytt — elles slutta
  vindauga å følgje bygget, og glasandelen i SXI vart stille feil
- renderFasadeView() er daud kode: det finst ingen #fasadeWrap i DOM-en
```
