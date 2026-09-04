# EntroPi-integrasjon — lagre prosjektet rett på bygget

SXI-generatoren køyrer som verktøy i ein iframe inne i EntroPi
(`https://entroknut.github.io/energimerking-2/`). Utan integrasjon må brukaren
laste ned `.entro`-fila lokalt og laste henne opp att neste gong. Denne brua
gjer at «Lagre» sender prosjektet til EntroPi, som legg det på bygget, og at
prosjektet som ligg på bygget kjem automatisk inn når verktøyet vert opna.

**Verktøyet eig ingen lagring.** Det kan ingenting om innlogging, kundar eller
bygg — det sender ei ferdig `.entro`-fil til vertssida og tek imot ei tilbake.
All autentisering, tilgangsstyring og lagring skjer i EntroPi, der brukaren
alt er innlogga. Difor treng verktøyet ingen API-nøklar, og GitHub Pages-
hostinga kan halde fram som før.

---

## Slik heng det saman

```
EntroPi (entro-digital.vercel.app)          iframe (github.io)
│                                            │
│  ◀── sxi:ready ────────────────────────────┤  verktøyet er lasta
├──── sxi:init {bygg, project} ─────────────▶│  opnar prosjektet frå bygget
│  ◀── sxi:state {dirty} ────────────────────┤  ulagra endringar?
├──── sxi:request-save ─────────────────────▶│  (t.d. når modalen vert lukka)
│  ◀── sxi:save {blob, meta, filename} ──────┤  brukaren trykte «Lagre»
├──── sxi:save-result {ok} ─────────────────▶│  lagra — verktøyet blir «reint»
│  ◀── sxi:request-systems ──────────────────┤  «Hent tekniske systemer»
├──── sxi:systems {systems} ────────────────▶│  systema som ligg på bygget
│  ◀── sxi:export-sxi {blob} ────────────────┤  SXI-fila til SIMIEN (valfritt)
```

Meldingar går med `window.postMessage`. `.entro`-fila vert sendt som ein
**Blob**, ikkje som ein streng — han går rett vidare til opplasting, og
strukturert kloning slepp å kopiere fleire megabyte som JSON-tekst.

---

## Protokoll

Alle meldingar er objekt med `type`. Frå verktøyet har dei i tillegg
`source:'sxi-generator'` og `protocol:1` — filtrer på dette i EntroPi, elles
plukkar lyttaren opp meldingar frå andre bibliotek (Mapbox, React DevTools).

### Verktøyet → EntroPi

| type | felt | når |
|---|---|---|
| `sxi:ready` | `version` | verktøyet er lasta. Krev `?embed=1` i iframe-URL-en (sjå under). Vert sendt fleire gonger (0/250/750/2000/5000 ms) til init kjem, så det er trygt om React monterer lyttaren seint. |
| `sxi:state` | `dirty`, (`ready`) | ulagra endringar har endra seg. Bruk til å åtvare før modalen vert lukka. |
| `sxi:save` | `requestId`, `auto`, `filename`, `bytes`, `blob`, `meta` | brukaren trykte «Lagre» (eller EntroPi bad om det). **Må** svarast med `sxi:save-result`. |
| `sxi:request-systems` | `requestId` | brukaren opna «Hent tekniske systemer». Svar med `sxi:systems`. Verktøyet ventar 12 s, så gir det opp og seier det til brukaren. |
| `sxi:export-sxi` | `filename`, `bytes`, `blob`, `meta` | SXI-fila til SIMIEN vart eksportert. Kjem berre om init hadde `wantsSxi:true`. Krev ikkje svar. |

`meta` på `sxi:save`: `{floors, zones, braM2, adresse, savedAt, appVersion}` —
nok til å vise «3 etasjar · 12 soner · 2 480 m²» på byggkortet utan å opne fila.

### EntroPi → verktøyet

| type | felt | verknad |
|---|---|---|
| `sxi:init` | `bygg`, `project`, `wantsSxi`, `autosaveMs`, `saveLabel` | slår på innbygd modus. Send han som svar på `sxi:ready`. |
| `sxi:load` | `project` | byt til eit anna prosjekt medan verktøyet står ope (t.d. ein tidlegare versjon). |
| `sxi:request-save` | `requestId`, `auto` | ber verktøyet lagre no. Kvar førespurnad endar i ein `sxi:save` med same `requestId` — kjem han medan ei lagring alt går (t.d. ei autolagring), vert han lagd i kø og send så snart den fyrste er ferdig. |
| `sxi:save-result` | `requestId`, `ok`, `message` | resultatet av lagringa. Utan svar innan 45 s gir verktøyet opp og ber brukaren prøve igjen. |
| `sxi:systems` | `requestId`, `ok`, `systems`, `message` | dei tekniske systema på bygget. Svar på `sxi:request-systems`, men kan òg sendast uoppmoda — då oppdaterer verktøyet lista si (og eit ope vindauge) med ein gong. |

