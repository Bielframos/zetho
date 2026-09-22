# CHANGELOG

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

Seguindo o formato "Keep a Changelog" e o versionamento semântico.

## [Unreleased]

## [1.29.0] - 2026-09-21

### Added

- Aba “Minha jogatina” na página de cada jogo para registrar plataforma, tipo de conclusão e horas jogadas; as estatísticas mostram a média comunitária de tempo para zerar.
- Meta anual de jogos no perfil, com objetivo editável e progresso em porcentagem.

### Changed

- O feed social passa a carregar páginas por cursor para manter a navegação cronológica conforme a timeline cresce.
- Alterações de jogatina, comentários, listas, conexões e perfil passam pela API, com validação centralizada.
- Capas de jogos usam imagens responsivas com carregamento sob demanda e prioridade nas primeiras capas visíveis.

### Fixed

- Nomes de View Transition das capas agora são únicos por seção e registro, evitando conflitos quando o mesmo jogo aparece mais de uma vez na página.

## [1.28.1] - 2026-09-17

### Fixed

- Loading compartilhado aparece na posição final, sem deslocamento ou escala de entrada; a rotação da logo respeita a preferência por movimento reduzido.

## [1.28.0] - 2026-09-17

### Added

- Página pública de Jogatina em `/jogatina/:id`, com detalhes da sessão, participantes confirmados e acesso para visitantes.

### Changed

- Links compartilhados de Jogatinas agora apontam para a página pública e recebem título, descrição, capa do jogo e dados estruturados no HTML renderizado pelo servidor.
- Visitantes podem consultar Jogatinas públicas e são direcionados para entrar ou criar uma conta antes de solicitar participação.

## [1.27.0] - 2026-09-14

### Added

- Novo ranking social de jogos zerados entre conexões (`/ranking`), com alternância fluida por abas (`ui-tabs`) e pódio visual.
- Destaque da logo do Zetho nas pontuações de zeramento do ranking.

### Changed

- Header da página de rankings alinhado ao padrão visual das páginas de listas (mesma escala tipográfica, espaçamento e sem fonte display).
- Unificação das pontuações em branco alto contraste (`text-gray-12`) no placar.
- Rota legada `/zcoins/leaderboard/weekly` redirecionada automaticamente para `/ranking`.
- Barra de navegação lateral (desktop) e menu inferior (mobile) apontando diretamente para `/ranking`.

### Performance

- Otimização do consumo do placar de Z-Coins e hidratação das entradas.

## [1.26.3] - 2026-09-12

### Fixed

- Landing sem a tag promocional, com título menor no mobile.
- Ações da hero em linha com flex-wrap, botões quadrados padrão e altura uniforme.
- Busca movida da topbar para a hero, mantendo a navegação para resultados de jogos e jogadores.

## [1.26.2] - 2026-09-12

### Fixed

- Acesso à navegação pública pelo botão Explorar o Zetho na landing, com Início e marca direcionando visitantes para Notícias.
- Z Shop oculta nos menus desktop e mobile para visitantes, com acesso direto à loja protegido por autenticação.

## [1.26.1] - 2026-09-12

### Fixed

- Formulário central de busca no mobile envia o termo sem recarregar a página.
- Campos de busca com fonte de 16 px para evitar zoom automático ao receber foco no mobile.
- Campo superior de busca oculto enquanto o formulário central está visível, evitando duplicação.

## [1.26.0] - 2026-09-12

### Added

- Menu contextual nas capas para registrar Zerei, Biblioteca, Jogando e Dropei sem abrir o jogo, com suporte a mouse e teclado no desktop.
- Ações por toque prolongado no mobile, com capa animada, scrim e grade compacta de ações com cores por status.
- Opção de ocultar indicadores de status nas capas, aplicada às listagens do perfil.

### Changed

- Entradas já carregadas na busca e no próprio perfil são reutilizadas no menu, preservando os demais atributos do registro.
- Logo do Zetho nas ações de zerar e no feed, com a cor da marca.
- Compartilhamento de jogos disponível apenas por ação explícita do usuário.

### Fixed

- Jogos lançados não são bloqueados quando a projeção da capa omite a data de lançamento.
- Removido o gatilho persistente que abria o compartilhamento ao acessar outro jogo após zerar.
- Tratamento de falhas, repetição de consultas, foco e cancelamento de gestos no menu de ações.

## [1.25.0] - 2026-09-12

### Added

