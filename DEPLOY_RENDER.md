# DELTA Studio — Publicação no Render

Este projeto está pronto para criar um **Static Site gratuito** na conta Render.

## Publicação de um clique
Abra:
https://render.com/deploy?repo=https://github.com/idelta775-hash/delta-produtos

Entre na conta Render, confira o serviço **delta-studio**, o tipo **Static Site** e o Blueprint `render.yaml`. A publicação requer a aprovação do titular da conta no painel.

## Publicação manual
1. Render → **New → Blueprint** ou **New → Static Site**.
2. Conecte o GitHub `idelta775-hash`, autorizando acesso a `delta-produtos`.
3. No Blueprint: branch `main`, caminho `render.yaml`, revisão do plano e aplicar.
4. Em Static Site manual: repositório `idelta775-hash/delta-produtos`, branch `main`, Build Command `sh render-build.sh`, Publish Directory `render-dist`.
5. Aguarde status **Live** e obtenha a URL exata `*.onrender.com`. Não presumir nome de domínio antes de confirmar.
6. Confira a página inicial, calculadora gratuita, amostra e ambos os produtos. Ajuste o monitor do Master à URL real.
7. O Blueprint define `autoDeployTrigger: off` para evitar implantações inesperadas; depois de verificar a titularidade e o serviço, pode habilitar atualização automática nas configurações.

## O que vai ao Render
O comando de build seleciona somente 7 HTML, 2 arquivos CSS/JS, robots.txt, sitemap.xml e imagens comerciais públicas. A URL canônica e sitemap são adaptados para a URL real do serviço Render durante o build.

**Nenhuma fonte privada, chave, carteira ou ZIP pago é enviado.** A loja só recebe checkout depois que houver conta de vendedor verificada e um link autêntico de pagamento. A configuração Render isoladamente não cria faturamento.

## Referências
- https://render.com/docs/deploy-to-render
- https://render.com/docs/blueprint-spec
- https://render.com/docs/static-sites
- https://render.com/docs/environment-variables