Felta i `sxi:init`:

- `bygg: {id, namn, adresse, byggeaar}` — `namn` vert vist som brikke i
  verktøylinja, så brukaren ser kvar lagringa hamnar. `id` **må vere stabil for
  same bygg**: han stemplar den lokale sikkerheitskopien, slik at ulagra arbeid
  berre vert tilbydd att på det bygget det høyrer til. `adresse` og `byggeaar`
  er **framlegg** som vert fylte inn i verktøyet (sjå under). `byggeaar` må
  vere eit årstal mellom 1800 og 2100; alt anna vert ignorert, sidan eit
  vrøvltal ville gitt feil standard-U-verdiar utan at nokon såg det.
- `project` — `.entro`-innhaldet, som **Blob, streng eller ferdig parsa
  objekt**. `null` for eit bygg utan prosjekt.
- `wantsSxi: true` — send også SXI-fila til EntroPi ved eksport.
- `autosaveMs` — intervall for automatisk lagring til bygget.
  **Utelate ⇒ 120 000 (2 min), som er standard.** `0` slår det av; alt anna
  vert løfta til minst 30 000, slik at ein feilskriven verdi ikkje lagrar i eit
  kjør. Kvar autolagring skriv ei ny fil, så vel eit tal som passar med kor
  mange versjonar de vil ta vare på.
- `saveLabel` — tekst på lagreknappen (standard «Lagre på bygget»).

### Autolagring til bygget

Autolagringa står **på som standard** i innbygd modus — verten treng ikkje
gjere noko. Ho oppfører seg slik:

- **Fyrste endringa i økta går til bygget etter 10 sekund.** Ein skal ikkje
  kunne miste den fyrste halvtimen med arbeid fordi intervallet ikkje hadde
  slått til enno.
- **Deretter kvart intervall**, men berre når det finst ulagra endringar. Er
  prosjektet reint, går det ingen meldingar.
- Eingongslagringa skjer **berre éin gong** per økt. Elles ville kvar lagring
  gjere prosjektet reint, neste endring skulle lagrast straks, og intervallet
  vart i praksis 10 sekund for resten av økta.
- Autolagringar er merkte `auto:true` i `sxi:save`. Dei skal svarast med
  `sxi:save-result` som alle andre, men verten bør ikkje vise varsel for dei.

Den lokale autolagringa til `localStorage` **står ned** medan dette er på. Dei
kan ikkje køyre side om side: den lokale lagringa kallar `markClean()`, så ho
ville nulla «ulagra endringar» før lagringa til bygget fekk sjå det, og bygget
ville aldri blitt oppdatert. Slår verten autolagringa av med `autosaveMs: 0`,
tek den lokale over att, slik at det ikkje står heilt utan.

### Lokalkopien er eit nett under lagringa til bygget

I innbygd modus er fila på bygget den eigentlege lagringa. `localStorage` er
berre eit nett for det som **ikkje rakk fram**, og heile livsløpet til kopien
heng saman med lagringa på bygget:

| når | kva skjer med lokalkopien |
|---|---|
| ved `pagehide` med ulagra endringar | han vert skriven, stempla med `bygg.id` |
| ved `autosaveMs: 0` (verten har slått av) | den lokale autolagringa tek over, òg stempla |
| ved `sxi:save-result {ok:true}` | han vert **sletta** — bygget har fila no |
| ved `sxi:init` / `sxi:load` | han vert vurdert (sjå under) og enten tilbydd, sletta eller lagd att |

Stempelet er nødvendig fordi `localStorage`-nøkkelen er **den same for heile
nettlesaren**. Utan det kunne arbeid på eitt bygg blitt tilbode att på eit anna.

Ved opning vurderer brua kopien slik:

- **Feil bygg** ⇒ ingen ting skjer. Kopien vert liggjande, så han kan tilbydast
  der han høyrer heime.
- **Eldre enn `project` frå verten** ⇒ sletta i stillheit. Bygget har alt ein
  nyare versjon, og då er kopien berre støy. (Marginen er 5 sekund, så ei
  lagring som var undervegs då sida vart lukka ikkje blir tolka som nytt
  arbeid.)
- **Rett bygg og nyare** ⇒ brikka «Ulagra arbeid som ikkje nådde bygget» med
  knappen «Hent inn att». Å hente inn markerer prosjektet ulagra, så arbeidet
  går vidare til bygget ved neste autolagring — det blir ikkje liggjande lokalt
  ein gong til.

