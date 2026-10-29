import json
from pathlib import Path
links=json.loads(Path('source-links.json').read_text())
raw=[
('line-praca','Line Praça da Árvore','Praça da Árvore','sul',[1,2],'31 a 40','Em obras','Mar/2028','Apartamentos de 1 e 2 dormitórios para viver a Zona Sul.','Piscina,Academia,Lavanderia,Pet place,Churrasqueira,Mini market','Consultar opções','Endereço a confirmar com o atendimento'),
('atlas','Atlas Sacomã','Sacomã','sul',[2],'41 a 45','Lançamento','Dez/2028','Varanda, vaga e espaço para a sua rotina acontecer.','Piscinas adulto e infantil,Academia,Espaço gourmet,Brinquedoteca,Pet place,Bicicletário','Vaga e varanda','Endereço a confirmar com o atendimento'),
('mob-campo','MOB Campo Limpo','Campo Limpo','sul',[2],'38 a 39','Lançamento','Dez/2028','Dois dormitórios, varanda e lazer para aproveitar todos os dias.','Piscina,Coworking,Lavanderia,Academia,Espaço gourmet,Pet place','Com varanda','Rua Rudolf Alt, 40'),
('sinfonia','Sinfonia Santo Amaro','Santo Amaro','sul',[2],'42 a 46','Lançamento','Dez/2028','Mais possibilidades para morar bem em Santo Amaro.','Piscinas adulto e infantil,Coworking,Academia,Spa,Pet care,Salão de jogos','Varanda e opção de vaga','Rua Ada Negri, 469'),
('altus','Altus Vila Prudente','Vila Prudente','leste',[2],'45','Em obras','Nov/2026','Seu novo endereço na Vila Prudente, com lazer para toda a família.','Piscina,Academia,Salão de festas,Churrasqueira,Playground,Espaço relax','2 dormitórios','Rua Marcello Müller, 200'),
('origem','Origem Itaquera','Itaquera','leste',[2],'41','Em obras','Out/2027','Dois dormitórios com vaga e lazer para viver mais momentos juntos.','Piscina,Coworking,Quadra,Academia,Brinquedoteca,Pet place','Com vaga','Rua Agrimensor Sugaya, 842'),
('serena','Serena Residence','Vila Sílvia','leste',[2],'40','Em obras','Jul/2028','Um lugar para desacelerar, com dois dormitórios e vaga.','Piscina,Academia,Biblioteca,Playground,Pet place,Mini mercado','Com vaga','Rua Nova Itarana, 11'),
('vision','Vision Penha','Penha','leste',[2],'47','Pronto para morar',None,'Dois dormitórios, suíte e vaga para o seu próximo capítulo.','Piscina,Coworking,Espaço yoga,Academia,Brinquedoteca,Espaço delivery','Suíte e vaga','Av. Amador Bueno de Veiga, 1127'),
('mob-barra','MOB Barra Funda','Barra Funda','oeste',[1,2],'25 a 40','Em obras','Mar/2029','Plantas de 1 e 2 dormitórios e uma nova forma de viver a Barra Funda.','Piscina,Lavanderia,Academia,Quadra de areia,Brinquedoteca,Pet place','1 e 2 dormitórios','Rua dos Americanos, 465'),
('iconico','Icônico Jaraguá','Jaraguá','norte',[2],'40 a 41','Em obras','Set/2028','Dois dormitórios e espaços para compartilhar bons momentos.','Piscina,Coworking,Academia,Espaço gourmet,Playground,Mini market','2 dormitórios','Rua Camocim de São Félix, 44'),
('line-parada','Line Parada Inglesa','Tucuruvi','norte',[1,2],'31 a 40','Em obras','Ago/2028','Seu lugar na Zona Norte, com plantas de 1 e 2 dormitórios.','Coworking,Lavanderia,Academia,Espaço yoga,Pet care,Brinquedoteca','1 e 2 dormitórios','Rua do Tramway, 103'),
('villagio','Villagio dos Eucaliptos','Medeiros','jundiai',[2],'50','Em obras','Ago/2028','Uma nova história em Jundiaí, com lazer e espaços ao ar livre.','Piscina,Quadra,Academia,Playground,Pomar e horta,Pet place','Em Jundiaí','Rua Primo Porcari, esquina com Rua Alfredo Abaid')]
regions={'sul':'Zona Sul','leste':'Zona Leste','oeste':'Zona Oeste','norte':'Zona Norte','jundiai':'Jundiaí'}
res=[]
for i,(id,name,hood,region,beds,area,status,delivery,desc,amenities,highlight,address) in enumerate(raw):
 link=links[i]['links']
 if i in [0,1]:link.pop('map',None)
 res.append(dict(id=id,name=name,neighborhood=hood,region=region,regionLabel=regions[region],city='Jundiaí' if region=='jundiai' else 'São Paulo',beds=beds,area=area,status=status,delivery=delivery,description=desc,amenities=amenities.split(','),highlight=highlight,address=address,links=link,image=f'assets/{id}.webp',facade=f'assets/{id}-fachada.webp'))
Path('dist/properties.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
