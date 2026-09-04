# SXI-generatoren

Nettbasert oppmålingsverktøy for energimerking av norske bygg. Du lastar opp ei
planteikning, teiknar soner som polygon, og eksporterer ein SXI-fil som kan
opnast direkte i **SIMIEN**.

**▶ [Opne verktøyet](https://entroknut.github.io/energimerking-2/)** — køyrer i
nettlesaren, ingen installasjon.

Utvikla i Entro AS. Versjon 3.0.2.

---

## Arbeidsflyt

Brukar du verktøyet inne i **EntroPi**, sjå
[docs/bruksrettleiing.md](docs/bruksrettleiing.md) — der står lagring på bygget,
autolagring og tekniske system frå bygget forklart steg for steg.

1. **Last opp** planteikninga (`↑ Last opp`) — PDF eller bilete.
2. **Kalibrer** (`⊕ Kalibrer`) så programmet veit kor mange millimeter éin
   biletpiksel er. Utan dette blir alle areal feil.
3. **Teikn soner** (`⬡ Sone`) — klikk hjørne for hjørne, dobbelklikk for å
   fullføre.
4. **Legg til vindauge og dører** (`▭ Vindauge/dør`) på fasadane.
5. **Fyll ut** bygningskategori, etasjehøgd, U-verdiar og n50 per sone i
   sidepanelet.
6. **Eksporter** (`⬇ Eksporter SXI`) og opne fila i SIMIEN.

Lagre undervegs med `Ctrl+S` — det gir ei `.entro`-fil du kan halde fram med
seinare. Programmet autolagrar òg lokalt i nettlesaren kvart minutt.

## Kalibrering

Tre metodar, alle under `⊕ Kalibrer`:

| Metode | Slik gjer du det |
|---|---|
| **Lengde** | Klikk start → slutt på ei kjend lengd, tast inn talet i mm |
| **Areal** | Klikk på ei sone du alt veit arealet av |
| **Målestokk** | Vel 1:100, 1:200 osv. — ingen klikking på teikninga |

Målestokk-metoden krev papirformatet. Det blir oppdaga automatisk: for PDF frå
den fysiske sidestorleiken (eksakt), for PNG/JPEG frå DPI-metadata om dei finst.
Elles vel du format sjølv (A0–A4).

Kalibreringa er **global** som standard, men kan settast per etasje der
teikningane har ulik målestokk.

## Funksjonar

**Soner og geometri**
- Snapping til sonehjørne, sonekant og **veggkryss i sjølve planteikninga**.
  Slå av med `⌖ Snap`. Skrå veggar får ikkje snap — det er med vilje, ingen
  snap er betre enn feil snap.
- Hald `Shift` for å låse til 90°/45°.
- Skiljeveggar mot andre soner, med samanslåing av fasadar (`⊞ Slå saman fasadar`).
- Takflater og gavlflater med vinkel og retning.
- **Del sone** — høgreklikk og teikn ei linje tvers gjennom.
- **Kopling av soner** — samlar soner i SIMIEN utan å slå saman geometrien.
- Overstyr areal, omkrins eller einskilde veggsegment manuelt der oppmålinga
  krev det.
- **Kontrollmål** avstandar med måleverktøyet — klikk start og slutt. Det er
  reint kontrollarbeid og påverkar ikkje SXI-eksporten. `Esc` fjernar
  målingane.

**Fleire etasjar**
- `+ Etasje` legg til ei ny etasje med eiga teikning og eiga etasjehøgd.
- Etasjen under blir vist som ghost, og kan forskyvast til å ligge rett.

**Visualisering**
- `⬡ 3D` byggjer ein 3D-modell av bygget, stakka etter etasjehøgdene, med
  planteikning og wireframe som visingsval.
- Kartmodul med adressesøk, bygg i nærleiken og automatisk høgd over havet.
- Kompass for å setje nord — som styrer solorienteringa.

**AI-analyse (valfri)** — `✦ Start analyse` les planteikninga og føreslår soner
automatisk, som du kan godta eller forkaste. Krev din eigen Anthropic
API-nøkkel; sjå [Personvern og nøklar](#personvern-og-nøklar).

## Eksport

| Format | Bruk |
|---|---|
| **`.sxi`** | Importerast i SIMIEN. Inneheld soner, konstruksjonar, vindauge, dører, tak, gulv, skiljekonstruksjonar og energimerke per bygningskategori. |
| **`.entro`** | Prosjektfila til dette verktøyet — planteikningar, kalibrering og alle soner. Bruk denne for å halde fram arbeidet. |

## Tastatursnarvegar

Trykk `?` i programmet for same oversikt.

**Generelt**

| | |
|---|---|
| `Ctrl+Z` / `⌘Z` | Angre |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Gjere om |
| `Ctrl+S` | Lagre prosjekt |
| `Ctrl+O` | Opne prosjekt |
| `Esc` | Avbryt / tilbake til navigering |
| `?` | Vis snarvegar |

**Teikning**

| | |
|---|---|
| Klikk | Legg til hjørne |
| `Shift` + klikk | Lås til 90°/45° |
| Dobbelklikk, eller klikk startpunktet | Fullfør sona |
| `Backspace` / `Delete` | Fjern siste punkt |

**Redigering**

| | |
|---|---|
| Dra hjørne | Flytt hjørne |
| Klikk midtpunkt | Legg til hjørne |
| Høgreklikk hjørne | Slett hjørne |
| Dra vindauge (navigeringsmodus) | Flytt langs fasaden |
| `Backspace` / `Delete` over vindauge | Slett vindauge/dør |

**Kopiering**

| | |
|---|---|
| `Ctrl+C` over sone | Kopier sona |
| `Ctrl+C` over vindauge/dør | Kopier vindauget/døra |
| `Ctrl+V` over sone | Lim inn sone på aktiv etasje |
| `Ctrl+V` over fasade | Lim inn vindauge/dør på fasaden |

**Navigering**

| | |
|---|---|
| Scroll | Zoom |
| Klikk + dra | Flytt planteikninga |
| Høgreklikk sone | Kontekstmeny |

## Køyre lokalt

Heile programmet er **éi HTML-fil** utan byggsteg. Start likevel ein lokal
server framfor å opne fila direkte — `file://` sperrar localStorage i mange
nettlesarar, så autolagringa sluttar å verke:

```bash
python -m http.server 8742
```

Opne så http://localhost:8742/

## Krav

**Nettlesar:** ein moderne Chromium-basert nettlesar er tilrådd. `Ctrl+S`
brukar `showSaveFilePicker` der den finst, slik at du kan velje mappe og
filnamn; elles fell den tilbake til vanleg nedlasting.

**Nettilgang:** avhengnadene blir henta frå CDN, så verktøyet fungerer ikkje
offline:

| Avhengnad | Brukt til |
|---|---|
| Three.js r128 | 3D-visinga |
| pdf.js 3.11.174 | Lesing av PDF-teikningar |
| Mapbox GL | Kartmodulen (inlina i fila) |
| Mapbox API | Adressesøk og høgd over havet |
| Google Fonts | Typografi |
| Anthropic API | Berre ved AI-analyse |

## Personvern og nøklar

**Planteikningane dine blir ikkje lasta opp nokon stad.** All oppmåling skjer
lokalt i nettlesaren, og prosjektfilene blir lagra på di eiga maskin.

Tre unntak verdt å kjenne til:

- **Autolagring** legg planteikningane som JPEG i `localStorage`. Dei ligg
  altså i nettlesarprofilen din på den maskina du jobbar på.
- **Kartmodulen** sender adressesøk og koordinatar til Mapbox når du brukar
  han.
- **AI-analyse** sender eit nedskalert bilete av planteikninga til Anthropic.
  API-nøkkelen blir lagra i `localStorage` og sendt direkte frå nettlesaren.
  Bruk difor ein personleg nøkkel du kan tilbakekalle, ikkje ein delt
  produksjonsnøkkel. Funksjonen er heilt valfri — resten av verktøyet fungerer
  utan.

Mapbox-tokenen i kjeldekoden er ein offentleg `pk.`-token, som Mapbox er meint
å eksponere i klientkode.

## Kjende manglar

- Import av eksisterande SXI-filer
- Validering av overlappande soner
- Snap til skrå veggar
- PDF-rapport og eksport til rekneark
- Kopiering av ei heil etasje (må gjerast sone for sone)
- Offline-modus

## Utvikling

| Grein | Rolle |
|---|---|
| `dev` | Alt arbeid skjer her |
| `main` | Publiserer til GitHub Pages |

All kode ligg inline i `index.html`, fordelt på **to** `<script>`-blokker —
syntakssjekk må dekke begge. Sjå [claude.md](claude.md) for datamodell,
kritiske invariantar og bughistorikk. Les den før du endrar noko som rører
kalibrering, segment-indeksering eller SXI-formatet.

---

© Entro AS. Repoet har ingen lisensfil, så koden er som standard opphavsrettsleg
verna sjølv om han ligg offentleg tilgjengeleg.