Verten treng ikkje gjere noko for dette; det einaste kravet er at `bygg.id` er
stabil for same bygg.

Er tilbodet reist før `sxi:init` rakk fram, vert det fjerna ved init og
vurdert på nytt med bygget kjent. Verktøyet held seg heilt unna det lokale
tilbodet så lenge `?embed=1` står i URL-en — då eig brua det.

Det er `sxi:state {dirty}` som gir verten grunnlag for å åtvare før modalen
vert lukka; `postMessage` rekk ikkje fram når iframen forsvinn.

### Åtvaring om ulagra endringar

Verktøyet ligg i ein iframe og kan ikkje stoppe navigasjon i EntroPi. Skal
brukaren åtvarast før han går ut av energimerkinga med ulagra endringar, må det
byggjast på **EntroPi-sida** — verktøyet gir grunnlaget:

1. Følg `sxi:state {dirty}`. Han kjem ved init og ved kvar endring i tilstanden,
   så verten har alltid ferskt svar på «finst det ulagra endringar?».
2. Er `dirty` sann når brukaren navigerer bort: vis dialogen. «Lagre og gå ut»
   sender `sxi:request-save` med ein eigen `requestId` og ventar på
   `sxi:save-result` for **den** id-en før navigasjonen held fram.
3. Kvar `sxi:request-save` får svar, også når ei autolagring var i gang då han
   kom. Verten trenger ikkje ta høgd for kollisjonen sjølv.

`beforeunload` er ikkje til hjelp: han fyrer ikkje når ein iframe vert fjerna.
Det er heile grunnen til at `sxi:state` finst.

### Verdiar som vert fylte inn frå bygget

Bygget i EntroPi har alt fleire av dei same opplysningane som verktøyet spør
om. Dei som EntroPi sender i `bygg` vert fylte inn av seg sjølv, slik at
brukaren ikkje må tasta dei på nytt:

| felt i `bygg` | hamnar i verktøyet |
|---|---|
| `adresse` | `prosjektAdresse` → adressefeltet i kartet og i SXI-dialogen, framlegg til filnamn, og prosjektnamnet (sjå under) |
| `byggeaar` | `byggeaar` på kvar sone → standard U-verdiar, TEK-kode og SFP i SXI-eksporten |

Prosjektnamnet i SXI-dialogen er **gateadressa** — adressa utan postnummer og
poststad («Nordre gate 3, 7011 Trondheim» → «Nordre gate 3»). Det er ikkje eit
eige felt i protokollen: `gateadresse()` utleier det av adressa, og same
regelen gjeld utanfor EntroPi når adressa kjem frå kartsøket.

Dette er **framlegg, aldri fasit**. Regelen er den same for alle felt, og han
er verdt å halde når lista veks:

- Verktøyet fyller berre inn der feltet står **tomt**. Eit tal brukaren har
  skrive sjølv vert aldri overskrive — heller ikkje neste gong prosjektet vert
  opna, sidan det då ligg i `.entro`-fila.
- Nye soner arvar byggeåret frå bygget, så ein slepp å setje det per sone.
- Verdiane kjem med `sxi:init` kvar gong verktøyet vert opna, så dei vert
  **ikkje** serialiserte. Det som ligg i prosjektfila er brukaren sine eigne
  verdiar (`prosjektAdresse`, `z.byggeaar`) — altså slepp dei den femdelte
  lagringsregelen.
- Eit prosjekt som er lagra før feltet fanst får verdien frå bygget ved
  opning, utan at prosjektet vert markert som endra.

I koden: `piBygg` held verdiane frå verten (brua er einaste skrivar), og
`_fyllFraPi()` avgjer kva som faktisk vert fylt inn. Eit nytt felt av same
slag skal berre inn i desse to — pluss der feltet har ein eigen standardverdi,
som `finishZone()` for nye soner.

### Tekniske system frå bygget (beta)

Bygget i EntroPi har alt ei liste med tekniske system (Ventilasjon, Varme,
Kjøling, Belysning, Automasjon …). Knappen **«⚙ Hent tekniske systemer»** i
verktøylinja opnar eit eige vindauge der desse systema står på venstre side og
sonene i energimerkinga på høgre, og der ein dreg system over på soner.

Knappen er `.embed-only`, så heile funksjonen finst berre inne i EntroPi.

**Verten svarar på `sxi:request-systems` med `sxi:systems`:**

```js
{ type:'sxi:systems', requestId, ok:true, systems:[
    {id:'vent-201362', kategori:'Ventilasjon', namn:'201.362'},
    {id:'varme-fjern', kategori:'Varme',       namn:'Fjernvarme'}
] }
```

