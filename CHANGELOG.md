# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Seguindo o formato "Keep a Changelog" e o versionamento semântico.

## [Unreleased]

## [1.16.0] - 2026-07-12

### Changed

- A biblioteca de jogos no perfil de um usuário agora usa rolagem infinita: os itens são carregados automaticamente em lotes maiores conforme você rola a página, sem precisar clicar em "Carregar mais".

## [1.15.0] - 2026-07-12

### Added

- No celular, o saldo de Z-Coins agora fica sempre visível em um botão flutuante no canto inferior direito.
- O acesso à área de administração virou um botão flutuante dedicado no celular, deixando a barra de navegação inferior mais limpa.

### Changed

- No celular, modais e caixas de diálogo agora ocupam a tela inteira, com o conteúdo alinhado à esquerda e os botões de ação no canto inferior direito.

### Fixed

- Corrigido o comportamento de definir o status de um jogo: tocar novamente em um status já ativo agora o desativa, como esperado.

## [1.14.0] - 2026-07-08

### Added

- Adicionada ação para ativar e desativar notificações por e-mail nas páginas de jogos.
- O feed do dashboard agora exibe o comentário pai direto em respostas, dando mais contexto à conversa.
- Comentários do feed agora podem receber upvote e downvote diretamente pelo dashboard.

### Fixed

- Corrigido o estado visual dos votos no feed para indicar a seleção de forma sutil.
- Corrigida a sincronização de votos para evitar ações concorrentes no mesmo comentário.

## [1.13.0] - 2026-06-25

### Added

- Nova aba "Salvas" na seção de Listas do seu perfil, permitindo visualizar de forma rápida todas as listas de outros usuários que você salvou.
- Adicionada segurança transacional na compra de temas: caso a transação falhe, os Z-Coins debitados são reembolsados automaticamente.

### Changed

- Melhorias na reatividade e velocidade ao carregar os temas adquiridos e ativos na página de Conta.
- Ajustes de interface na Loja de Temas.


## [1.11.0] - 2026-06-23

### Changed

- Interface renovada e modernizada com foco em melhor visualização e acessibilidade para visitantes.
- Redesign completo das páginas de login e registro, com visual atrativo e focado nos benefícios do uso do aplicativo.
- Suporte expandido para acesso público: visitantes não autenticados agora podem explorar o app e navegar pela plataforma antes de criar uma conta.
- Melhorias na página de busca, perfil, tela inicial e layout geral para uma experiência fluida e aprimorada.

## [1.10.0] - 2026-06-15

### Added

- Nova seção de Destaques da Comunidade no dashboard mesclando os comentários e avaliações recentes.
- Tempo relativo nas publicações (ex: "5 minutos atrás").
- Ajuste e correção de bug onde a foto e nome do autor não apareciam em comentários recentes.

## [1.9.1] - 2026-06-13

### Added

- Adicionado estado de carregamento sutil na nota do jogo no card de média geral e melhorias na seção de reviews.

## [1.9.0] - 2026-05-22

### Added

- Introduzidos os sorteios no Zetho para novas formas de participação e premiação.
- Adicionado o sistema de convites para facilitar a entrada de novos usuários no app.

## [1.8.0] - 2026-05-22

### Added

- Introduzidos os Z-Coins: uma nova moeda virtual do Zetho para recompensas e conquistas.
- Exibição do saldo de Z-Coins no perfil do usuário.
- Sistema inicial de ganhos de Z-Coins ao completar ações dentro do app.
- Adicionado placar semanal de líderes para destacar os usuários mais ativos.

## [1.7.1] - 2026-05-06

### Changed

- Novo padrão de cores aplicado em toda a interface do app para reforçar a identidade visual do Zetho.

### Added

- Chegada do Gazetho: novo destaque visual e anúncio oficial no app.

## [1.7.0] - 2026-04-25

### Added

- Nova seção `Mídias` nas páginas internas dos jogos.
- Estilização da página individual dos jogos com uma screenshot ou arte conceitual como background.
- Galeria interativa na página interna dos jogos.

## [1.6.0] - 2026-04-24

### Added

