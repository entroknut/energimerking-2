"""Evaluering av KI-soneteikninga mot ferdige prosjekt (treningsdata).

  python tools/ki-eval.py                       # 20 etasjar frå treningssettet
  python tools/ki-eval.py --utval 40 --del bruk # fleire, og «del etter bruk»
  python tools/ki-eval.py --sett test --alle    # heile testsettet (hald det urørt!)
  python tools/ki-eval.py --mock                # utan API: fasit med støy, testar etterarbeidet
  python tools/ki-eval.py --samanlikn TAG       # samanlikn med ei tidlegare køyring

Kva som skjer: køyraren startar ein lokal server og opnar tools/test/ki-eval.html
i ein nettlesar utan vindauge. Sida lastar index.html og køyrer DEI EKTE
KI-funksjonane (kiSonerForArk med oversikt, kiRettSoner og kontrollrunde, og
kiSlaaSamanKategori) på kvar planteikning. EntroHost.askAi er bytt ut med eit
kall hit, og køyraren kallar Claude med same parametrar som EntroPi-sida
(docs/entropi-integrasjon.md). Svaret vert mellomlagra på innhaldet i
førespurnaden, så ei endring i etterarbeidet (kiRettSoner o.l.) kan målast på
nytt utan nye API-kall — berre ei endra prompt kostar.

Krev ANTHROPIC_API_KEY i miljøet (ikkje med --mock).

Treningsdataa ligg utanfor git (kundedata): --data, eller SXI_KI_DATA, elles
C:\\EntroPi\\soneteikning-treningsdata. Bygga er delte i trenings- og testsett
etter ein hash av mappenamnet (om lag 1 av 5 i test). Juster prompten mot
treningssettet, og mål på testsettet berre til slutt — elles lærer vi
prompten dataa utanåt.

Resultat: tools/test/ki-eval/koyringar/<tag>/ (rapport.txt, resultat.json og
overlay/ med fasit grøn og KI raud oppå planen). Mellomlageret:
tools/test/ki-eval/cache/. Begge er utanfor git.
"""
import sys, os, json, re, glob, csv, time, random, hashlib, shutil, subprocess, tempfile, threading
import http.server, socketserver, urllib.request, urllib.error, urllib.parse, argparse, datetime
import numpy as np
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL = os.path.join(ROT, 'tools', 'test', 'ki-eval')
CACHE = os.path.join(EVAL, 'cache')
KOYR = os.path.join(EVAL, 'koyringar')
DATA_STD = os.environ.get('SXI_KI_DATA', r'C:\EntroPi\soneteikning-treningsdata')

# Fasit-soner som ikkje er energisoner, men hjelpesoner i prosjektet
IKKJE_SONE = re.compile(r'trekkes?\s+fra|fjern|åpen\s+ned|ikkje\s+med|ikke\s+med', re.I)

sys.path.insert(0, os.path.join(ROT, 'tools'))
_ts = __import__('importlib').import_module('test-sxi')
nettlesarar = _ts.nettlesarar


# ── Data ────────────────────────────────────────────────────────────────────
def les_etasjar(data):
    ut = []
    for js in sorted(glob.glob(os.path.join(data, '*', '[0-9]*.json'))):
        mappe = os.path.basename(os.path.dirname(js))
        stamme = os.path.splitext(os.path.basename(js))[0]
        plan = os.path.join(os.path.dirname(js), stamme + '_plan.png')
        if not os.path.exists(plan):
            continue
        with open(js, encoding='utf-8') as fh:
            d = json.load(fh)
        soner = [z for z in d.get('soner', []) if len(z.get('pts', [])) >= 3]
        bort = [z['name'] for z in soner if IKKJE_SONE.search(z.get('name') or '')]
        soner = [z for z in soner if not IKKJE_SONE.search(z.get('name') or '')]
        if not soner or not d.get('mmPerPx'):
            continue
        h = int(hashlib.sha1(mappe.encode('utf-8')).hexdigest(), 16)
        ut.append({'nokkel': mappe + '/' + stamme, 'bygg': mappe, 'etasje': d.get('etasje'),
                   'plan': mappe + '/' + stamme + '_plan.png', 'mpp': d['mmPerPx'],
                   'w': d.get('bildeBreidde'), 'h': d.get('bildeHogde'),
                   'soner': soner, 'bort': bort, 'sett': 'test' if h % 5 == 0 else 'trening'})
    return ut


