"""Build deck-v2/index.html from src/index-src.html: every <!--REUSE id [scene json]--> is replaced by
that slide from ../deck/index.html, with its old map attributes removed and the new scene attached."""
import re, sys, os, json
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = open(os.path.join(root, 'src', 'index-src.html'), encoding='utf-8').read()
old = open(os.path.join(root, '..', 'deck', 'index.html'), encoding='utf-8').read()
AT = {'quiz1': '1.6', 'text': '6.2', 'unau': '19.0', 'debate': '19.9', 'end': '20.3'}
# old act labels → the film structure
EYEBROW = {'quiz1': 'Quiz', 'text': 'Flashback · cycle #2', 'unau': 'Climax', 'debate': 'Your turn'}
def section(sid):
    m = re.search(r'<section\b[^>]*\bid="%s"[^>]*>.*?</section>' % sid, old, re.S)
    if not m: sys.exit('missing old section ' + sid)
    return m.group(0)
def repl(m):
    sid, scene = m.group(1), m.group(2)
    json.loads(scene)
    s = section(sid)
    s = re.sub(r"\s+data-map(-steps)?='.*?'", '', s, flags=re.S)
    s = re.sub(r'\s+data-(video|shade|transition)="[^"]*"', '', s)
    if sid in AT: s = re.sub(r'data-at="[^"]*"', 'data-at="%s"' % AT[sid], s, count=1)
    s = s.replace('2023 – 25 Oct 2026', '2023 – 23 Oct 2026')
    if sid in EYEBROW: s = re.sub(r'(<div class="eyebrow"><span>)[^<]*(</span>)', r'\g<1>%s\g<2>' % EYEBROW[sid], s, count=1)
    s = re.sub(r'(<aside class="notes">)', '<script type="application/json" class="scene">%s</script>\n    \\1' % scene, s, count=1)
    return '  ' + s
out = re.sub(r'<!--REUSE (\w+) (\[.*?\])-->', repl, src)
# validate every scene block
for blk in re.findall(r'<script type="application/json" class="scene">(.*?)</script>', out, re.S):
    json.loads(blk)
# cache-busting: a local static server lets the browser keep old JS/CSS, so stamp each file with its mtime
def stamp(m):
    path = m.group(2)
    try: v = int(os.path.getmtime(os.path.join(root, path)))
    except OSError: return m.group(0)
    return '%s="%s?v=%d"' % (m.group(1), path, v)
out = re.sub(r'(src|href)="((?:js|css)/[^"?]+)"', stamp, out)
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(out)
print('slides:', out.count('<section'), 'scenes:', out.count('class="scene"'))
