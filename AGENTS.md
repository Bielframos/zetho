# Padroes de Redesign do Zetho

Este guia documenta os padroes visuais aplicados no `AppShell`, no `Dashboard` e na pagina individual de game. Use-o ao redesenhar outras telas Angular/Tailwind para manter consistencia com a experiencia atual.

Fontes principais:

- `src/app/app.html`
- `src/app/core/dashboard/pages/dashboard/dashboard.html`
- `src/app/core/games/pages/game/game.html`
- `src/styles.css`

## Base Visual

- O produto e um app escuro, com fundo principal `bg-gray-1` e texto primario `text-gray-12`.
- Use `text-gray-11` para texto secundario, descricoes, labels e metadados; use `text-gray-10` para informacao ainda mais discreta.
- Use bordas como estrutura visual: `border-gray-4` no shell e separacoes externas; `border-gray-6` em secoes, modulos internos, listas e controles.
- Azul e a cor de acao e enfase: `blue-9` para botoes/estado ativo, `blue-10` para hover de botao primario e `blue-11` para links, icones e destaques textuais.
- O corpo usa `Readex Pro Variable`; reserve `font-display` para a marca `zetho` e momentos muito pontuais de identidade.
- Prefira `rounded-lg` para controles, navegacao, chips e modais pequenos. Evite raios grandes em areas estruturais do app.
- Use Phosphor Icons (`ph` e `ph-fill`) para acoes e navegacao. O tamanho base dos icones vem de `src/styles.css`; ajuste com `text-[...]` apenas quando o modulo pedir destaque.

## Layout E Shell

- O `AppShell` autenticado usa `min-h-dvh bg-gray-1 text-gray-12` e centraliza tudo em `max-w-[1180px]`.
- No desktop, preserve a grade de tres colunas: sidebar esquerda `15rem`, conteudo fluido e sidebar direita `18rem` (`lg:grid-cols-[15rem_minmax(0,1fr)_18rem]`).
- Sidebars desktop devem ser `sticky top-0 h-dvh`, com bordas verticais `border-r` ou `border-l` em `border-gray-4`.
- O conteudo principal fica em `main` com `min-w-0` e bordas laterais no desktop (`lg:border-x`).
- A busca global no shell e sticky, transluzida e com blur (`bg-gray-1/50`, `backdrop-blur-lg`, `border-b`).
- No mobile, use header sticky no topo e bottom nav fixa. A navegacao inferior deve ter botoes icon-only com area de toque estavel (`h-11`) e estado ativo `bg-gray-3 text-gray-12`.
- Para paginas dentro do shell, prefira wrappers como `w-full max-w-5xl mx-auto` quando a tela for feed/dashboard; deixe paginas de detalhe ocuparem a largura do conteudo e organizarem modulos em faixas.

## Composicao De Paginas

- Estruture telas como faixas e secoes full-width. Use bordas e divisorias para hierarquia, em vez de empilhar cards decorativos.
- Padroes de separacao recorrentes:
  - `border-b border-gray-6` para separar cabecalhos e conteudo.
  - `border-y border-gray-6` para blocos informativos horizontais.
  - `border-t-8 border-gray-6` ou `border-y-8 border-gray-6` para quebras fortes entre grandes modulos.
  - `divide-y divide-gray-6` para feeds e listas.
  - `divide-y-8 divide-gray-6` para listas de chamadas com separacao mais editorial.
- Nao coloque cards dentro de cards. Reserve cards para itens repetidos, modais, unidades compactas de conteudo e componentes existentes como `ui-game-card`.
- Use grid compacto para capas e colecoes: `grid-cols-3` no mobile e colunas responsivas no desktop quando houver muitos games.
- Prefira headers de secao com `px-4 py-4`, icone em caixa `h-11 w-11 border border-gray-6`, titulo `text-2xl` e subtitulo apenas quando necessario.
- Use `animate-fade-in-slide` somente para entrada de blocos ou troca de conteudo. Nao aplique animacoes a cada item pequeno de uma lista longa.

## Interacoes E Controles

- Use classes globais de botao antes de criar novas combinacoes:
  - `.ui-primary-btn` para acao principal.
  - `.ui-secondary-btn` para acao secundaria.
  - `.ui-ghost-btn` para acoes discretas e icon-only.
  - `.ui-action-btn` para acoes pequenas em comentarios, listas e chips interativos.
  - `.ui-destructive-btn` para acoes destrutivas.
