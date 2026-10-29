"""Byggjer den lokale varianten av SXI-generatoren.

    python tools/bygg-lokal.py

Les index.html og skriv lokal/SXI-generatoren-lokal.html: éi fil som ikkje
hentar noko frå nettet. Sjå «Lokal variant» i claude.md.

- Biblioteka (pdf.js + worker, Three.js, jsPDF) vert lagde inn frå
  tools/vendor/ i staden for CDN. Workeren går via ein blob-URL.
- Kartet (Mapbox) vert teke ut, kartknappen gøymd og tokenet fjerna.
- Google Fonts vert teke ut (fell tilbake på system-ui).
- EntroPi-brua får aldri handtrykk (embedRequested=false).
- Ein Content-Security-Policy med connect-src 'none' lèt nettlesaren
  stoppe all nettverkstrafikk, sjølv om noko skulle sleppe gjennom her.
- Eit «Lokal»-merke i verktøylinja viser at sperra står på.

Kvar erstatning MÅ treffe nøyaktig éin gong — elles stoppar skriptet, så
ei endring i index.html aldri gir ein lokal variant som stille går på nett.
"""
import hashlib
import os
import re
import sys

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(ROT, 'tools', 'vendor')
UT = os.path.join(ROT, 'lokal', 'SXI-generatoren-lokal.html')

# sha256 for filene i tools/vendor — vert sjekka før dei vert lagde inn
VENDOR_SHA = {
    'pdf.min.js': '5b5799e6f8c680663207ac5b42ee14eed2a406fa7af48f50c154f0c0b1566946',
    'pdf.worker.min.js': 'feabdf309770ed24bba31a5467836cdc8cf639c705af27d52b585b041bb8527b',
    'three.min.js': '9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2',
    'jspdf.umd.min.js': '98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875',
}

CSP = ("default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; "
       "style-src 'unsafe-inline'; img-src data: blob:; font-src data:; "
       "media-src data: blob:; worker-src blob:; connect-src 'none'; "
       "form-action 'none'; base-uri 'none'")


def les_vendor(namn):
    with open(os.path.join(VENDOR, namn), 'rb') as f:
        data = f.read()
    h = hashlib.sha256(data).hexdigest()
    if h != VENDOR_SHA[namn]:
        sys.exit(f'{namn}: feil sha256 ({h})')
    js = data.decode('utf-8')
    # Kjeldekart vert henta av utviklarverktøya — ta dei bort
    js = re.sub(r'//# sourceMappingURL=\S+', '', js)
    if '</script' in js.lower():
        sys.exit(f'{namn} inneheld </script')
    return js


def byt(html, gammal, ny, kva, regex=False):
    if regex:
        treff = len(re.findall(gammal, html))
    else:
        treff = html.count(gammal)
    if treff != 1:
        sys.exit(f'{kva}: venta 1 treff, fann {treff} — har index.html endra seg?')
    if regex:
        return re.sub(gammal, lambda m: ny, html)
    return html.replace(gammal, ny)


MERKE_CSS = """<style>
#lokalMerke{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:2px 9px 2px 7px;
  border:1px solid #9fd3b5;border-radius:999px;background:#e9f7ef;color:#166534;font-size:11px;
  font-weight:600;font-family:inherit;white-space:nowrap;cursor:pointer;user-select:none}
#lokalMerke.brot{border-color:#fca5a5;background:#fef2f2;color:#991b1b}
#lokalInfo{position:fixed;z-index:9000;width:330px;padding:14px 16px;border:1px solid var(--border2,#d1d5db);
  border-radius:10px;background:var(--surface,#fff);color:var(--text,#111);box-shadow:0 10px 30px rgba(0,0,0,.18);
  font-size:12px;line-height:1.5;display:none}
#lokalInfo h4{margin:0 0 6px;font-size:13px}
#lokalInfo ul{margin:6px 0 0 16px;padding:0}
#lokalInfo li{margin:2px 0}
#lokalInfo .lk-status{margin-top:8px;padding-top:8px;border-top:1px solid var(--border,#e5e7eb);font-weight:600}
</style>
"""

LAAS_SVG = ('<svg width="11" height="12" viewBox="0 0 11 12" fill="none" style="flex-shrink:0">'
            '<rect x="1" y="5" width="9" height="6.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/>'
            '<path d="M3 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3"/></svg>')

MERKE_HTML = (f'\n    <span id="lokalMerke" title="Lokal versjon: programmet har ingen nettilgang">'
              f'{LAAS_SVG}<span id="lokalMerkeTekst">Lokal · ingen nett</span></span>'
              '\n    <div id="lokalInfo"></div>')