def vel_utval(etasjar, a):
    l = [e for e in etasjar if a.sett == 'alle' or e['sett'] == a.sett]
    if a.bygg:
        l = [e for e in l if a.bygg.lower() in e['bygg'].lower()]
    if a.alle or a.bygg:
        return l
    # Spreidd over bygga: éin etasje per bygg i runde etter runde
    rnd = random.Random(a.seed)
    per = {}
    for e in l:
        per.setdefault(e['bygg'], []).append(e)
    bygg = sorted(per)
    rnd.shuffle(bygg)
    for b in bygg:
        rnd.shuffle(per[b])
    ut = []
    while len(ut) < a.utval and any(per.values()):
        for b in bygg:
            if per[b] and len(ut) < a.utval:
                ut.append(per[b].pop())
    return ut


# ── Claude ──────────────────────────────────────────────────────────────────
class Ai:
    def __init__(self, a, oppg):
        self.a = a
        self.oppg = {e['nokkel']: e for e in oppg}
        self.lock = threading.Lock()
        self.bruk = {'kall': 0, 'cache': 0, 'inn': 0, 'ut': 0, 'feil': 0}
        self.rnd = random.Random(a.seed)
        os.makedirs(CACHE, exist_ok=True)

    def svar(self, d):
        if self.a.mock:
            return self.mock(d)
        body = {
            'model': self.a.modell,
            'max_tokens': min(d.get('maxTokens') or 16000, 32000),
            'thinking': {'type': 'adaptive'},
            'output_config': {'effort': self.a.effort, 'format': {'type': 'json_schema', 'schema': d['schema']}},
            'fallbacks': 'default',
            'messages': [{'role': 'user', 'content': [
                *[{'type': 'image', 'source': {'type': 'base64', 'media_type': b['mediaType'], 'data': b['data']}}
                  for b in d.get('images') or []],
                {'type': 'text', 'text': d['prompt']}]}],
        }
        nokkel = hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()
        fil = os.path.join(CACHE, nokkel + '.json')
        if os.path.exists(fil) and not self.a.utan_cache:
            with self.lock:
                self.bruk['cache'] += 1
            with open(fil, encoding='utf-8') as fh:
                return json.load(fh)
        if self.a.berre_cache:
            with self.lock:
                self.bruk['feil'] += 1
            return {'ok': False, 'message': 'avslo: ikkje i mellomlageret (--berre-cache)'}
        with self.lock:
            if self.kostnad() >= self.a.budsjett:
                self.bruk['feil'] += 1
                return {'ok': False, 'message': f'avslo: budsjettet på {self.a.budsjett} USD er brukt opp'}
        r = self.kall(body)
        if r.get('ok'):
            with open(fil, 'w', encoding='utf-8') as fh:
                json.dump(r, fh, ensure_ascii=False)
        return r

    # USD per million token (claude-opus-5-5: 4 inn / 20 ut). Tenkinga er med i output_tokens.
    PRIS = {'claude-opus-5-5': (4, 20), 'claude-sonnet-5-5': (2, 10)}

    def kostnad(self):
        pi, pu = self.PRIS.get(self.a.modell, (4, 20))
        return (self.bruk['inn'] * pi + self.bruk['ut'] * pu) / 1e6

    def kall(self, body):
        key = os.environ.get('ANTHROPIC_API_KEY', '')
        data = json.dumps(body).encode('utf-8')
        for forsok in range(4):
            req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=data, method='POST', headers={
                'x-api-key': key, 'anthropic-version': '2023-06-01',
                'anthropic-beta': 'server-side-fallback-2026-07-01', 'content-type': 'application/json'})
            try:
                with urllib.request.urlopen(req, timeout=600) as res:
                    msg = json.loads(res.read().decode('utf-8'))
                break
            except urllib.error.HTTPError as e:
                tekst = e.read().decode('utf-8', 'replace')[:300]
                if e.code in (429, 500, 502, 503, 504, 529) and forsok < 3:
                    time.sleep(10 * (forsok + 1))
                    continue
                with self.lock:
                    self.bruk['feil'] += 1
                return {'ok': False, 'message': f'API {e.code}: {tekst}'}
            except Exception as e:
                if forsok < 3:
                    time.sleep(5)
                    continue
                with self.lock:
                    self.bruk['feil'] += 1
                return {'ok': False, 'message': 'nettfeil: ' + str(e)}
        u = msg.get('usage') or {}
        with self.lock:
            self.bruk['kall'] += 1
            self.bruk['inn'] += u.get('input_tokens', 0)
            self.bruk['ut'] += u.get('output_tokens', 0)
        # Same meldingar som EntroPi-sida, så kiSpor vel rett (nytt forsøk / ikkje)
        if msg.get('stop_reason') == 'refusal':
            return {'ok': False, 'message': 'Claude avslo førespurnaden.'}
        if msg.get('stop_reason') == 'max_tokens':
            return {'ok': False, 'message': 'Svaret vart avkorta.'}
        tekst = ''.join(c.get('text', '') for c in msg.get('content', []) if c.get('type') == 'text')
        try:
            return {'ok': True, 'result': json.loads(tekst)}
        except Exception:
            return {'ok': False, 'message': 'svaret var ikkje JSON'}

    # Utan API: fasiten med støy (hjørna flytta opp til --mock-stoy meter).
    # Testar kiRettSoner og samanslåinga, ikkje Claude.
    def mock(self, d):
        meta = d.get('meta') or {}
        if meta.get('steg') == 'oversikt':
            return {'ok': True, 'result': {'arkType': 'plan', 'x0': 0, 'y0': 0, 'x1': 1000, 'y1': 1000}}
        if meta.get('steg') == 'kontroll':
            return {'ok': True, 'result': {'ok': True, 'kommentar': 'mock', 'soner': []}}
        e = self.oppg.get(meta.get('arkId'))
        if not e:
            return {'ok': False, 'message': 'mock: ukjend etasje'}
        s = self.a.mock_stoy * 1000 / e['mpp']
        # Eigen generator per etasje: same støy uansett kva rekkjefølgje sida spør i
        rnd = random.Random(f"{self.a.seed}:{e['nokkel']}")
        dx, dy = rnd.uniform(-s, s) / 2, rnd.uniform(-s, s) / 2
        soner = [{'namn': z.get('name') or '', 'bruk': z.get('bygkat') or 'Ukjend', 'byggeaar': 0,
                  'pts': [{'x': (p['x'] + dx + rnd.uniform(-s, s) / 2) / e['w'] * 1000,
                           'y': (p['y'] + dy + rnd.uniform(-s, s) / 2) / e['h'] * 1000}
                          for p in z['pts']]} for z in e['soner']]
        return {'ok': True, 'result': {'arkType': 'plan', 'analyse': 'mock',
                                       'kontrollMaal': {'mm': 0, 'a': {'x': 0, 'y': 0}, 'b': {'x': 0, 'y': 0}},
                                       'soner': soner}}


