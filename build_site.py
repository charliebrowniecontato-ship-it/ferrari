from pathlib import Path
from html import escape,unescape
from urllib.parse import quote
import json,re,shutil,xml.etree.ElementTree as ET
from PIL import Image
BASE='https://ferrariassessoria.com'
OUT=Path('dist');source=Path('src/home.html').read_text();props=json.loads((OUT/'properties.json').read_text());byid={p['id']:p for p in props};ORDER=['sinfonia','atlas','vision','line-praca','mob-barra','origem','mob-campo','iconico','line-parada','serena','altus','villagio'];ordered=[byid[i] for i in ORDER]
wa=lambda msg:'https://wa.me/5511932362552?text='+quote(msg,safe='')
pageurl=lambda p:BASE+'/imoveis/'+p['id']+'/'
beds=lambda p:'1 e 2 dormitórios' if len(p['beds'])>1 else f"{p['beds'][0]} dormitório"+('s' if p['beds'][0]>1 else '')
def absolute_assets(s):
 return re.sub(r'((?:href|src)=")(assets/|styles\.css|app\.js|site-ui\.js)',r'\1/\2',s)
def jsonld(obj):return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False).replace('</','<\\/')+'</script>'
agent={'@type':'RealEstateAgent','@id':BASE+'/#empresa','name':'Ferrari Assessoria Imobiliária','url':BASE+'/','logo':BASE+'/assets/ferrari-logo.png','telephone':'+55-11-93236-2552','areaServed':[{'@type':'City','name':'São Paulo'},{'@type':'City','name':'Jundiaí'}],'sameAs':['https://instagram.com/ferraricorretagem']}
website={'@type':'WebSite','@id':BASE+'/#website','url':BASE+'/','name':'Ferrari Assessoria Imobiliária','inLanguage':'pt-BR','publisher':{'@id':BASE+'/#empresa'}}
def makehead(title,description,path='/',image='sinfonia',schema=None):
 url=BASE+path;social='og-ferrari-v2.jpg' if path=='/' else f'social-{image}.jpg';og=BASE+'/assets/'+social;im=Image.open(OUT/'assets'/social);w,h=im.size
 image_alt='Ferrari Assessoria Imobiliária — imóveis em São Paulo e Jundiaí' if path=='/' else 'Perspectiva ilustrativa de '+byid[image]['name']
 candidates=byid[image].get('responsive',[]);srcset=', '.join('/'+item['src']+' '+str(item['width'])+'w' for item in candidates)
 image_sizes='(max-width: 900px) 100vw, 67vw' if path=='/' else '(max-width: 900px) 100vw, 55vw'
 preload=f'<link rel="preload" as="image" href="/assets/{image}.webp" imagesrcset="{srcset}" imagesizes="{image_sizes}" fetchpriority="high">' if path=='/' or path.startswith('/imoveis/') else ''
 return f'''<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description,quote=True)}">
<link rel="canonical" href="{url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#ba242b"><meta name="color-scheme" content="light"><meta name="format-detection" content="telephone=no">
<meta name="application-name" content="Ferrari Assessoria Imobiliária"><meta name="author" content="Ferrari Assessoria Imobiliária">
<meta property="og:locale" content="pt_BR"><meta property="og:type" content="website"><meta property="og:site_name" content="Ferrari Assessoria Imobiliária">
<meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{og}"><meta property="og:image:secure_url" content="{og}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="{w}"><meta property="og:image:height" content="{h}"><meta property="og:image:alt" content="{escape(image_alt,quote=True)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title,quote=True)}"><meta name="twitter:description" content="{escape(description,quote=True)}"><meta name="twitter:image" content="{og}"><meta name="twitter:image:alt" content="{escape(image_alt,quote=True)}">
<link rel="icon" type="image/png" href="/assets/favicon.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preload" as="font" href="/assets/inter.woff2" type="font/woff2" crossorigin>{preload}
<link rel="stylesheet" href="/styles.css"><script src="/site-ui.js" defer></script>
{jsonld(schema) if schema else ''}
</head>'''
# build_media.py produces JPEG social cards and responsive WebP variants first.
assert (OUT/'assets/og-ferrari-v2.jpg').is_file(), 'Run python build_media.py first.'
def card(p,controls=True):
 link=f"/imoveis/{p['id']}/";state='launch' if p['status']=='Lançamento' else 'ready' if p['status']=='Pronto para morar' else ''
 return f'''<article class="property-card"><div class="card-image-wrap"><a class="image-open" href="{link}" data-open="{p['id']}" aria-label="Conhecer {p['name']}"><img class="card-image" src="/{p['image']}" alt="Perspectiva ilustrativa de {p['name']}" width="700" height="440" loading="lazy"></a><span class="status-badge {state}">{p['status']}</span>{f'<button class="favorite" data-save="{p["id"]}" aria-label="Salvar {p["name"]} nos favoritos" aria-pressed="false"><i data-icon="heart"></i></button>' if controls else ''}</div><div class="card-body"><p class="card-location"><i data-icon="pin"></i> {p['neighborhood']} · {p['regionLabel']}</p><a class="card-title" href="{link}" data-open="{p['id']}"><h3>{p['name']}</h3></a><p class="card-highlight">{p['highlight']}</p><div class="card-specs"><span><i data-icon="bed"></i>{beds(p)}</span><span><i data-icon="area"></i>{p['area']} m²</span></div><div class="card-footer">{f'<label class="compare-option"><input type="checkbox" data-compare="{p["id"]}" aria-label="Comparar {p["name"]}"> Comparar</label>' if controls else '<span class="card-price-label">Condições sob consulta</span>'}<a class="card-more" href="{link}" data-open="{p['id']}">Conheça o imóvel <i data-icon="arrow-up-right"></i></a></div></div></article>'''
