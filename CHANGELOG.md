# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Seguindo o formato "Keep a Changelog" e o versionamento semântico.

## [Unreleased]

## [1.21.1] - 2026-08-18

### Changed

- Reviews da comunidade agora usam divisórias mais largas, deixando a separação entre publicações mais evidente.
- O destaque de comentários passa a usar uma cor neutra e um pulso lento, sem caixa azul ou bordas arredondadas.
- No dashboard, o botão de comentário abre somente o campo de resposta, enquanto o conteúdo principal revela as demais respostas da conversa sem repetir o que já está visível.
- O preview de listas públicas vazias agora ocupa toda a área reservada às capas e comunica o estado vazio com o padrão visual das listas do app.

### Fixed

- Responder a um comentário no dashboard deixa de recarregar a thread antes de exibir o campo de resposta.
- A contagem de respostas do comentário não é mais sobrescrita pela quantidade de itens carregados no contexto da conversa.

## [1.21.0] - 2026-08-18

### Added

- Novo feed público de críticas da comunidade em `/reviews`, com paginação infinita, estados de carregamento e recuperação de erros.
- Nova descoberta de listas públicas em `/listas`, exibindo autor, capas dos jogos adicionados e totais de curtidas e salvamentos.
- Nova página de entrada institucional em `/institucional`, reunindo as políticas, informações sobre o projeto e canais de contato.
- Comentários do feed agora podem ser expandidos e respondidos diretamente no card, preservando a conversa em contexto.
- Links para comentários específicos passam a abrir a thread correta na página do jogo, com destaque temporário para o comentário alvo.

### Changed

- A navegação desktop e mobile ganhou atalhos para Críticas, Listas e a área Institucional.
- Cards de comentários no feed deixam de exibir ações rápidas do jogo para priorizar as ações da própria conversa.
- A central de notificações agora leva diretamente ao comentário relacionado quando uma resposta é recebida.

### Fixed

- Threads abertas por link carregam o comentário alvo mesmo quando ele não está na primeira página de resultados.
- A paginação de comentários evita duplicatas depois do pré-carregamento de uma thread específica.

## [1.20.0] - 2026-08-13

### Added

- As páginas públicas — landing, jogo, notícias, perfil de jogador e placar semanal — agora são entregues já renderizadas pelo servidor, aparecendo completas para buscadores e em compartilhamentos.
- Novas páginas institucionais de Privacidade, Termos, Política Editorial, Sobre e Contato, acessíveis pelo rodapé.
- A página de cada jogo passa a exibir uma seção fixa de "Críticas da comunidade", com os textos mais votados sempre visíveis fora das abas.
- Dados estruturados enriquecidos na página de jogo, incluindo críticas, nota agregada e trilha de navegação.
- As matérias de notícias trazem aviso de autoria por assistente editorial de IA, com link para a Política Editorial e para a fonte original.

### Changed

- Páginas de jogo ainda sem crítica escrita deixam de ser indexadas pelos buscadores até receberem conteúdo original da comunidade.
- O `robots.txt` passa a bloquear rotas privadas, fluxos de autenticação e a busca interna, e aponta o sitemap para o domínio principal.
- As notícias declaram autoria da organização nos dados estruturados quando produzidas com apoio de IA, mantendo o markup coerente com o que aparece na página.
- A página de jogo carrega mídias, jogos similares e destaque visual apenas no navegador, deixando o primeiro carregamento mais rápido.
- O painel administrativo passa a ser carregado sob demanda, reduzindo o peso do pacote inicial para quem não é administrador.
- Os pacotes do Angular foram alinhados na mesma versão e o pnpm ficou fixado como gerenciador de pacotes do projeto.
- A publicação passa a exigir configuração de hospedagem com função de renderização no servidor; o sitemap é servido pelo domínio principal.

### Fixed

- URLs inexistentes agora respondem com erro 404 de verdade, em vez de redirecionar ou responder como se a página existisse.
- Usuários já autenticados não ficam mais presos na landing enquanto a sessão é restaurada.
- Corrigido o piscar de conteúdo na primeira carga causado pela diferença entre o que o servidor renderiza e o que o navegador exibe.
- Rotas protegidas passam a aguardar a sessão ser restaurada antes de decidir o acesso, evitando redirecionamentos indevidos.
- O modo offline deixa de sobrepor as páginas vindas do servidor.

## [1.19.0] - 2026-08-12

### Added

- Página de notícias com carregamento infinito, estados de erro recuperáveis e apresentação textual sem imagem principal.
- Página individual de notícia com fonte original, jogos relacionados, metadados SEO e dados estruturados.
- Aba de notícias na página de cada jogo, exibindo somente as matérias relacionadas ao título.

### Changed

- A navegação desktop e mobile agora oferece acesso direto à seção de notícias.
- Scrollbars de todo o aplicativo seguem o estilo visual do Design System.
- Páginas sem imagem removem metadados sociais de imagem herdados da navegação anterior.

