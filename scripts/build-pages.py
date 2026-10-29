"""Prepare the static website for a GitHub Pages project URL or custom domain."""
from pathlib import Path
import argparse,re,shutil
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--base-path',default='',help='GitHub Pages base_path output, e.g. /schrauben-technologies-v6')
args=parser.parse_args();base=args.base_path.strip().rstrip('/')
if base and (not base.startswith('/') or base.startswith('//') or '..' in base.split('/') or any(c in base for c in '\\"\'`?#')):
 parser.error('base-path must be an absolute URL path without traversal, quotes, queries or fragments')
output=root/'_site'
if output.exists():shutil.rmtree(output)
shutil.copytree(root/'site',output)
if base:
 for f in output.rglob('*'):
  if f.suffix in {'.html','.css','.js'}:
   f.write_text(re.sub(r'''(?<=["'`(])/(?!/)''',lambda m:base+'/',f.read_text()))
(output/'.nojekyll').touch()
# A real 404 keeps unknown URLs useful without hiding missing routes behind a homepage.
notfound='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Schrauben Technologies</title><link rel="stylesheet" href="BASE/styles.css"></head><body><main class="detail-hero"><div class="section-label">SCHRAUBEN TECHNOLOGIES / 404</div><h1>Let’s get you<br>back on track.</h1><p>This page could not be found.</p><p><a class="button button-dark" href="BASE/">Return to the website <span>↗</span></a></p></main></body></html>'''
(output/'404.html').write_text(notfound.replace('BASE',base))
# Audit all HTML links and assets against the emitted directory.
missing=[]
for f in output.rglob('*.html'):
 for url in re.findall(r'''(?:href|src)=["']([^"']+)["']''',f.read_text()):
  if not url.startswith('/') or url.startswith('//'):continue
  path=url.split('#')[0].split('?')[0]
  if base:
   if not (path==base or path.startswith(base+'/')):missing.append((str(f.relative_to(output)),url));continue
   path=path[len(base):]
  if not (output/path.lstrip('/')).exists():missing.append((str(f.relative_to(output)),url))
if missing:raise SystemExit('Broken internal links/assets: '+repr(missing))
print(f'Built {len(list(output.rglob("*.html")))} pages for {base or "/"}; all static links and assets verified.')
