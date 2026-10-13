# Changelog do Zetho

O changelog é publicado dentro do Zetho e deve ajudar quem usa o produto a entender rapidamente o que mudou. Ele não é um histórico de commits nem um relatório técnico.

## Como escrever uma entrada

Adicione a mudança em `## [Unreleased]`, dentro de uma destas categorias:

- `Novidades`: recursos novos ou mudanças que criam uma nova possibilidade para o usuário.
- `Melhorias`: refinamentos de interface, experiência, desempenho ou estabilidade.
- `Removido`: funcionalidades que deixaram de estar disponíveis.

Cada item deve:

- descrever o comportamento que mudou ou o benefício para o usuário;
- usar uma frase curta, em português e sem depender de contexto interno;
- agrupar alterações relacionadas em um único item;
- mencionar nomes de telas e funcionalidades como aparecem no produto.
- limitar cada versão a, no máximo, três itens sempre que possível.

Detalhes de layout, foco, estados internos, sincronização, fallbacks e correções técnicas devem ser agrupados em frases como “Melhorias na interface e na experiência de uso”. Só detalhe uma mudança quando ela apresenta uma funcionalidade ou altera claramente o que o usuário pode fazer.

Não inclua refatorações, dependências, migrations, endpoints, nomes de componentes, detalhes de infraestrutura ou outras tarefas internas sem efeito percebido pelo usuário.

Prefira “A página do jogo passou a carregar mais rápido” a “Otimizamos a hidratação e removemos uma chamada do controller no SSR”.

## Preparar uma versão

1. Revise `Unreleased`, agrupando correções e refinamentos semelhantes.
2. Confirme que novidades estão claras e que melhorias não expõem detalhes desnecessários.
3. Execute `pnpm bump patch`, `pnpm bump minor`, `pnpm bump major` ou informe uma versão exata.
4. Confira a nova seção na página `/changelog` antes de publicar.

O comando de bump exige ao menos um item em `Unreleased`. A opção `pnpm bump sync` continua disponível para sincronizar a versão atual sem criar uma nova seção.
