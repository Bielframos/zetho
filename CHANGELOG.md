# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Seguindo o formato "Keep a Changelog" e o versionamento semântico.

## [1.3.0] - Não lançado

### Added

- Busca por perfis de usuários na página de busca, com alternância entre `Jogos` e `Perfis`.

### Changed

- Paginação da busca agora é isolada por tipo de resultado (`jogos` e `perfis`), preservando o estado ao trocar de aba.

## [1.2.1] - 2026-03-01

### Added

- Tag de status na capa de jogos dentro da página de buscas ou games similares dentro de um jogo.

### Changed

- Estilo da exiblição e interação do seletor de listas na caixa de dialogo `Adicionar à lista` dentro da página de um jogo.

## [1.2.0] - 2026-02-23

### Added

- Acesso público para páginas de jogos individuais e perfis de usuários (todas as subrotas de perfil agora acessíveis sem autenticação)
- Serviço de SEO centralizado (`SeoService`) gerenciando title, meta tags, canonical, robots e JSON-LD
- Meta tags dinâmicas por página: OpenGraph, Twitter Card e canonical único para cada jogo e perfil
- JSON-LD estruturado para entidades `VideoGame` (páginas de jogo) e `ProfilePage`/`Person` (perfis)
- Arquivo `robots.txt` com referência ao sitemap dinâmico backend e regras de crawl
- Melhoria de base SEO no `index.html` com suporte a múltiplas redes sociais

### Changed

- Rota de perfil público não requer mais autenticação (`userGuard` removido de `profile.routes.ts`)
- Componente `UiGameActions` agora se renderiza condicionalmente apenas para usuários autenticados
- Copy do CTA de login na página de jogo melhorado: "Comece a acompanhar seus jogos" com descrição de benefícios diretos

### Fixed

- Bug onde usuários anônimos eram redirecionados ao tentar acessar páginas de jogo por dependência obrigatória em `GameActions`
- Acesso a métodos de comentário e voto (`addComment`, `vote`) agora valida autenticação sem tentar redirect indevido
- Game controller `handleEntry` agora retorna silenciosamente se usuário não autenticado em lugar de tentar usar perfil nulo

### Security

- Ações autenticadas (like, adicionar à lista, comentar, votar) agora possuem guarda explícita contra usuário não autenticado

## [1.1.0] - 2026-02-20

### Added

- Gerenciamento da foto do perfil
- Atualização do e-mail do usuário
- Exclusão da conta do usuário
- Página `/404` e tratativa para perfis e jogos não econtrados
- Bio no perfil do usuário
- Perfil social do usuário (Xbox, Steam e Psn)
- Estado vazio no perfil do usuário
- Componente toaster para exibir notificações

### Changed

- Interface da Landing Page
- Interface da página de buscas

## [1.0.2] - 2026-02-19

### Added

- Implementa gerenciamento local do JWT do usuário
- Integra fluxo de registro com a API oficial do Zetho

### Changed

- Renomeia o `UserStore` para `AuthStore`

## [1.0.0] - 2026-02-06

### Added

- Lançamento inicial do Zetho.
- Autenticação e autorização integradas.
- Perfis de usuário com gerenciamento e visualização.
- Integração com IGDB via funções serverless.
- Gestão de jogos: busca, páginas de jogo, e cache local.
- Listas de jogos (criar, editar, compartilhar).
- Sistema de comentários e moderação básica.
- Serviços e APIs internas: `zEntries`, `zStats`, `userProfiles`.
- Painel de usuário / dashboard e páginas públicas.

### Changed

- (Nenhuma alteração; versão inicial.)

### Fixed

- (Nenhum bug corrigido; versão inicial.)

### Security

- (Nenhuma correção de segurança nesta versão inicial.)

### Notes

- Esta é a versão inicial. Não há mudanças compatíveis anteriores.
- Para instalar/rodar localmente, veja o `README.md` e os `package.json` dos serviços.
- Dependências principais: Node.js, pnpm, e Appwrite configurado conforme `appwrite.config.json`.

### Contributors

- Equipe Zetho
