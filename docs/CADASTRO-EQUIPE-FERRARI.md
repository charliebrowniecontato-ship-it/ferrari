# Cadastro de imobiliárias e Central da Equipe Ferrari

## O que já está implementado

- `/equipe/`: identidade Ferrari, pesquisa por empreendimento e região, livros/apresentações e tabelas mensais para download no próprio domínio, fichas e tours existentes. `/materiais/` redireciona permanentemente para a central.
- A biblioteca tem referência `2026-10`, sem apresentar os preços como uma oferta permanente. Os arquivos de tabela são cópias exatas dos PDFs recebidos. Os books possuem uma versão otimizada para leitura online, preservando as páginas, o texto e os links externos; os originais enviados ficam intactos nos ZIPs do usuário.
- `/parcerias/`: fluxo de imobiliária, responsável, documentação e revisão. O cadastro permanece identificado como “em preparação” enquanto a integração e a lista documental não estiverem configuradas.
- `/api/parcerias`: validação de campos, consentimento, origem, assinatura de arquivos, tamanho, comunicação autenticada com o serviço do Google e confirmação de recebimento.
- `integrations/google-apps-script/Code.gs`: pasta privada por cadastro, arquivos privados, protocolo, validação documental, controle de tentativas, estado durável de recebimento e envio de aviso via MailApp. O e-mail inclui o resumo, os documentos anexados e um link para a pasta privada. Nenhuma mensagem é enviada pela conta conectada ao ChatGPT.

## Dados que ainda precisam chegar de Ferrari/Luiza

1. E-mail exato que receberá os novos cadastros.
2. Link do formulário atual (as capturas mostram apenas o cadastro de corretores).
3. Lista definitiva dos documentos e campos exigidos das **imobiliárias**, com indicação de obrigatório/opcional. A lista exibida antes de ativar é preliminar; não foi tratada como uma exigência confirmada.
4. Link da pasta principal de materiais da Equipe Ferrari e quem mantém as tabelas. O acervo publicado nesta edição vem dos ZIPs recebidos, não de uma sincronização automática com o Drive.
5. Conta Google do responsável que será proprietária dos documentos dos cadastros. O e-mail visível na captura do formulário não foi presumido como destinatário.

## Ativação na conta Google de Ferrari

1. Criar uma pasta **restrita** no Drive para os cadastros, separada da pasta comercial pública. Autorizar apenas Ferrari e os responsáveis definidos por ele.
2. Criar um projeto em Apps Script nessa conta e inserir `Code.gs` e o manifesto `appsscript.json` desta pasta.
3. Em Propriedades do script, definir `ROOT_FOLDER_ID`, `NOTIFY_EMAIL`, `INTAKE_SECRET` (segredo aleatório com no mínimo 32 caracteres), `DOCUMENTS_JSON` e `DOCUMENTS_CONFIRMED=true` somente após Ferrari confirmar a lista.
4. `DOCUMENTS_JSON` aceita IDs `cnpj`, `contrato`, `creci` e `complemento`, cada um com `label` e `required`. Exemplo de formato, sem representar aprovação da lista:

```json
[{"id":"cnpj","label":"Cartão CNPJ","required":true},{"id":"contrato","label":"Contrato social ou equivalente","required":true},{"id":"creci","label":"CRECI PJ","required":true},{"id":"complemento","label":"Outros documentos solicitados","required":false}]
```

5. Publicar como aplicativo Web executado pelo proprietário. O endereço pode ser acessível publicamente, mas toda operação exige HMAC com o segredo privado do servidor. Autorizar Drive e envio de e-mail na conta proprietária. O código não solicita leitura da caixa Gmail.
6. Configurar as variáveis **Secret** de produção na Vercel: `FERRARI_REGISTRATION_URL` (URL `/exec` da implantação) e `FERRARI_REGISTRATION_SECRET` (o mesmo segredo do script). Não inserir segredo em HTML, JS público, Git, chat, query string ou arquivos de exemplo. Não reutilizar esse segredo em preview: configurar uma integração de teste separada se houver ambiente de homologação.
7. Republicar o site para aplicar as variáveis. O status só ativa o formulário se a pasta for privada e a lista documental estiver confirmada.
8. Com autorização para um teste de envio ao destinatário confirmado, completar um cadastro fictício com arquivos de teste. Conferir protocolo, pasta privada, o aviso recebido e a resposta de “responder” para o contato informado. Excluir os dados fictícios pelo processo normal do Drive. Não usar documentos reais de terceiros como teste.

## Comportamentos importantes

- Até 2 MB por arquivo; PDF/JPG/PNG. Cada arquivo vai em uma requisição separada para respeitar o limite de payload da hospedagem. Não foi copiado o limite genérico de 10 GB visto no formulário de referência.
- As respostas e os anexos não são salvos em armazenamento local do navegador. Enquanto preenche, os arquivos ficam no navegador; ao enviar, vão para o serviço privado configurado.
- Só há mensagem de conclusão após confirmação do servidor. O status de envio do aviso por e-mail é tratado separadamente. Repetir uma finalização já confirmada não reenvia um aviso normal; falhas de rede não devem ser consideradas aprovação de parceria.
- Uploads iniciados e não finalizados ficam como incompletos e não geram aviso de cadastro concluído. Definir com a equipe o prazo e o procedimento de limpeza desses casos e de retenção dos cadastros completos.
- O link da pasta no aviso obedece às permissões do Drive; enviar um e-mail não torna a pasta pública nem concede acesso ao destinatário automaticamente. A pasta proprietária e o destinatário devem pertencer à operação Ferrari.
- Não há cobrança automática, aceitação de contrato ou aprovação de imobiliárias neste fluxo.

## Atualização mensal dos materiais

`team-materials.json` é o índice da edição. A conferência de 30/10/2026 inclui o ZIP consolidado mais recente, com 14 books e 14 tabelas, incluindo View. O importador também aceita o caminho direto de um ZIP consolidado. O importador `import_team_library.py` recebe `--reference YYYY-MM` e `--received YYYY-MM-DD` explicitamente. Exemplo desta edição: `python import_team_library.py /caminho/dos/zips --reference 2026-10 --received 2026-10-30`. Para um mês novo, importar os arquivos da edição seguinte com a nova referência, conferir documentos e atualizar o índice, mantendo as versões antigas com URLs datadas. Só mudar o rótulo do mês não atualiza nenhum preço.

Para uma sincronização automática a partir do Drive será necessário identificar a pasta principal, mapear cada empreendimento, decidir as regras de publicação comercial e configurar acesso de leitura ao servidor. Não prometer que trocar um arquivo no Drive já atualiza esta versão do portal: isso ainda não está conectado.

## Verificação executável

```bash
node --test tests/partnership.test.mjs
python build_site.py
python check_site.py
```

Os testes usam um serviço simulado e não enviam e-mail real. O código de Apps Script exige um teste real após a ativação, pois depende das permissões e quotas da conta Google de Ferrari.
