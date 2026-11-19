"""SXI-regresjon: same prosjekt skal gi teikn for teikn same SXI-fil.

  python tools/test-sxi.py                  # samanlikn med fasiten
  python tools/test-sxi.py --lag-fasit      # fasit frå SISTE COMMIT (git HEAD),
                                            # ikkje frå arbeidskopien — så fangar
                                            # testen òg endringar som ikkje er committa
  python tools/test-sxi.py --legg-til X.entro [Y.entro ...]
                                            # nytt testprosjekt (bileta takne ut)

Prosjekta og fasiten ligg i tools/test/fasit/, som er utanfor git: dei er
kundedata. Køyraren startar ein lokal server, opnar tools/test/sxi-regresjon.html
i ein nettlesar utan vindauge og les resultatet ut av sida. Kvar prosjekt vert eksportert
to gonger: utan tiltak og med alle tiltaka. Datoen i fila er låst.

Feilar òg om hovudskriptet ikkje vart ferdig lasta, eller om programmet skreiv
feil til konsollen medan testane gjekk.
"""
import sys, os, json, re, html, shutil, subprocess, tempfile, threading, http.server, socketserver, difflib, functools

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FASIT = os.path.join(ROT, 'tools', 'test', 'fasit')
PROSJ = os.path.join(FASIT, 'prosjekt')
SXI = os.path.join(FASIT, 'sxi')
# Nettlesaren som køyrer testane. IKKJE Edge: bedrifts-Edge krev innlogging
# òg utan vindauge og kjem aldri til testsida. Playwright sin headless-shell
# har ingen slike reglar; Chrome er reserve.
def nettlesarar():
    pw = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright')
    l = []
    if os.path.isdir(pw):
        for d in sorted(os.listdir(pw), reverse=True):
            if d.startswith('chromium_headless_shell'):
                l.append(os.path.join(pw, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'))
    l += [r'C:\Program Files\Google\Chrome\Application\chrome.exe',
          os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Google', 'Chrome', 'Application', 'chrome.exe')]
    return l


def legg_til(filer):
    os.makedirs(PROSJ, exist_ok=True)
    for f in filer:
        with open(f, encoding='utf-8') as fh:
            p = json.load(fh)
        # Bileta og PDF-ane påverkar ikkje SXI-fila — berre geometri og skala
        p.pop('pdfar', None)
        for f2 in (p.get('floors') or []) + (p.get('fasadar') or []):
            for k in ('bgImgData', 'pdfData'):
                f2.pop(k, None)
        namn = re.sub(r'[^\w\- ]+', '', os.path.splitext(os.path.basename(f))[0]).strip()
        with open(os.path.join(PROSJ, namn + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(p, fh, ensure_ascii=False)
        print('lagt til:', namn)
    oppdater_liste()


def oppdater_liste():
    namn = sorted(os.path.splitext(f)[0] for f in os.listdir(PROSJ) if f.endswith('.json'))
    with open(os.path.join(FASIT, 'liste.json'), 'w', encoding='utf-8') as fh:
        json.dump(namn, fh, ensure_ascii=False)
    return namn


def koyr_sida(app=None):
    """Opnar testsida i ein nettlesar utan vindauge. Sida POSTar resultatet
    til /__resultat på den same lokale serveren, og då vert nettlesaren
    avslutta. (--dump-dom med virtuell tid hang: animasjonane i programmet
    lèt aldri den virtuelle klokka bli ferdig.)"""
    edge = next((e for e in nettlesarar() if os.path.exists(e)), None)
    if not edge:
        sys.exit('Fann ingen nettlesar til testane (Playwright headless-shell eller Chrome).')
    fekk = {}
    ferdig = threading.Event()

    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=ROT, **k)

        def log_message(self, *a):
            pass

        def do_POST(self):
            if self.path != '/__resultat':
                self.send_error(404)
                return
            n = int(self.headers.get('Content-Length') or 0)
            fekk['ut'] = json.loads(self.rfile.read(n).decode('utf-8'))
            self.send_response(204)
            self.end_headers()
            ferdig.set()

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    profil = tempfile.mkdtemp(prefix='sxi-test-')
    url = f'http://127.0.0.1:{port}/tools/test/sxi-regresjon.html' + (f'?app={app}' if app else '')
    hl = [] if 'headless-shell' in edge else ['--headless=new']
    p = subprocess.Popen([edge, *hl, '--disable-gpu', '--no-first-run',
                          '--no-default-browser-check', f'--user-data-dir={profil}', url],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if not ferdig.wait(300):
            sys.exit('Testsida svarte ikkje innan 5 minutt.')
    finally:
        p.kill()
        try:
            p.wait(10)
        except Exception:
            pass
        srv.shutdown()
        shutil.rmtree(profil, ignore_errors=True)
    return fekk['ut']


def main():
    a = sys.argv[1:]
    if a[:1] == ['--legg-til']:
        legg_til(a[1:])
        return
    # index.html må vere bygd frå src/ — elles testar vi noko anna enn kjelda
    b = subprocess.run([sys.executable, os.path.join(ROT, 'tools', 'bygg.py'), '--sjekk'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if b.returncode:
        sys.exit(b.stdout + b.stderr)
    if not os.path.isdir(PROSJ) or not oppdater_liste():
        sys.exit('Ingen testprosjekt. Legg til med: python tools/test-sxi.py --legg-til prosjekt.entro')
    lag = '--lag-fasit' in a
    app = None
    if lag:
        # Fasiten skal kome frå det som er committa, ikkje frå arbeidskopien
        ref = subprocess.run(['git', 'show', 'HEAD:index.html'], cwd=ROT, capture_output=True)
        if ref.returncode:
            sys.exit('git show HEAD:index.html feila: ' + ref.stderr.decode(errors='replace'))
        with open(os.path.join(FASIT, 'ref.html'), 'wb') as fh:
            fh.write(ref.stdout)
        app = 'fasit/ref.html'
    ut = koyr_sida(app)
    feil = list(ut.get('feil') or [])
    # Merket kom i v5.25 — eldre committa versjonar (fasit-kjelda) har det ikkje
    if not ut.get('klar') and not lag:
        feil.insert(0, 'Programmet vart ikkje ferdig lasta.')
    if lag:
        feil = [f for f in feil if '__sxiKlar' not in f]
    os.makedirs(SXI, exist_ok=True)
    avvik = 0
    for nokkel, sxi in sorted(ut['sxi'].items()):
        sti = os.path.join(SXI, nokkel + '.sxi')
        if lag:
            with open(sti, 'w', encoding='utf-8', newline='') as fh:
                fh.write(sxi)
            print('fasit skriven (frå HEAD):', nokkel)
            continue
        if not os.path.exists(sti):
            print('MANGLAR FASIT:', nokkel)
            avvik += 1
            continue
        with open(sti, encoding='utf-8', newline='') as fh:
            fasit = fh.read()
        if fasit == sxi:
            print('OK       ', nokkel, f'({len(sxi)} teikn)')
        else:
            avvik += 1
            print('ENDRA    ', nokkel)
            d = list(difflib.unified_diff(fasit.splitlines(), sxi.splitlines(), 'fasit', 'no', n=1, lineterm=''))
            print('\n'.join(d[:40]) + ('\n  …' if len(d) > 40 else ''))
    # Lagra prosjekt (.entro) mot fasiten
    ED = os.path.join(FASIT, 'entro')
    os.makedirs(ED, exist_ok=True)
    for namn, tekst in sorted((ut.get('entro') or {}).items()):
        sti = os.path.join(ED, namn + '.json')
        if lag:
            with open(sti, 'w', encoding='utf-8', newline='') as fh:
                fh.write(tekst)
            continue
        if not os.path.exists(sti):
            print('MANGLAR FASIT (entro):', namn)
            avvik += 1
            continue
        with open(sti, encoding='utf-8', newline='') as fh:
            fasit = fh.read()
        if json.loads(fasit) == json.loads(tekst):
            print('OK lagring', namn)
        else:
            avvik += 1
            print('ENDRA lagring', namn)
            a_, b_ = json.dumps(json.loads(fasit), indent=1, ensure_ascii=False).splitlines(), json.dumps(json.loads(tekst), indent=1, ensure_ascii=False).splitlines()
            print(chr(10).join(list(difflib.unified_diff(a_, b_, 'fasit', 'no', n=1, lineterm=''))[:30]))
    for n, d in (ut.get('dekning') or {}).items():
        print('  dekning', n + ':', ', '.join(f'{k} {v}' for k, v in d.items() if v))
    for f in feil:
        print('FEIL:', f)
    if avvik or feil:
        sys.exit(f'\n{avvik} SXI-fil(er) endra/manglar, {len(feil)} feil.')
    print('\nAlle SXI-filene er teikn for teikn like fasiten.' if not lag else '\nFasiten er skriven.')


if __name__ == '__main__':
    main()
