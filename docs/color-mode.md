# Aparência e contrato de cores

A preferência `light | dark | system` fica somente no navegador, na chave `zetho.color-mode`. Ausência, remoção, clear e valor inválido resolvem para `system`. A preferência explícita vence o sistema operacional. Mudanças do SO atualizam apenas `system`; eventos de outra aba atualizam a preferência. Sem acesso ao storage, a escolha continua funcionando em memória na sessão.

`public/color-mode.js` é o contrato único de normalização, resolução e aplicação, compartilhado pelo script bloqueante anterior ao CSS e pelo store Angular. Ele define `data-color-mode`, `color-scheme` e `theme-color`. O store se inicializa em `afterNextRender`: SSR e a primeira hidratação mantêm o mesmo DOM e seleção inicial; dados do navegador não entram no HTML/cache do servidor. Sem JavaScript, a media query CSS aplica a preferência do SO. Os listeners são únicos por injector e removidos no destroy.

O alternador Claro/Escuro/Sistema aparece no menu desktop/mobile e fora do shell (autenticação/páginas públicas). São botões nativos com `aria-pressed`, legend e foco visível. A seleção não recarrega a rota.

## Tokens

A fonte é `src/styles/color-tokens.css`. Use os tokens semânticos em código novo; aliases `gray-*` e `blue-*` preservam compatibilidade. `@theme inline` faz as utilities consumirem primitivas locais, inclusive nos contextos de perfil/exportação.

| Papel | Utilities |
| --- | --- |
| Fundo e superfícies | `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-surface-hover` |
| Texto | `text-content`, `text-content-muted`, `text-content-subtle` |
| Divisórias / controles | `border-line` decorativo; `border-line-strong` em controles |
| Ação / hover / texto | `bg-accent`, `hover:bg-accent-hover`, `text-on-accent` |
| Links / foco | `text-link`, `ring-focus-ring` ou `outline-focus-ring` |
| Feedback | `text-success`, `bg-success-bg`, `border-success-line`; equivalentes `warning`, `danger`, `info` |
| Mídia | `text-on-media`, `bg-media-overlay`; contexto intencionalmente escuro |

Não use hexadecimal avulso para cores de interface nem branco sobre status claros. Não use `prose-invert`: `.prose` centraliza corpo, títulos, links, código, tabelas, listas e citações. Uma divisória decorativa não é a borda de identificação de um campo. Texto normal precisa 4.5:1; controles, foco e texto grande 3:1, considerando o fundo composto real. Feedback deve incluir texto/ícone, não apenas cor.

## Exceções deliberadas

- Capas, avatares, screenshots e artes conservam as cores. Texto sobre mídia recebe overlay/superfície estável.
- Temas comprados do perfil são independentes do modo global. `ProfileThemeContrast` cria contexto local com fundo personalizado e texto preto/branco por luminância; áreas textuais são opacas para não depender da imagem. A decoração permanece ao redor dessas áreas. Estados hover e foco preservam esse contexto. O admin gera cores hex opacas (#RGB/#RRGGBB); valores legados em outros formatos conservam a arte, mas áreas de leitura e exportação usam canvas escuro seguro.
- Exportações usam `.color-mode-fixed-dark` para presets escuros e foreground calculado em fundos personalizados. Assim a escolha global não muda o PNG. Fundos customizados são sólidos na exportação para garantir contraste; estrelas cheias/vazias usam forma, além da cor.
- Sombras, scrims, overlay de mídia, cores de marca e presets exportáveis são valores fixos intencionais. Não são novas paletas de interface.

## PWA e offline

`/color-mode.js` entra no grupo prefetch `/*.js` do service worker. Manifest e ícones válidos mantêm uma cor de splash estática escura, pois o manifest não consegue ler localStorage. Ao abrir o app, o documento resolve a preferência real. O app já aberto permite alternar offline. A configuração existente exclui todas as rotas do fallback de navegação e não promete cold reload offline; esta alteração não modifica essa estratégia.

## Inventário de migração

Shell, menus, busca/filtros, formulários compartilhados, checkboxes/toggles, sheets, dropdowns, notificações/toasts, onboarding/login, feed/reviews/comentários, notícia, listas, comparação, jogo/status/rating, perfil, loja e administração usam a paleta adaptável. Foram removidos `prose-invert`, focos `blue-6`, texto fixo branco em labels e pares de status com contraste insuficiente. O padrão decorativo e o fallback das capas usam superfície adaptável.

## Verificação

Cobrir preferência ausente/inválida/salva, override explícito, mudança do SO, eventos de outras abas/clear, storage indisponível, cleanup e SSR. Verificar produção/prerender, console de hidratação, desktop/mobile, menu por teclado, imagens e perfis com fundo claro/escuro em ambos modos, além do conteúdo rico e exportação. Não assumir que pares isolados garantem contraste sobre imagens e transparências.

Referências: [Tailwind theme inline](https://tailwindcss.com/docs/theme), [Angular hydration](https://angular.dev/guide/hydration), [MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme).

### Evidência da implementação (2026-10-11)

- Build de produção com SSR e 7 rotas prerenderizadas; 117 testes unitários passaram.
- 12 combinações do script pré-pintura (preferência/OS/storage bloqueado) e execução sem globals de navegador passaram.
- Chromium: reload preservou preferência; SO respeitou override; evento real entre duas abas e clear sincronizaram; sem JavaScript o CSS aplicou modo claro do SO.
- Matriz visual com fixtures locais: busca/menu, feed rico, login, jogo, loja e administração em 1440×1000 e 390×844, ambos os modos. Perfis com/sem tema claro/escuro e exportação foram avaliados separadamente.
- ExportNode gerou PNG 1080×1920 em preset escuro e tema claro; o hash de cada fundo foi idêntico com interface clara/escura. Capas/avatares remotos não fizeram parte desse teste.
- `color-mode-contrast.json` registra 30 pares de tokens medidos por luminância sRGB, todos aprovados. A revisão visual adicional cobre composição real e contextos personalizados; o JSON não é uma certificação de todo conteúdo arbitrário publicado.

Dados autenticados na matriz visual são fixtures em memória com rede externa bloqueada; não houve escrita em contas reais. Integração visual autenticada contra produção não faz parte dessa evidência.
- PWA em build de produção servido por SSR: service worker activated/controlando página, `/color-mode.js` no CacheStorage e fetch offline retornando 200. Cliques reais alternaram Claro/Escuro offline (inclusive rota `/sem-conexao`), atualizando DOM/meta/storage; online/reload manteve Claro e Sistema acompanhou o SO. Ícones 192/512 retornaram PNG 200. Não houve NG05/NG0100 nem exceções Runtime; três erros de fetch vieram das chamadas Appwrite bloqueadas pelo harness.
- Matriz final de perfil: 12 combinações (2 modos × sem tema/tema claro/tema escuro × 2 larguras) legíveis, incluindo textos herdados, tabs ativas e contadores. Foco por teclado em 8 combinações personalizadas usa outline local branco/preto de 2px sem clipping/overflow. Toasts de sucesso/erro e diálogo de capa também foram inspecionados nos dois modos e viewports.
