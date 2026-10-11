# Retirada de Meta do ano — issue #99

O frontend deixa de renderizar o widget e de consultar/alterar `achievements/:profileId/goals/:year`. A biblioteca e o sidebar do perfil continuam sendo renderizados pelos componentes existentes.

## Ordem de publicação

1. Publicar esta retirada do frontend antes de desativar as operações da API.
2. A API retira consultas e gravações da tabela de metas; clientes antigos em cache recebem uma resposta explícita de recurso descontinuado (HTTP 410), sem gravar dados.
3. Os usuários de clientes antigos devem recarregar o app para receber a versão sem o widget. Não há migração destrutiva nesta entrega.

## Dados legados

Preservar a tabela `annual_goals` e seus campos (`profileId`, `year`, `target`, identificador e timestamps). Seus registros ficam inativos. Remoção física exige migração própria e revisão posterior.

Eventos de conclusão, jogos da biblioteca, estatísticas, catálogo de conquistas e showcase não são metas e permanecem ativos.
