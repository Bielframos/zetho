# Perfil e expansor — issue #131

Capturas diretas do Chromium, com fixtures locais estáveis e rede externa bloqueada. Não representam autenticação nem mutações contra produção. Base antes: correção #125 integrada (`d4657c6`); depois: implementação desta PR. A seleção de tema global foi feita no store real; o tema equipado e a biblioteca são fixtures em memória.

| Contexto | Antes | Depois |
| --- | --- | --- |
| Desktop claro, sem tema | [Antes](before-light-1440.png) | [Depois](after-light-1440.png) |
| Desktop escuro, tema claro equipado | [Antes](before-dark-1440.png) | [Depois](after-dark-1440.png) |
| Mobile claro, sem tema | [Antes](before-light-390.png) | [Depois](after-light-390.png) |
| Mobile escuro, tema claro equipado | [Antes](before-dark-390.png) | [Depois](after-dark-390.png) |

## Medidas e interações

1440×1000 e 390×844, painel recolhido, início da página:

| Contexto | Topo da grade antes | Depois | Depois com botão `display:none` |
| --- | ---: | ---: | ---: |
| Desktop claro/escuro | 44 px | 0 px | 0 px |
| Mobile claro | 415 px | 231 px | 231 px |
| Mobile escuro/tema | 423 px | 235 px | 235 px |

A redução mobile também inclui a nova composição da identificação. Ocultar somente o botão no depois não muda a grade. Hit test 15 px à direita do expansor encontra a capa, sem camada interceptando a área restante. Ambos os controles medem 44×44 px. Nome longo é truncado sem deslocar a ação social; nome acessível conserva o gamertag completo.

O painel aberto mantém select de 256 px no desktop e 147 px no mobile, sem interseção com o expansor. As opções completas são legíveis no dropdown. Selecionar ano de lançamento preservou `t=playing` e `custom=keep` na URL; Enter recolheu o painel com foco visível. Rolagem mantém o botão ligado ao topo da biblioteca, sem faixa sticky extra.

Enter na ação social executou um POST simulado e atualizou a ação para “Deixar de seguir”; novo Enter executou um DELETE simulado e restaurou “Seguir”. Foco foi recuperado após cada operação. A variante padrão das sugestões de feed/onboarding mantém rótulo e confirmação existentes; apenas o perfil usa a variante de ícone.

O erro de conexão em um perfil mobile sem bio/social foi exercitado. O feedback inicialmente ultrapassava 12 px da borda do card; o clipping agora fica na arte e o card permite overflow somente enquanto apresenta esse feedback. Mensagem e botão de recuperação permanecem completos acima da biblioteca. Não há reserva de altura no estado normal.

Validação automatizada: 136 testes passaram, incluindo a variante de ícone (ação explícita, nome acessível, bloqueio de repetição) e as garantias anteriores de sessão, concorrência, reconciliação e recuperação de foco.
