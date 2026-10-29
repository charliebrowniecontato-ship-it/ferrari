from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse,unquote
from collections import Counter
import json,re,xml.etree.ElementTree as ET
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
  if t=='img':assert 'alt'in a and a.get('width') and a.get('height'),(page,'image accessibility/size')
 for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(data)
 canonical=next(a['href'] for t,a in h.tags if t=='link' and a.get('rel')=='canonical');assert canonical.startswith(base)
 og=next(a['content'] for t,a in h.tags if t=='meta' and a.get('property')=='og:image');assert og.startswith(base+'/assets/') and resolve(urlparse(og).path).is_file()
 assert s.index('src="/site-ui.js"')<s.index('</head>')
 if page.name!='404.html':
  expected=base+'/'+str(page.parent.relative_to(root)).replace('\\','/').strip('./')+'/' if page.parent!=root else base+'/'
  assert canonical==expected,(page,canonical,expected)
xml=ET.parse(root/'sitemap.xml');urls=[el.text for el in xml.iter() if el.tag.endswith('}loc')];assert len(urls)==14 and len(set(urls))==14
for url in urls:assert resolve(urlparse(url).path).is_file() and not urlparse(url).query and not urlparse(url).fragment
home=(root/'index.html').read_text();assert home.count('class="property-card"')==12 and '<script id="property-data"'in home
for f in ['llms.txt','llm.txt','llms-full.txt','robots.txt']:assert (root/f).is_file() and (root/f).stat().st_size>50
print(f'PASS: {len(pages)} HTML pages; 14 canonical sitemap URLs; unique IDs, H1s, Legacy signature, local links, image metadata, structured JSON and prerendered catalog.')