- Votos positivos e negativos diretamente nas reviews do dashboard e do feed da comunidade, com indicação de envio e tratamento de falhas.
- Prévia de até 400 caracteres nas reviews longas, com controles inline para expandir o conteúdo completo e recolher.
- Filtro de busca por desenvolvedora com sugestões de empresas e filtros preservados na URL.
- Sidebar compartilhado para filtros, com sobreposição ao shell, fechamento por Escape e controle do foco.

### Changed

- Busca com 24 resultados por página, quatro capas por linha e estado inicial sem jogos em alta.
- Cabeçalho da busca simplificado para alternador Jogos/Perfis e filtros; formulário central disponível apenas no mobile.
- Alternadores compactos compartilhados entre busca, conexões, listas do perfil e compartilhamento.
- Títulos de busca e Próximo jogo revisados.

### Fixed

- Sugestões do combobox flutuam sobre o conteúdo sem deslocar os controles abaixo.
- Escape fecha primeiro as sugestões do combobox e depois o sidebar.

## [1.24.0] - 2026-09-09

### Added

* Nova página "Seu próximo jogo", com recomendação personalizada por IA, seleção entre backlog e catálogo, resultado em destaque e histórico paginado de descobertas.
* Fundo animado exclusivo e responsivo para a experiência de recomendação, com suporte a movimento reduzido e fallback sem WebGL.

### Changed

* A página de recomendações agora informa o custo de 10 zCoins e o limite de uma descoberta por dia, preservando tentativas idempotentes e refletindo o saldo atualizado.
* A rota de recomendações agora fornece título, descrição, URL canônica e metadados sociais no SSR, incluindo uma imagem dedicada para compartilhamento.

## [1.23.1] - 2026-09-09

### Changed

* As reviews da comunidade na página individual de um jogo agora são visualizadas exclusivamente dentro da aba "Reviews", removendo a exibição estática prévia fora das abas.
* Otimizado o carregamento inicial da página do jogo e SSR ao eliminar chamadas desnecessárias de busca de reviews no controller principal.

## [1.23.0] - 2026-09-09

### Added

* Nova aba de Briefing por IA na tela de detalhe do jogo (`/jogo/:slug`), posicionada como primeira aba padrão antes do Lobby.
* Renderização estruturada do briefing inteligente contendo visão geral, destaques da experiência, perfis de jogadores indicados e avisos de conteúdo catalogados.
* Integração leve e assíncrona no cliente via `POST /games/:gameId/ai-briefing`, mantendo o render inicial do SSR rápido e desacoplando o carregamento inicial dos comentários do Lobby.

## [1.22.0] - 2026-09-09

### Added

* Nova tela de splash centralizada ao carregar a aplicação, resolvendo o estado de autenticação antes de qualquer redirecionamento e evitando flashes da landing page para usuários logados.
* Rota dedicada `/landing` para a apresentação pública da plataforma, preservando renderização no servidor e otimização para mecanismos de busca.

### Changed

* O fluxo de login e cadastro no mobile agora traz os formulários imediatamente visíveis, reduzindo rolagens desnecessárias e integrando os campos diretamente à superfície da página.

### Fixed

* Corrigida a sobreposição do preço sobre o botão de compra de temas na Zetho Store no mobile, garantindo legibilidade e espaçamento estável em qualquer largura de tela.

## [1.21.2] - 2026-08-20

### Changed

* O campo de resposta a comentários no feed agora conta com uma separação visual mais clara.

### Fixed

* Ao responder a um comentário que já possui respostas, a conversa existente agora é carregada e exibida automaticamente.

## [1.21.1] - 2026-08-18

### Changed

* Reviews da comunidade agora possuem uma separação visual mais clara entre as publicações.
* O destaque de comentários ficou mais discreto e integrado ao restante da interface.
* No dashboard, o botão de comentário agora abre diretamente o campo de resposta.
* Listas públicas vazias agora possuem uma apresentação mais clara e consistente.

### Fixed

* Responder a um comentário no dashboard não recarrega mais a conversa antes de abrir o campo de resposta.
* Corrigida a contagem de respostas exibida nos comentários.

## [1.21.0] - 2026-08-18

### Added

