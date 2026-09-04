# Bruksrettleiing — SXI-generatoren i EntroPi

Versjon 3.9.0 · Entro AS

SXI-generatoren er oppmålingsverktøyet for energimerking: du tek inn ei
planteikning, teiknar sonene i bygget, og får ut ei `.sxi`-fil som opnar rett i
SIMIEN.

Verktøyet køyrer på to måtar, og dei er ikkje heilt like:

| | **Inne i EntroPi** | **Som eiga nettside** |
|---|---|---|
| Prosjektet ligg | på bygget i EntroPi | som `.entro`-fil på maskina di |
| «Lagre» gjer | lagrar på bygget | ladar ned ei fil |
| Autolagring | til bygget, kvart 2. minutt | lokalt i nettlesaren, kvart minutt |
| Om økta blir broten | ulagra arbeid blir tilbydd att på same bygget | lokal kopi blir tilbydd att |
| Adresse og byggeår | kjem inn av seg sjølv | tastar du inn |
| Tekniske system | kan hentast frå bygget | ikkje tilgjengeleg |

Denne rettleiinga går gjennom **EntroPi-vegen**. Alt som gjeld sjølve
oppmålinga er likt begge stader; det som berre finst i EntroPi er merkt
**(EntroPi)**.

---

## 1. Kom i gang

Opne energimerkinga på bygget i EntroPi. Verktøyet startar i ei ramme inne i
EntroPi, og du kjenner igjen at du er kopla til på tre ting i verktøylinja:

- **⌂ Byggnamn** står som ei brikke ved sida av opne-knappen. Det er bygget
  lagringa hamnar på. Manglar brikka, står du i ei vanleg fane, og «Lagre»
  ladar ned ei fil i staden.
- **Lagreknappen** heiter **«Lagre på bygget»** og er grøn.
- **⚙ Hent tekniske systemer** har kome til i verktøylinja.

Ligg det alt eit prosjekt på bygget, blir det opna med ein gong — planteikningar,
kalibrering, soner, alt. Er bygget tomt, startar du på blankt ark.

**To ting blir fylte inn frå bygget:** adressa (som blir framlegg til
prosjektnamn og filnamn) og byggeåret (som styrer standard U-verdiar og SFP).
Berre **tomme** felt blir fylte — har du tasta inn noko sjølv, står det.

---

## 2. Arbeidsflyten

Sju steg, i denne rekkjefølgja. Steg 2 er det som oftast blir gløymt, og det
gjer alle areala feil.

### Steg 1 — Last opp planteikninga

**↑ Last opp**, eller slepp fila rett på lerretet. PDF, PNG eller JPG. Er PDF-en
fleirsidig, blir det pilar `‹ 1/6 ›` i verktøylinja.

Ligg teikninga på sida, rett ho opp med **↻ Roter**.

### Steg 2 — Kalibrer

Verktøyet må vite kor mange millimeter éin biletpiksel er. **Utan kalibrering
er alle areal og lengder feil**, og badgen nede til venstre står raud:
«Ikkje kalibrert».

**⊕ Kalibrer** gir tre metodar:

| Metode | Slik gjer du det |
|---|---|
| **Lengde** | Klikk start → slutt på ei kjend lengd, tast talet i mm |
| **Areal** | Klikk rundt eit område du veit arealet av |
| **Målestokk** | Vel 1:100, 1:200 osv. — ingen klikking på teikninga |

Målestokk-metoden treng papirformatet. Det blir funne automatisk: eksakt frå
PDF-en, eller frå DPI-metadata i PNG/JPEG. Finst det ikkje, vel du sjølv
(A0–A4, A3 er framlegg).

Kalibreringa er **global** — den gjeld alle etasjar. Har ein etasje ei teikning
i annan målestokk, klikk på skala-badgen og vel **Eiga** for den etasjen.

> **Kalibrerer du om etterpå,** følgjer alt du har teikna med: soneareal,
> veggengder, vindaugsbreidder og gavlflater blir rekna om. Det du har **tasta
> inn** — høgder, brystning, overstyrte areal — står urørt. Det er meininga.

### Steg 3 — Teikn sonene

**⬡ Sone**, så klikk hjørne for hjørne. Dobbelklikk eller klikk på startpunktet
for å lukke sona. `Backspace` fjernar siste punkt, `Esc` avbryt.

Undervegs hjelper to ting:

- **⌖ Snap** låser punktet til hjørne på eksisterande soner og til **veggkryss i
  sjølve planteikninga**. Snappar det til feil stad — tekst, møblar, målesetting
  — slå det av med knappen. Skrå veggar får ikkje snap; det er med vilje.
