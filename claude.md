# Entro — Prosjektkontekst for ny Claude-sesjon
**Programnamn:** SXI-generatoren  
**Firma:** Entro AS  
**Versjon:** 3.0.2 | Single-file HTML applikasjon

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

Appversjonen står som `>v3.0.2</span>` (line 629), så ankeret er det som gjer
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
remapSegsAfterInsert(z, i)    // kall ETTER z.pts.splice(i+1,0,pt)
remapSegsBeforeDelete(z, pi)  // kall FØR z.pts.splice(pi,1) — treng gamle lengder
sanitizeZoneSegRefs(z)        // rydd ugyldige referansar ved lasting
```

### 3. Ghost-forskyving

`floorDxImg`/`floorDyImg` er i **biletpikslar**. Dei gamle felta `floorDx`/`floorDy` (skjermpikslar) finst ikkje lenger — dei vert berre lesne ved migrering av gamle `.entro`-filer. All teikning skjer på `(ix + floorDxImg) * sc + offX`, så alt som reknar skjermposisjon må ta med forskyvinga (dette råka både kartet og `zoomToZone`).

### 4. XML-escaping

All brukarstyrt tekst i SXI-eksporten må gjennom `xesc()`. Eit prosjektnamn med `&` gir elles ugyldig XML som SIMIEN nektar å opne.

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

**Manuell (.entro):** `showSaveFilePicker` der nettlesaren støttar det, så brukaren vel mappe og namn. Framlegg til filnamn er `prosjektAdresse` utan postnummer/poststad. Fallback til vanleg nedlasting.

**Autolagring (localStorage):** JPEG 85%, kvart 60. sekund når `isDirty`. `markClean()` **må** kallast etter lagring — elles re-enkodar den alle bileta i full oppløysing kvart minutt for alltid.

Alle felt som skal overleve må leggjast til **fem** stader: `snapshot()`, `applyHistoryState()`, `getCurrentState()`, `autosave()`/`restoreAutosave()`, og `.entro` lagre/laste.

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
```
