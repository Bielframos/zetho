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

As listas oficiais ampliam `lists`/`list_items`, com `ownerType=user|system` e `status=draft|published|archived`, independentemente de `isPublic`. O MCP `submit_editorial_list_draft` cria diretamente uma lista do sistema em rascunho. Não há nova geração autônoma nem publicação automática.

Administradores criam listas oficiais no diálogo existente em `/listas`. A página comum `/listas/:slug` reúne título, descrição, ordenação e jogos, com controles de critérios, fontes, período e publicação. Publicar exige salvar e conferir a revisão atual; voltar para rascunho ou arquivar retira a exposição pública, preservando IDs e vínculos. A conversão em post oferece prévia e ação própria de publicação. Respostas antigas são descartadas ao mudar de lista ou revisão, inclusive A → B → A.

A apresentação pública mostra “Por Zetho”, fontes e CTAs no SSR. Os antigos caminhos `/listas-editoriais` redirecionam para `/listas`. Posts de curadoria usam `Article`.

A API deve receber a migração de colunas e permissões antes desta versão do frontend. Os itens públicos agora são lidos pela API após verificar a lista; o cliente antigo não é compatível com a retirada da leitura global do Appwrite. A implantação exige manutenção coordenada. Consulte `docs/editorial-lists.md` no backend para ordem, backup e retomada da migração. Não houve gravação real em produção.