- **Shift** låser retninga til 90° eller 45°.

**Ligg den nye sona inntil ei sone du alt har teikna, blir den felles veggen
sett til skiljekonstruksjon i begge sonene automatisk.** Ligg berre ein del av
naboveggen inntil, blir naboveggen delt i tre — fasade, skiljevegg, fasade — og
vindauga i nabosona følgjer med. Berøring på nokre få centimeter tel ikkje.

Trykk du ein vegg tilbake til fasade manuelt, står det valet fast. Verktøyet
set skiljeveggar, men fjernar dei aldri.

Skal du rette geometrien etterpå: **⊹ Rediger** — dra hjørne, klikk midtpunkt
for å setje inn eit nytt, høgreklikk for å slette.

### Steg 4 — Vindauge og dører

**▭ Vindauge/dør**, så klikk to gonger langs ein fasade: start og slutt.
Breidda blir målt frå dei to klikka, og du fyller ut høgd, tal og eventuelt
brystning i dialogen.

- Kopier med `Ctrl+C` over eit vindauge, lim inn med `Ctrl+V` over ein fasade.
- I navigeringsmodus kan du **dra** eit vindauge langs veggen.
- `Delete` over eit vindauge slettar det.

Endrar du breidda i dialogen etterpå, blir vindauget halde sentrert på same
staden og skuva inn på veggen om det ikkje er plass.

### Steg 5 — Fyll ut sonene

Sidepanelet til høgre har eitt kort per sone. Sett minst:

- **Bygningskategori** — styrer heile settet med SIMIEN-profilar (drifttider,
  internlast, energimerke). Ein `<energymark26>` blir laga per unik kategori.
- **Etasjehøgd** — kjem frå feltet i verktøylinja, men kan overstyrast per sone.
- **Himling** — berre om himlingshøgda er lågare enn etasjehøgda. Påverkar
  volumet, ikkje areala.
- **Taktype** — «Tak», «Himling mot uoppvarma sone» eller «Himling mot varm
  sone». Vel du feil her, kan SIMIEN henge seg opp.
- **Gulvtype** og **takvinkel** der det er relevant.
- **Byggeår** — kjem frå bygget i EntroPi. Det styrer standard U-verdiar, SFP og
  lekkasjetal.

**U-verdiar og n50** blir sette etter byggeåret, men kan overstyrast i
**Tabell**-fana. Der ligg òg ei full oversikt over fasadar, vindauge og areal —
nyttig til kontroll før eksport. Fana er skjult som standard; ho blir berre
rekna ut når ho er open.

Andre ting du kan gjere i sidepanelet:

- **⊞ Slå saman fasadar** — fasadar med same himmelretning blir eitt element i
  SXI-en. Skiljeveggar kan slåast saman på same vis; **«Vel…»** lèt deg plukke
  ut nokre av dei i staden for alle.
- **Kopling av soner** — samlar soner i SIMIEN utan å slå saman geometrien.
  Berre soner med same bygningskategori kan koplast, og kvar kopla sone kan ha
  eigen tak- og gulvtype. Kopla soner får lilla ramme.
- **Del sone** — høgreklikk på sona, teikn ei linje tvers gjennom. Segmenta frå
  klippelinja blir skiljekonstruksjon i begge dei nye sonene, og vindauga blir
  fordelte etter kva vegg dei hamna på.
- **Overstyr areal, omkrins eller einskilde veggsegment** der oppmålinga krev
  det. Tasta fasit blir aldri skalert.

### Steg 6 — Tekniske system frå bygget **(EntroPi)**

