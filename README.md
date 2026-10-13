# Zetho

Registre sua vida nos jogos e compartilhe com sua comunidade. O Zetho reúne biblioteca pessoal, avaliações, listas, perfis, comparação entre jogadores e sessões de jogatina.

*Zetho is a gaming journal and community app. Contributions in Portuguese and English are welcome.*

Este repositório contém o frontend Angular com renderização no servidor. A [API NestJS](https://github.com/Bielframos/zetho-api) contém as regras de negócio e integrações. O nome histórico do repositório e do diretório de build é `zerei`.

## Desenvolvimento

Requisitos: Node.js 22.12 ou superior (versão de referência em `.node-version`), pnpm 11.1.2, API do Zetho e um projeto Appwrite próprio. Para instalar pnpm: `npm install --global pnpm@11.1.2`.

```bash
git clone https://github.com/Bielframos/zerei.git
cd zerei
pnpm install --frozen-lockfile
cp .env.example .env
```

Configure `PUBLIC_APPWRITE_ENDPOINT` e `PUBLIC_APPWRITE_PROJECT` para o mesmo projeto usado pela API. Adicione `localhost` às plataformas Web permitidas no console Appwrite. Siga primeiro a [instalação da API](https://github.com/Bielframos/zetho-api#começar) para criar o schema e os dados fictícios.

```bash
pnpm start
```

Abra http://localhost:4200. Os comandos `start`, `build` e `test` geram `src/environments/environment.generated.ts` a partir de `.env`, `.env.local` e variáveis do processo (nessa ordem de prioridade). O arquivo gerado não é versionado. Sem configuração, os endpoints apontam para localhost, nunca para o serviço oficial.

**Tudo que começa com `PUBLIC_` entra no navegador.** Nunca use chaves de servidor nessa configuração. Firebase Analytics é opcional e não é inicializado sem API key, project ID e app ID. Não é necessário configurar Firebase para usar o núcleo do app.

## Verificar alterações

```bash
pnpm test:tooling
pnpm test:ci
pnpm build
```

Os testes Angular precisam de Chrome/Chromium. Em Linux, se necessário: `CHROME_BIN=/usr/bin/chromium pnpm test:ci`. Os testes usam mocks; uma instalação Appwrite real é necessária para validar o fluxo completo de cadastro, biblioteca e avaliações.

Para usar `pnpm ng` diretamente, execute `pnpm configure` antes. `pnpm watch` regenera a configuração ao iniciar; reinicie após mudar `.env`.

## Estrutura

- `src/app/core`: funcionalidades organizadas por domínio.
- `src/app/shared`: componentes, estado e acesso compartilhado à infraestrutura.
- `src/app/app.config.ts`: configuração comum ao browser e SSR.
- `src/app/app.config.browser.ts`: inicialização específica do navegador.
- `src/environments`: configuração pública gerada durante desenvolvimento e build.
- `AGENTS.md`: convenções visuais e de interação existentes.

## Hospedar uma instância

Defina as URLs públicas e o projeto Appwrite antes de `pnpm build`. O build padrão não herda a configuração da instalação oficial. Sirva com `node dist/zerei/server/server.mjs` e configure o domínio permitido em `angular.json` (`security.allowedHosts`). Use HTTPS e registre o domínio como plataforma Web no Appwrite.

O build da Vercel exige `PUBLIC_APP_URL`, `PUBLIC_API_URL`, `PUBLIC_APPWRITE_ENDPOINT` e `PUBLIC_APPWRITE_PROJECT`; se faltar alguma delas, ele falha antes de publicar uma configuração local. Firebase continua opcional.

O arquivo `vercel.json` descreve a instalação oficial: para um fork, adapte os destinos de sitemap ao domínio da sua API antes de usá-lo. Firebase, identidade visual, textos institucionais e links externos também devem refletir sua instância. O serviço hospedado e os dados dos seus usuários não fazem parte deste repositório.

## Contribuir

Leia [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md). As regras de proteção da branch estão em [.github/default-branch.ruleset.json](.github/default-branch.ruleset.json) e precisam ser ativadas no GitHub.

## Changelog

Antes de preparar uma versão, registre em `CHANGELOG.md` apenas mudanças percebidas por quem usa o Zetho. Adicione entradas curtas em `Unreleased`, nas categorias `Added`, `Changed`, `Fixed` ou `Removed`, descrevendo o efeito para o usuário.

## Licença e conteúdo

O código do Zetho é distribuído sob a **GNU Affero General Public License, versão 3 exclusivamente** (`AGPL-3.0-only`). Consulte o texto completo em [LICENSE](LICENSE). Dependências mantêm suas próprias licenças. Imagens, marcas e dados de jogos de terceiros não recebem uma nova licença por aparecerem no aplicativo; consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