* Novo feed público de críticas da comunidade em `/reviews`, com carregamento contínuo conforme você navega.
* Nova área de descoberta de listas públicas em `/listas`, exibindo autor, jogos adicionados, curtidas e salvamentos.
* Nova página institucional em `/institucional`, reunindo informações sobre o projeto, políticas e canais de contato.
* Comentários do feed agora podem ser expandidos e respondidos diretamente no card.
* Links para comentários específicos agora abrem diretamente a conversa correspondente na página do jogo.

### Changed

* A navegação desktop e mobile ganhou atalhos para Críticas, Listas e a área Institucional.
* Cards de comentários no feed agora priorizam as ações relacionadas à própria conversa.
* Notificações de respostas agora levam diretamente ao comentário relacionado.

### Fixed

* Comentários acessados por links agora são encontrados corretamente mesmo em conversas maiores.
* Corrigidos casos em que comentários podiam aparecer duplicados.

## [1.20.0] - 2026-08-13

### Added

* As páginas públicas do Zetho agora aparecem de forma mais completa em mecanismos de busca e ao serem compartilhadas.
* Novas páginas institucionais de Privacidade, Termos, Política Editorial, Sobre e Contato, acessíveis pelo rodapé.
* A página de cada jogo agora possui uma seção fixa de "Críticas da comunidade", destacando avaliações da comunidade.
* As matérias de notícias agora informam quando foram produzidas com apoio de IA e apresentam acesso à fonte original.

### Changed

* Melhoramos a forma como páginas de jogos e notícias são apresentadas em mecanismos de busca.
* O carregamento inicial das páginas de jogos ficou mais rápido.
* O acesso ao aplicativo ficou mais fluido para usuários que já estão autenticados.

### Fixed

* URLs inexistentes agora exibem corretamente uma página de conteúdo não encontrado.
* Corrigidos redirecionamentos indevidos durante a restauração da sessão.
* Reduzidas alterações visuais inesperadas durante o primeiro carregamento das páginas.
* Páginas protegidas agora aguardam corretamente a identificação do usuário antes de redirecioná-lo.
* Corrigidos conflitos entre o modo offline e páginas carregadas normalmente.

## [1.19.0] - 2026-08-12

### Added

* Nova página de notícias com carregamento contínuo e recuperação em caso de falha.
* Cada notícia agora possui uma página própria com fonte original e jogos relacionados.
* Nova aba de notícias nas páginas dos jogos, reunindo matérias relacionadas ao título.

### Changed

* A navegação desktop e mobile agora oferece acesso direto à seção de notícias.
* As barras de rolagem agora seguem o estilo visual do Zetho.
* Compartilhamentos de páginas sem imagem agora apresentam informações mais adequadas ao conteúdo exibido.

### Fixed

* O carregamento de novas notícias volta a funcionar normalmente após uma falha.
* Melhorada a separação visual entre as matérias da listagem.

## [1.18.1] - 2026-08-05

### Added

* Curtidas e comentários agora estão disponíveis em registros de jogos publicados no feed.
* Comentários podem receber respostas em sequência, formando conversas.
* Nova aba "Meus registros" para acompanhar suas publicações e os comentários recebidos.
* Novo menu mobile reunindo atalhos adicionais sem sobrecarregar a navegação inferior.

### Changed

* A navegação inferior mobile agora concentra cinco destinos principais: Início, Buscar, Placar semanal, Perfil e Menu.
* As ações das publicações foram compactadas para funcionar melhor em telas menores.
* Curtidas agora possuem uma apresentação visual consistente em todo o aplicativo.
* Notificações de comentários agora levam diretamente ao conteúdo relacionado.

### Fixed

* Melhorado o acesso aos controles de voto e às ações do feed em celulares com telas menores.

## [1.18.0] - 2026-07-29

### Added

* Nova área autenticada de Jogatinas para descobrir encontros públicos, acompanhar participações e criar sessões públicas, privadas ou por convite.
* Convites para jogatinas podem ser enviados diretamente às suas conexões, com definição de vagas, data, descrição e jogo relacionado.
* Nova central de notificações internas com contador, marcação de leitura e opção de exclusão.

### Changed

* As notificações são atualizadas automaticamente ao entrar no aplicativo e ao abrir a central.
* A área de Jogatinas fica disponível apenas para usuários autenticados.
* O fluxo de criação de jogatinas agora valida melhor datas, horários e quantidade de participantes.

### Fixed

* Ações realizadas na central de notificações agora se recuperam corretamente quando ocorre uma falha.

## [1.17.0] - 2026-07-21

### Added