- `id` må vere **stabil** — koplinga til sona lagrar han. Manglar `id`, lagar
  verktøyet ein av `kategori/namn`, og då mistar koplinga festet om namnet
  vert endra i EntroPi.
- `kategori` styrer grupperinga i lista, og **kva som blir vist**: berre
  **ventilasjon, varme og kjøling** påverkar energimerkinga, så resten
  (belysning, automasjon, gatevarme …) vert sila bort. Verten kan sende heile
  lista si — verktøyet filtrerer, og seier i vindauget kor mange som ikkje er
  viste, slik at ingenting forsvinn i stillheit. Samanlikninga er på
  «byrjar med» etter at ø er normalisert, så «Varmepumpe» er med og
  «Gatevarme» ikkje.
- `namn` er det brukaren ser — og det blir namnet på `<ventilation>`-elementet
  i SXI-fila, så anlegget er til å kjenne att i SIMIEN. `undertittel` og `ikon`
  (eitt teikn) er valfrie.
- Feltnamna kan like godt vere `name`/`category`/`subtitle` — verktøyet
  normaliserer, så EntroPi kan sende radene sine som dei ligg.
- Same `id` to gonger vert rekna som same system, og duplikatet vert forkasta.
- Svarar verten ikkje i det heile (t.d. før dette er implementert), seier
  vindauget det etter 12 sekund i staden for å stå og hente for alltid.

#### Tal på ventilasjonsanlegga (går inn i SXI-fila)

Eit ventilasjonssystem kan sende med tal som overstyrer normverdiane i
`<ventilation>`:

| felt i `sxi:systems` | eining | hamnar i SXI som |
|---|---|---|
| `tilluft`, `avtrekk` | m³/h | `supply_air`, `extract_air` |
| `tilluftRedusert`, `avtrekkRedusert` | m³/h | `supply_airflow_reduced`, `extract_airflow_reduced` |
| `gjenvinning` | % (`78`) eller brøk (`0.78`) | `efficiency_exchanger` + dellastkurva |
| `sfp` | kW/(m³/s) | `sfp_100` + dellastkurva |

Alle er valfrie, og dei blandast **per felt**: sender de SFP men ikkje
gjenvinningsgrad, brukar verktøyet SFP-en dykkar og normverdien for
gjenvinning. Utan tal i det heile står heile elementet på norm som før —
ei fil frå eit prosjekt utan EntroPi-tal er teikn for teikn den same.

Reglar det er verdt å kjenne:

- **Luftmengd vert delt på arealet anlegget betjener.** SIMIEN vil ha
  m³/(h·m²), og verktøyet kjenner arealet til alle sonene systemet ligg på —
  også på tvers av etasjar. Eitt aggregat gir då same spesifikke luftmengd i
  alle sonene sine. Sender de ferdig spesifikk luftmengd, sei det med
  `luftEining: 'm3/(h·m2)'` — elles vert tala feil med ein faktor på arealet.
- **Legg de anlegget på ei ny sone, endrar luftmengda seg i alle dei andre.**
  Det er meint slik: same luftmengd fordelt på meir areal.
- `gjenvinning: 0` gir `heat_exchanger="no"` — altså eit aggregat utan
  varmegjenvinning, ikkje eit aggregat med 0 % verknadsgrad.
- **Dellastkurvene vert skalerte, ikkje funne opp.** SFP-en fell til
  90/80/70/60 % ved 80/60/40/20 % luftmengd, og gjenvinningskurva held same
  forma som referansefila har rundt 0,80.
- **Luftmengd utanfor drift gjettar vi ikkje.** Utan `tilluftRedusert` står
  normverdien, men aldri høgare enn den luftmengda anlegget faktisk har. Vi
  skalerer den *ikkje* ned etter forholdet mellom design og norm: ei
  nattsenking vi ikkje veit om ville gjort energimerket betre enn vi har
  grunnlag for å seie. `0` er ein gyldig verdi og tyder at anlegget står av.
- Tal utanfor rimeleg område vert forkasta og normverdien brukt: SFP må vere
  0–20, gjenvinningsgrad 0–100 %. Eit vrøvltal frå verten skal ikkje gå rett
  inn i energiberekninga.
- Har ei sone fleire ventilasjonssystem, brukar SXI-en **det fyrste**.
- Driftstid, tilluftstemperatur, varme- og kjølebatteri kjem framleis frå
  bygningskategorien — ikkje frå EntroPi enno.

Tala vert **lagra saman med koplinga** på sona, så SXI-eksporten verkar utan
EntroPi (frå ei `.entro`-fil, i ei anna økt). Ved kvar henting vert dei lagra
kopiane oppdaterte mot lista frå verten, og vindauget seier kor mange
koplingar som fekk nye tal.

