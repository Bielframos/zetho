# Seguir jogadores

`ui-follow-control` apresenta a mesma ação no perfil desktop/mobile, sugestões do Feed e onboarding. Perfil usa 156px; sugestões usam 132px. Todos os estados preservam essa largura e área de toque mínima de 44px. O controle é oculto sem autenticação e no próprio perfil.

| Estado | Apresentação e recuperação |
| --- | --- |
| Consulta inicial | Verificando…, bloqueado |
| Não segue | Seguir com user-plus e cor de ação |
| Segue | Seguindo com check e disclosure |
| Disclosure aberto | Deixar de seguir explícito; Tab/Enter ativam, Escape fecha e retorna ao gatilho |
| Alteração pendente | Spinner/label, novos cliques bloqueados em todas as instâncias |
| Mutação incerta | Indisponível, borda tracejada, mensagem e Verificar novamente; nenhuma nova mutação até reconciliar |
| Mutação confirmada, refresh falhou | Estado confirmado preservado, aviso e Atualizar consulta (somente leitura) |

O menu não desfaz a conexão ao clicar em Seguindo. Toque, mouse e teclado chegam à mesma ação explícita. O foco perdido ao remover/desabilitar um controle volta ao gatilho ou à recuperação após terminar. Não há restauração se ocorreu interação posterior, mudança de perfil/conta ou se a instância ficou oculta/desmontada. Feedback usa texto, ícones e live region, além de cor. Superfícies/foreground/foco herdam o contexto local seguro dos temas de perfil; a ação primária conserva seu par de contraste próprio.

## Contrato de estado

`FollowStore` compartilha estado por sessão/owner/target, deduplica leituras e bloqueia mutações concorrentes da mesma relação. Trocar conta limpa os estados; gerações e identidade da sessão impedem que respostas anteriores atualizem a nova conta ou outro jogador. Navegar para outro perfil não reaproveita o estado do alvo anterior.

`ConnectionsService.setFollowing` recebe o estado desejado. Seguir faz POST idempotente, que devolve a conexão existente quando necessário. Deixar de seguir consulta a relação atual e faz DELETE explícito; ausência já representa sucesso. Não existe mais operação de alternância. A consulta não usa o antigo cache indexado só por target.

O guard de sessão é reavaliado após a consulta e antes/depois de obter o JWT em `SocialApi`, impedindo iniciar a escrita com credenciais de uma conta que mudou durante o await. Uma requisição já enviada pertence ao usuário que a iniciou; sua resposta não entra no estado de outra sessão.

O resultado confirmado da mutação é aplicado antes do refresh. Falha na consulta posterior não desfaz esse resultado nem repete a escrita. Falha de rede com resultado incerto bloqueia a ação: Verificar novamente apenas lê a relação. Após a confirmação, o usuário pode escolher outra ação conscientemente.

`ConnectionsController` invalida lista/total pela revisão da relação, protege paginação com geração/profile/type/session e ignora respostas antigas. Se a atualização falha, mostra contagem indisponível e retry somente da consulta, evitando um falso total zero.

## Verificação

Testes cobrem duas instâncias da mesma relação, cliques repetidos, POST existente sem toggle, DELETE explícito, falha incerta, refresh após sucesso, retry somente leitura, troca de alvo, logout/troca de conta durante lookup/mutação/JWT, isolamento owner/target, self-follow, lista/contadores e retorno de foco no retry.

A matriz Chromium usou fixtures locais e rede externa bloqueada: perfil, Feed e onboarding em 1440×1000 e 390×844, claro/escuro, nomes longos, loading, erro, disclosure e temas de perfil contrastantes. Larguras 156/132px permaneceram constantes, sem overflow; Enter abriu o menu sem DELETE, a ação explícita removeu a relação e o GET de recuperação não repetiu o POST. Avatares remotos e carregamento de jogos não foram integrados nesse harness; nenhuma conexão real foi alterada.

A entrada direta em `/comecar` revelou que o store de aparência dependia da existência do seletor. O App agora o instancia na raiz, mantendo listeners também nessa rota. Com autenticação simulada localmente e sem seletor, mudanças reais de `prefers-color-scheme` e storage de outra aba atualizaram o modo corretamente.