* Novo onboarding "Monte sua estante" para ajudar novos usuários a registrar jogos concluídos, avaliar títulos e encontrar jogadores para seguir.
* Novo módulo de compartilhamento para criar imagens da sua biblioteca, listas ou jogos concluídos, com formatos para story e publicação quadrada.
* Convites para o Zetho agora podem ser enviados por link, facilitando a conexão entre quem convida e quem entra.
* Nova sugestão de jogadores com gostos parecidos, baseada em jogos avaliados em comum.
* A opção de hype agora aparece apenas para jogos que ainda não foram lançados.

### Changed

* O dashboard foi reformulado como um feed social contínuo reunindo atividades das suas conexões.
* Jogos exibidos no feed agora possuem ações rápidas para adicionar à biblioteca, aos desejos ou a uma lista.
* A página dos jogos foi redesenhada e organizada em abas para facilitar a navegação.
* As estatísticas dos jogos agora possuem uma área própria e uma apresentação mais simples.
* A aba de Mídias foi redesenhada para destacar vídeos e imagens e facilitar a exploração da galeria.
* Os carregamentos do dashboard agora acompanham melhor o formato real do conteúdo.
* As ações de compartilhar, curtir e salvar foram padronizadas visualmente.
* A lista de seguidores e pessoas seguidas agora possui uma apresentação mais simples.
* Sorteios foram temporariamente removidos da navegação.

## [1.16.1] - 2026-07-13

### Changed

* Perfis ainda sem registros agora apresentam mensagens mais úteis e amigáveis.
* A apresentação dos estados vazios do perfil foi simplificada.

## [1.16.0] - 2026-07-12

### Changed

* A biblioteca de jogos do perfil agora carrega novos títulos automaticamente conforme você rola a página.

## [1.15.0] - 2026-07-12

### Added

* No celular, o saldo de Z-Coins agora fica sempre visível em um botão flutuante.
* Usuários administradores ganharam um acesso dedicado à área administrativa no celular.

### Changed

* No celular, modais e caixas de diálogo agora aproveitam melhor o espaço disponível na tela.

### Fixed

* Tocar novamente em um status de jogo já selecionado agora remove corretamente esse status.

## [1.14.0] - 2026-07-08

### Added

* Agora é possível ativar ou desativar notificações por e-mail diretamente nas páginas dos jogos.
* Respostas exibidas no feed agora mostram também o comentário anterior para facilitar o acompanhamento da conversa.
* Comentários podem receber votos positivos e negativos diretamente pelo dashboard.

### Fixed

* Melhorada a indicação visual dos votos selecionados.
* Corrigidos problemas que podiam ocorrer ao votar repetidamente em um comentário.

## [1.13.0] - 2026-06-25

### Added

* Nova aba "Salvas" na seção de Listas do perfil, reunindo todas as listas de outros usuários que você salvou.
* Caso uma compra de tema não seja concluída, os Z-Coins utilizados são devolvidos automaticamente.

### Changed

* Temas adquiridos e ativos agora aparecem mais rapidamente na página de Conta.
* Melhorias na interface da Loja de Temas.

## [1.11.0] - 2026-06-23

### Changed

* Interface renovada e modernizada para melhorar a navegação e a acessibilidade.
* Páginas de login e registro redesenhadas.
* Visitantes agora podem explorar mais áreas do Zetho antes de criar uma conta.
* Melhorias nas páginas de busca, perfil, tela inicial e navegação geral.

## [1.10.0] - 2026-06-15

### Added

* Nova seção de Destaques da Comunidade no dashboard, reunindo comentários e avaliações recentes.
* Publicações agora mostram há quanto tempo foram feitas.
* Corrigida a exibição do nome e da foto do autor em comentários recentes.

## [1.9.1] - 2026-06-13

### Added

* Melhorada a apresentação das avaliações e do carregamento da nota dos jogos.

## [1.9.0] - 2026-05-22

### Added

* Introduzidos os sorteios no Zetho como nova forma de participação e premiação.
* Adicionado o sistema de convites para facilitar a entrada de novos usuários.

## [1.8.0] - 2026-05-22

### Added

* Introduzidos os Z-Coins, a moeda virtual de recompensas do Zetho.
* O saldo de Z-Coins agora aparece no perfil.
* Algumas atividades dentro do aplicativo passam a conceder Z-Coins.
* Novo placar semanal destacando os usuários mais ativos da comunidade.

## [1.7.1] - 2026-05-06

### Changed