MERKE_JS = """<script>
// ── Lokal variant: merke og vakt ─────────────────────────────
// Sperra er CSP-en i <head>; dette viser berre at ho står på, og tel
// forsøk nettlesaren har stoppa. Eitt forsøk er ikkje ein lekkasje
// (det vart blokkert), men det skal sjåast — aldri stille.
(()=>{
  const merke=document.getElementById('lokalMerke');
  const info=document.getElementById('lokalInfo');
  if(!merke||!info)return;
  document.body.appendChild(info); // verktøylinja har overflow:hidden
  const csp=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const sperra=!!csp&&/connect-src 'none'/.test(csp.content);
  const stoppa=[];
  document.addEventListener('securitypolicyviolation',e=>{
    if(e.disposition!=='enforce')return;
    stoppa.push((e.effectiveDirective||e.violatedDirective)+': '+(e.blockedURI||'?'));
    oppdater();
  });
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function oppdater(){
    merke.classList.toggle('brot',!sperra);
    document.getElementById('lokalMerkeTekst').textContent=
      !sperra?'Nettsperre manglar':stoppa.length?`Lokal · ${stoppa.length} stoppa`:'Lokal · ingen nett';
    info.innerHTML=`<h4>Lokal versjon</h4>
      Denne utgåva av SXI-generatoren køyrer berre på denne maskina.
      <ul>
        <li>Teikningar, soner og prosjekt vert aldri sende nokon stad.</li>
        <li>Alle bibliotek ligg inne i fila — ingenting vert lasta frå nettet.</li>
        <li>Kartet er teke ut, og koplinga mot EntroPi er slått av.</li>
        <li>Nettlesaren sperrar all nettverkstrafikk frå programmet (Content-Security-Policy).</li>
        <li>Lagring går til fil du vel sjølv, og ein autolagra kopi i denne nettlesaren.</li>
      </ul>
      <div class="lk-status" style="color:${sperra?'#166534':'#991b1b'}">${
        !sperra?'⚠ Nettsperra manglar i denne fila.'
        :'✓ Nettsperra er på. '+(stoppa.length?`${stoppa.length} forsøk stoppa denne økta:`:'Ingen forsøk på nettilgang denne økta.')}</div>
      ${stoppa.length?'<ul>'+stoppa.slice(-5).map(s=>'<li style="word-break:break-all">'+esc(s)+'</li>').join('')+'</ul>':''}`;
  }
  merke.addEventListener('click',e=>{
    e.stopPropagation();
    if(info.style.display==='block'){info.style.display='none';return;}
    const r=merke.getBoundingClientRect();
    info.style.display='block';
    info.style.top=(r.bottom+6)+'px';
    info.style.left=Math.max(8,Math.min(r.left,innerWidth-info.offsetWidth-8))+'px';
  });
  document.addEventListener('mousedown',e=>{if(!info.contains(e.target)&&e.target!==merke&&!merke.contains(e.target))info.style.display='none';});
  oppdater();
})();
</script>
"""


