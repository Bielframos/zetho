# Restauração de temas e seletor — #136

## Referência histórica

O commit [**`1bfc6c1c55fa2f6548f9a00fa68ad2575a0bb7bf`**](https://github.com/Bielframos/zerei/commit/1bfc6c1c55fa2f6548f9a00fa68ad2575a0bb7bf), release **1.33.1 / PR #118**, é o primeiro pai de `835ddaa` (merge da PR #121 que implementou #117). É a versão imediatamente anterior ao modo claro. Um worktree detached desse commit foi executado para capturar a referência com a mesma fixture da versão corrigida.

O histórico aplica cor primária com **18%** de opacidade a hover, tab ativa e badges; hover da tab ativa/badge ativo usa **30%**. Bordas misturam **58%** da cor secundária com gray-6. Chips e ações são transparentes em repouso. A imagem usa `linear-gradient(to bottom, transparent, black 60%)`, opacidade **.5** no perfil desktop e **.4** no mobile/card de conta. Os valores terciários permanecem nos dados, sem inventar um novo uso onde o histórico não os utilizava.

Restauramos essas regras e removemos as placas/paddings por elemento introduzidos posteriormente. A paleta fixa local e seus aliases impedem a interferência da aparência global, sem afetar o restante da aplicação. A linha de identificação/ação e o expansor sobreposto de #131 continuam presentes, portanto as capturas não pretendem igualar layouts históricos por pixel.

**Exceção específica de acessibilidade:** a referência mantém texto claro até em fundo personalizado claro. A correção usa foreground preto nesse caso, sem modificar transparências nem criar superfícies adicionais. Foco também acompanha o foreground. O popup de erro (posterior à referência histórica) mantém sua superfície original escura e texto/foco claros próprios.

## Comparação com a mesma fixture

Capturas diretas do Chromium, 1440×1000 e 390×844. `color/image` descrevem o tipo de fixture; `dark/light` no nome do tema descreve o fundo personalizado, não a aparência global.

| Tema / fundo / largura | Antes de #117 | Corrigido, global escuro | Corrigido, global claro |
| --- | --- | --- | --- |
| color / dark / 1440 | [Histórico](reference-color-dark-1440.png) | [Escuro](after-dark-color-dark-1440.png) | [Claro](after-light-color-dark-1440.png) |
| color / dark / 390 | [Histórico](reference-color-dark-390.png) | [Escuro](after-dark-color-dark-390.png) | [Claro](after-light-color-dark-390.png) |
| color / light / 1440 | [Histórico](reference-color-light-1440.png) | [Escuro](after-dark-color-light-1440.png) | [Claro](after-light-color-light-1440.png) |
| color / light / 390 | [Histórico](reference-color-light-390.png) | [Escuro](after-dark-color-light-390.png) | [Claro](after-light-color-light-390.png) |
| image / dark / 1440 | [Histórico](reference-image-dark-1440.png) | [Escuro](after-dark-image-dark-1440.png) | [Claro](after-light-image-dark-1440.png) |
| image / dark / 390 | [Histórico](reference-image-dark-390.png) | [Escuro](after-dark-image-dark-390.png) | [Claro](after-light-image-dark-390.png) |
| image / light / 1440 | [Histórico](reference-image-light-1440.png) | [Escuro](after-dark-image-light-1440.png) | [Claro](after-light-image-light-1440.png) |
| image / light / 390 | [Histórico](reference-image-light-390.png) | [Escuro](after-dark-image-light-390.png) | [Claro](after-light-image-light-390.png) |

[Fixture compartilhada](fixture.json), [estilos históricos](reference-styles.json), [estilos corrigidos](restored-styles.json).

A comparação programática dos oito contextos confirmou fundos de card/chips/tabs iguais aos históricos. Os oito pares de aparência global clara/escura conservaram as mesmas cores personalizadas e composição. A diferença intencional de foreground em temas claros está explicitada acima.

## Seletor

[Desktop claro](selector-light-1440.png), [desktop escuro](selector-dark-1440.png), [mobile claro](selector-light-390.png), [mobile escuro](selector-dark-390.png).

[Medições](selector-measurements.json): aparência **28×28 px**, alvos **44×44 px**, grupo **132 px**, sem expansão. Margem esquerda igual à navegação: **1039 px** no desktop da fixture e **23 px** no menu mobile. Enter, nome acessível, foco visível, preferência após reload, eventos de storage e Sistema acompanhando o SO passaram.

## Escopo e limites da QA

- 24 combinações de próprio perfil/terceiro, desktop/mobile, sem tema/tema claro/tema escuro e aparência global clara/escura: sem overflow, sem classes/propriedades/imagens residuais após navegação; o restante da aplicação continua seguindo o modo global. [Matriz](navigation-matrix.json).
- Popup de erro em tema claro: texto/retry brancos sobre rgb(24,25,27), foco branco de 2 px, hit test válido; nenhum fundo adicional no estado normal.
- 136 testes automatizados passaram, incluindo isolamento/cleanup da paleta, temas somente com imagem, preferência global, corridas de carregamento e conexões.
- Fixtures sintéticas de cor/imagem, incluindo fundo claro para exercitar contraste; não representam auditoria do catálogo real de temas. Dados e sinais de perfil/tema foram injetados em memória, com transporte externo bloqueado. Não houve autenticação nem mutações em produção.

### Acesso direto, reload e temas sem cor explícita

[16 casos de acesso direto/reload](direct-reload.json): próprio perfil/terceiro × desktop/mobile × fundo personalizado claro/escuro × entrada/reload. Perfis e temas foram carregados pelo transporte Appwrite simulado, sem injetar sinais dos stores. **Limite:** o documento `/player/...` recebeu o shell Angular local de `/buscar`; valida bootstrap client/reload, não SSR autenticado nem integração de produção. A preferência persistida e a classe/paleta local foram preservadas.

[4 casos de tema somente com imagem](image-only.json): desktop/mobile × aparência global clara/escura. Sem `backgroundColor`, o card conserva o canvas histórico `#101113`, em vez de revelar o canvas claro global. Essa é a base da região inteira que antes deixava o app escuro aparecer; não são placas atrás de elementos. Imagem e chips transparentes permanecem visíveis, texto `#edeef0` e nenhuma mudança nos dados equipados. Após esse ajuste pontual, os 3 testes finais do contexto foram executados novamente.

Build final de produção aprovado com SSR e 7 rotas prerenderizadas; apenas o aviso preexistente de CommonJS do lexorank.
