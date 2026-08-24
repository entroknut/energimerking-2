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
| `sxi:export-sxi` | `filename`, `bytes`, `blob`, `meta` | SXI-fila til SIMIEN vart eksportert. Kjem berre om init hadde `wantsSxi:true`. Krev ikkje svar. |

`meta` på `sxi:save`: `{floors, zones, braM2, adresse, savedAt, appVersion}` —
nok til å vise «3 etasjar · 12 soner · 2 480 m²» på byggkortet utan å opne fila.

### EntroPi → verktøyet

| type | felt | verknad |
|---|---|---|
| `sxi:init` | `bygg`, `project`, `wantsSxi`, `autosaveMs`, `saveLabel` | slår på innbygd modus. Send han som svar på `sxi:ready`. |
| `sxi:load` | `project` | byt til eit anna prosjekt medan verktøyet står ope (t.d. ein tidlegare versjon). |
| `sxi:request-save` | `requestId`, `auto` | ber verktøyet lagre no. |
| `sxi:save-result` | `requestId`, `ok`, `message` | resultatet av lagringa. Utan svar innan 45 s gir verktøyet opp og ber brukaren prøve igjen. |

Felta i `sxi:init`:

- `bygg: {id, namn, adresse, byggeaar}` — `namn` vert vist som brikke i
  verktøylinja, så brukaren ser kvar lagringa hamnar. `adresse` og `byggeaar`
  er **framlegg** som vert fylte inn i verktøyet (sjå under). `byggeaar` må
  vere eit årstal mellom 1800 og 2100; alt anna vert ignorert, sidan eit
  vrøvltal ville gitt feil standard-U-verdiar utan at nokon såg det.
- `project` — `.entro`-innhaldet, som **Blob, streng eller ferdig parsa
  objekt**. `null` for eit bygg utan prosjekt.
- `wantsSxi: true` — send også SXI-fila til EntroPi ved eksport.
- `autosaveMs` — automatisk lagring til bygget når det finst ulagra endringar.
  Minst 30 000; `0`/utelate slår det av. Kvar autolagring skriv ei ny fil, så
  vel eit tal som passar med kor mange versjonar de vil ta vare på.
- `saveLabel` — tekst på lagreknappen (standard «Lagre på bygget»).

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
- Autolagringstoasten («Autolaga prosjekt frå 52 min sidan») vert undertrykt
  når verten sender eit prosjekt, og gjenopprettinga vert utsett 1,5 s i
  iframe så `sxi:init` får komme fyrst.
