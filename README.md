# Ferrari Assessoria Imobiliária

Site institucional e catálogo imobiliário estático. Código sem dependências de terceiros em execução.

## Conteúdo

- `dist/index.html`: página principal, seções institucionais e diálogos.
- `dist/styles.css`: identidade visual e layouts responsivos.
- `dist/app.js`: filtros, favoritos locais, comparação, destaques e busca guiada.
- `dist/properties.json`: cadastro de 12 empreendimentos e links oficiais fornecidos.
- `dist/assets/`: logos e imagens extraídas dos arquivos de referência fornecidos pelo usuário.

## Fontes

Portfólio Ferrari EMCCAMP, edição setembro/2026, e captura do site EMCCAMP fornecida em 29/10/2026. Os status de Vision Penha (pronto para morar) e MOB Barra Funda (em obras) seguem a captura institucional, mais recente. Endereços divergentes de Atlas Sacomã e Line Praça da Árvore foram omitidos das fichas e devem ser confirmados pelo atendimento. Metragens apresentadas seguem o portfólio Ferrari; possibilidades e disponibilidade devem ser validadas por unidade. Não foram criados preços, depoimentos ou credenciais profissionais.

## Operação

WhatsApp comercial: +55 11 93236-2552. Instagram: @ferraricorretagem.
Os contatos são iniciados pelo visitante em links externos, sem formulário ou backend de coleta. Favoritos permanecem apenas no navegador do visitante. A busca guiada filtra o catálogo; não realiza análise ou simulação de crédito.

## Verificação

Sintaxe JavaScript; verificação dos arquivos e referências locais; catálogo, filtros combinados, detalhe, links de WhatsApp, favoritos, comparação e busca guiada verificados em navegador. Layout responsivo validado em viewport de 390 px em iframe, incluindo menu, filtros e ficha. Os destinos externos de Drive/tour não foram autenticados ou auditados.

## Refinamento de outubro/2026

A tarja Legacy foi reproduzida a partir do site Circuito Poty fornecido, com link para https://www.legacygrowthpartner.com.br/ e efeito dourado ao passar o mouse. A identidade e o visual principal Ferrari foram preservados.

O catálogo possui agora HTML pré-renderizado, páginas próprias em `/imoveis/<id>/`, links rastreáveis, títulos e descrições únicos, URLs canônicas, Open Graph/Twitter com imagens JPEG, JSON-LD, sitemap de 14 URLs e documentação textual em `/llms.txt`, `/llm.txt` e `/llms-full.txt`. O sitemap facilita a descoberta das páginas; a indexação depende dos mecanismos de busca.

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