* Novo padrão de cores aplicado em toda a interface para reforçar a identidade visual do Zetho.

### Added

* Chegada do Gazetho ao Zetho.

## [1.7.0] - 2026-04-25

### Added

* Nova seção `Mídias` nas páginas dos jogos.
* As páginas dos jogos agora podem destacar screenshots ou artes do título no plano de fundo.
* Nova galeria interativa para explorar imagens dos jogos.

## [1.6.0] - 2026-04-24

### Added

* Novo recurso de `hypes` para marcar os jogos que você mais aguarda.
* Nova seção no dashboard para descobrir grandes lançamentos.
* Novas estatísticas mostram quais jogos são mais aguardados pela comunidade.

## [1.5.0] - 2026-03-19

### Added

* Novo atalho para iniciar uma busca diretamente pelo campo de pesquisa.

### Changed

* A busca de jogos agora aceita filtros combinados de gênero e ano.
* Os gêneros exibidos nas páginas dos jogos agora podem ser usados diretamente como filtros.
* A navegação ficou mais rápida durante o carregamento das informações.

## [1.4.2] - 2026-03-13

### Changed

* As telas internas foram redesenhadas para facilitar o uso no celular.

## [1.4.1] - 2026-03-09

### Changed

* Textos e fontes foram ajustados para melhorar a leitura em telas menores.

## [1.4.0] - 2026-03-09

### Added

* O Zetho agora pode ser instalado diretamente no celular ou computador.
* Nova tela informa quando você está sem conexão com a internet.

### Changed

* A página de conexões ficou mais simples de navegar no celular.

## [1.3.2] - 2026-03-08

### Fixed

* Corrigido um problema que impedia a abertura de algumas listas de jogos.

## [1.3.1] - 2026-03-07

### Fixed

* Ao sair da conta, suas informações agora são removidas corretamente da sessão.
* Visitantes não autenticados não veem mais ações de seguir usuários.

## [1.3.0] - 2026-03-07

### Added

* A busca agora encontra jogadores e perfis além de jogos.
* Comentários no `Game Lobby` ganharam acesso rápido ao perfil do autor.
* Agora você pode seguir outros jogadores e ser seguido.
* Nova página dedicada a seguidores e pessoas que você segue.

### Changed

* Alternar entre resultados de jogos e perfis não perde mais sua posição na busca.
* Comentários no `Game Lobby` agora exibem a foto do jogador.
* O perfil agora carrega mais rapidamente.

## [1.2.1] - 2026-03-01

### Added

* As capas agora mostram etiquetas indicando o status de lançamento dos jogos.

### Changed

* Melhorada a experiência de adicionar jogos às listas.

## [1.2.0] - 2026-02-23

### Added

* Páginas de jogos e perfis agora são públicas e podem ser compartilhadas com pessoas que ainda não possuem conta.
* Melhorada a apresentação do Zetho em mecanismos de busca e em links compartilhados nas redes sociais.

### Changed

* Visitantes agora recebem orientações mais claras sobre os benefícios de criar uma conta.

### Fixed

* Corrigidas páginas públicas que solicitavam login indevidamente.
* Ações que exigem autenticação agora informam corretamente quando é necessário entrar na conta.

### Security

* Reforçada a proteção das ações disponíveis apenas para usuários autenticados.

## [1.1.0] - 2026-02-20

### Added

* Adicione uma foto ao seu perfil.
* Atualize seu endereço de e-mail.
* Exclua sua conta diretamente pelo Zetho.
* Nova página de aviso para jogos ou perfis que não forem encontrados.
* Adicione uma biografia ao perfil.
* Conecte suas contas Xbox, Steam e PlayStation ao perfil.
* Novas confirmações visuais informam quando suas ações são concluídas.

### Changed

* Visual renovado na página inicial.
* Visual renovado e mais limpo na página de buscas.

## [1.0.2] - 2026-02-19

### Added

* Sistema de criação de conta e login integrado ao Zetho.

### Changed

* Melhorias na estabilidade e segurança da sessão do usuário.

## [1.0.0] - 2026-02-06

### Added

* Lançamento inicial do Zetho! 🎉
* Crie sua conta com segurança.
* Crie e personalize seu perfil de jogador.
* Explore, busque e descubra novos jogos.
* Crie listas de jogos, edite e compartilhe.
* Participe da comunidade comentando no Game Lobby.
* Acompanhe suas atividades e estatísticas pelo dashboard.
