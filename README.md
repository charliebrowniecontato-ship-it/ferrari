# Ferrari Assessoria Imobiliária

Site institucional e catálogo imobiliário estático. Código sem dependências de terceiros em execução.

## Conteúdo

- `dist/index.html`: página principal, seções institucionais e diálogos.
- `dist/styles.css`: identidade visual e layouts responsivos.
- `dist/app.js`: filtros, favoritos locais, comparação, destaques e busca guiada.
- `dist/properties.json`: cadastro de 14 empreendimentos e links oficiais fornecidos.
- `dist/assets/`: logos e imagens extraídas dos arquivos de referência fornecidos pelo usuário.

## Fontes

Portfólio Ferrari EMCCAMP, edição setembro/2026, e captura do site EMCCAMP fornecida em 29/10/2026. Os status de Vision Penha (pronto para morar) e MOB Barra Funda (em obras) seguem a captura institucional, mais recente. A revisão de 30/10/2026 usa os books fornecidos no pacote da Equipe Ferrari para endereços, metragens e diferenciais; inclui tipologias especiais e gardens quando indicados. As fases e entregas sem nova documentação permanecem sujeitas a confirmação; possibilidades e disponibilidade devem ser validadas por unidade. Não foram criados preços, depoimentos ou credenciais profissionais.

## Operação

WhatsApp comercial: +55 11 93236-2552. Instagram: @ferraricorretagem.
Os contatos são iniciados pelo visitante em links externos, sem backend de coleta. O formulário de preparação monta uma mensagem no navegador, revisada pelo visitante antes de abrir o WhatsApp; não persiste respostas nem avalia crédito. Favoritos permanecem apenas no navegador do visitante. A busca guiada filtra o catálogo; não realiza análise ou simulação de crédito.

## Verificação

Sintaxe JavaScript; verificação dos arquivos e referências locais; catálogo, filtros combinados, detalhe, links de WhatsApp, favoritos, comparação e busca guiada verificados em navegador. Layout responsivo validado em viewport de 390 px em iframe, incluindo menu, filtros e ficha. Os destinos externos de Drive/tour não foram autenticados ou auditados.

## Refinamento de outubro/2026

A tarja Legacy foi reproduzida a partir do site Circuito Poty fornecido, com link para https://www.legacygrowthpartner.com.br/ e efeito dourado ao passar o mouse. A identidade e o visual principal Ferrari foram preservados.

O catálogo possui agora HTML pré-renderizado, páginas próprias em `/imoveis/<id>/`, links rastreáveis, títulos e descrições únicos, URLs canônicas, Open Graph/Twitter com imagens JPEG, JSON-LD, sitemap de 18 URLs e documentação textual em `/llms.txt`, `/llm.txt` e `/llms-full.txt`. O sitemap facilita a descoberta das páginas; a indexação depende dos mecanismos de busca.

Menu por regiões, busca por bairro/nome sem distinção de acentos, filtros removíveis, parâmetros na URL, navegação de teclado, compartilhamento de imóvel, melhora de contraste, alvos de toque, animações de entrada e respeito à redução de movimento completam o refinamento. Não foram adicionados rastreadores ou integrações de analytics sem identificação de conta.

Para regenerar os arquivos após alterar imagens ou catálogo, execute `python build_media.py` e depois `python build_site.py` (Python com Pillow e fontes DejaVu Sans). Ao editar apenas `src/home.html`, execute `python build_site.py`. A implementação estática permanece em `dist/`. Para verificar os metadados, links locais e sitemap, execute `python check_site.py`; para sintaxe, `node --check dist/app.js`, `node --check dist/site-ui.js` e `node --check dist/property-page.js`.


## Publicação na Vercel

Domínio canônico de produção: https://ferrariassessoria.com.

O projeto é estático e não exige banco, chaves ou variáveis de ambiente. `vercel.json` usa `dist` como saída, preserva URLs com barra final e não executa instalação ou build remoto. Execute `python build_site.py` para atualizar o conteúdo antes de enviar. O domínio `www.ferrariassessoria.com` deve redirecionar para `ferrariassessoria.com`.

Projeto Vercel: `ferrari-assessoria` (`prj_La1iEQf8J6Mna18ZbTSpc4MSc6h7`), equipe `charliebrowniecontato-7772`. Publicação pública: https://ferrari-assessoria.vercel.app.

O domínio principal e o redirecionamento de `www` já estão vinculados ao projeto. Em 29/10/2026, o domínio principal passou a apontar para `216.198.79.1` e `www` para `6deef47b8bde0dbd.vercel-dns-017.com`, ambos validados pela Vercel. O domínio principal foi aberto em navegador, sem tela de autenticação. Não altere registros de e-mail.

O repositório deve conter o código-fonte, os scripts de geração e `dist/`, que é a saída publicada. Após editar, regenere e valide os arquivos antes de fazer commit. O repositório https://github.com/charliebrowniecontato-ship-it/ferrari está conectado à Vercel. Commits na branch `main` acionam publicações de produção automaticamente.

## Imagens e movimento

