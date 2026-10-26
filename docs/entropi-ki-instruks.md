# Instruks: KI-oppteikning i SXI-generatoren — EntroPi-sida

Du jobbar i EntroPi-kodebasen. SXI-generatoren (energimerkingsverktøyet til
Entro) ligg inne i EntroPi som ein iframe frå `https://entroknut.github.io/energimerking-2/`,
og snakkar med EntroPi via `postMessage`. Det finst alt ein komponent som
handterer meldingane frå verktøyet (`sxi:ready`, `sxi:save`,
`sxi:request-systems`, `sxi:export-sxi` …) — finn han fyrst, t.d. ved å søkje
etter `sxi:request-systems` eller `sxi-generator`.

Verktøyet har fått ein ny knapp, «✦ KI-oppteikning», der Claude teiknar opp
soner, vindauge og dører frå planteikninga. **Verktøyet har ingen API-nøkkel**,
så det ber EntroPi om å kalle Claude. I dag svarar ikkje EntroPi, og brukaren
får «EntroPi svarte ikkje — vertssida må svare på sxi:ai-request».

Oppgåva di: få EntroPi til å svare.

## Kva du skal lage

### 1. Ei serverrute som kallar Claude

EntroPi har alt ein Anthropic API-nøkkel. Finn korleis han er sett opp
(miljøvariabel, eksisterande `Anthropic`-klient e.l.) og bruk det same —
ikkje lag ein ny nøkkel eller eit nytt oppsett om eitt finst. Nøkkelen skal
aldri ut til nettlesaren.

Ruta tek imot `{prompt, images, schema, maxTokens}` som JSON og returnerer
`{ok:true, result}` eller `{ok:false, message}`. Døme for Next.js App Router
(`app/api/sxi/ki/route.ts`) — tilpass til korleis EntroPi faktisk er bygd
(rutestruktur, autentisering, eksisterande klient):

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();     // eller gjenbruk EntroPi sin eksisterande klient
export const maxDuration = 300;     // analysen kan ta 1–2 min; standard tidsavbrot er for kort