**Koplinga er verktøyet sitt, ikkje verten sitt.** Ho vert lagra på sona som

```js
z.tekniskeSystem = [{id, namn, kategori}]
```

og følgjer `.entro`-fila, angre-historikken og lagringa på bygget som alle
andre sonefelt. Namn og kategori vert lagra **saman med** id-en med vilje: eit
system som vert sletta i EntroPi skal framleis vere leseleg i prosjektet, og
det står då med stipla kant i vindauget.

- **Kopla soner (`groupId`) er éi sone** i vindauget — same regel som
  SXI-eksporten brukar. Eit system som vert lagt der, vert lagt på alle
  instansane, slik at koplinga ikkje kan komme i utakt mellom etasjar.
- Drag og slepp er hovudvegen; klikk på systemet og deretter sona gjer det
  same (for peikeflater der drag er tungt).
- Koplinga påverkar **ikkje** geometri, areal eller SXI-eksporten. Ho er
  dokumentasjon inntil vi veit kva SIMIEN skal ha av det.

Verten kan sende `sxi:systems` uoppmoda når som helst — t.d. når nokon legg
inn eit nytt system i EntroPi medan verktøyet står ope.

#### Verdiar som skal med i SXI-fila seinare

Luftmengder, gjenvinningsgrad og SFP for ventilasjon er **på plass** — sjå
«Tal på ventilasjonsanlegga» over. Det som står att, kryssa mot det SXI-en
faktisk har av felt og kva verktøyet gjettar i dag:

**Ventilasjon** — resten av `<ventilation>`:

| Verdi frå EntroPi | Felt i SXI | Kva som skjer no |
|---|---|---|
| Vekslartype (roterande/plate/væskekopla) | `hygroscopic_exchanger`, `humidity_efficiency`, `frost_protection` | roterande-liknande, frostsikring av |
| Systemtype (balansert/avtrekk) og CAV/VAV | `type`, `norm_airflow` | alltid balansert CAV |
| Driftstid (på/av, helg) | `usage_ventilation`-profilen, `usage_holiday` | norm per bygningskategori |
| Tilluftstemperatur | `supply_temp`, `min/max_supply_temp` | 19 °C |
| Varmebatteri (kW) | `heating_coil`, `heating_coil_cap` | ja, 30 kW |
| Kjølebatteri (kW) | `cooling_coil`, `cooling_coil_cap` | per bygningskategori |

**Varme** — her manglar det mest. I dag skriv verktøyet **berre panelovnar**
(`<new_local_heater_dir_el>`, 50 W/m² av BRA), altså elektrisk oppvarming for
alle bygg. Eit reelt varmesystem treng:

| Verdi frå EntroPi | Kvar det hører heime |
|---|---|
| Energibærar (fjernvarme, varmepumpe, el, bio, gass) | avgjer kva varmeelement som skal skrivast i staden for panelovnane |
| Installert effekt (kW) | `capacity` |
| Systemverknadsgrad / COP–SCOP for varmepumpe | verknadsgrad på varmeelementet |
| Dekningsgrad (% av varmebehovet) | fleire varmeelement med `priority` |
| Distribusjon (radiator / gulvvarme / luft) | `heater_type`, `convective_share` |
| Tur-/returtemperatur | `heating_coil_supply_temp` / `_return_temp` (i dag 45/30) |

**Kjøling** — verktøyet har inga kjølemaskin i det heile; kjøling finst berre
som batteri i ventilasjonsaggregatet med `cooling_coil_efficiency="2.00"`.
Relevant frå EntroPi: energibærar (fjernkjøling / kjølemaskin / VP i
kjøledrift), effekt (kW), kjølefaktor (COP/EER), tur-/returtemperatur (i dag
10/15) og om kjølinga er romkjøling eller berre i aggregatet.

**Felles, uavhengig av kategori:** installasjonsår (avgjer normverdiar når tala
manglar), fabrikat/modell (rapporten), status i drift/ute av drift, og kva
soner systemet betjener — det siste er det brua alt gjer.

**Før noko av dette vert skrive til SXI** må feltnamna lesast av ei
referansefil frå SIMIEN som *har* fjernvarme, varmepumpe og kjølemaskin.
Attributta `distr_heating_id`/`distr_cooling_id` på batteria viser at SIMIEN
har sentrale anlegg som vert refererte med id, men elementnamna deira kan vi
ikkje gjette — SIMIEN er kresen på feltnamn, og feil namn har før gjort at
programmet heng. Eksporter ei slik fil frå SIMIEN, så les vi namna av henne.

Ei anna strukturell avgjerd som må tas då: i dag får **kvar sone sin eigen**
`<ventilation>`. Eitt EntroPi-aggregat som betjener fleire soner bør heller bli
**eitt** element som sonene deler.