- Novo recurso de `hypes` para marcar os jogos que você mais aguarda.
- Nova seção no dashboard para descobrir os maiores lançamentos.
- Estatísticas exclusivas destacando os jogos mais aguardados antes do lançamento.

## [1.5.0] - 2026-03-19

### Added

- Atalho para buscar jogos assim que você clica no campo de pesquisa.

### Changed

- A busca de jogos agora aceita filtros combinados de gênero e ano.
- Os gêneros nas páginas dos jogos agora são botões clicáveis que já aplicam filtros de busca.
- Navegação mais rápida com otimização no carregamento das informações.

## [1.4.2] - 2026-03-13

### Changed

- Visual das telas internas redesenhado para facilitar o uso no celular.

## [1.4.1] - 2026-03-09

### Changed

- Textos e fontes ajustados para melhorar a leitura em telas menores.

## [1.4.0] - 2026-03-09

### Added

- O aplicativo do Zetho agora pode ser instalado direto no seu celular ou computador.
- Nova tela de aviso amigável caso você fique sem conexão com a internet.

### Changed

- Exibição mais limpa na página de conexões no celular, mostrando um perfil por linha.

## [1.3.2] - 2026-03-08

### Fixed

- Correção de um problema que impedia o carregamento de listas específicas de jogos.

## [1.3.1] - 2026-03-07

### Fixed

- Limpeza correta das suas informações no aplicativo após sair da conta.
- Ocultados os botões de seguir para visitantes que não estão logados.

## [1.3.0] - 2026-03-07

### Added

- Busca expandida: agora você pode procurar por amigos e outros perfis, além de jogos.
- Atalho rápido para acessar o perfil de quem comentou no `Game Lobby`.
- Sistema de conexões: você pode seguir e ser seguido por outros usuários.
- Nova página dedicada para visualizar quem você segue e seus seguidores.

### Changed

- A paginação da busca agora não se perde ao alternar entre resultados de jogos e perfis.
- Os comentários no `Game Lobby` agora mostram a foto de perfil do usuário.
- O carregamento inicial das informações do seu perfil ficou mais rápido.

## [1.2.1] - 2026-03-01

### Added

- Novas etiquetas indicando o status do jogo direto nas capas (ex: Lançado, Em Breve).

### Changed

- Melhorias visuais e mais facilidade ao usar o botão "Adicionar à lista".

## [1.2.0] - 2026-02-23

### Added

- Compartilhamento liberado: páginas de jogos e perfis agora são públicas e podem ser vistas por quem não tem conta.
- Melhorias na forma como o Zetho aparece no Google e na exibição de links compartilhados em redes sociais.

### Changed

- Textos mais claros e atrativos convidando visitantes a criarem uma conta para acompanhar seus jogos.

### Fixed

- Correção de um erro que exigia login indevidamente ao tentar acessar algumas páginas públicas.
- Ações como comentar e votar agora avisam corretamente quando é necessário estar logado, sem quebrar a tela.

### Security

- Proteção extra garantindo que apenas usuários logados possam curtir, adicionar a listas ou comentar.

## [1.1.0] - 2026-02-20

### Added

- Adicione uma foto no seu perfil.
- Opção para atualizar seu endereço de e-mail.
- Opção para excluir sua conta.
- Nova página de aviso amigável caso um jogo ou perfil não seja encontrado.
- Adicione uma biografia no seu perfil.
- Conecte suas contas da Xbox, Steam e PSN no seu perfil.
- Novas notificações visuais (pop-ups) para confirmar suas ações no site.

### Changed

- Visual renovado na página inicial.
- Visual renovado e mais limpo na página de buscas.

## [1.0.2] - 2026-02-19

### Added

- Sistema de criação de conta e login 100% integrado à API do Zetho.

### Changed

- Melhorias internas na segurança e salvamento da sessão do usuário.

## [1.0.0] - 2026-02-06

### Added

- Lançamento inicial do Zetho! 🎉
- Crie sua conta com segurança.
- Crie e personalize seu perfil de jogador.
- Explore, busque e descubra novos jogos.
- Crie listas de jogos, edite e compartilhe.
- Participe da comunidade comentando no Game Lobby.
- Painel do usuário completo para acompanhar suas estatísticas.
