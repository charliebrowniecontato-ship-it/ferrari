"""Extract only explicitly reviewed property media from the supplied October archive.
Usage: python import_materials.py /path/to/archive.zip
Sales tables are never copied into the public site.
"""
import hashlib,io,json,sys,zipfile
from pathlib import Path
import fitz
from PIL import Image
ROOT=Path(__file__).resolve().parent
# property: (folder, book substring, primary xref or None, gallery [(xref, caption)])
MEDIA={
 'line-parada':('LINE PARADA INGLESA','BOOK Line',186,[(192,'Salão de festas'),(207,'Academia')]),
 'atlas':('ATLAS','BOOK Atlas',None,[]),
 'altus':('ALTUS','BOOK ALTUS',None,[(164,'Salão de festas'),(192,'Piscina')]),
 'vision':('VISION PENHA','Book Vision',224,[(236,'Salão de festas'),(274,'Piscina')]),
 'serena':('SERENA','Book Serena',437,[(161,'Piscina'),(243,'Academia')]),
 'villagio':('VILLAGIO','Book Villagio',83,[(118,'Salão de festas'),(143,'Piscina')]),
 'nostro':('NOSTRO MOOCA','Nostro Mooca BOOK',48,[(132,'Piscina')]),
 'iconico':('ICÔNICO','BOOK ICÔNICO',98,[(187,'Piscina')]),
 'line-praca':('LINE PRAÇA DA ÁRVORE','BOOK LINE',None,[(963,'Piscina'),(1232,'Sugestão de decoração')]),
 'view':('VIEW PARQUE ECOLÔGICO','BOOK View',91,[(97,'Piscina'),(138,'Salão de festas')]),
 'sinfonia':('SINFÔNIA','BOOK Sinfônia',None,[(90,'Piscina'),(97,'Academia')]),
 'mob-barra':('MOB BARRA FUNDA','Book Mob',178,[(277,'Academia'),(447,'Sugestão de decoração')]),
 'mob-campo':('MOB CAMPO LIMPO','BOOK MOB',None,[(173,'Piscina'),(177,'Academia')]),
 'origem':('ORIGEM ITAQUERA','Book ORIGEM',None,[(209,'Piscina'),(255,'Salão de festas')])}

def main():
 z=zipfile.ZipFile(sys.argv[1]);catalog=json.loads((ROOT/'catalog-source.json').read_text());audit=[]
 for prop in catalog:
  folder,needle,primary,photos=MEDIA[prop['id']]
  name=next(n for n in z.namelist() if folder in n.split('/')[-2].strip() and needle in n.split('/')[-1])
  raw=z.read(name);doc=fitz.open(stream=raw,filetype='pdf');record={'property':prop['id'],'book':name,'sha256':hashlib.sha256(raw).hexdigest(),'reviewed':'2026-10-30','images':[]}
  def extract(xref):
   data=doc.extract_image(xref);return Image.open(io.BytesIO(data['image'])).convert('RGB')
  if primary:
   image=extract(primary);image.thumbnail((2000,2000));dest=ROOT/'media-source'/f"{prop['id']}.jpg";image.save(dest,'JPEG',quality=94,optimize=True)
   # Public fallback is a fresh URL; responsive variants are generated separately.
   path=f"assets/{prop['id']}-r3.webp";image.thumbnail((2000,2000));image.save(ROOT/'dist'/path,'WEBP',quality=86,method=6);prop['image']=path
   record['primary_xref']=primary
  gallery=[]
  for number,(xref,caption) in enumerate(photos,1):
   image=extract(xref);image.thumbnail((1600,1600));path=f"assets/{prop['id']}-gallery-{number}.webp";image.save(ROOT/'dist'/path,'WEBP',quality=83,method=6)
   gallery.append({'src':path,'caption':caption,'width':image.width,'height':image.height});record['images'].append({'xref':xref,'asset':path,'caption':caption})
  prop['gallery']=gallery;record['primary_source']='book image' if primary else 'previously supplied EMCCAMP image, matched against book';audit.append(record)
 (ROOT/'catalog-source.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'media-source/audit-20261030.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 print('Reviewed property media extracted for',len(catalog),'properties; no sales tables published.')
if __name__=='__main__':main()