### Fixed

- O carregamento infinito volta a responder após uma falha ao buscar a próxima página.
- As matérias da listagem agora possuem divisores visíveis de 1 px.

## [1.18.1] - 2026-08-05

### Added

- Curtidas e comentários em registros de jogos publicados no feed, com respostas em thread e acompanhamento das interações.
- Aba "Meus registros" para consultar as próprias publicações e os comentários recebidos.
- Menu mobile em drawer para reunir atalhos adicionais sem sobrecarregar a navegação inferior.

### Changed

- A navegação inferior mobile passa a exibir cinco destinos principais: Início, Buscar, Placar semanal, Perfil e Menu.
- As ações dos posts foram compactadas em botões apenas com ícones para evitar cortes em telas estreitas.
- Corações preenchidos agora usam vermelho de forma consistente no feed, nas listas e nos jogos.
- Notificações de comentários em registros direcionam o usuário ao conteúdo relacionado.

### Fixed

- Controles de voto e ações do feed permanecem acessíveis em larguras mobile reduzidas.

## [1.18.0] - 2026-07-29

### Added

- Nova área autenticada de Jogatinas para descobrir encontros públicos, acompanhar participações e criar sessões públicas, privadas ou por convite.
- Convites de participantes por busca de conexões, com limite de vagas, data, descrição e contexto do jogo.
- Central de notificações internas com contador, marcação de leitura e exclusão persistente.
- Componentes reutilizáveis de combobox e folha de notificações.

### Changed

- As notificações são sincronizadas automaticamente ao autenticar e atualizadas sempre que a central é aberta.
- A navegação exibe Jogatinas somente para usuários autenticados e protege a rota contra acesso anônimo.
- O fluxo de criação valida data futura, capacidade entre 2 e 100 jogadores e preserva corretamente o horário local.

### Fixed

- A exclusão e a marcação de notificações usam atualização otimista com restauração do estado em caso de falha.
- Os testes do shell principal agora inicializam o roteador e verificam o conteúdo atual da aplicação.

## [1.17.0] - 2026-07-21

### Added

- Onboarding "Monte sua estante" para quem acabou de se cadastrar: buscar e marcar jogos já zerados, avaliar um deles e seguir jogadores sugeridos, tudo em três passos rápidos e puláveis.
- Novo módulo de compartilhamento: gere prints instagramáveis ao zerar um jogo, da sua biblioteca ou de uma lista, com escolha de formato (story ou quadrado), fundos (gradientes ou o tema do seu perfil) e opção de incluir sua nota.
- O convite para amigos agora vira um link: quem se cadastra por ele já nasce seguindo (e sendo seguido por) quem convidou, e vê um mini-perfil de quem o convidou na tela de cadastro.
- Sugestões de "jogadores com gostos parecidos" no dashboard, com base em jogos avaliados em comum.
- A ação de hype agora aparece apenas em jogos ainda não lançados.

### Changed

- Dashboard reformulado como um feed social único com carregamento infinito. As antigas seções separadas deram lugar a um fluxo cronológico que reúne reviews, comentários, listas, registros de status (zerou, adicionou à biblioteca, começou a jogar, abandonou) e adições de jogos às listas das suas conexões. Registros de status são deduplicados por jogo (mostrando o mais recente) e as vitrines de "Listas em alta" e "Mais aguardados" saíram do dashboard.
- Todo jogo que aparece no feed agora traz ações rápidas embutidas — adicionar à biblioteca, aos desejos ou a uma lista — para você agir sobre o que descobre sem sair do fluxo.
- Página de um jogo redesenhada: header centralizado com nota compacta e ações agrupadas, e conteúdo organizado em abas (Lobby, Estatísticas, Reviews, Mídias, Talvez você goste) carregadas sob demanda.
- Estatísticas do jogo agora têm aba própria e viraram uma lista de uma coluna, sem o grid anterior.
- Aba de Mídias redesenhada: o trailer (ou a primeira screenshot, na ausência de vídeo) vira o destaque em largura total, e todas as demais imagens ficam sempre visíveis em um grid, sem o antigo botão "Ver galeria" escondendo o restante. Clicar em qualquer imagem continua abrindo a visualização ampliada.
- Os skeletons de carregamento do dashboard agora espelham o layout real do conteúdo, sem o antigo gradiente azul.
- Ações de compartilhar, curtir e salvar em listas foram padronizadas visualmente.
- A lista de conexões (seguidores/seguindo) do perfil agora é exibida em coluna única.
- Sorteios foram temporariamente ocultados da navegação.

## [1.16.1] - 2026-07-13

### Changed

- O estado vazio do perfil agora sugere, de forma bem-humorada, um jogo para o próprio usuário registrar, enquanto visitantes continuam vendo uma mensagem neutra.
- A apresentação do estado vazio foi simplificada, sem a antiga caixa com borda tracejada.

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
