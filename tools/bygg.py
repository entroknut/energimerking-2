"""Byggjer index.html frå kjeldefilene i src/.

  python tools/bygg.py            # src/ → index.html
  python tools/bygg.py --sjekk    # feilar om index.html ikkje er bygd frå src/
  python tools/bygg.py --del-opp  # (eingongs) del index.html opp i src/

Hovudskriptet ligg i src/js/NN-namn.js og vert lima saman i nummerrekkjefølgje,
byte for byte, inn i src/index.html der markøren står. Ingen omskriving, ingen
modular i JS-forstand: alt er framleis globalt, slik programmet alltid har vore.
Det er berre filene som er delte, så ein finn fram.

index.html er framleis fila GitHub Pages, testane og tools/bygg-lokal.py brukar,
og ho er committa. Ikkje rediger ho direkte: bygget nektar å skrive over ei
index.html som er endra sidan siste bygg (src/.bygd), så ei endring ikkje kan
forsvinne i stillheit. Flytt endringa til src/, eller bruk --tving.
"""
import os, re, sys, hashlib

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROT, 'src')
JS = os.path.join(SRC, 'js')
MAL = os.path.join(SRC, 'index.html')
UT = os.path.join(ROT, 'index.html')
STEMPEL = os.path.join(SRC, '.bygd')
MARKOR = '/*@@HOVUDSKRIPT@@*/'

# Grenser for oppdelinga: fyrste linje i kvar fil er ein bolk-overskrift i
# hovudskriptet. Berre brukt av --del-opp.
DELAR = [
    ('01-grunn', None),
    ('02-etasjar-ui', '// ── Floor UI '),
    ('03-geometri', '// ── Coord helpers '),
    ('04-modus-liste', '// ── Mode management '),
    ('05-historikk-lagring', '// ── Angre-historikk (Ctrl+Z) '),
    ('06-import', '// ── PDF / image loading '),
    ('07-teikning', '// ── Compass ─'),
    ('08-kalibrering', '// ── Calibration dialog '),
    ('09-soner-flater', '// ── Zone management '),
    ('10-snapping', '// ── Window management '),
    ('11-sidepanel', '// ── Results / sidebar '),
    ('12-interaksjon', '// ── Ortho-snapping (Shift) '),
    ('13-ki', '// ── 2e. KI-oppteikning '),
    ('14-init-lagring-entropi', '// ── Init ─'),
    ('15-verktoy', '// ── 3. Pinch-to-zoom '),
    ('16-sxi', '// ── Bygningstype-konfigurasjon for SXI '),
    ('17-3d', '// ── Corrected 3D scene builder '),
    ('18-kart', '// ── Mapbox 3D-kart integrasjon '),
    ('19-klips', '// ── 2f. Klips '),
]


def les(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def skriv(p, t):
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(t)


def sha(t):
    return hashlib.sha256(t.encode('utf-8')).hexdigest()


def hovudskript(h):
    """Siste inline <script> utan attributt er hovudskriptet."""
    ms = list(re.finditer(r'<script>((?:(?!</script>)[\s\S])*)</script>', h))
    m = ms[-1]
    return m.start(1), m.end(1)


def bygg():
    mal = les(MAL)
    if mal.count(MARKOR) != 1:
        sys.exit('src/index.html må ha markøren ' + MARKOR + ' nøyaktig éin gong.')
    filer = sorted(f for f in os.listdir(JS) if re.match(r'^\d\d-.*\.js$', f))
    js = ''.join(les(os.path.join(JS, f)) for f in filer)
    return mal.replace(MARKOR, js), filer


def del_opp():
    if os.path.exists(JS) and os.listdir(JS):
        sys.exit('src/js finst alt.')
    h = les(UT)
    a, b = hovudskript(h)
    js = h[a:b]
    linjer = js.split('\n')
    grenser = [0]
    for namn, start in DELAR[1:]:
        i = next((k for k, l in enumerate(linjer) if l.startswith(start)), None)
        if i is None:
            sys.exit('Fann ikkje grensa: ' + start)
        grenser.append(i)
    if grenser != sorted(grenser):
        sys.exit('Grensene står ikkje i rekkjefølgje.')
    grenser.append(len(linjer))
    os.makedirs(JS, exist_ok=True)
    for k, (namn, _) in enumerate(DELAR):
        bit = linjer[grenser[k]:grenser[k + 1]]
        tekst = '\n'.join(bit) + ('\n' if k < len(DELAR) - 1 else '')
        skriv(os.path.join(JS, namn + '.js'), tekst)
    skriv(MAL, h[:a] + MARKOR + h[b:])
    ny, _ = bygg()
    if ny != h:
        sys.exit('FEIL: det bygde index.html er ikkje identisk med originalen.')
    skriv(STEMPEL, sha(h) + '\n')
    print(f'Delt opp i {len(DELAR)} filer i src/js/. Bygget er byte for byte likt index.html.')


def main():
    a = sys.argv[1:]
    if '--del-opp' in a:
        del_opp()
        return
    ny, filer = bygg()
    gml = les(UT) if os.path.exists(UT) else ''
    if '--sjekk' in a:
        if ny != gml:
            sys.exit('index.html er ikkje bygd frå src/. Køyr: python tools/bygg.py')
        print('index.html er bygd frå src/ (' + str(len(filer)) + ' JS-filer).')
        return
    if ny == gml:
        print('index.html er alt oppdatert.')
        return
    sist = les(STEMPEL).strip() if os.path.exists(STEMPEL) else None
    if gml and sist and sha(gml) != sist and '--tving' not in a:
        sys.exit('index.html er endra direkte sidan siste bygg. Flytt endringa til src/ '
                 '(eller køyr med --tving for å skrive over ho).')
    skriv(UT, ny)
    skriv(STEMPEL, sha(ny) + '\n')
    print(f'index.html bygd frå {len(filer)} JS-filer ({ny.count(chr(10)) + 1} linjer).')


if __name__ == '__main__':
    main()