Os originais oficiais disponíveis em `media-source/` geram versões WebP de 480 até 2000 px, conforme a resolução real, sem ampliar artificialmente as fotografias. Os demais imóveis preservam a resolução disponível no material fornecido. `srcset` e `sizes` escolhem a imagem por espaço e densidade da tela; a foto principal recebe preload responsivo e as imagens abaixo da dobra usam carregamento adiado. A origem dos cinco novos originais está em `media-source/sources.json`.

As capas de compartilhamento são JPEG de 1200 × 630, com marca Ferrari, título e informações próprias de cada imóvel. A home usa `/assets/og-ferrari-v2.jpg`. Os títulos entram por linha, com sequência suave inspirada na referência EMCCAMP, usando a API nativa do navegador. O conteúdo permanece visível sem JavaScript e as animações são canceladas ao ativar redução de movimento. Não há vídeo automático nem biblioteca de animação externa.


## Reunião de 29/10 — aplicação no site em 30/10/2026

- Catálogo de 14 empreendimentos: View Parque Ecológico e Nostro Mooca incluídos a partir dos respectivos books; Vision Penha já existia. A transcrição usa “Viu”, e a identificação como View é apoiada pelo material recebido, sem transformar isso em confirmação verbal.
- `catalog-source.json` é a fonte editável. `python build_data.py`, `python build_media.py`, `python build_site.py` regeneram o catálogo, as mídias e todas as páginas. `build_site.py` chama `build_extras.py` para atendimento e materiais.
- `/atendimento/`: três passos para preferências, momento e resumo. Renda e entrada são opcionais, não bloqueiam ninguém e não são usadas para classificação ou decisão de crédito. O visitante pode ir direto ao WhatsApp, sem preencher o roteiro. Nada é enviado automaticamente, salvo em servidor ou armazenado localmente pelo formulário. A URL só recebe identificador público de imóvel/região/dormitórios.
- `/materiais/`: busca por bairro/empreendimento e filtro por região, apresentações/tours existentes, ficha compartilhável e tabelas de referência identificadas como out/2026 e solicitação de tabela vigente. A pasta de Altus continha referência de agosto e não é apresentada como tabela vigente. Os books externos abriram sem redirecionamento para login no teste HTTP de 30/10; a permanência do acesso depende do proprietário dos arquivos.
- Fotos da galeria foram extraídas do book correspondente. `media-source/audit-20261030.json` registra arquivo, SHA-256, xref e legenda. `import_materials.py /caminho/arquivo.zip` reproduz a extração exclusivamente para a edição revisada. As tabelas de vendas e o ZIP não são publicados. Não há preços, estoque ou condições de outubro apresentados como atuais.
- Nostro: a fase e a entrega não foram comprovadas no pacote, portanto aparecem como consulta ao atendimento. Books e tabelas podem ter faixas de área distintas porque não representam o mesmo conjunto de unidades; a faixa do book não constitui oferta de estoque.
- Fotos WebP responsivas, sem ampliar a resolução original, galerias com acesso à imagem ampliada, OG por imóvel 1200×630, títulos/canônicas/JSON-LD, sitemap de 18 páginas e textos LLM atualizados. Sem scripts externos ou bibliotecas de formulário.

## Dependências para próximas etapas comerciais

A reunião também propõe CRM/API, dashboard de aquisição, campanhas, eventual SDR e jornada individual por corretor. Nenhuma dessas integrações é apresentada como ativa. Para executá-las, faltam o acesso e identificação técnica do CRM, contas de mídia/analytics e definição de responsáveis, eventos e funil. Doni/Malu devem confirmar os destinos das quatro landing pages, a rotina de atualização dos materiais e a fase/entrega do Nostro e do View. Não foram inferidos IDs de analytics, chaves, permissões, taxas bancárias ou regras de crédito.

O arquivo mais recente com sufixo `(2).zip` não pôde ser aberto nesta sessão. A revisão foi feita com o pacote anterior disponível, recebido em 29/10/2026; novos materiais precisam ser conferidos após o reenvio.


## Central da equipe e cadastro corporativo — 30/10/2026

A central da Equipe Ferrari está em `/equipe/`, preservando o visual aprovado; `/materiais/` passa a redirecionar para ela. `team-materials.json` indexa os 13 ZIPs comerciais recebidos, com books em PDF e tabelas de referência datadas. As 13 plantas ilustrativas adicionais têm origem e página registradas em `media-source/plans-audit-20261030.json`. O View mantém os materiais já recebidos anteriormente; seu ZIP específico não estava no novo lote.

O cadastro corporativo `/parcerias/` possui quatro etapas, revisão, anexos e um endpoint servidor. **O envio está desativado até a configuração na conta Google de Ferrari.** Não houve envio de e-mail real nem coleta de documentos de clientes. As imagens de referência mostram um cadastro de corretores e não confirmam a lista documental das imobiliárias.

Veja `docs/CADASTRO-EQUIPE-FERRARI.md` para ativação, dados pendentes, operação mensal e comportamento de privacidade. A pasta Google Drive principal e o link do formulário de referência não foram fornecidos; os materiais desta publicação vêm dos ZIPs, sem sincronização automática com o Drive. A documentação de implantação fica fora da interface do cliente.
