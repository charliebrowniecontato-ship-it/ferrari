from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse,unquote
from collections import Counter
import json,re,xml.etree.ElementTree as ET
from PIL import Image
root=Path('dist');base='https://ferrariassessoria.com'
class HTML(HTMLParser):
 def __init__(self):super().__init__();self.tags=[]
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
def resolve(path):
 p=root/unquote(path).lstrip('/')
 return p/'index.html' if p.is_dir() else p
pages=[p for p in root.rglob('*.html') if p.name!='_qa.html']
for page in pages:
 s=page.read_text();h=HTML();h.feed(s)
 ids=[a['id'] for _,a in h.tags if a.get('id')];assert not [x for x,c in Counter(ids).items() if c>1],(page,'duplicate ids')
 assert sum(t=='h1' for t,_ in h.tags)==1,(page,'h1')
 assert 'https://www.legacygrowthpartner.com.br/' in s,(page,'Legacy link')
 assert 'Desenvolvido por Legacy Growth Partner' in s
 for t,a in h.tags:
  for attr in ['src','href']:
   link=a.get(attr,'');u=urlparse(link)
   if u.scheme in ['https','http','tel','mailto'] or link.startswith('#') or not link:continue
   if u.path.startswith('/'):assert resolve(u.path).is_file(),(page,link)
  if t=='img':
   assert 'alt'in a and a.get('width') and a.get('height'),(page,'image accessibility/size')
   for candidate in a.get('srcset','').split(','):
    if not candidate.strip():continue
    asset,width=candidate.strip().split();assert resolve(asset).is_file(),(page,asset)
    assert Image.open(resolve(asset)).width==int(width.rstrip('w')),(page,'srcset width',asset)
 for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(data)
 canonical=next(a['href'] for t,a in h.tags if t=='link' and a.get('rel')=='canonical');assert canonical.startswith(base)
 og=next(a['content'] for t,a in h.tags if t=='meta' and a.get('property')=='og:image');assert og.startswith(base+'/assets/') and resolve(urlparse(og).path).is_file()
 assert Image.open(resolve(urlparse(og).path)).size==(1200,630),(page,'social card dimensions')
 assert any(t=='meta' and a.get('name')=='description' and 50<len(a.get('content',''))<250 for t,a in h.tags),(page,'description')
 assert any(t=='meta' and a.get('name')=='twitter:card' and a.get('content')=='summary_large_image' for t,a in h.tags),(page,'Twitter card')
 assert s.index('src="/site-ui.js"')<s.index('</head>')
 if page.name!='404.html':
  expected=base+'/'+str(page.parent.relative_to(root)).replace('\\','/').strip('./')+'/' if page.parent!=root else base+'/'
  assert canonical==expected,(page,canonical,expected)
xml=ET.parse(root/'sitemap.xml');urls=[el.text for el in xml.iter() if el.tag.endswith('}loc')];assert len(urls)==18 and len(set(urls))==18
for url in urls:assert resolve(urlparse(url).path).is_file() and not urlparse(url).query and not urlparse(url).fragment
home=(root/'index.html').read_text();assert home.count('class="property-card"')==14 and '<script id="property-data"'in home
for f in ['llms.txt','llm.txt','llms-full.txt','robots.txt']:assert (root/f).is_file() and (root/f).stat().st_size>50
print(f'PASS: {len(pages)} HTML pages; 18 canonical sitemap URLs; unique IDs, H1s, Legacy signature, local links, image metadata, structured JSON and prerendered catalog.')

props=json.loads((root/'properties.json').read_text())
assert len(props)==14 and len({p['id'] for p in props})==14
assert {'view','nostro','vision'}.issubset({p['id'] for p in props})
for p in props:
 for key in ['image','facade']:
  assert (root/p[key]).is_file(),(p['id'],key)
 for photo in p.get('gallery',[]):
  assert Image.open(root/photo['src']).size==(photo['width'],photo['height'])
 for item in p.get('responsive',[]):
  assert Image.open(root/item['src']).width==item['width']
for path in root.rglob('*'):
 if path.is_file() and path.suffix in ['.html','.js','.json','.txt','.md']:
  text=path.read_text()
  assert '99379' not in text,(path,'old phone')
  for number in re.findall(r'wa\.me/(\d+)',text):assert number=='5511932362552',(path,number)
assert not list(root.rglob('*.pdf')), 'Review sales documents before public distribution'
print('PASS: 14 reviewed property records; media dimensions; institutional WhatsApp; no public sales-table files.')