# ── Nettlesaren ─────────────────────────────────────────────────────────────
def koyr(a, oppg, data):
    nett = next((e for e in nettlesarar() if os.path.exists(e)), None)
    if not nett:
        sys.exit('Fann ingen nettlesar (Playwright headless-shell eller Chrome).')
    ai = Ai(a, oppg)
    res, ferdig, slutt = {}, threading.Event(), {}
    oppgaver = {'js': a.js, 'del': a.del_, 'slaaKat': not a.utan_slaa, 'parallelt': a.parallelt,
                'etasjar': [{'nokkel': e['nokkel'], 'etasje': e['etasje'], 'plan': urllib.parse.quote(e['plan']), 'mpp': e['mpp']} for e in oppg]}

    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *x, **k):
            super().__init__(*x, directory=ROT, **k)

        def log_message(self, *x):
            pass

        def svar_json(self, o, kode=200):
            b = json.dumps(o, ensure_ascii=False).encode('utf-8')
            self.send_response(kode)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(b)))
            self.end_headers()
            self.wfile.write(b)

        def do_GET(self):
            if self.path == '/__oppgaver':
                return self.svar_json(oppgaver)
            if self.path.startswith('/__data/'):
                rel = urllib.parse.unquote(self.path[len('/__data/'):].split('?')[0])
                p = os.path.realpath(os.path.join(data, rel))
                if not p.startswith(os.path.realpath(data)) or not os.path.isfile(p):
                    return self.send_error(404)
                with open(p, 'rb') as fh:
                    b = fh.read()
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.send_header('Content-Length', str(len(b)))
                self.end_headers()
                self.wfile.write(b)
                return
            return super().do_GET()

        def do_POST(self):
            n = int(self.headers.get('Content-Length') or 0)
            d = json.loads(self.rfile.read(n).decode('utf-8'))
            if self.path == '/__ai':
                return self.svar_json(ai.svar(d))
            if self.path == '/__resultat':
                res[d['nokkel']] = d
                print(f"  [{len(res)}/{len(oppg)}] {d['nokkel']}: "
                      + (d.get('feil') or d.get('ikkjePlan') or f"{len(d.get('slegne') or [])} soner")
                      + f" ({d.get('sek', 0):.0f} s)", flush=True)
                self.send_response(204)
                self.end_headers()
                return
            if self.path == '/__ferdig':
                slutt.update(d)
                self.send_response(204)
                self.end_headers()
                ferdig.set()
                return
            self.send_error(404)

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H)
    srv.daemon_threads = True
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    profil = tempfile.mkdtemp(prefix='sxi-kieval-')
    url = f'http://127.0.0.1:{port}/tools/test/ki-eval.html'
    hl = [] if 'headless-shell' in nett else ['--headless=new']
    p = subprocess.Popen([nett, *hl, '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                          '--js-flags=--max-old-space-size=8192', f'--user-data-dir={profil}', url],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not ferdig.wait(a.tidsgrense * 60):
            print(f'⚠ Tidsgrensa ({a.tidsgrense} min) gjekk ut — reknar på det som kom.')
    finally:
        p.kill()
        try:
            p.wait(10)
        except Exception:
            pass
        srv.shutdown()
        shutil.rmtree(profil, ignore_errors=True)
    return res, slutt.get('feil') or [], ai.bruk


# ── Måling ──────────────────────────────────────────────────────────────────
def areal(pts):
    x = np.array([p['x'] for p in pts]); y = np.array([p['y'] for p in pts])
    return abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))) / 2


