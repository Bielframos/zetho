# Aquisição por conteúdo

Implementa as issues #146, #147, #148 e a auditoria #149. API complementar: `Bielframos/zetho-api`, branch `codex/acquisition-activation`.

## Jornada e compatibilidade

Notícias usam exclusivamente `relatedGames`. “Quero jogar” chama `POST social/entries/ensure`, uma operação de inclusão idempotente, sem semântica de toggle. Nenhum status existente é substituído. A API valida jogo e identidade; sua resposta só confirma a ação após o commit. A escrita existente `social/entries` conserva sua semântica de toggle.

Visitantes guardam uma intenção de 30 minutos em sessionStorage (com fallback em memória), entram ou se cadastram e retornam ao conteúdo. O cadastro passa pelo onboarding. No retorno, o usuário confirma “Quero jogar”; a navegação por si só não grava. Há cancelamento no formulário e no conteúdo. Logout, troca de proprietário, expiração e dados inválidos eliminam a intenção. Uma aba não transfere intenção a outra. Sem storage, o reload perde a intenção, mas nenhuma escrita automática acontece. O destino é construído de duas rotas permitidas e de um slug validado; não se aceita `returnUrl` arbitrário.

Os CTAs verificam a geração de sessão antes de obter e usar o JWT. Respostas de sessão antiga não atualizam a UI. Retries da mesma intenção usam o mesmo identificador. Se a API ainda não tiver a operação, o CTA mostra erro e permite tentar novamente; nunca usa o toggle como fallback.

A conclusão do perfil responde `registration: { created, inviteAccepted }`. `created` só é verdadeiro na primeira conclusão persistida. O frontend emite cadastro exclusivamente com esse recibo; uma API antiga continua autenticando, mas não emite novos eventos de cadastro. Uma conta criada antes de falhar o perfil pode retomar a criação mediante autenticação. Sessões com perfil pendente completam o fluxo ao serem restauradas. Convite inválido não cria perfil nem recebe bônus. Convites aceitos são confirmados pela transação do servidor, nunca pelo preview ou pela URL.

## Contrato de analytics

| Evento | Momento | Parâmetros adicionais |
| --- | --- | --- |
| `content_cta_click` | Ação explícita, antes de autenticação/escrita | origem e CTA |
| `sign_up` | Recibo de conclusão real de conta/perfil | `method=password`, `invite_status=accepted\|none` |
| `content_action_complete` | Confirmação persistida da operação de inclusão | origem e CTA |
| `first_game_saved` | Primeiro status de biblioteca persistido para a pessoa | `game_id` efetivamente salvo |

A origem usa `source_type=direct|news|editorial_list`; quando houver intenção válida, inclui `content_id`, `game_id`, `cta_action=wishlist` e `cta_position=related_games|list_item`. IDs são de conteúdo/jogo, nunca de pessoa. `page_location` exclui query/fragment e `page_referrer` é vazio nesses eventos. Não se enviam e-mail, gamertag, nome, fingerprint, código de convite, JWT, requestId ou senha. O evento legado `user_game_entry_interaction` continua compatível.

“Primeiro jogo” inclui qualquer status da biblioteca, inclusive desejos. Like/hype isolado não conta. O servidor verifica histórico e projeção legada e guarda um marco privado por pessoa na mesma transação do jogo; remover jogos, outro dispositivo e reload não criam novo marco. A emissão GA é **no máximo uma tentativa por recibo**: resposta perdida, bloqueador, falta de configuração e falha de rede podem subcontar. Não há promessa de entrega exatamente uma vez, nem retries de telemetria com PII. O recibo persistido é a verdade operacional; GA não é um livro contábil.

Firebase permanece opcional e ausente no SSR. A coleta automática já configurada no Firebase/GA não foi alterada; a revisão de parâmetros de eventos automáticos é separada destes payloads controlados.

## Listas editoriais

O agente envia apenas rascunhos privados pela ferramenta MCP `submit_editorial_list_draft`. `/admin/listas-editoriais` permite revisar texto, fontes e período, salvar uma versão, aprovar/publicar a lista e gerar um rascunho de post. Publicar o post exige outra ação após sua prévia. Campos desconhecidos e instruções de publicação no payload são rejeitados. Texto é tratado como dado; fontes não são executadas nem buscadas pelo servidor.

Listas publicadas reutilizam `lists`/`list_items`, ordem, jogos e ações sociais, com identidade reservada `system:zetho`. A vitrine pública encaminha essa identidade à página editorial. `/listas-editoriais/:slug` entrega conteúdo público, critérios subjetivos, fontes e CTAs no SSR. Posts desse autor usam `Article`, sem representar a curadoria como `NewsArticle`.

A API precisa provisionar a nova tabela privada antes do uso editorial. Não há chamadas pagas de IA, cron de geração, nem publicação de dados reais. Detalhes, API e política de correções: `docs/editorial-lists.md` no backend.

## Auditoria do fórum

Já existiam SSR para feed/tópico, sanitização, canonical, `DiscussionForumPosting` e sitemap via API. Foram preservados. Lacunas corrigidas:

- Feed paginado com links HTML `?page=n`, leitura SSR da página e canonical correspondente.
- Rota `/forum/:slug/respostas/:parentId?page=n` com leitura pública paginada e links para descendentes. Confere a raiz da discussão antes de mostrar respostas. `noindex,follow`, canonical do tópico, sem duplicar a discussão principal.
- Tópico ausente responde 404; falha transitória responde 503/noindex. Limpeza de conteúdo e JSON-LD durante mudança de rota impede dados antigos em uma falha.
- HTML do fórum e respostas da API não usam cache compartilhado. Isso evita conservar texto excluído por 24h via stale-while-revalidate. Sitemap tem expiração máxima de cinco minutos; pode conservar uma URL removida nesse intervalo, mas a URL responde 404. Notícias conservam sua infraestrutura.
- `articleBody` passa a refletir o texto público completo visível, não apenas o excerpt.

`game_comments` é um domínio público, sem campo de tópico privado neste schema. Exclusão de comentários é física e em cascata, protegida pelo serviço social. Não foi criada nova permissão nem interpretação de privacidade. Qualquer futura modalidade privada precisa compartilhar uma política de elegibilidade entre leitura e sitemap antes de ser exposta.

## Validação e limites

Testes unitários usam mocks e não comprovam transações/índices em Appwrite real. A verificação SSR local usa catálogo, notícias, discussões e listas fictícias, sem autenticação ou produção. Verifica HTML inicial, sanitização, links, status 404/503 e cache. Não comprova indexação pelo Google.

Antes de liberar: testar transações concorrentes em Appwrite de homologação, provisionar a tabela privada, verificar review/withdrawal com uma sessão admin de teste, e validar eventos no DebugView com uma propriedade de teste. Conferir o `measurementId` configurado para distinguir App e Gazetho, sem imprimir credenciais. Diferenciar: nenhum evento emitido; requisição bloqueada; destino incorreto; recebido no DebugView; e atraso de relatório. Ausência em relatório não comprova conversão zero. Nenhuma configuração de GA/GSC foi modificada.