Sjå [kapittel 3](#3-tekniske-system-frå-entropi-beta).

### Steg 7 — Eksporter til SIMIEN

**⬇ Eksporter SXI** opnar ein dialog med prosjektnamn, adresse, byggeår,
klimastad og kommunenr. Klimastaden avgjer klimadata i SIMIEN, og kommunenr.
blir fylt inn automatisk når du vel stad. Adresse og prosjektnamn står alt der
om dei kom frå bygget.

Fila blir lada ned. Er verten sett opp for det, får EntroPi ein kopi samstundes.
Opne `.sxi`-fila direkte i SIMIEN.

---

## 3. Tekniske system frå EntroPi (BETA)

Dette er det einaste som verkeleg berre finst inne i EntroPi: dei tekniske
anlegga som alt er registrerte på bygget kan koplast til sonene, og
ventilasjonstala går inn i SXI-fila i staden for normverdiar.

### Slik gjer du det

1. **⚙ Hent tekniske systemer** i verktøylinja. Verktøyet spør EntroPi og viser
   lista. Kjem det ikkje svar innan 12 sekund, seier det frå — prøv **↻ Hent på
   nytt**.
2. **Dra eit system frå venstre kolonne over på ei sone** i høgre kolonne.
   Vil du ikkje dra (nettbrett, tastatur), klikk systemet først og sona etterpå.
3. **Ferdig** lukkar vindauget.

Nokre ting å vite:

- **Berre ventilasjon, varme og kjøling blir viste.** Belysning, automasjon,
  gatevarme og resten påverkar ikkje energimerkinga, så dei blir sila bort.
  Talet på sila system står i statuslinja — det blir aldri sila i det stille.
- **Kopla soner (groupId) er éi sone her.** Legg du eit anlegg på ei kopla sone,
  får alle instansane det, i alle etasjar.
- **Talverdiane står under systemnamnet** — luftmengd, redusert luftmengd,
  gjenvinningsgrad og SFP, slik dei kjem frå EntroPi. Står det «ingen tal frå
  EntroPi — normverdiar i SXI», er anlegget registrert men utan tal.
- **Eit system som er sletta i EntroPi står med stipla kant.** Namnet blir
  lagra saman med koplinga, så gamle prosjekt held seg lesbare.
- **Koplinga ser du berre i dette vindauget** — ikkje på sonekortet i
  sidepanelet.
- **↻ Hent på nytt** friskar opp tala på alle koplingane. Det lagar ikkje eit
  angre-steg, men markerer prosjektet som ulagra.

### Kva som faktisk går inn i SXI-fila

**Ventilasjon** — desse fire går inn:

| Frå EntroPi | Inn i SIMIEN som |
|---|---|
| Luftmengd tilluft/avtrekk | spesifikk luftmengd, m³/(h·m²) |
| Redusert luftmengd | luftmengd utanfor drifttid |
| Gjenvinningsgrad | verknadsgrad på varmegjenvinnaren |
| SFP | vifteeffekt, med dellastkurve |

Blandinga skjer **per felt**: manglar gjenvinningsgraden, står normverdien for
gjenvinning medan luftmengda kjem frå anlegget. Har sona ikkje noko anlegg i det
heile, blir fila teikn for teikn som før.

Sender EntroPi total luftmengd i m³/h, blir ho delt på **arealet anlegget
faktisk betjener** — summen av alle soner anlegget er lagt på, over alle
etasjar. Same aggregat gir difor same spesifikke luftmengd i alle sonene sine.
Legg du til eller fjernar ei sone frå anlegget, endrar talet seg.

Redusert luftmengd blir **ikkje** skalert ned frå norma etter designluftmengda.
Ei nattsenking vi ikkje kjenner ville gjort energimerket for godt.

**Varme og kjøling går enno ikkje inn i SXI-fila.** Koplinga blir lagra, men
oppvarming står framleis som panelovnar (50 W/m²). Systemvindauget seier
«ikkje i SXI enno» på desse.

---

## 4. Fleire etasjar

**+ Etasje** lagar ei ny etasje med eiga teikning og eiga etasjehøgd. Drag
fanane for å endre rekkjefølgja — det er rekkjefølgja 3D-modellen blir stakka i.

**Ghost** viser etasjen under som svakt omriss, så du kan leggje teikninga rett
over. Står teikningane i utakt, dra ghosten på plass; forskyvinga står i px ved
sida av knappen, og **↺** nullstillar.

BRA-summen for heile bygget står i etasjelinja.

---

## 5. Lagring i EntroPi

| Handling | Kva som skjer |
|---|---|
| **Lagre på bygget** / `Ctrl+S` | Prosjektet blir lagra på bygget i EntroPi |
| **⬇-knappen** / `Ctrl+Shift+S` | `.entro`-fila blir lada ned til maskina |
| **Opne** / `Ctrl+O` | Opnar ei `.entro`-fil frå maskina |

**Autolagringa til bygget står på.** Den fyrste endringa i økta blir lagra etter
10 sekund — du skal ikkje kunne miste den fyrste halvtimen fordi intervallet
ikkje hadde slått til. Deretter kvart andre minutt, men berre når det finst noko
ulagra. Kvar autolagring skriv ei ny versjon på bygget.

Medan autolagringa til bygget er på, står den lokale autolagringa til
nettlesaren nede. Dei to kan ikkje køyre side om side.

Nedlastingsknappen er der fordi du framleis kan trenge ein `.entro`-kopi ut av
EntroPi — til arkiv, eller til å halde fram på ei anna maskin.

### Om økta blir broten

Fell nettet ut, krasjar fana, eller blir energimerkinga lukka mellom to
autolagringar, ligg arbeidet framleis i nettlesaren din. Verktøyet skriv ein
sikkerheitskopi lokalt kvar gong ei økt blir avslutta med noko ulagra.

Neste gong du opnar **det same bygget**, kjem det opp ei melding nede på
skjermen:

> 💾 Ulagra arbeid som ikkje nådde bygget · 14 min sidan — **Hent inn att**

Trykk **Hent inn att**, så er du tilbake der du slapp. Arbeidet blir då lagra
vidare til bygget av seg sjølv — du treng ikkje gjere noko meir.

Tre ting er verdt å vite:

- **Kopien høyrer til eitt bygg.** Han blir aldri tilbydd på eit anna bygg, så
  du kan ikkje komme til å dra arbeid frå Storgata 1 inn i eit anna prosjekt.
- **Har bygget alt ein nyare versjon, forsvinn kopien i stillheit.** Du får
  aldri tilbod om å hente inn noko som er eldre enn det som ligg på bygget.
- **Ei vellukka lagring slettar kopien.** Meldinga dukkar altså berre opp når
  det verkeleg finst arbeid som ikkje nådde fram.

Trykkjer du **Ignorer**, blir kopien sletta. Lèt du meldinga stå, forsvinn ho
av seg sjølv etter tolv sekund — men kopien blir liggjande, så du får tilbodet
på nytt neste gong du opnar bygget.

---

## 6. Kontroll før du leverer

- **Skala-badgen** nede til venstre skal ikkje vere raud.
- **Tabell-fana** viser alle soner, fasadar og vindauge med areal. Her ser du
  raskt om ein fasade manglar vindauge eller eit areal ser rart ut.
- **Mål** kontrollmåler ein avstand på teikninga — klikk start og slutt. Måla
  blir lagra med prosjektet og påverkar ikkje SXI-en. Dei følgjer omkalibrering.
- **⬡ 3D** byggjer modellen stakka etter etasjehøgdene. Ein etasje som ligg
  feil, eller ei sone som manglar tak, er lett å sjå der.
- **Nord** styrer solorienteringa i SIMIEN. Sett han med kompasset nede til
  høgre. **Nord-sjekk**-knappen roterar teikninga mellombels så nord peikar opp,
  så lenge du held han inne.

---

## 7. Tastatursnarvegar

Trykk **?** i programmet for full liste.

| | |
|---|---|
| `Ctrl+S` | Lagre (på bygget i EntroPi) |
| `Ctrl+Shift+S` | Last ned prosjektfila |
| `Ctrl+O` | Opne prosjekt |
| `Ctrl+Z` / `Ctrl+Y` | Angre / gjere om |
| `Esc` | Avbryt, tilbake til navigering |
| `Shift` under teikning | Lås til 90°/45° |
| Dobbelklikk | Fullfør sone |
| `Ctrl+C` / `Ctrl+V` | Kopier og lim inn sone eller vindauge |
| Scroll / klikk+dra | Zoom / flytt teikninga |
| Høgreklikk sone | Kontekstmeny |

---

## 8. Når noko ikkje stemmer

**Areala er feil.** Du har ikkje kalibrert, eller ein etasje har eiga
kalibrering som er sett feil. Sjekk skala-badgen på kvar etasje.

**Snappen låser til feil stad.** Teikninga er tett eller skanna. Slå av
**⌖ Snap** og klikk fritt.

**Skiljeveggen mellom to soner blei ikkje sett.** Sonene ligg meir enn ~8 cm frå
kvarandre, eller overlappar mindre enn 25 cm. Sett veggen manuelt i
sidepanelet. Flyttar du eit hjørne i etterkant, skjer det ingenting automatisk
— berre nyteikna soner utløyser skanninga.

**Tekniske systemer-lista er tom.** Anten ligg det ingen ventilasjons-, varme-
eller kjølesystem på bygget i EntroPi, eller verten svarte ikkje. Statuslinja
skil dei to.

**Byggnamnet manglar i verktøylinja.** Du står i ei vanleg fane, ikkje i
EntroPi. «Lagre» ladar då ned ei fil.

**SIMIEN nektar å opne fila.** Sjekk at alle soner har bygningskategori og at
taktypen stemmer med kva sona faktisk grensar mot.

---

## 9. Kjende manglar

- Import av eksisterande SXI-filer
- Varme og kjøling frå EntroPi går ikkje inn i SXI-en
- Validering av overlappande soner
- Snap til skrå veggar
- PDF-rapport og eksport til rekneark
- Kopiering av ei heil etasje (må gjerast sone for sone)
- Offline-modus (3D og PDF-lesing hentar bibliotek frå CDN)