# Indexable HTML, without waiting for client-side data fetching.
schema={'@context':'https://schema.org','@graph':[agent,website,{'@type':'CollectionPage','@id':BASE+'/#pagina','url':BASE+'/','name':'Imóveis em São Paulo e Jundiaí | Ferrari Assessoria Imobiliária','isPartOf':{'@id':BASE+'/#website'},'inLanguage':'pt-BR','mainEntity':{'@type':'ItemList','numberOfItems':len(props),'itemListElement':[{'@type':'ListItem','position':i+1,'url':pageurl(p),'name':p['name']} for i,p in enumerate(ordered)]}}]}
head=makehead('Ferrari Imóveis | Apartamentos em São Paulo e Jundiaí','Encontre seu imóvel em São Paulo e Jundiaí com a Ferrari Assessoria Imobiliária. Compare plantas, explore empreendimentos EMCCAMP e agende sua visita.',schema=schema)
home=re.sub(r'<head>.*?</head>',head,source,flags=re.S)
home=home.replace('<!-- PRERENDER_CARDS -->','\n'.join(card(p) for p in ordered))
home=home.replace('<body>','<body>\n<noscript><style>#search-form,.catalog-tools,.catalog-search-line,.sort-label,#load-more,.favorite,.compare-option,.saved-btn,#open-quiz,.menu-btn{display:none!important}#main-nav{display:flex;position:static;box-shadow:none}.property-grid{margin-top:25px}</style></noscript>')
home=home.replace('</head>','<script src="/app.js" defer></script></head>')
home=home.replace('</body>','<script id="property-data" type="application/json">'+json.dumps(props,ensure_ascii=False).replace('</','<\\/')+'</script></body>')
(OUT/'index.html').write_text(absolute_assets(home))
# Reuse approved navigation and footer on each property page.
header=re.search(r'<div class="topbar">.*?</header>',home,re.S).group()
header=header.replace('href="#','href="/#')
header=re.sub(r'<button class="saved-btn".*?</button>','<a class="header-home" href="/#imoveis" aria-label="Voltar aos imóveis"><i data-icon="search"></i></a>',header,flags=re.S)
header=header.replace('data-nav-region=','data-page-region=').replace('data-nav-status=','data-page-status=')
footer=re.search(r'<footer>.*?</footer>',home,re.S).group().replace('href="#','href="/#')
footer=footer.replace('<button id="privacy-btn">Privacidade</button>','<a href="/privacidade/">Privacidade</a>')
notes='Imagens ilustrativas. Metragens, disponibilidade, endereço, previsões de entrega e condições comerciais devem ser confirmados com o atendimento e a documentação do empreendimento.'
page_js='''<script src="/property-page.js" defer></script>'''
for p in props:
 path='/imoveis/'+p['id']+'/'
 rooms=beds(p);description=f"{p['name']} em {p['neighborhood']}, {p['city']}: {rooms}, {p['area']} m². Conheça os diferenciais e consulte condições com a Ferrari."
 # A structured description, without speculative price, stock or reviews.
 residence={'@type':'Residence' if p['id']=='villagio' else 'ApartmentComplex','@id':pageurl(p)+'#empreendimento','name':p['name'],'description':p['description'],'image':BASE+'/'+p['image'],'address':{'@type':'PostalAddress','addressLocality':p['city'],'addressRegion':'SP','addressCountry':'BR'}}
 graph={'@context':'https://schema.org','@graph':[agent,website,residence,{'@type':'WebPage','@id':pageurl(p)+'#pagina','url':pageurl(p),'name':p['name']+' | Ferrari Assessoria Imobiliária','inLanguage':'pt-BR','isPartOf':{'@id':BASE+'/#website'},'about':{'@id':pageurl(p)+'#empreendimento'},'breadcrumb':{'@id':pageurl(p)+'#breadcrumb'}},{'@type':'BreadcrumbList','@id':pageurl(p)+'#breadcrumb','itemListElement':[{'@type':'ListItem','position':1,'name':'Início','item':BASE+'/'},{'@type':'ListItem','position':2,'name':p['name'],'item':pageurl(p)}]}]}
 related=[x for x in ordered if x['id']!=p['id'] and x['region']==p['region']][:3]
 if len(related)<3:related+= [x for x in ordered if x['id']!=p['id'] and x not in related][:3-len(related)]
 l=p['links'];resources=''.join(f'<a href="{l[key]}" target="_blank" rel="noopener noreferrer"><i data-icon="{ico}"></i>{label}</a>' for key,label,ico in [('tour','Tour virtual','play'),('book','Apresentação','file'),('imagens','Mais imagens','image'),('map','Ver localização','pin')] if l.get(key))
 contact=wa(f"Olá! Tenho interesse no {p['name']}, em {p['neighborhood']}. Gostaria de consultar valores, disponibilidade e condições.")
 content=f'''<main id="inicio" class="property-page"><div class="wrap"><nav class="breadcrumbs" aria-label="Caminho de navegação"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/#imoveis">Imóveis</a><span aria-hidden="true">/</span><span aria-current="page">{p['name']}</span></nav><section class="property-page-hero"><div class="page-photo"><img id="page-photo" src="/{p['image']}" alt="Perspectiva ilustrativa de {p['name']}" width="700" height="440" fetchpriority="high"><small>Imagem ilustrativa</small><button class="photo-toggle" id="page-photo-toggle" data-main="/{p['image']}" data-facade="/{p['facade']}" aria-pressed="false"><i data-icon="image"></i> Ver fachada</button></div><div class="detail-info"><p class="eyebrow"><span></span>{p['neighborhood'].upper()} · {p['city'].upper()}</p><h1>{p['name']}</h1><span class="detail-status">{p['status']}</span><p>{p['description']}</p><div class="detail-specs"><div><small>Plantas</small>{rooms}</div><div><small>Metragem do portfólio</small>{p['area']} m²</div><div><small>Diferencial</small>{p['highlight']}</div><div><small>{'Previsão de entrega' if p['delivery'] else 'Fase'}</small>{p['delivery'] or p['status']}</div></div><p class="detail-address"><i data-icon="pin"></i>{p['address']}</p><a class="btn btn-red" href="{contact}" target="_blank" rel="noopener noreferrer"><i data-icon="whatsapp"></i> Consultar condições <i data-icon="arrow-up-right"></i></a><a class="text-link" href="{wa('Olá! Gostaria de agendar uma visita ao '+p['name']+'. Quais são as possibilidades?')}" target="_blank" rel="noopener noreferrer">Quero agendar uma visita <i data-icon="arrow-right"></i></a><div class="detail-utilities"><a href="/#imoveis"><i data-icon="arrow-left"></i> Voltar aos imóveis</a><button id="page-share" data-title="{p['name']}"><i data-icon="share"></i> Compartilhar</button></div></div></section><section class="detail-bottom page-features" aria-label="Diferenciais e materiais"><div><h2>Mais possibilidades no dia a dia.</h2><div class="amenities">{''.join('<span><i data-icon="check"></i>'+a+'</span>' for a in p['amenities'])}</div></div><div><h2>Explore os detalhes.</h2><div class="resource-links">{resources}</div><p>{notes}</p></div></section><section class="related-section section"><div class="section-top"><div><p class="eyebrow"><span></span> CONTINUE EXPLORANDO</p><h2>Outras possibilidades<br><span>para a sua história.</span></h2></div><a class="text-link" href="/#imoveis">Ver todos os imóveis <i data-icon="arrow-right"></i></a></div><div class="property-grid">{''.join(card(x,False) for x in related)}</div></section></div></main>'''
 html='<!doctype html><html lang="pt-BR">'+makehead(p['name']+' em '+p['neighborhood']+' | Ferrari Imóveis',description,path,p['id'],graph)+page_js+'<body><a class="skip" href="#inicio">Pular para o imóvel</a>'+header+content+footer+f'<a class="floating-wa" href="{contact}" target="_blank" rel="noopener noreferrer" aria-label="Falar sobre {p["name"]} no WhatsApp"><i data-icon="whatsapp"></i></a><div id="toast" class="toast" role="status" aria-live="polite"></div></body></html>'
 target=OUT/path.lstrip('/');target.mkdir(parents=True,exist_ok=True);(target/'index.html').write_text(absolute_assets(html))
 # A short Markdown equivalent makes linked material useful to text agents.
 md=f"# {p['name']}\n\n{p['description']}\n\n- Região: {p['regionLabel']}, {p['city']}.\n- Bairro: {p['neighborhood']}.\n- Plantas: {rooms}.\n- Metragem informada no portfólio: {p['area']} m².\n- Fase: {p['status']}.\n- Entrega prevista: {p['delivery'] or 'Consultar disponibilidade da unidade pronta'}.\n- Diferencial: {p['highlight']}.\n\n## Lazer e conveniências\n\n"+'\n'.join('- '+a for a in p['amenities'])+f"\n\n## Atendimento\n\n- [Página do empreendimento]({pageurl(p)})\n- [Consultar condições pelo WhatsApp]({contact})\n\n{notes}\n"
 (target/'index.md').write_text(md)