def lag_ikon(html, ut):
    """Entro-ikonet (--entro-ikon, ein alfamaske) kvitt på Entro-grønt, med
    ein liten hengelås nede til høgre så det skil seg frå vanleg Edge."""
    import base64
    import io
    from PIL import Image, ImageDraw
    m = re.search(r'--entro-ikon:url\(data:image/png;base64,([A-Za-z0-9+/=]+)\)', html)
    if not m:
        sys.exit('ikon: fann ikkje --entro-ikon')
    logo = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
    S = 256
    bilete = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(bilete)
    d.rounded_rectangle((8, 8, S - 8, S - 8), radius=48, fill=(29, 79, 79, 255))
    h = 168
    w = round(logo.width * h / logo.height)
    alfa = logo.getchannel('A').resize((w, h), Image.LANCZOS)
    kvit = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    bilete.paste(kvit, ((S - w) // 2 - 18, (S - h) // 2), alfa)
    # hengelås
    cx, cy = 196, 194
    d.ellipse((cx - 50, cy - 50, cx + 50, cy + 50), fill=(22, 163, 74, 255), outline=(255, 255, 255, 255), width=8)
    d.rounded_rectangle((cx - 22, cy - 6, cx + 22, cy + 26), radius=6, fill=(255, 255, 255, 255))
    d.arc((cx - 15, cy - 30, cx + 15, cy + 4), 180, 360, fill=(255, 255, 255, 255), width=8)
    d.line((cx - 15, cy - 13, cx - 15, cy - 4), fill=(255, 255, 255, 255), width=8)
    d.line((cx + 15, cy - 13, cx + 15, cy - 4), fill=(255, 255, 255, 255), width=8)
    bilete.save(ut, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])


def kopier_lokal_filer(mappe):
    """Snarvegsskripta og «Les meg» frå tools/lokal-filer. Windows PowerShell
    5.1 les .ps1 utan BOM som ANSI (æøå vert rot), og cmd vil ha CRLF."""
    kjelde = os.path.join(ROT, 'tools', 'lokal-filer')
    for namn in os.listdir(kjelde):
        with open(os.path.join(kjelde, namn), encoding='utf-8') as f:
            tekst = f.read()
        koding = 'utf-8-sig' if namn.endswith(('.ps1', '.txt')) else 'ascii'
        with open(os.path.join(mappe, namn), 'w', encoding=koding, newline='\r\n') as f:
            f.write(tekst)


def main():
    with open(os.path.join(ROT, 'index.html'), encoding='utf-8') as f:
        html = f.read()

    # 1. CSP fyrst i <head>, så ho gjeld før noko anna vert lese
    html = byt(html, '<meta charset="UTF-8">\n',
               '<meta charset="UTF-8">\n'
               f'<meta http-equiv="Content-Security-Policy" content="{CSP}">\n',
               'CSP')
    html = byt(html, '<title>SXI-generatoren — Entro AS</title>',
               '<title>SXI-generatoren (lokal) — Entro AS</title>', 'tittel')

    # 2. Bibliotek inne i fila
    html = byt(html,
               '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>',
               '<script>' + les_vendor('pdf.min.js') + '</script>', 'pdf.js')
    html = byt(html,
               '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
               '<script>' + les_vendor('three.min.js') + '</script>\n'
               # jsPDF sin «pdfobjectnewwindow»-modus hentar eit skript frå
               # cdnjs. Programmet brukar han ikkje, men adressa skal ikkje stå
               '<script>' + byt(les_vendor('jspdf.umd.min.js'),
                                'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1/pdfobject.min.js',
                                'about:blank', 'jsPDF-pdfobject') + '</script>\n'
               '<script type="text/plain" id="pdfWorkerKjelde">' + les_vendor('pdf.worker.min.js') + '</script>',
               'three.js')
    html = byt(html,
               "pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';",
               "pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob("
               "[document.getElementById('pdfWorkerKjelde').textContent],{type:'text/javascript'}));",
               'pdf-worker')
    # jsPDF er alt lasta, så lastJsPdf() svarar utan å leggje til ein <script src>
    html = byt(html,
               "const JSPDF_URL='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';",
               "const JSPDF_URL='';", 'jsPDF')

    # 3. Mapbox ut: stilarket, biblioteket og tokenet
    html = byt(html, r'<style>\n\.mapboxgl-map\{[^\n]*\n</style>\n', '', 'mapbox-css', regex=True)
    html = byt(html,
               r'<script>\n/\* Mapbox GL JS is Copyright[\s\S]*?//# sourceMappingURL=mapbox-gl\.js\.map\n\n</script>\n',
               '', 'mapbox-js', regex=True)
    # Heile kart-IIFE-en (token, adressesøk, terreng) vert ein stump som
    # gøymer knappen. window._nordEndra vert då aldri sett — kallet er vakta.
    html = byt(html, r'\(function setupMapbox\(\)\{\n[\s\S]*?\n\}\)\(\);\n',
               "(function setupMapbox(){\n"
               "  const b=document.getElementById('model3dMapBtn');if(b)b.style.display='none';\n"
               "})();\n",
               'mapbox-iife', regex=True)

    # 4. Google Fonts ut
    html = byt(html,
               "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n",
               '', 'fontar')

    # 5. EntroPi-brua: aldri handtrykk
    html = byt(html,
               "const embedRequested=framed&&new URLSearchParams(location.search).has('embed');",
               'const embedRequested=false;', 'embed')

    # 6. Merket ved versjonsnummeret
    m =re.search(r'<span id="appVer"[^>]*>v[0-9.]+</span>', html)
    if not m or html.count('<span id="appVer"') != 1:
        sys.exit('merke: fann ikkje appVer')
    html = html[:m.end()] + MERKE_HTML + html[m.end():]
    i = html.rfind('</body>')
    if i < 0:
        sys.exit('merke-js: fann ikkje </body>')
    html = html[:i] + MERKE_CSS + MERKE_JS + html[i:]

    # 7. Kontroll: ingen adresse att som programmet sjølv kan hente frå
    att = sorted(set(re.findall(r'https?://(?:[a-z0-9-]+\.)*(?:mapbox|googleapis|gstatic|cdnjs|jsdelivr|unpkg|github\.io)[^\s"\'`)]*', html)))
    if att:
        sys.exit('Nettadresser att i fila:\n  ' + '\n  '.join(att))

    os.makedirs(os.path.dirname(UT), exist_ok=True)
    with open(UT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    lag_ikon(html, os.path.join(os.path.dirname(UT), 'sxi-lokal.ico'))
    kopier_lokal_filer(os.path.dirname(UT))
    ver = re.search(r'>(v[0-9.]+)</span>', html).group(1)
    print(f'{UT}\n{ver}, {len(html.encode("utf-8")) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