- Para botoes icon-only, use `data-size="icon"` e forneca `aria-label` quando o texto nao estiver visivel.
- Links textuais devem usar `text-blue-11` com `hover:text-blue-9` e, quando fizer sentido, `hover:underline`.
- Navegacao ativa segue `routerLinkActive="bg-gray-3 text-gray-12"` no shell. Em tabs de conteudo, use borda inferior ativa (`border-blue-9`) e texto `text-gray-12`.
- Inputs e textareas devem ficar escuros ou transparentes, com `border-gray-6`, placeholder `text-gray-10/11` e foco `focus:ring-2 focus:ring-blue-6`.
- Estados disabled devem usar `disabled:pointer-events-none`, `disabled:text-gray-10`, `disabled:bg-transparent` ou `disabled:opacity-50`, conforme o componente existente.
- Badges e contadores usam `rounded-full`, texto pequeno (`text-xs`) e fundos discretos como `bg-blue-3 text-blue-11`, `bg-gray-3 text-gray-10` ou tons semanticos quando necessario.

## Padroes Do Dashboard

- O Dashboard e um feed social unico e cronologico (estilo timeline), em coluna focada (`w-full max-w-2xl mx-auto`), com carregamento infinito. Nao ha mais secoes separadas de descoberta (trending/aguardados) na home.
- O feed mistura varios tipos de atividade das conexoes: review, comentario, lista, registro de status (`status`: zerou/adicionou a biblioteca/comecou a jogar/abandonou) e adicao de jogo a lista (`list_item`). O tipo de cada item define o corpo renderizado.
- Feeds usam `flex flex-col divide-y divide-gray-6`; cada item usa `p-4`, avatar `h-8 w-8 rounded-full`, metadados `text-xs text-gray-10` e conteudo em `text-gray-12/11`.
- A acao do item (verbo) fica na linha do autor para `status` e `list_item` (ex.: "**Fulano** zerou", "**Fulano** adicionou em [Lista]"); review/comentario/lista usam um rotulo discreto a direita. Icone de status a direita, com `text-amber-300` para o marco `completed` (pico) e `text-gray-11` nos demais.
- Avatares sem imagem devem cair para uma bolha `rounded-full bg-blue-9 text-white` com inicial.
- Previews de game dentro do feed devem ser compactos: imagem pequena, `border border-gray-6`, `rounded-lg`, `hover:bg-gray-3` e transicao de cor.
- Carregamento infinito via `IntersectionObserver` sobre uma sentinela no fim da lista; indicador de carga discreto (`ui-loading` inline) enquanto pagina. A janela mesclada tem teto pratico (top ~100 por fonte).
- Empty states devem ser simples e diretos, normalmente `text-gray-11`, sem composicao de card pesada; o estado vazio do feed sugere jogadores com gostos parecidos.

## Padroes Da Pagina De Game