# Privacy is a real static page as well as the existing home dialog.
privacy='''<main class="wrap privacy-page" id="inicio"><p class="eyebrow"><span></span> PRIVACIDADE</p><h1>Uma conversa transparente.</h1><p>Este site apresenta imóveis e direciona o visitante para atendimento externo. Não há formulário de cadastro ou análise de crédito no site.</p><h2>Favoritos neste navegador</h2><p>Os imóveis favoritos ficam armazenados somente no navegador utilizado. Você pode apagá-los na opção Privacidade da página inicial ou nas configurações do seu navegador. Não são enviados para um servidor do site.</p><h2>Contato e serviços externos</h2><p>Ao acessar WhatsApp, Instagram, mapas, tours ou materiais dos empreendimentos, você utiliza serviços externos, que possuem suas próprias políticas de privacidade. Informações enviadas pelo WhatsApp são compartilhadas diretamente por você com o atendimento.</p><h2>Suas escolhas</h2><p>Você pode navegar pelo catálogo sem informar seus dados pessoais. Se tiver dúvidas sobre informações compartilhadas com o atendimento, entre em contato pelo WhatsApp comercial (11) 93236-2552.</p><a class="btn btn-red" href="/">Voltar ao site <i data-icon="arrow-right"></i></a></main>'''
pt=OUT/'privacidade';pt.mkdir(exist_ok=True);(pt/'index.html').write_text(absolute_assets('<!doctype html><html lang="pt-BR">'+makehead('Privacidade | Ferrari Assessoria Imobiliária','Entenda como funcionam os favoritos locais e os links de atendimento da Ferrari Assessoria Imobiliária.','/privacidade/')+'<script src="/property-page.js" defer></script><body>'+header+privacy+footer+'</body></html>'))
# A host-supported custom 404 does not send visitors to a broken app shell.
notfound='''<main class="wrap not-found" id="inicio"><p class="eyebrow"><span></span> ENDEREÇO NÃO ENCONTRADO</p><h1>Vamos encontrar<br>outro caminho?</h1><p>Essa página não está disponível. Seu próximo imóvel pode estar no nosso catálogo.</p><a class="btn btn-red" href="/#imoveis">Explorar os imóveis <i data-icon="arrow-right"></i></a></main>'''
(OUT/'404.html').write_text(absolute_assets('<!doctype html><html lang="pt-BR">'+makehead('Página não encontrada | Ferrari Imóveis','Explore os empreendimentos Ferrari em São Paulo e Jundiaí.').replace('index, follow, max-image-preview:large','noindex, follow')+'<script src="/property-page.js" defer></script><body>'+header+notfound+footer+'</body></html>'))
# Sitemap contains only existing canonical HTML URLs, with no query strings or fragments.
urls=[BASE+'/']+[pageurl(p) for p in ordered]+[BASE+'/privacidade/']
ET.register_namespace('','http://www.sitemaps.org/schemas/sitemap/0.9');tree=ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
for url in urls:
 item=ET.SubElement(tree,'{http://www.sitemaps.org/schemas/sitemap/0.9}url');ET.SubElement(item,'{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text=url
ET.ElementTree(tree).write(OUT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(OUT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE+'/sitemap.xml\n')
llms='''# Ferrari Assessoria Imobiliária

> Catálogo de empreendimentos EMCCAMP em São Paulo e Jundiaí, com atendimento da Ferrari Assessoria Imobiliária.

Telefone/WhatsApp comercial: +55 11 93236-2552. Instagram: @ferraricorretagem.

As metragens do catálogo são as do portfólio Ferrari, edição setembro/2026. Os status de Vision Penha e MOB Barra Funda seguem o material institucional EMCCAMP fornecido em outubro/2026. Valores, disponibilidade, endereço, itens incluídos e previsões devem ser confirmados com o atendimento. Não há aprovação ou simulação automática de crédito neste site.

## Informações principais

'''+f'- [Página inicial e catálogo]({BASE}/): Busca de imóveis, regiões e atendimento.\n- [Privacidade]({BASE}/privacidade/): Favoritos locais e serviços externos.\n\n## Empreendimentos\n\n'+'\n'.join(f'- [{p["name"]}]({pageurl(p)}index.md): {p["neighborhood"]}, {p["city"]}; {beds(p)}; {p["area"]} m².' for p in ordered)+f'\n\n## Optional\n\n- [Catálogo completo em texto]({BASE}/llms-full.txt)\n- [Mapa do site]({BASE}/sitemap.xml)\n'
(OUT/'llms.txt').write_text(llms);(OUT/'llm.txt').write_text(llms);(OUT/'llms-full.txt').write_text(llms+'\n\n'+'\n\n'.join((OUT/'imoveis'/p['id']/'index.md').read_text() for p in ordered))
print(f'Built home, {len(props)} property pages, privacy, 404, sitemap, robots and LLM documents.')
# Keep deferred page scripts in the document head for valid document structure.
for path in OUT.rglob('*.html'):
 text=path.read_text().replace('</head><script src="/property-page.js" defer></script>','<script src="/property-page.js" defer></script></head>')
 # Preserve real, indexable heading text and the approved manual line breaks.
 def heading(match):
  level,attrs,content=match.groups()
  if 'data-text-motion' in attrs:return match.group()
  parts=re.split(r'<br\s*/?>',content)
  wrapped=''.join('<span class="motion-line"><span class="motion-line-inner">'+line+'</span></span>' for line in parts)
  return f'<h{level}{attrs} data-text-motion>{wrapped}</h{level}>'
 text=re.sub(r'<h([12])([^>]*)>(.*?)</h\1>',heading,text,flags=re.S)
 def responsive(match):
  tag=match.group();src=re.search(r'src="/?assets/([^"/]+)\.webp"',tag)
  if not src or src.group(1) not in byid:return tag
  p=byid[src.group(1)];variants=p.get('responsive',[])
  if not variants:return tag
  srcset=', '.join('/'+v['src']+' '+str(v['width'])+'w' for v in variants)
  sizes='(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw'
  if 'hero-image' in tag:sizes='(max-width: 900px) 100vw, 67vw'
  if 'page-photo' in tag:sizes='(max-width: 900px) 100vw, 55vw'
  return tag[:-1]+f' srcset="{srcset}" sizes="{sizes}" decoding="async">'
 text=re.sub(r'<img\b[^>]*>',responsive,text)
 path.write_text(text)
(OUT/'site.webmanifest').write_text(json.dumps({'name':'Ferrari Assessoria Imobiliária','short_name':'Ferrari','lang':'pt-BR','start_url':'/','display':'standalone','background_color':'#ffffff','theme_color':'#ba242b','icons':[{'src':'/assets/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any'}]},ensure_ascii=False))