def raster(polys, s, W, H):
    """Etikettbilete: 0 = ingenting, i+1 = polygon i (seinare vinn ved overlapp)."""
    im = Image.new('I', (W, H), 0)
    g = ImageDraw.Draw(im)
    for i, pts in enumerate(polys):
        if len(pts) >= 3:
            g.polygon([(p['x'] * s, p['y'] * s) for p in pts], fill=i + 1)
    return np.array(im)


def kantpunkt(polys, steg):
    ut = []
    for pts in polys:
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            L = ((b['x'] - a['x']) ** 2 + (b['y'] - a['y']) ** 2) ** 0.5
            n = max(1, int(L / steg))
            t = (np.arange(n) + 0.5) / n
            ut.append(np.stack([a['x'] + (b['x'] - a['x']) * t, a['y'] + (b['y'] - a['y']) * t], 1))
    return np.concatenate(ut) if ut else np.zeros((0, 2))


def avstand_til_kantar(P, polys):
    segs = [((pts[i]['x'], pts[i]['y']), (pts[(i + 1) % len(pts)]['x'], pts[(i + 1) % len(pts)]['y']))
            for pts in polys for i in range(len(pts))]
    if not len(P) or not segs:
        return np.full(len(P), np.inf)
    A = np.array([s[0] for s in segs]); B = np.array([s[1] for s in segs])
    best = np.full(len(P), np.inf)
    for k in range(0, len(P), 2000):
        Q = P[k:k + 2000, None, :]
        AB = B - A
        t = np.clip(((Q - A) * AB).sum(-1) / np.maximum((AB * AB).sum(-1), 1e-9), 0, 1)
        D = np.linalg.norm(Q - (A + t[..., None] * AB), axis=-1).min(1)
        best[k:k + 2000] = D
    return best