### `?embed=1` — slår på handtrykket

Utan `?embed=1` sender verktøyet **ingen** meldingar og endrar ingenting: det
oppfører seg akkurat som ein vanleg fane, og «Lagre» lastar ned `.entro`-fila.
Det er difor trygt å ha brua ute i produksjon før EntroPi-sida er klar.

Lyttaren står likevel alltid klar når verktøyet er i ein iframe, så ein vert som
ikkje kan endre URL-en kan opne samtalen med `sxi:hello` og få `sxi:ready`
tilbake.

Verktøylinja endrar seg («Lagre på bygget», byggbrikka) fyrst når `sxi:init`
faktisk har kome — knappen lyg aldri om kvar lagringa hamnar.

I innbygd modus dukkar det òg opp ein eigen nedlastingsknapp (`#dlBtn`) ved
sida av lagreknappen. Han lastar ned `.entro`-fila til maskina, slik at ein kan
ta med seg ein kopi ut av EntroPi. Utanfor iframe er han skjult — der gjer
«Lagre» alt det same. Snarvegen er `Ctrl+Shift+S`, og han verkar i begge modus.

---

## Legge til ein funksjon som berre gjeld EntroPi

To mekanismar, og ingen andre. Bruk dei, så slepp du å hugse på ei liste med
stader som må haldast i sync.

**Vising: `data-embed` på `<html>`.** `applyEmbedUI()` set flagget når
`sxi:init` har kome. All vising går gjennom to klasser:

```html
<button class="btn embed-only" id="minKnapp">…</button>   <!-- berre i EntroPi -->
<span class="lbl local-only">Last ned fila</span>          <!-- berre vanleg fane -->
```

Ein ny EntroPi-berre-knapp er altså **rein markup** — ingen ny linje i
`applyEmbedUI()`. Standard vising er `flex` (som `.btn`); brikker og
merkelappar legg til `.eo-inline`.

**Logikk: `inPi()`.** Éin gate for alt som skal oppføre seg annleis inne i
EntroPi:

```js
if(inPi()){ /* … */ return; }
```

Han er sann **først etter `sxi:init`** — ikkje berre fordi vi ligg i ein
iframe. Ein vert som ikkje har sagt at han handterer lagring skal aldri få
verktøyet til å oppføre seg annleis. Bruk `inPi()` framfor å gjenta
`window.EntroHost&&window.EntroHost.active()`; brua vert definert etter
`markDirty`, så vakta på eksistens må vere med, og den bur no på éin stad.

**Ny melding til/frå verten:** legg ein metode på `window.EntroHost` (som
`sendSxi`) — `postMessage` skal ikkje spreiast utover brua. Additive felt held
`protocol:1`; bump berre ved brekkjande endring, og la verten ignorere ukjende
`sxi:`-typar. Kvar ny melding skal inn i **tre** filer samtidig: brua i
`index.html`, protokolltabellen over, og `docs/entropi-test-host.html`.

**Test alltid begge modus:**

- `http://localhost:8742/index.html` — skal vere heilt uendra
- `http://localhost:8742/docs/entropi-test-host.html` — innbygd

### Ny versjon slår ikkje gjennom med ein gong

GitHub Pages sender `Cache-Control: max-age=600` på `index.html`. Nettlesaren
brukar altså sin lagra kopi i inntil **ti minutt utan å spørje serveren**, så
ein nypublisert versjon kan sjå ut som han ikkje kom — versjonsnummeret nede i
verktøylinja står på det gamle sjølv om fila på Pages er ny.

- Sjekk kva som faktisk ligg ute:
  `curl -sI 'https://entroknut.github.io/energimerking-2/index.html?embed=1'`
  (sjå `Last-Modified`) — er den ny, er det cachen lokalt.
- Hard oppfrisking (Ctrl+F5) hentar iframen på nytt med ein gong.
- Verktøyet sender versjonen sin i `sxi:ready` og `sxi:state`
  (`version:'v3.7.0'`). Logg han på vertssida, så treng ingen gjette på kva
  iframen køyrer.
- Treng de å tvinge fram ein bestemt versjon straks, legg han i URL-en:
  `?embed=1&v=3.7.0`. Ny query gir ny cache-nøkkel. Ikkje bruk eit tidsstempel
  som endrar seg for kvar opning — fila er fleire megabyte, og då vert ho lasta
  ned på nytt kvar gong.

### Sikkerheit

Verktøyet tek berre imot meldingar frå opphav i denne lista (i `index.html`,
søk `EntroPi-bru`):

```js
/^https?:\/\/localhost(:\d+)?$/
/^https?:\/\/127\.0\.0\.1(:\d+)?$/
/^https:\/\/([a-z0-9-]+\.)*entro\.no$/
/^https:\/\/[a-z0-9-]+\.vercel\.app$/
```

