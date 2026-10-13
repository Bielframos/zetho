# Zetho — instruções para agentes

Frontend do Zetho: biblioteca de jogos, avaliações, perfis e comunidade. Angular com componentes standalone, signals, Tailwind e SSR. O repositório chama-se Zetho; o diretório de build ainda é `dist/zerei`.

## Começar e verificar

Execute os comandos na raiz deste repositório. Use o Node de `.node-version` e a versão de pnpm de `package.json`; mantenha `pnpm-lock.yaml` como lockfile.

| Objetivo | Comando |
| --- | --- |
| Instalar dependências | `pnpm install --frozen-lockfile` |
| Preparar configuração pública | `pnpm configure` |
| Desenvolvimento | `pnpm start` |
| Testes de configuração | `pnpm test:tooling` |
| Testes Angular | `pnpm test:ci` |
| Teste focado, exemplo | `pnpm test:ci --include=src/app/core/dashboard/pages/dashboard/entry-comments-pages.store.spec.ts` |
| Build de produção e SSR | `pnpm build` |
| Segredos nos arquivos atuais | `pnpm secrets:check` (requer Gitleaks; aceita `GITLEAKS_BIN`) |

- Siga [README.md](README.md) para configurar uma instância própria. Crie `.env` a partir de `.env.example` apenas se ainda não existir; preserve a configuração local.
- Os testes Angular precisam de Chrome/Chromium; em Linux, use `CHROME_BIN=/usr/bin/chromium` se necessário.
- `start`, `build` e `test` geram `src/environments/environment.generated.ts`. Não edite nem versione esse arquivo. Para chamar `pnpm ng` diretamente, execute `pnpm configure` antes.
- Não há script `lint` neste pacote. Não invente comandos de validação nem acrescente ferramentas para satisfazer um comando inexistente.

## Onde alterar

- `src/app/core`: funcionalidades e serviços por domínio. Mantenha regras e estado próximos à funcionalidade responsável.
- `src/app/shared`: componentes e infraestrutura reutilizáveis; extraia para cá quando houver uso compartilhado real.
- `src/app/app.config.ts`, `app.config.browser.ts` e `app.config.server.ts`: fronteiras entre configuração comum, navegador e servidor.
- `src/environments` e `scripts/configure-environment.js`: configuração pública permitida no bundle.
- `src/styles.css` e `src/styles/color-tokens.css`: estilos compartilhados e tokens de aparência.

## Contratos e comportamento

- Preserve a separação entre componentes de apresentação, estado e acesso a dados. Para módulos grandes, extraia responsabilidades coesas; evite serviços genéricos que acumulem domínios.
- Escritas sociais passam pela API. Reaproveite os serviços existentes; não contorne autenticação/permissões com chamadas diretas ao Appwrite.
- Código executado em SSR não deve acessar `window`, `document` ou APIs do navegador sem a proteção já usada no projeto. Preserve o isolamento de dados entre requisições e sessões.
- Em consultas paginadas, preserve inserções e remoções durante carregamentos. Invalide respostas antigas ao trocar item, perfil ou sessão, inclusive no ciclo A → B → A; uma chave de entidade sozinha não basta.
- Ao mudar contratos da API, confira DTOs, consumidores e testes nos dois repositórios. Não presuma que ambos serão publicados simultaneamente.
- Mantenha a sanitização de notícias e as restrições de conteúdo incorporado. Firebase Analytics é opcional; o app deve funcionar sem suas credenciais.

## Interface

Antes de alterar HTML, estilos ou interação, leia [.github/UI_GUIDELINES.md](.github/UI_GUIDELINES.md). O guia preserva as convenções do shell, feed, jogos e componentes existentes.

- Reutilize componentes `ui-*`, classes de botão e tokens semânticos; preserve os modos claro, escuro e sistema.
- Verifique teclado, foco, estados de carregamento/erro/vazio e tamanhos mobile/desktop. Compare visualmente com as telas de referência do guia quando mudar a apresentação.
- Mantenha o texto da interface em português e evite expor detalhes internos ao usuário.

## Validação proporcional

- Para lógica ou correções de regressão, execute os testes afetados e adicione cobertura do comportamento quando necessário. Evite testes que só reproduzem a implementação.
- Antes de entregar alterações de código para merge, execute `pnpm test:tooling`, `pnpm test:ci` e `pnpm build`, como no CI. Testes com mocks não comprovam integração com Appwrite real.
- Para mudanças somente em Markdown, confira comandos, caminhos, links locais e `git diff --check`; não é necessário repetir o build.
- Informe o que foi validado e qualquer limitação real. Não apresente teste não executado como aprovado.

## Configuração, contribuição e manutenção

- Tudo que entra na configuração `PUBLIC_*` é visível aos visitantes. Nunca inclua chaves de servidor, `.env`, dados de usuários ou dumps em código, logs ou commits.
- O build da Vercel exige as quatro variáveis públicas descritas no README. Não remova essa validação nem restaure endpoints da instância oficial como fallback para forks.
- Siga [CONTRIBUTING.md](CONTRIBUTING.md) e [SECURITY.md](SECURITY.md). Preserve a licença [AGPL-3.0-only](LICENSE) e os avisos de terceiros.
- Não sobrescreva trabalho local ou de outros agentes. Mantenha alterações focadas e evite reformatação ampla.
- Atualize `CHANGELOG.md` para mudanças percebidas pelo usuário; registre novas entradas em `Unreleased`, salvo orientação explícita sobre a versão. Use `scripts/bump-version.js` para sincronizar versões quando uma release for solicitada.
- Mantenha este arquivo sincronizado com scripts e arquitetura. Instruções específicas de uma área pertencem a um guia referenciado ou a um `AGENTS.md` mais próximo dela; não duplique regras em `CLAUDE.md`.
