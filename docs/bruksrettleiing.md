# Bruksrettleiing — SXI-generatoren

Versjon 5.6.0 · Entro AS

SXI-generatoren er oppmålingsverktøyet for energimerking: du tek inn ei
planteikning, teiknar sonene i bygget, og får ut ei `.sxi`-fil som opnar rett i
SIMIEN.

Verktøyet køyrer på to måtar, og dei er ikkje heilt like:

| | **Inne i EntroPi** | **Som eiga nettside** |
|---|---|---|
| Prosjektet ligg | på bygget i EntroPi | som `.entro`-fil på maskina di |
| «Lagre» gjer | lagrar på bygget | lastar ned ei fil |
| Autolagring | til bygget, kvart 2. minutt | lokalt i nettlesaren, kvart minutt |
| Om økta blir broten | ulagra arbeid blir tilbode att på same bygget | lokal kopi blir tilboden att |
| Adresse, byggeår, ansvarleg | kjem inn av seg sjølv | tastar du inn |
| Tekniske system | kan hentast frå bygget | ikkje tilgjengeleg |

Alt som gjeld sjølve oppmålinga er likt begge stader. Det som berre finst i
EntroPi er merkt **(EntroPi)**.

---

## 1. Kom i gang

Opne energimerkinga på bygget i EntroPi. Verktøyet startar i ei ramme inne i
EntroPi, og du kjenner igjen at du er kopla til på tre ting i verktøylinja:

- **⌂ Byggnamn** står som ei brikke ved sida av opne-knappen. Det er bygget
  lagringa hamnar på. Manglar brikka, står du i ei vanleg fane, og «Lagre»
  lastar ned ei fil i staden.
- **Lagreknappen** heiter **«Lagre på bygget»** og er grøn.
- **⚙ Hent tekniske systemer** har kome til i verktøylinja.

Ligg det alt eit prosjekt på bygget, blir det opna med ein gong. Er bygget
tomt, startar du på blankt ark.

**Frå bygget blir det fylt inn** adresse (framlegg til prosjektnamn og
filnamn), byggeår (styrer standard U-verdiar og SFP) og den som er logga inn
(ansvarleg person i SXI-fila). Berre **tomme** felt blir fylte — har du tasta
inn noko sjølv, står det.

### Skjermbiletet

| Område | Kva det er |
|---|---|
| Verktøylinja øvst | Opplasting, kalibrering, teikneverktøy, 3D og SXI-eksport |
| Fanerada under | **Plan / Fasade / Side om side**, etasjefanene og BRA-summen |
| Lerretet | Planteikninga med sonene teikna oppå |
| Sidepanelet til høgre | **Soner** (eitt kort per sone) og **Tabell** |
| Hintlinja nedst | Fortel kva verktøyet ventar på — les henne når du står fast |

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
«Ikkje kalibrert». SXI-eksporten stoppar òg til skalaen er sett.

**⊕ Kalibrer** gir tre metodar:

| Metode | Slik gjer du det |
|---|---|
| **Lengde** | Klikk start → slutt på ei kjend lengd, tast talet i mm |
| **Areal** | Klikk på ei sone du veit arealet av |
| **Målestokk** | Vel 1:100, 1:200 osv. — ingen klikking på teikninga |

Målestokk-metoden treng papirformatet. Det blir funne automatisk: eksakt frå
PDF-en, eller frå DPI-metadata i PNG/JPEG. Finst det ikkje, vel du sjølv
(A0–A4, A3 er framlegg).

Kalibreringa er **global** — ho gjeld alle etasjar. Har ein etasje ei teikning
i annan målestokk, klikk på skala-badgen og vel **Eiga** for den etasjen.

> **Kalibrerer du om etterpå,** følgjer alt du har teikna med: soneareal,
> veggengder, vindaugsbreidder og gavlflater blir rekna om. Det du har **tasta
> inn** — høgder, brystning, overstyrte areal — står urørt. Det er meininga.

### Steg 3 — Teikn sonene