`sxi:ready` går til `'*'` (han inneheld ingen data). Alt anna går til opphavet
som sende den fyrste godkjende meldinga. Får EntroPi eit eige domene, må lista
utvidast — elles blir brua ståande stille.

EntroPi bør på si side sjekke `ev.source === iframe.contentWindow` og
`ev.origin === 'https://entroknut.github.io'`.

---

## EntroPi-sida — ferdig komponent

```tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const TOOL_ORIGIN = 'https://entroknut.github.io';
const TOOL_URL = `${TOOL_ORIGIN}/energimerking-2/index.html?embed=1`;

type Bygg = { id: string; namn: string; adresse?: string; byggeaar?: number };

export function Energimerking({ bygg, onClose }: { bygg: Bygg; onClose: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  // .entro-fila som ligg på bygget. Hent henne før modalen vert opna.
  const lagra = useRef<Blob | string | null>(null);

  const send = useCallback((msg: Record<string, unknown>) => {
    ref.current?.contentWindow?.postMessage({ source: 'entropi', ...msg }, TOOL_ORIGIN);
  }, []);

  useEffect(() => {
    const onMsg = async (ev: MessageEvent) => {
      if (ev.origin !== TOOL_ORIGIN) return;
      if (ev.source !== ref.current?.contentWindow) return;
      const d = ev.data;
      if (!d || d.source !== 'sxi-generator') return;

      switch (d.type) {
        case 'sxi:ready':
          send({
            type: 'sxi:init',
            bygg: { id: bygg.id, namn: bygg.namn, adresse: bygg.adresse, byggeaar: bygg.byggeaar },
            project: lagra.current,          // Blob, streng eller null
            wantsSxi: true,
            saveLabel: 'Lagre på bygget',
          });
          break;

        case 'sxi:state':
          setDirty(!!d.dirty);
          break;

        case 'sxi:save': {
          setStatus('Lagrar…');
          try {
            const form = new FormData();
            form.append('file', d.blob, d.filename);
            form.append('meta', JSON.stringify(d.meta));
            const res = await fetch(`/api/bygg/${bygg.id}/energimerking`, {
              method: 'POST', body: form,
            });
            if (!res.ok) throw new Error(await res.text());
            lagra.current = d.blob;
            setStatus('Lagra');
            send({ type: 'sxi:save-result', requestId: d.requestId, ok: true,
                   message: `Lagra på ${bygg.namn}.` });
          } catch (e) {
            setStatus('Lagring feila');
            send({ type: 'sxi:save-result', requestId: d.requestId, ok: false,
                   message: e instanceof Error ? e.message : 'ukjend feil' });
          }
          break;
        }

        case 'sxi:request-systems': {
          // Dei tekniske systema på bygget. Verktøyet ventar 12 s på svaret.
          try {
            const res = await fetch(`/api/bygg/${bygg.id}/tekniske-systemer`);
            const systems = await res.json();   // [{id, kategori, namn}]
            send({ type: 'sxi:systems', requestId: d.requestId, ok: true, systems });
          } catch (e) {
            send({ type: 'sxi:systems', requestId: d.requestId, ok: false, systems: [],
                   message: e instanceof Error ? e.message : 'ukjend feil' });
          }
          break;
        }

        case 'sxi:export-sxi': {
          // SIMIEN-fila — same opplasting, annan filtype
          const form = new FormData();
          form.append('file', d.blob, d.filename);
          await fetch(`/api/bygg/${bygg.id}/energimerking/sxi`, { method: 'POST', body: form });
          break;
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [bygg, send]);

  const lukk = () => {
    if (dirty && !confirm('Det finst ulagra endringar. Lukke likevel?')) return;
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-2">
        <strong>Energimerking — {bygg.namn}</strong>
        {dirty && <span className="text-amber-600 text-xs">ulagra endringar</span>}
        {status && <span className="text-xs text-gray-500">{status}</span>}
        <button className="ml-auto" onClick={() => send({ type: 'sxi:request-save' })}>
          Lagre
        </button>
        <button onClick={lukk}>Lukk</button>
      </div>
      <iframe
        ref={ref}
        src={TOOL_URL}
        title="SXI-generatoren"
        className="h-full w-full border-0"
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
```

**Iframe-attributt:** ikkje sett `sandbox` utan `allow-downloads`,
`allow-scripts`, `allow-same-origin` og `allow-modals` — verktøyet lastar ned
SXI- og PNG-filer, brukar `localStorage` til autolagring og `confirm()`/`alert()`
nokre stader. Enklast er å la `sandbox` vere heilt ute (som i dag).