def mal(e, r):
    """Måla for éi etasje. Fasit = e['soner'], KI = r['slegne']."""
    mpp = e['mpp']
    fa = [z['pts'] for z in e['soner']]
    ki = [z['pts'] for z in (r.get('slegne') or [])]
    m = {'nokkel': e['nokkel'], 'fasitSoner': len(fa), 'kiSoner': len(ki)}
    m['fasitM2'] = sum(areal(p) for p in fa) * mpp * mpp / 1e6
    m['kiM2'] = sum(areal(p) for p in ki) * mpp * mpp / 1e6
    if r.get('feil') or r.get('ikkjePlan') or not ki:
        m.update({'iou': 0.0, 'soneIou': 0.0, 'kantMed': None, 'kantP90': None, 'arealAvvik': -1.0,
                  'feil': r.get('feil') or ('ikkje plan: ' + r['ikkjePlan'] if r.get('ikkjePlan') else 'ingen soner')})
        return m
    # Rutenett på om lag 5 cm, men aldri over ~3000 ruter langs lengste kant
    s = min(1.0, mpp / 50, 3000 / max(e['w'], e['h']))
    W, H = int(e['w'] * s) + 2, int(e['h'] * s) + 2
    F, K = raster(fa, s, W, H), raster(ki, s, W, H)
    fb, kb = F > 0, K > 0
    m['iou'] = float((fb & kb).sum() / max(1, (fb | kb).sum()))
    m['bom'] = float((fb & ~kb).sum() / max(1, fb.sum()))        # fasit som KI-en ikkje dekte
    m['ekstra'] = float((kb & ~fb).sum() / max(1, kb.sum()))     # KI-areal utanfor fasiten
    # Soneinndelinga: for kvar fasitsone den beste KI-sona, arealvekta
    tot, vekt = 0.0, 0
    for i in range(len(fa)):
        fi = F == i + 1
        n = fi.sum()
        if not n:
            continue
        best = 0.0
        for j in np.unique(K[fi]):
            if j == 0:
                continue
            kj = K == j
            best = max(best, (fi & kj).sum() / (fi | kj).sum())
        tot += best * n; vekt += n
    m['soneIou'] = float(tot / max(1, vekt))
    m['arealAvvik'] = (m['kiM2'] - m['fasitM2']) / m['fasitM2'] if m['fasitM2'] else 0
    # Kantavvik: frå fasitkantane til næraste KI-kant, i cm
    P = kantpunkt(fa, 100 / mpp)
    D = avstand_til_kantar(P, ki) * mpp / 10
    m['kantMed'] = float(np.median(D)); m['kantP90'] = float(np.percentile(D, 90))
    # Etterarbeidet åleine: polygona før og etter kiRettSoner i det kallet som vart brukt
    if r.get('rett'):
        siste = r['rett'][-1]
        for k, polys in (('iouForRett', siste['inn']), ('iouEtterRett', siste['ut'])):
            R = raster([z['pts'] for z in polys], s, W, H) > 0
            m[k] = float((fb & R).sum() / max(1, (fb | R).sum()))
    m['kontroll'] = (r.get('kontroll') or {}).get('retta')
    m['utsnitt'] = r.get('utsnitt')
    return m


def overlay(e, r, data, ut):
    try:
        im = Image.open(os.path.join(data, e['plan'])).convert('RGB')
        s = 1600 / max(im.size)
        im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.LANCZOS)
        g = ImageDraw.Draw(im)
        # Blå tynn: KI før kiRettSoner. Grøn: fasit. Raud: KI etter alt etterarbeid.
        forRett = (r.get('rett') or [{}])[-1].get('inn') or []
        lag = [(z['pts'], (37, 99, 235), 1) for z in forRett] + \
              [(z['pts'], (22, 163, 74), 3) for z in e['soner']] + \
              [(z['pts'], (220, 38, 38), 3) for z in (r.get('slegne') or [])]
        for pts, farge, b in lag:
            xy = [(p['x'] * s, p['y'] * s) for p in pts]
            g.line(xy + xy[:1], fill=farge, width=b)
        im.save(ut)
    except Exception as err:
        print('  overlay feila for', e['nokkel'], err)