**⬡ Sone**, så klikk hjørne for hjørne. Dobbeltklikk, `Enter` eller klikk på
startpunktet lukkar sona. `Backspace` fjernar siste punkt, `Esc` avbryt.

Undervegs hjelper to ting:

- **⌖ Snap** låser punktet til hjørne på eksisterande soner og til **veggkryss i
  sjølve planteikninga**. Snappar det til feil stad — tekst, møblar,
  målesetting — slå det av med knappen. Skrå veggar får ikkje snap; det er med
  vilje.
- **Shift** låser retninga til 90° eller 45°.

**Ligg den nye sona inntil ei sone du alt har teikna, blir den felles veggen
sett til skiljekonstruksjon i begge sonene automatisk.** Ligg berre ein del av
naboveggen inntil, blir naboveggen delt i tre — fasade, skiljevegg, fasade — og
vindauga i nabosona følgjer med. Berøring på nokre få centimeter tel ikkje.

Trykkjer du ein vegg tilbake til fasade manuelt, står det valet fast. Verktøyet
set skiljeveggar, men fjernar dei aldri.

Skal du rette geometrien etterpå: **⊹ Rediger** — dra hjørne, klikk på
**+**-merket midt på ein kant for å setje inn eit nytt hjørne, høgreklikk på eit
hjørne for å slette det.

### Steg 4 — Vindauge og dører

