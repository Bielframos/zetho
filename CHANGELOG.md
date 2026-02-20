# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Seguindo o formato "Keep a Changelog" e o versionamento semântico.

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

## [1.0.1] - 2026-02-17

### Added

- Nova visualização da página idividual de uma lista

## [1.0.2] - 2026-02-19

### Added

- Implementa gerenciamento local do JWT do usuário
- Integra fluxo de registro com a API oficial do Zetho

### Changed

- Renomeia o `UserStore` para `AuthStore`

## [1.1.0] - 2026-02-20

### Added

- Atualização da foto de perfil do usuário

### Contributors

- Equipe Zetho