def rapport(maal, a, bruk, tag):
    def snitt(k, l=None):
        v = [m[k] for m in (l or maal) if m.get(k) is not None]
        return sum(v) / len(v) if v else float('nan')
    ok = [m for m in maal if not m.get('feil')]
    rad = []
    rad.append(f'KI-evaluering {tag}  ({datetime.datetime.now():%Y-%m-%d %H:%M})')
    rad.append(f"modell {a.modell}, effort {a.effort}, del={a.del_}, slå saman kategori={'nei' if a.utan_slaa else 'ja'}"
               + (f', js: {a.js}' if a.js else '')
               + (f', MOCK støy {a.mock_stoy} m' if a.mock else '') + f', sett={a.sett}')
    rad.append(f"API: {bruk['kall']} kall, {bruk['cache']} frå mellomlager, {bruk['inn']} token inn, {bruk['ut']} ut, "
               f"{bruk['feil']} feil — {bruk.get('usd', 0):.2f} USD (totalt i alle køyringar {bruk.get('usdTotalt', 0):.2f})")
    rad.append('')
    rad.append(f'Etasjar: {len(maal)}  (feila/ikkje plan/tomme: {len(maal) - len(ok)})')
    rad.append(f"Fotavtrykk-IoU   snitt {snitt('iou'):.3f}   (≥0,90: {sum(m['iou'] >= 0.9 for m in maal)}/{len(maal)})")
    rad.append(f"Sone-IoU         snitt {snitt('soneIou'):.3f}")
    rad.append(f"Kantavvik        median av median {np.median([m['kantMed'] for m in ok]) if ok else float('nan'):.0f} cm, "
               f"snitt p90 {snitt('kantP90', ok):.0f} cm")
    rad.append(f"Arealavvik       snitt |avvik| {snitt('_abs', [dict(m, _abs=abs(m['arealAvvik'])) for m in ok]):.1%}, "
               f"snitt {snitt('arealAvvik', ok):+.1%}")
    rad.append(f"Tal soner        rett {sum(m['kiSoner'] == m['fasitSoner'] for m in ok)}/{len(ok)}, "
               f"for mange {sum(m['kiSoner'] > m['fasitSoner'] for m in ok)}, for få {sum(m['kiSoner'] < m['fasitSoner'] for m in ok)}")
    rad.append(f"Udekt fasit      snitt {snitt('bom', ok):.1%}    KI utanfor fasit snitt {snitt('ekstra', ok):.1%}")
    rad.append(f"Etterarbeidet    IoU før kiRettSoner {snitt('iouForRett', ok):.3f} → etter {snitt('iouEtterRett', ok):.3f}")
    rad.append('')
    rad.append(f"{'etasje':58} {'IoU':>5} {'soneIoU':>7} {'kant':>5} {'p90':>5} {'areal':>7} {'soner':>6} {'før→etter rett':>15}")
    for m in sorted(maal, key=lambda m: m['iou']):
        if m.get('feil'):
            rad.append(f"{m['nokkel'][:58]:58} {'—':>5}  {m['feil'][:60]}")
            continue
        rad.append(f"{m['nokkel'][:58]:58} {m['iou']:5.3f} {m['soneIou']:7.3f} {m['kantMed']:5.0f} {m['kantP90']:5.0f} "
                   f"{m['arealAvvik']:+7.1%} {m['kiSoner']:>3}/{m['fasitSoner']:<2}"
                   + (f"   {m['iouForRett']:.3f}→{m['iouEtterRett']:.3f}" if 'iouForRett' in m else ''))
    return '\n'.join(rad)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--data', default=DATA_STD)
    p.add_argument('--utval', type=int, default=20)
    p.add_argument('--alle', action='store_true')
    p.add_argument('--bygg', help='berre bygg der mappenamnet inneheld dette')
    p.add_argument('--sett', choices=['trening', 'test', 'alle'], default='trening')
    p.add_argument('--seed', type=int, default=1)
    p.add_argument('--del', dest='del_', choices=['ein', 'bruk'], default='bruk')
    p.add_argument('--utan-slaa', action='store_true', help='ikkje kiSlaaSamanKategori etterpå')
    p.add_argument('--modell', default='claude-opus-5-5')
    p.add_argument('--effort', default='high')
    p.add_argument('--parallelt', type=int, default=3)
    p.add_argument('--utan-cache', action='store_true')
    p.add_argument('--mock', action='store_true')
    p.add_argument('--berre-cache', action='store_true', help='ingen API-kall, berre mellomlagra svar (krev ingen nøkkel)')
    p.add_argument('--budsjett', type=float, default=1.0, help='maks USD i nye kall i denne køyringa')
    p.add_argument('--mock-stoy', type=float, default=0.6)
    p.add_argument('--js', help='JS som vert køyrd i programmet før testen, t.d. "KI_FIT.S=1200"')
    p.add_argument('--tag')
    p.add_argument('--samanlikn')
    p.add_argument('--tidsgrense', type=int, default=120, help='minutt')
    a = p.parse_args()

    if not a.mock and not a.berre_cache and not os.environ.get('ANTHROPIC_API_KEY'):
        sys.exit('ANTHROPIC_API_KEY manglar. I PowerShell: $env:ANTHROPIC_API_KEY = "sk-ant-..." '
                 '(eller --mock for å teste utan API).')
    b = subprocess.run([sys.executable, os.path.join(ROT, 'tools', 'bygg.py'), '--sjekk'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if b.returncode:
        sys.exit('index.html er ikkje bygd frå src/ — køyr python tools/bygg.py\n' + b.stdout + b.stderr)

    etasjar = les_etasjar(a.data)
    oppg = vel_utval(etasjar, a)
    if not oppg:
        sys.exit('Ingen etasjar i utvalet.')
    git = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROT, capture_output=True, text=True).stdout.strip()
    skitten = subprocess.run(['git', 'status', '--porcelain', 'src'], cwd=ROT, capture_output=True, text=True).stdout.strip()
    tag = a.tag or f"{datetime.datetime.now():%Y%m%d-%H%M}-{git}{'+' if skitten else ''}{'-mock' if a.mock else ''}"
    ut = os.path.join(KOYR, tag)
    os.makedirs(os.path.join(ut, 'overlay'), exist_ok=True)
    print(f'{len(oppg)} etasjar ({a.sett}-settet, {len({e["bygg"] for e in oppg})} bygg) → {ut}')

    t0 = time.time()
    res, feil, bruk = koyr(a, oppg, a.data)
    # Samla forbruk over alle køyringar (mellomlagra svar kostar ingenting)
    pi, pu = Ai.PRIS.get(a.modell, (4, 20))
    bruk['usd'] = (bruk['inn'] * pi + bruk['ut'] * pu) / 1e6
    fil = os.path.join(EVAL, 'forbruk.json')
    tot = 0.0
    try:
        with open(fil, encoding='utf-8') as fh:
            tot = json.load(fh).get('usd', 0.0)
    except Exception:
        pass
    tot += bruk['usd']
    bruk['usdTotalt'] = tot
    with open(fil, 'w', encoding='utf-8') as fh:
        json.dump({'usd': tot, 'sist': tag}, fh)
    maal = []
    for e in oppg:
        r = res.get(e['nokkel'], {'feil': 'kom ikkje tilbake frå sida'})
        maal.append(mal(e, r))
        overlay(e, r, a.data, os.path.join(ut, 'overlay', re.sub(r'[\\/]', '__', e['nokkel']) + '.png'))
    tekst = rapport(maal, a, bruk, tag)
    if feil:
        tekst += '\n\nFeil i sida:\n' + '\n'.join(feil)
    tekst += f'\n\nTid: {time.time() - t0:.0f} s'
    if a.samanlikn:
        try:
            with open(os.path.join(KOYR, a.samanlikn, 'resultat.json'), encoding='utf-8') as fh:
                gml = {m['nokkel']: m for m in json.load(fh)['maal']}
            fl = [(m, gml[m['nokkel']]) for m in maal if m['nokkel'] in gml]
            tekst += f'\n\nMot {a.samanlikn} ({len(fl)} felles etasjar):'
            tekst += f"\n  IoU snitt {np.mean([g['iou'] for _, g in fl]):.3f} → {np.mean([m['iou'] for m, _ in fl]):.3f}"
            tekst += f"\n  sone-IoU snitt {np.mean([g['soneIou'] for _, g in fl]):.3f} → {np.mean([m['soneIou'] for m, _ in fl]):.3f}"
            for m, g in sorted(fl, key=lambda x: x[0]['iou'] - x[1]['iou']):
                if abs(m['iou'] - g['iou']) >= 0.02:
                    tekst += f"\n  {m['nokkel'][:58]:58} {g['iou']:.3f} → {m['iou']:.3f}"
        except Exception as err:
            tekst += f'\n\nKunne ikkje samanlikne med {a.samanlikn}: {err}'
    print('\n' + tekst)
    with open(os.path.join(ut, 'rapport.txt'), 'w', encoding='utf-8') as fh:
        fh.write(tekst)
    with open(os.path.join(ut, 'resultat.json'), 'w', encoding='utf-8') as fh:
        json.dump({'innst': {k: v for k, v in vars(a).items()}, 'bruk': bruk, 'maal': maal,
                   'svar': res, 'feil': feil}, fh, ensure_ascii=False)


if __name__ == '__main__':
    main()