**▭ Vindauge/dør**, så klikk to gonger langs ein fasade: start og slutt.
Breidda blir målt frå dei to klikka, og du fyller ut type, høgd, antal og
eventuelt brystning i dialogen. Sjå [kapittel 3](#3-vindauge-og-dører) for
grupper med fleire like vindauge.

- Kopier med `Ctrl+C` over eit vindauge, lim inn med `Ctrl+V` over ein fasade.
- I navigeringsmodus kan du **dra** eit vindauge langs veggen.
- `Delete` over eit vindauge slettar det.

### Steg 5 — Fyll ut sonene

Sidepanelet til høgre har eitt kort per sone. Sett minst:

- **Kategori** — bygningskategorien styrer heile settet med SIMIEN-profilar
  (drifttider, internlast, energimerke). Eitt energimerke blir laga per
  kategori i prosjektet.
- **Byggeår** — styrer standard U-verdiar, SFP og lekkasjetal. Kjem frå bygget
  i EntroPi.
- **Etg.høgde** — kjem frå feltet i verktøylinja, men kan overstyrast per sone.
- **Himling** — berre om himlingshøgda er lågare enn etasjehøgda. Påverkar
  volumet, ikkje areala.
- **Golv** og **Tak** — type, og takvinkel for skråtak (tomt felt = flatt tak).
  Treng sona fleire typar, sjå [kapittel 4](#4-tak-og-golv-med-fleire-typar).

**U-verdiar og n50** blir sette etter byggeåret, men kan overstyrast i
**Tabell**-fana. Der ligg òg ei full oversikt over fasadar, vindauge og areal —
nyttig til kontroll før eksport.

### Steg 6 — Tekniske system frå bygget **(EntroPi)**

Sjå [kapittel 9](#9-tekniske-system-frå-entropi-beta).

### Steg 7 — Eksporter til SIMIEN

**⬇ Eksporter SXI** opnar ein dialog med prosjektnamn, adresse, byggeår,
klimastad, kommunenr. og **ansvarleg person**. Kommunenr. blir fylt inn når du
vel klimastad. Ansvarleg person er den som er logga inn i EntroPi; utanfor
EntroPi hugsar nettlesaren det du skreiv sist.

Under ligg **tiltak** du kan ta med i fila — sjå
[kapittel 8](#8-tiltak-i-sxi-fila).

Fila blir lasta ned. Er verten sett opp for det, får EntroPi ein kopi
samstundes. Opne `.sxi`-fila direkte i SIMIEN.

**Eksporten stoppar** (med ei raud melding i dialogen) når:

- eit felt manglar (prosjektnamn, byggeår, kommunenr., ansvarleg person),
- ein etasje med soner ikkje er kalibrert,
- **vindauga og dørene på ein fasade har større areal enn fasaden.** Meldinga
  listar sone, fasade og areal. Rett breidd, høgd eller antal og eksporter på
  nytt. Sonekortet varslar om det same på førehand (sjå kapittel 3).

---

## 3. Vindauge og dører

### Fleire like vindauge — grupper

Eit vindauge med **antal** større enn 1 er **eitt element i SIMIEN**
(`number="3"`), men står som tre stykk på veggen — i planteikninga, i 3D og i
kartet. Stykket du teikna står der du teikna det, og resten blir spreidde
utover heile veggen med lik luft mellom. Gruppelappen (`V×3`) står ved det
teikna stykket.

Høgreklikk på eit vindauge i ei gruppe:

| Val | Kva det gjer |
|---|---|
| **Rediger** | Opnar dialogen (breidd, høgd, antal, U-verdi …) |
| **Løys ut denne stk** | Gruppa blir `antal−1`, og stykket blir eit eige vindauge på same plass |
| **Løys opp gruppa** | Alle stykka blir sjølvstendige vindauge — i SXI-en blir det n element i staden for eitt |
| **Fordel jamnt** | Stykka blir fordelte jamnt over heile veggen |
| **Kopier til fasade…** | Kopierer vindauget til ein annan vegg |
| **Kopier** / **Slett** | |

Stykka kan dragast enkeltvis langs veggen. Plasseringa er berre visning —
SIMIEN får antal og målet på eitt vindauge.

### Åtvaringar

Verktøyet seier frå i staden for å la feil gå stille inn i energimerket:

- **⚠ breiare enn veggen** — gruppa får ikkje plass, så stykka må overlappe.
  Står i sonekortet, i dialogen medan du skriv og i hintlinja.
- **Mørk overlappsbit** i planteikninga — to vindauge ligg oppå kvarandre.
- **⚠ større enn fasaden** — samla areal av vindauge og dører på ein fasade er
  større enn fasaden (fangar òg vindauge som er for høge). Pilla i
  «Vindauge og dører» blir raud, og ei raud linje viser fasade og areal, også
  når lista er samanslegen. **SXI-eksporten stoppar til dette er retta.**

Dører har ikkje antal-felt; set du typen til dør, går antalet tilbake til 1.

---

## 4. Tak og golv med fleire typar

Halve taket kan vere tak mot det fri og resten himling mot kaldt loft; halve
golvet kan vere golv på grunn og resten kjellargolv. Då deler du laget opp i
**flater**, og kvar flate får sin eigen type og U-verdi.

- **✂** ved **Golv** eller **Tak** i sonekortet startar oppdelinga. Teikn ei
  linje tvers over sona; ho blir delt i to flater.
- Teiknar du ei **lukka sløyfe heilt inne i ei flate** (klikk tilbake på
  startpunktet), blir sløyfa ei eiga flate — ein bit midt i taket, t.d. eit
  overlys eller ein lågare del.
- Kvar flate har eit kompakt kort: namn, areal, type og U-verdi (blank = sona
  sin). Skrå tak har vinkel og fallretning på ei tredje rad.
- **✕** slettar ei flate — arealet går til naboflata, så sona aldri står utan
  tak eller golv. Slettar du den siste, er laget udelt igjen.
- **↺ Slå saman** tek bort heile oppdelinga.
- Dekkjer flatene ikkje sonearealet (t.d. etter at sona har endra form), står
  det ei **gul ⚠-pille** i overskrifta. Det blir aldri sila bort.

Berre eitt lag blir teikna oppå planen om gongen (varme fargar for tak, kalde
med prikka kant for golv).

**⇄ Tilpass takflater** (på kortet til ei skrå flate) gjer at fleire skrå
flater møtest i mønet og grata: flata du trykte på held vinkelen, og dei andre
blir rekna ut frå planteikninga. Går linjene i planen ikkje opp som eitt tak,
seier hintlinja kor stort spranget er.

Ei himling blir eksportert som skiljekonstruksjon, eit kjellargolv som kjellar,
uansett kva lag ho ligg i. Ei udelt sone gir nøyaktig same SXI som før.

---

## 5. Meir om soner

**Sonekortet.** Klikk på overskrifta for å slå kortet saman eller opne det.
Knappen over lista slår saman eller opnar alle. Lista blir ståande i ro når du
gjer endringar i eit kort.

**Høgreklikk på ei sone** i planteikninga:

| Val | |
|---|---|
| **Rediger geometri** | Same som ⊹ Rediger |
| **Del sone…** | Teikn ei linje tvers gjennom — sona blir to |
| **Zoom til sone** | |
| **Skjul sona** | Sjå under |
| **Kopier sone…** | Til same eller ein annan etasje (`Ctrl+C`) |
| **Slett sone** | |

**Del sone.** Segmenta frå klippelinja blir skiljekonstruksjon i begge dei nye
sonene, og vindauga blir fordelte etter kva vegg dei hamna på. Takflater,
gavlflater og overstyrte segment blir nullstilte.

**Skiljevegg og sonekopling.** Ein vegg mellom to soner er anten
**skiljekonstruksjon** (gul) eller **sonekopling** (grøn) — sonekoplinga ber
med seg kva sone veggen vender mot i SIMIEN. Klikk på veggrada i sonekortet
for å byte, eller høgreklikk for fleire val. Same veggrad byter òg mellom
fasade og skiljevegg.

**Slå saman veggar.** **⊞ Slå saman fasadar** kombinerer fasadar med same
himmelretning til eitt element i SXI-en. Skiljeveggar mot same nabo kan slåast
saman med **Slå saman**; **«Vel…»** lèt deg plukke ut nokre av dei.

**Kopling av soner** (lilla ramme) samlar soner i SIMIEN utan å slå saman
geometrien — t.d. same leilegheit over to etasjar. Berre soner med same
bygningskategori kan koplast, og kvar kan ha eigen tak- og golvtype.

**Skjulte soner.** Augeikonet på sonekortet (eller «Skjul sona» i
høgreklikkmenyen) tek sona ut av planteikninga, 3D-modellen og kartet. Ho er
framleis med i tabellen, BRA-summane og SXI-eksporten — å skjule er ikkje å
slette. **Skjul alle soner / Vis alle** står over sonelista. Ei skjult sone
kan ikkje snappast til eller redigerast; kortet er dempa med namnet overstroke.

**Overstyr** areal, omkrins eller einskilde veggsegment der oppmålinga krev
det. Tasta fasit blir aldri skalert ved omkalibrering.

---

## 6. Etasjar og delplanar

**+ Etasje** lagar ei ny etasje med eiga teikning og eiga etasjehøgd. Drag
fanane for å endre rekkjefølgja — det er rekkjefølgja 3D-modellen blir stabla i.

**Endre namn på ei etasje:** dobbeltklikk på fana, trykk **✎** på den aktive
fana, eller høgreklikk → **Gi nytt namn**. Feltet blir kvitt med ramme medan du
skriv. `Enter` eller klikk utanfor lagrar (fana blinkar grønt), `Esc` avbryt.
Namneendringa kan angrast.

**Ghost** viser etasjen under som svakt omriss, så du kan leggje teikninga
rett over. Står teikningane i utakt, dra ghosten på plass; **↺** nullstiller.

BRA for aktiv etasje og for heile bygget står i fanerada.

### Delplanar — fleire teikningar for same etasje

Store bygg har ofte éi teikning per fløy. Høgreklikk på etasjefana → **Ny
delplan i «Etasje 2»…**, eller **+** i etasjegruppa. Delplanen får eiga
teikning og eiga kalibrering, men står på same nivå og har same høgd som
etasjen i 3D. Fanene står samla i éi ramme.

- **Kalibrer delplanen** — ho får alltid eiga kalibrering, sidan ulike
  teikningar sjeldan har same skala. Hintlinja seier frå om målestokken frå
  hovudteikninga blir føreslått.
- **⌖ Plasser** legg teikningane saman: klikk eit punkt på denne teikninga,
  så same punktet på den andre. Berre under plasseringa ser du dei andre
  teikningane i etasjen.
- Ei sone som ligg inntil ei sone på ei anna delplan, får skiljekonstruksjon
  automatisk, akkurat som innanfor éi teikning.
- Høgreklikk: **Gjer til eiga etasje** eller **Legg under «…» som delplan**
  flyttar ei teikning mellom etasjar utan å flytte ho på arket.
- Slettar du hovudteikninga, tek den fyrste delplanen over etasjenamnet.

### Kopiere ei etasje til eit anna prosjekt

1. **Høgreklikk på etasjefana** → **Kopier etasje**. Heile etasjen — teikning,
   kalibrering, soner, vindauge, skiljeveggar og kontrollmål — blir lagd på eit
   klippbord i nettlesaren.
2. Opne det andre prosjektet (i EntroPi: gå til det andre bygget og opne
   verktøyet der).
3. **+ Etasje** → **Lim inn kopiert etasje**.

Skal etasjen til ei anna maskin, last ned `.entro`-fila (`Ctrl+Shift+S`) og vel
**+ Etasje** → **Hent etasje frå prosjektfil…** i det andre prosjektet.

- **Måla følgjer etasjen.** Var skalaen i kjeldeprosjektet ein annan, får
  etasjen eiga kalibrering, og areala blir dei same som før.
- **Nord er globalt.** Stod nordpila annleis i kjeldeprosjektet, seier meldinga
  frå. Sjekk kompasset.
- **Tekniske system blir ikkje med til eit anna bygg** — luftmengdene deira ville
  gått rett inn i energimerket.

---

## 7. Fasadeteikningar

Fasadeteikningar er eit eige lag **berre for oppmåling** — t.d. for å måle
vindaugshøgder og brystningar. Dei har ingen soner og påverkar ikkje 3D-modellen
eller SXI-eksporten.

- **Fasade** i fanerada byter til fasadevisinga. **+ Fasade** lagar eit nytt
  ark; last opp PDF eller bilete på det.
- **Kalibrer kvart ark** — det finst ingen felles fasadeskala. Areal-metoden er
  ikkje tilgjengeleg her (ho krev ei sone).
- **Mål** og **⌖ Snap** verkar som i planen. Måla blir lagra med arket.
- Fanene kan få nytt namn på same måte som etasjefanene.

**Side om side** deler lerretet i to: plan til venstre, fasade til høgre. Du
arbeider i den eine; den andre er til å sjå på, med eigen zoom. Dobbeltklikk i
ruta for å byte kva du arbeider i. Dra skiljestreken for å endre breidda;
dobbeltklikk på streken gir halv-halv, og slepp han heilt ut mot kanten for å
lukke ruta.

---

## 8. Tiltak i SXI-fila

I eksportdialogen kan du krysse av for tiltak som SIMIEN skal rekne
lønnsemd på:

| Tiltak | Ny verdi |
|---|---|
| Etterisolere fasader | U = 0,18 |
| Etterisolere tak | U = 0,13 |
| Etterisolere gulv | U = 0,10 |
| Bytte vindu | U = 0,8 |
| Bytte dører | U = 1,2 |
| Lekkasjetall 1,5 | n50 = 1,5 |

Verdiane følgjer TEK17. Kvart tiltak dekkjer alle sonene, og fila får med ei
lønnsemdvurdering med SIMIEN sine standardverdiar (kalkulasjonsrente 4 %,
inflasjon 2 %, levetid 20 år).

Finn eit tiltak ingen element å verke på (t.d. «Etterisolere tak» når alle
soner har himling mot ei anna sone), får du beskjed før fila blir lasta ned.
Valet blir ikkje lagra — du vel på nytt ved kvar eksport.

---

## 9. Tekniske system frå EntroPi (BETA)

Dei tekniske anlegga som alt er registrerte på bygget kan koplast til sonene,
og ventilasjonstala går inn i SXI-fila i staden for normverdiar.

### Slik gjer du det

1. **⚙ Hent tekniske systemer** i verktøylinja. Kjem det ikkje svar innan 12
   sekund, seier verktøyet frå — prøv **↻ Hent på nytt**.
2. **Dra eit system frå venstre kolonne over på ei sone** i høgre kolonne.
   Alternativt: klikk systemet først og sona etterpå.
3. **Ferdig** lukkar vindauget.

- **Berre ventilasjon, varme og kjøling blir viste.** Talet på sila system står
  i statuslinja.
- **Kopla soner er éi sone her.** Legg du eit anlegg på ei kopla sone, får alle
  instansane det.
- **Talverdiane står under systemnamnet.** «Ingen tal frå EntroPi —
  normverdiar i SXI» betyr at anlegget er registrert utan tal.
- **Eit system som er sletta i EntroPi står med stipla kant.**
- **↻ Hent på nytt** friskar opp tala på alle koplingane.

### Kva som går inn i SXI-fila

| Frå EntroPi | Inn i SIMIEN som |
|---|---|
| Luftmengd tilluft/avtrekk | spesifikk luftmengd, m³/(h·m²) |
| Redusert luftmengd | luftmengd utanfor drifttid |
| Gjenvinningsgrad | verknadsgrad på varmegjenvinnaren |
| SFP | vifteeffekt, med dellastkurve |

Manglar eitt tal, står normverdien for det eine. Total luftmengd i m³/h blir
delt på arealet anlegget betjener (alle sonene det er lagt på, over alle
etasjar). **Varme og kjøling går enno ikkje inn i SXI-fila** — oppvarming står
som panelovnar (50 W/m²).

---

## 10. 3D-modell og kart

**⬡ 3D** byggjer modellen stabla etter etasjehøgdene. Drag for å rotere,
scroll for å zoome, Shift+drag for å flytte.

| Knapp | |
|---|---|
| **Wireframe** | Berre kantar |
| **Planteikning** | Vis eller skjul teikninga under modellen |
| **↺ Reset** | Tilbake til startvinkelen |
| **🗺 Kart** (beta) | Legg modellen på kartet ved adressa |
| **Sol** | Solsimulering — korleis sola treff bygget gjennom året |
| **PNG** | Last ned visninga som bilete |

Nordpila (kompasset nede til høgre i planen) styrer både solorienteringa i
SIMIEN og retninga på kartet. **Nord-sjekk** roterer planteikninga mellombels
så nord peikar opp, så lenge du held knappen inne.

---

## 11. Lagring

| Handling | Inne i EntroPi | Som eiga nettside |
|---|---|---|
| **Lagre** / `Ctrl+S` | lagrar på bygget | lastar ned `.entro`-fila (du vel mappe og namn) |
| **⬇** / `Ctrl+Shift+S` | lastar ned `.entro`-fila | — |
| **Opne** / `Ctrl+O` | opnar ei `.entro`-fil | opnar ei `.entro`-fil |

**Autolagring til bygget (EntroPi)** står på. Den fyrste endringa i økta blir
lagra etter 10 sekund, deretter kvart andre minutt når det finst noko ulagra.

**Autolagring lokalt** (utanfor EntroPi) skriv ein kopi i nettlesaren kvart
minutt. Han blir tilboden att neste gong du opnar verktøyet.

### Om økta blir broten

Fell nettet ut eller krasjar fana mellom to lagringar, ligg arbeidet framleis
i nettlesaren. Neste gong du opnar **det same bygget**, kjem det ei melding:

> 💾 Ulagra arbeid som ikkje nådde bygget · 14 min sidan — **Hent inn att**

Trykk **Hent inn att**, så er du tilbake der du slapp, og arbeidet blir lagra
vidare til bygget.

- Kopien høyrer til **eitt bygg** og blir aldri tilboden på eit anna.
- Har bygget alt ein nyare versjon, blir kopien sletta.
- **Ignorer** slettar kopien. Lèt du meldinga stå, blir kopien liggjande til
  neste gong.

---

## 12. Kontroll før du leverer

- **Skala-badgen** nede til venstre skal ikkje vere raud — på nokon etasje.
- **Sonekorta**: ingen raude ⚠ ved vindauga, ingen gule ⚠-piller på tak og golv.
- **Tabell-fana** viser alle soner, fasadar og vindauge med areal. Her ser du
  raskt om ein fasade manglar vindauge eller eit areal ser rart ut.
- **Mål** kontrollmåler ein avstand på teikninga. Måla blir lagra med
  prosjektet, påverkar ikkje SXI-en og følgjer omkalibrering.
- **⬡ 3D**: ein etasje som ligg feil, eller ei sone som manglar tak, er lett å
  sjå der.
- **Nord** er sett rett.

---

## 13. Tastatursnarvegar

Trykk **?** i programmet for full liste.

| | |
|---|---|
| `Ctrl+S` | Lagre (på bygget i EntroPi) |
| `Ctrl+Shift+S` | Last ned prosjektfila |
| `Ctrl+O` | Opne prosjekt |
| `Ctrl+Z` / `Ctrl+Y` | Angre / gjere om |
| `Esc` | Avbryt, tilbake til navigering |
| `Shift` under teikning | Lås til 90°/45° |
| Dobbeltklikk / `Enter` | Fullfør sone |
| `Backspace` | Fjern siste punkt under teikning |
| `Ctrl+C` / `Ctrl+V` | Kopier og lim inn sone eller vindauge |
| `Delete` over vindauge | Slett vindauget |
| Scroll / klikk+dra | Zoom / flytt teikninga |
| Høgreklikk sone / vindauge | Kontekstmeny |
| Høgreklikk etasjefane | Nytt namn, delplanar, kopier etasje |
| Dobbeltklikk etasjefane | Endre namn |

---

## 14. Når noko ikkje stemmer

**Areala er feil.** Du har ikkje kalibrert, eller ein etasje har eiga
kalibrering som er sett feil. Sjekk skala-badgen på kvar etasje (og kvar
delplan).

**Eksporten seier at vindauge og dører er større enn fasaden.** Sjå sona og
fasaden i meldinga. Vanlege årsaker: antal er for høgt, vindaugshøgda er
større enn etasjehøgda, eller vindauget er lagt på feil vegg.

**Snappen låser til feil stad.** Teikninga er tett eller skanna. Slå av
**⌖ Snap** og klikk fritt.

**Skiljeveggen mellom to soner blei ikkje sett.** Sonene ligg meir enn ~8 cm
frå kvarandre, eller overlappar mindre enn 25 cm. Sett veggen manuelt i
sidepanelet. Å flytte eit hjørne i etterkant set ingenting automatisk.

**Ei sone er borte frå teikninga.** Ho er truleg skjult — sjå etter dempa kort
med overstroke namn, eller trykk **Vis alle** over sonelista.

**Delplanen ligg feil i forhold til resten av etasjen.** Bruk **⌖ Plasser**.

**Tekniske systemer-lista er tom.** Anten ligg det ingen ventilasjons-, varme-
eller kjølesystem på bygget, eller verten svarte ikkje. Statuslinja skil dei to.

**Byggnamnet manglar i verktøylinja.** Du står i ei vanleg fane, ikkje i
EntroPi. «Lagre» lastar då ned ei fil.

**SIMIEN nektar å opne fila.** Sjekk at alle soner har bygningskategori og at
taktypen stemmer med kva sona faktisk grensar mot.

---

## 15. Kjende manglar

- Import av eksisterande SXI-filer
- Varme og kjøling frå EntroPi går ikkje inn i SXI-en
- Validering av overlappande soner
- Snap til skrå veggar
- PDF-rapport og eksport til rekneark
- Offline-modus (3D og PDF-lesing hentar bibliotek frå internett)