export async function POST(req: Request) {
  // 1. Krev innlogga brukar — bruk same sjekk som dei andre API-rutene i EntroPi.
  //    Ruta sender vidare ein prompt som kjem frå klienten, så ho må ikkje vere open.

  const d = await req.json();

  // 2. Grenser: dette er ein proxy mot Claude.
  const images = Array.isArray(d.images) ? d.images : [];
  if (typeof d.prompt !== 'string' || !d.prompt || d.prompt.length > 20000
      || images.length < 1 || images.length > 2
      || images.some((b: any) => b?.mediaType !== 'image/jpeg' || typeof b?.data !== 'string')
      || images.reduce((s: number, b: any) => s + b.data.length, 0) > 8_000_000
      || typeof d.schema !== 'object' || d.schema === null) {
    return Response.json({ ok: false, message: 'Ugyldig førespurnad.' }, { status: 400 });
  }

  try {
    const msg = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: Math.min(Number(d.maxTokens) || 16000, 32000),
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: { type: 'json_schema', schema: d.schema } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',          // eit avslag vert køyrt på nytt på ein annan modell
      messages: [{ role: 'user', content: [
        ...images.map((b: any) => ({ type: 'image' as const,
          source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b.data } })),
        { type: 'text' as const, text: d.prompt },
      ]}],
    });
    if (msg.stop_reason === 'refusal')
      return Response.json({ ok: false, message: 'Claude avslo førespurnaden.' });
    if (msg.stop_reason === 'max_tokens')
      return Response.json({ ok: false, message: 'Svaret vart for langt og er avkorta.' });
    const text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
    return Response.json({ ok: true, result: JSON.parse(text) });
  } catch (e) {
    console.error('SXI KI-analyse feila', e);
    return Response.json({ ok: false,
      message: 'KI-analysen feila: ' + (e instanceof Error ? e.message : 'ukjend feil') });
  }
}
```

Viktig:
- **Modell `claude-opus-5-5`, `thinking: adaptive`, `effort: 'high'`.** Ikkje
  send `temperature`, `budget_tokens` eller `thinking: {type:'disabled'}` —
  det gir 400 på denne modellen.
- **`output_config.format` med skjemaet frå verktøyet** gjer at svaret alltid
  er gyldig JSON etter skjemaet. Ikkje endre skjemaet eller prompten — dei
  kjem frå verktøyet og vert forbetra der.
- Bruk SDK-en (`@anthropic-ai/sdk`), ikkje rå `fetch` mot API-et. Er SDK-en
  for gammal til å kjenne `output_config`/`fallbacks`, oppgrader han.
- `maxDuration = 300` (eller tilsvarande for hostinga): éin analyse tek
  30–120 s. Køyrer EntroPi ikkje på Vercel, sørg for at proxy/server-tidsavbrotet
  er minst 5 min for denne ruta.
- Verktøyet sender opptil **tre førespurnader samstundes** (éin per sone i
  steg 2). Ruta må tole det.

### 2. Ein ny `case` i iframe-komponenten

I `switch`-en på meldingstypane frå verktøyet (der `sxi:request-systems` er):

```ts
case 'sxi:ai-request': {
  // Stadfest STRAKS — verktøyet gir opp etter 15 s utan ack.
  send({ type: 'sxi:ai-ack', requestId: d.requestId });
  try {
    const res = await fetch('/api/sxi/ki', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: d.prompt, images: d.images,
                             schema: d.schema, maxTokens: d.maxTokens }),
    });
    const svar = await res.json();     // {ok, result} eller {ok:false, message}
    send({ type: 'sxi:ai-result', requestId: d.requestId, ...svar });
  } catch (e) {
    send({ type: 'sxi:ai-result', requestId: d.requestId, ok: false,
           message: e instanceof Error ? e.message : 'ukjend feil' });
  }
  break;
}
```

`send` er den eksisterande hjelparen som postar til iframen
(`iframe.contentWindow.postMessage({source:'entropi', ...msg}, 'https://entroknut.github.io')`).
Følg det same mønsteret som dei andre meldingane i komponenten.

Lyttaren må, som for dei andre meldingane, berre handtere meldingar der
`ev.source === iframe.contentWindow`, `ev.origin === 'https://entroknut.github.io'`
og `ev.data.source === 'sxi-generator'`.

## Protokollen

Verktøyet → EntroPi:

```js
{ source:'sxi-generator', protocol:1, type:'sxi:ai-request',
  requestId:'ki3',
  oppgave:'soner',            // 'soner' | 'opningar' — kan brukast til logging
  prompt:'…',                 // ferdig tekst
  images:[{mediaType:'image/jpeg', data:'<base64 utan data:-prefiks>'}],  // 1–2 stk, ≤ 2400 px
  schema:{…},                 // JSON-skjema for svaret
  maxTokens:16000,
  meta:{…} }                  // berre til logging — skal IKKJE til Claude
```

EntroPi → verktøyet:

| type | felt | når |
|---|---|---|
| `sxi:ai-ack` | `requestId` | straks meldinga kjem. Utan ack innan 15 s gir verktøyet opp. Etter ack ventar det opptil 6 min. |
| `sxi:ai-result` | `requestId`, `ok`, `result`, `message` | når Claude er ferdig. `result` = JSON-objektet (objekt eller streng). `ok:false` + `message` ved feil — meldinga vert vist til brukaren. |

`requestId` må speglast nøyaktig — verktøyet har fleire førespurnader ute
samstundes.

## Slik testar du

1. Opne eit bygg i EntroPi og start SXI-generatoren (energimerkinga).
2. Last opp ei planteikning, og kalibrer ho (Kalibrer → Lengde eller Målestokk).
3. Trykk «✦ KI-oppteikning» → «Start ✦».
4. Venta: loggen i vindauget seier «Steg 1 — soner…», og etter 30–120 s kjem
   eit forslag med oransje stipla soner på teikninga og «✓ Godta n soner».
5. Godta. Er «Finn vindauge og dører» kryssa av, går det rett vidare til
   steg 2, og forslag til vindauge (oransje) og dører (lilla) kjem på veggane.

Feilsøking:
- «EntroPi svarte ikkje — vertssida må svare på sxi:ai-request» ⇒ `case`-en
  vert ikkje nådd, eller ack vert ikkje sendt (sjekk origin-/source-filteret).
- «KI-analysen svarte ikkje innan 6 min» ⇒ ack kom, men ikkje resultatet
  (ruta heng eller tidsavbrot på serveren).
- Annan feiltekst ⇒ kjem frå `message` i ruta; sjå serverloggen.

Full protokoll for alle meldingane mellom EntroPi og verktøyet:
https://github.com/entroknut/energimerking-2/blob/main/docs/entropi-integrasjon.md
