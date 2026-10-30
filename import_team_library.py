"""Prepare a dated commercial library from explicitly supplied per-property ZIP files.
Usage: python import_team_library.py /path/to/uploads
Keeps original PDFs in the user's ZIPs. Web copies preserve text, links and pages.
"""
import io,json,hashlib,sys,zipfile,math,subprocess,argparse,re
from pathlib import Path
import fitz
from PIL import Image,ImageDraw,ImageChops,ImageStat,ImageOps
ROOT=Path(__file__).resolve().parent
FOLDERS={'ALTUS':'altus','ATLAS':'atlas','ICÔNICO':'iconico','LINE PARADA INGLESA':'line-parada','LINE PRAÇA DA ÁRVORE':'line-praca','MOB BARRA FUNDA':'mob-barra','MOB CAMPO LIMPO':'mob-campo','NOSTRO MOOCA':'nostro','ORIGEM ITAQUERA':'origem','SERENA':'serena','SINFÔNIA':'sinfonia','VILLAGIO':'villagio','VISION PENHA':'vision'}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('uploads');parser.add_argument('--reference',required=True);parser.add_argument('--received',required=True);args=parser.parse_args()
 assert re.fullmatch(r'20[0-9]{2}-(0[1-9]|1[0-2])',args.reference);assert re.fullmatch(r'20[0-9]{2}-[0-9]{2}-[0-9]{2}',args.received)
 month=int(args.reference[-2:]);label=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][month-1]+' de '+args.reference[:4];reference=args.reference[-2:]+'/'+args.reference[:4]
 output=ROOT/'dist/assets/materiais'/args.reference;output.mkdir(parents=True,exist_ok=True)
 review=ROOT/'tmp/review';review.mkdir(parents=True,exist_ok=True);manifest=[]
 for archive in sorted(Path(args.uploads).glob('*.zip')):
  folder=archive.name.split('-20')[0].strip()
  if folder not in FOLDERS:continue
  id=FOLDERS[folder];files={};z=zipfile.ZipFile(archive)
  for name in z.namelist():
   if not name.lower().endswith('.pdf'):continue
   raw=z.read(name);kind='book' if 'book' in name.lower() else 'tabela';path=output/f'{id}-{kind}.pdf'
   doc=fitz.open(stream=raw,filetype='pdf');original_text=[p.get_text() for p in doc];page_count=len(doc)
   if kind=='book':
    assert not doc.is_form_pdf,'Unexpected form: '+name
    source_path=review/(id+'-source.pdf');source_path.write_bytes(raw)
    receipt_path=review/(id+'-cache.json');receipt=json.loads(receipt_path.read_text()) if receipt_path.is_file() else {};valid_cache=path.is_file() and receipt.get('version')=='gs140-v1' and receipt.get('input')==hashlib.sha256(raw).hexdigest() and receipt.get('output')==hashlib.sha256(path.read_bytes()).hexdigest()
    cached=ROOT/'tmp'/(id+'-gs.pdf');cached_source=ROOT/'tmp'/(id+'-original.pdf')
    if valid_cache:pass
    elif cached.is_file() and cached_source.is_file() and hashlib.sha256(cached_source.read_bytes()).digest()==hashlib.sha256(raw).digest():path.write_bytes(cached.read_bytes())
    else:
     subprocess.run(['gs','-sDEVICE=pdfwrite','-dCompatibilityLevel=1.6','-dPDFSETTINGS=/ebook','-dColorImageResolution=140','-dGrayImageResolution=140','-dMonoImageResolution=300','-dJPEGQ=85','-dDetectDuplicateImages=true','-dSAFER','-dBATCH','-dNOPAUSE','-dQUIET','-sOutputFile='+str(path),str(source_path)],check=True)
    if path.stat().st_size>len(raw):path.write_bytes(raw)
    check=fitz.open(path);assert len(check)==page_count
    if sum(len(p.get_text()) for p in check)<sum(len(t) for t in original_text)*.96:
     check.close();path.write_bytes(raw);check=fitz.open(path)
    assert sum(len(p.get_text()) for p in check)>=sum(len(t) for t in original_text)*.96,(name,'text layer lost')
    original=fitz.open(stream=raw,filetype='pdf');sheet=Image.new('RGB',(1000,math.ceil(page_count/4)*165),'#ecefe9');draw=ImageDraw.Draw(sheet)
    max_error=0
    for n,p in enumerate(check):
     scale=240/p.rect.width;after=p.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False);before=original[n].get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False)
     img=Image.frombytes('RGB',[after.width,after.height],after.samples);prev=Image.frombytes('RGB',[before.width,before.height],before.samples)
     if img.size!=prev.size:
      assert abs(img.width-prev.width)<=1 and abs(img.height-prev.height)<=1,(id,n,"page size changed")
      img=img.resize(prev.size,Image.Resampling.LANCZOS)
     delta=sum(ImageStat.Stat(ImageChops.difference(img,prev)).mean)/3;max_error=max(max_error,delta)
     assert delta<15,(id,n,delta)
     img.thumbnail((244,140));x=n%4*250;y=n//4*165;sheet.paste(img,(x,y+22));draw.text((x+6,y+4),f'{id} / {n+1}',fill='black')
    receipt_path.write_text(json.dumps({'input':hashlib.sha256(raw).hexdigest(),'output':hashlib.sha256(path.read_bytes()).hexdigest(),'version':'gs140-v1'}))
    sheet.save(review/f'{id}-book.jpg');print(id,page_count,'pages,',len(raw),'->',path.stat().st_size,'bytes, max pixel delta',round(max_error,3),flush=True)
   else:path.write_bytes(raw)
   files[kind]={'url':'/'+str(path.relative_to(ROOT/'dist')),'bytes':path.stat().st_size,'source':name,'sha256':hashlib.sha256(raw).hexdigest(),'pages':page_count,'reference':reference}
  manifest.append({'id':id,'archive':archive.name,'files':files,'received':args.received})
 (ROOT/'team-materials.json').write_text(json.dumps({'reference':args.reference,'label':label,'received':args.received,'properties':manifest},ensure_ascii=False,indent=2)+'\n')
 for catalog_path in [ROOT/'catalog-source.json',ROOT/'dist/properties.json']:
  if not catalog_path.is_file():continue
  catalog=json.loads(catalog_path.read_text());by={item['id']:item['files'] for item in manifest}
  for prop in catalog:
   for kind in ['book','tabela']:
    item=by.get(prop['id'],{}).get(kind)
    if not item:continue
    old=prop['links'].get(kind)
    if old and old.startswith('https://'):prop['links'][kind+'_drive']=old
    prop['links'][kind]=item['url']
    if kind=='tabela':prop['tableReference']=item['reference']
  catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 print('Commercial library:',len(manifest),'properties. Original sales tables copied without changing values.')
if __name__=='__main__':main()
