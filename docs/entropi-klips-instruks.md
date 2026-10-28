# Instruks: «Spør Klips» i SXI-generatoren — EntroPi-sida

Du jobbar i EntroPi-kodebasen. SXI-generatoren (energimerkingsverktøyet til
Entro) ligg inne i EntroPi som ein iframe frå `https://entroknut.github.io/energimerking-2/`
og snakkar med EntroPi via `postMessage`. EntroPi svarar alt på
`sxi:ai-request` for KI-oppteikninga: ein `case 'sxi:ai-request'` i
iframe-komponenten poster til ei serverrute (truleg `/api/sxi/ki`) som kallar
Claude. Finn begge fyrst, t.d. ved å søkje etter `sxi:ai-request` og
`Ugyldig førespurnad`.

Verktøyet har fått ein hjelpefigur, **Klips**, der brukaren kan skrive
spørsmål om programmet. Spørsmåla går som `sxi:ai-request` med
`oppgave:'hjelp'` og **utan bilete**. I dag avviser ruta dei med «Ugyldig
førespurnad.», fordi ho krev 1–2 bilete.

Oppgåva di: la ruta svare på `oppgave:'hjelp'` — så billeg som mogleg — utan å
endre noko for KI-oppteikninga.

## 1. Komponenten: send `oppgave` vidare

I `case 'sxi:ai-request'` vert i dag berre `prompt`, `images`, `schema` og
`maxTokens` sende til ruta. Legg til `oppgave`:

```ts
body: JSON.stringify({ oppgave: d.oppgave, prompt: d.prompt, images: d.images,
                       schema: d.schema, maxTokens: d.maxTokens }),
```

Ack (`sxi:ai-ack`) og svar (`sxi:ai-result`) går som før — ingen andre
endringar i komponenten.

## 2. Ruta: eiga grein for `hjelp`, FØR bilete-sjekken

Legg greina rett etter at `d` er lesen og brukaren er sjekka innlogga — før
valideringa som krev bilete. Bruk den same Anthropic-klienten som ruta alt har.

```ts
  if (d.oppgave === 'hjelp') {
    // «Spør Klips»: korte tekstsvar om programmet. Billegaste modell, låg
    // innsats, ingen bilete. Eitt spørsmål kostar om lag 0,0005 USD.
    if (typeof d.prompt !== 'string' || !d.prompt || d.prompt.length > 12000
        || (Array.isArray(d.images) && d.images.length > 0)
        || typeof d.schema !== 'object' || d.schema === null) {
      return Response.json({ ok: false, message: 'Ugyldig hjelpespørsmål.' }, { status: 400 });
    }
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-5-5',
        max_tokens: Math.min(Number(d.maxTokens) || 700, 1000),
        output_config: { effort: 'low', format: { type: 'json_schema', schema: d.schema } },
        messages: [{ role: 'user', content: d.prompt }],
      });
      if (msg.stop_reason !== 'end_turn')
        return Response.json({ ok: false, message: 'Klips fekk ikkje svart på det.' });
      const text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
      return Response.json({ ok: true, result: JSON.parse(text) });
    } catch (e) {
      console.error('SXI Klips-spørsmål feila', e);
      return Response.json({ ok: false,
        message: 'Klips fekk ikkje svar: ' + (e instanceof Error ? e.message : 'ukjend feil') });
    }
  }
```

Viktig:
- **`claude-haiku-5-5` med `effort: 'low'`** — det er heile poenget. Ikkje bruk
  Opus-oppsettet frå KI-oppteikninga her (det kostar fleire hundre gonger meir).
- **Ikkje send `thinking`, `temperature`, `betas` eller `fallbacks`.** Haiku 5.5
  har ingen fallback på serversida, og `thinking:{type:'disabled'}` treng vi
  ikkje — låg innsats held svaret kort.
- **`output_config.format` med skjemaet frå verktøyet**, som for
  KI-oppteikninga. Svaret er `{omProgrammet: boolean, svar: string}`. Ikkje
  endre prompten eller skjemaet — dei kjem frå verktøyet og vert forbetra der.
  Prompten seier sjølv at modellen berre skal svare om programmet.
- **Ingen bilete er lov** i denne greina, og prompten er avgrensa til 12 000
  teikn (verktøyet sender om lag 5 000). Ruta er ein proxy mot Claude for alle
  som er logga inn — grensene skal stå.
- **Grense per brukar** (tilrådd): t.d. maks 50 hjelpespørsmål per brukar per
  døgn. Bruk den mekanismen EntroPi alt har for rate limiting om det finst ein;
  elles kan dette vente. Ved overskriding: `{ok:false, message:'Du har stilt
  mange spørsmål i dag — prøv igjen i morgon.'}` (meldinga vert vist i boblen).
- Logg gjerne `msg.usage.input_tokens` / `output_tokens` saman med
  `oppgave`, så forbruket kan følgjast.
- Den eksisterande vegen (`soner`, `opningar`, `fasade` med bilete og Opus)
  skal vere **heilt uendra**.

## Protokollen (det som er nytt)

Verktøyet → EntroPi:

```js
{ source:'sxi-generator', protocol:1, type:'sxi:ai-request',
  requestId:'ki7',
  oppgave:'hjelp',
  prompt:'…',          // kunnskapsgrunnlag om programmet + tilstand + spørsmålet, ~5 000 teikn
  images:[],           // alltid tom
  schema:{ type:'object', additionalProperties:false, required:['omProgrammet','svar'],
           properties:{ omProgrammet:{type:'boolean'}, svar:{type:'string'} } },
  maxTokens:700,
  meta:{ sporsmal: 42 } }   // berre logging — skal IKKJE til Claude
```

Svaret tilbake er det same som før: `sxi:ai-ack` straks, så `sxi:ai-result`
med `{requestId, ok:true, result:{omProgrammet, svar}}` eller
`{requestId, ok:false, message}`.

## Slik testar du

1. Opne eit bygg i EntroPi og start SXI-generatoren.
2. Klikk på Klips (binderset nede til venstre på lerretet). Boblen har eit
   felt «Spør om programmet …».
3. Skriv «Korleis kalibrerer eg?» og trykk «Spør». Venta: «Augneblink …», så
   «Klips svarar» med eit kort svar på nynorsk som nemner «⊕ Kalibrer» —
   innan nokre sekund.
4. Skriv «Kva blir vêret i morgon?». Venta: éi setning om at Klips berre kan
   hjelpe med SXI-generatoren.
5. Sjå i serverloggen at kallet gjekk til `claude-haiku-5-5`, med om lag
   1 200–1 500 token inn og under 300 ut.
6. Kontroller at «✦ KI-oppteikning» framleis verkar som før.

Feilsøking:
- «Ugyldig førespurnad.» ⇒ `oppgave` kjem ikkje fram til ruta (punkt 1), eller
  `hjelp`-greina står etter bilete-sjekken.
- «Ugyldig hjelpespørsmål.» ⇒ greina vert nådd, men valideringa slår til —
  sjå kva som kom inn.
- «Klips fekk ikkje svart på det.» ⇒ `stop_reason` var ikkje `end_turn`
  (t.d. `max_tokens` eller `refusal`); logg `msg.stop_reason`.

Full protokoll for alle meldingane mellom EntroPi og verktøyet:
https://github.com/entroknut/energimerking-2/blob/main/docs/entropi-integrasjon.md