**`onbeforeunload` finst ikkje for ein iframe som vert fjerna.** Bruk
`sxi:state` — den er der nettopp for at EntroPi skal kunne åtvare eller be om
ei siste lagring før modalen forsvinn.

---

## Lagringa på EntroPi-sida

- **Filstorleik.** `.entro` inneheld planteikninga som base64-PNG per etasje.
  Reine vektor-PDF-ar blir små (< 1 MB), skanna teikningar kan bli 5–30 MB.
  Legg fila i objektlagring (Supabase Storage / blob), ikkje i ei JSON-kolonne,
  og set opplastingsgrensa til minst 50 MB.
- **PNG, ikkje JPEG.** Verktøyet sender PNG med vilje: fila på bygget er den
  einaste kopien, og JPEG ville tapt litt kvalitet for kvar opne-lagre-runde.
- **Versjonar.** `meta.savedAt` og `meta.appVersion` følgjer kvar lagring.
  Å ta vare på dei siste 5–10 filene per bygg gir «gå tilbake til i går» nesten
  gratis — send den valde fila inn att med `sxi:load`.
- **Éin fil per bygg** er nok til å starte. Skal fleire jobbe på same bygg,
  treng de ein låsemekanisme eller siste-skriv-vinn med åtvaring — brua har
  ingen konfliktdeteksjon.
- **PDF-en vert ikkje lagra.** Verktøyet lagrar den ferdig rasteriserte
  planteikninga, ikkje PDF-en, så etasjenavigeringa i PDF-en er borte etter ei
  runde. Det er same åtferd som lokale `.entro`-filer har i dag.

---

## Testing

`docs/entropi-test-host.html` er ein minimal vert som implementerer heile
protokollen mot ein variabel i minnet:

```bash
python -m http.server 8742
```

Opne `http://localhost:8742/docs/entropi-test-host.html`. Loggen viser kvar
melding i båe retningar. «Ber verktøyet lagre» testar `sxi:request-save`,
«Last iframe på nytt» testar at prosjektet kjem tilbake frå «bygget».

Legg til `?silent=1` for å laste verktøyet slik EntroPi gjer det utan
integrasjon — utan `?embed=1`, og med ein vert som ikkje svarar. Då skal
lagring gå til nedlasting som før.

For dei tekniske systema: verten svarar på `sxi:request-systems` med åtte
system i sju kategoriar (same døme som i EntroPi). «Send systema uoppmoda»
testar at eit ope vindauge oppdaterer seg, og `?nosys=1` gjer verten stum, så
ein kan sjå at vindauget forklarar seg etter tidsavbrotet i staden for å stå og
hente.

Verifisert 20. august 2026 (v3.2.0): handtrykk, lagring med `meta` (BRA, soner,
etasjar), rundtur der soner, kalibrering, kontrollmål og adresse kjem uendra
tilbake, `sxi:request-save`, at autolagringstoasten frå localStorage vert
undertrykt når verten sender eit prosjekt, og at `?silent=1` framleis lastar ned
`.entro`-fila (både via `showSaveFilePicker` og nedlastings-fallbacken).

---

## Kva som endra seg i verktøyet

- `serialiserProsjekt(opts)` og `lastProsjekt(proj, opts)` er nye delte
  funksjonar. Manuell `.entro`-lagring, autolagringa til localStorage og brua
  brukar alle desse — dei tre kopiane av serialiseringskoden er borte.
  **Nye felt som skal overleve, skal no leggjast til i `serialiserProsjekt`,
  `lastProsjekt`, `snapshot()`, `applyHistoryState()` og `getCurrentState()`.**
- Brua ligg i `index.html` under `// ── 2b. EntroPi-bru`. Utanfor ein iframe er
  ho heilt passiv.
- Lagreknappen sender til verten i innbygd modus, og viser «Lagre på bygget»
  pluss ei brikke med byggnamnet. `Ctrl+S` går same vegen.
- Nedlastinga ligg i `lastNedProsjektfil()`. I innbygd modus får ho ein eigen
  knapp (`#dlBtn`, skjult elles); utanfor iframe kallar lagreknappen henne
  direkte. `Ctrl+Shift+S` lastar ned i begge modus.
- «⚙ Hent tekniske systemer» (beta) er ny: eige vindauge under
  `// ── 2c. Tekniske system frå EntroPi` i `index.html`, og koplinga ligg på
  sona som `z.tekniskeSystem`. Knappen er `.embed-only`.
- Autolagringstoasten («Autolaga prosjekt frå 52 min sidan») vert undertrykt
  når verten sender eit prosjekt, og gjenopprettinga vert utsett 1,5 s i
  iframe så `sxi:init` får komme fyrst.