- A pagina de game e uma tela de detalhe imersiva, nao um dashboard de cards.
- Quando houver imagem hero, use uma camada absoluta no topo, com `background-size: cover`, opacidade baixa e mascara vertical para desaparecer no fundo. A imagem deve ser decorativa (`aria-hidden="true"`) e nao bloquear interacao.
- O header do game e uma banda horizontal alinhada a esquerda (perfil social): capa `ui-game-card` em `readonlyMode` a esquerda (`w-24` no mobile, `[width]="150"` no desktop), a direita o titulo como heroi (`text-3xl md:text-5xl`, `leading-[1.05]`), uma linha de metadados sempre visivel (`ano · desenvolvedor · generos` em `text-sm text-gray-11`, generos como links) e as acoes ghost no topo-direito. So o resumo longo (em `font-light leading-7`) e a data de lancamento ficam no disclosure recolhivel. Nunca exponha IDs ou dados de sistema na UI.
- O titulo do jogo e sempre o maior elemento do header. A nota agregada e uma linha de score compacta estilo Letterboxd (`ui-game-rating`): numero `text-3xl tabular-nums` + estrelas readonly agrupados, seguidos de contagem e do CTA `Ver avaliacoes →` na mesma linha. Nunca deixe a nota maior que o titulo. No mobile, uma nota compacta fica sempre visivel na barra sticky.
- Acoes do game ficam em botoes ghost icon-only compostos no header (topo-direito) quando o usuario esta autenticado.
- Modulos abaixo do header: status/entry actions e uma barra de tabs sticky. Todo o resto (incluindo as estatisticas, que sao uma lista de uma coluna com `divide-y`, nunca grid) e conteudo de tab (Lobby como default, Estatisticas, Reviews, Midias, "Talvez voce goste"), sem headers de secao empilhados.
- Tabs usam container `border-t-8 border-b border-gray-6 px-4`, botoes com `py-4`, borda inferior de 2px e estado ativo em `border-blue-9 text-gray-12`.
- A area de midias e uma aba dedicada: o trailer (ou, na ausencia dele, a primeira screenshot) e o destaque em largura total no topo (`aspect-video`, `border-b border-gray-6`); abaixo, todas as demais screenshots ficam sempre visiveis num grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-6`), sem botao de "ver galeria" escondendo conteudo. Cada thumbnail abre o lightbox em tela cheia ao clicar. Videos e imagens preenchem o espaco com `aspect-video`, `object-cover` e hover de zoom leve.
- Lightbox deve ser tela cheia com `dialog`, backdrop escuro, botoes icon-only e imagem `object-contain`.
- Para jogos sem login ou ainda nao lancados, use blocos informativos centralizados com icone grande, titulo curto, texto `text-gray-11` e CTA quando aplicavel.

## Game Cards E Listas

- `ui-game-card` e a unidade padrao para capas. Ele deve manter proporcao visual de capa, overflow hidden e badge absoluto no canto superior direito.
- Se houver capa, mostre a imagem em largura total e use overlay no hover com gradiente para revelar nome e ano.
- Se nao houver capa, use fallback com `background-pattern`, layout centralizado e proporcao `3 / 4`.
- Badges de status devem ser pequenos, circulares, absolutos e acessiveis via `aria-label`/`title`.
- List cards usam capas sobrepostas, sombra discreta e hover `bg-gray-3`; listas vazias usam `background-pattern`, borda tracejada `border-dashed border-gray-6` e icone de adicao.
- Ao listar muitos games, use grids densos e previsiveis, evitando espacamento excessivo e composicoes de landing page.

## Estados Obrigatorios

- Loading de pagina ou secao: use `<ui-loading>`. Para loading inline em botoes, use `<ui-loading [inline]="true" size="sm">`.
- Skeleton de conteudo: use `<ui-skeleton>` com dimensoes explicitas.
- Empty states: texto curto em `text-gray-11`; use icone ou CTA apenas quando isso ajudar a proxima acao.
- Erros e sucessos devem usar tons semanticos discretos com borda e fundo transluscido, como ja ocorre em telas admin.
- Preservar foco visivel com `focus:ring-2 focus:ring-blue-6` em botoes e campos.

## Anti-padroes

- Nao criar hero marketing, layouts de landing page ou secoes promocionais em paginas internas do app.
- Nao usar gradientes decorativos, blobs, orbs ou ilustracoes SVG como decoracao principal.
- Nao substituir divisorias estruturais por cards grandes arredondados em areas como dashboard, detalhe de game ou feed.
- Nao introduzir novas paletas principais. Use os tokens `gray-*` e `blue-*` de `src/styles.css`; cores semanticas devem ser pontuais.
- Nao criar botao novo se uma classe global existente cobre a necessidade.
- Nao usar texto explicativo na interface para ensinar o design. O padrao deve aparecer pela composicao, estados e controles familiares.
- Nao aumentar a tipografia de paineis compactos como se fossem heroes. Reserve tamanhos grandes para marca, titulo do game e numeros de destaque.

## Checklist Para Redesenhar Outra Pagina

1. Confirme se a pagina esta dentro do `AppShell` e respeita a largura/grade existente.
2. Use `gray-1` como fundo, `gray-12` para texto principal e `gray-11/10` para apoio.
3. Organize a tela em secoes full-width com bordas `gray-6`, nao em pilhas de cards.
4. Reaproveite botoes globais, Phosphor Icons, `ui-loading`, `ui-skeleton`, `ui-game-card` e componentes compartilhados.
5. Garanta estados de loading, vazio, disabled, hover, focus e responsividade mobile.
6. Compare visualmente com Dashboard e pagina de game antes de finalizar.
