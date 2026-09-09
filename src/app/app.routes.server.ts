import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Modo de render por rota.
 *
 * Três categorias:
 *
 * - `Prerender` — páginas estáticas sem nenhuma busca de dados. Gerar no build
 *   é de graça e serve do CDN. Só entra aqui o que não depende da API: se
 *   dependesse, uma indisponibilidade da API quebraria o build.
 * - `Server` — páginas com conteúdo que precisa estar no HTML para o Google e
 *   para o revisor humano, mas que muda com frequência. Renderiza sob demanda
 *   e é cacheado na borda.
 * - `Client` — o resto: área logada, admin, fluxos de autenticação e páginas
 *   já marcadas como `noindex`. Não há ganho de SEO e evita-se todo o risco de
 *   executá-las em Node.
 *
 * `/buscar` fica em `Client` de propósito: a rota já é `noindex` e usa
 * `sessionStorage` — resolver por configuração é mais barato que por código.
 *
 * Se uma rota nova de `app.routes.ts` não tiver correspondência aqui, o build
 * falha. É intencional: força a decisão em vez de deixar a rota cair num
 * default silencioso.
 */
/**
 * Cache de borda para as rotas renderizadas sob demanda.
 *
 * `max-age=0` mantém o navegador sempre revalidando: quem já está na página não
 * pode ficar preso a um HTML velho. `s-maxage` vale só para cache compartilhado
 * — é a Vercel servindo a mesma resposta a todo mundo sem invocar a função de
 * novo. `stale-while-revalidate` de 24h faz a borda entregar a cópia vencida na
 * hora e renovar em segundo plano, então o custo do render nunca cai sobre um
 * visitante.
 *
 * É seguro compartilhar a resposta entre visitantes porque o servidor renderiza
 * sempre deslogado: o initializer que resolve a sessão vive em
 * `app.config.browser.ts` e não roda em Node. Se algum dia o SSR passar a
 * enxergar a sessão, estes headers precisam sair junto — caso contrário a
 * página de um usuário é servida para o próximo.
 */
const EDGE_CACHE_5_MIN = {
  'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
};

/**
 * Notícia individual muda menos que uma listagem: o texto é imutável depois de
 * publicado, só o entorno se mexe.
 */
const EDGE_CACHE_10_MIN = {
  'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
};

export const serverRoutes: ServerRoute[] = [
  // Estáticas puras — sem chamada de API.
  { path: 'institucional', renderMode: RenderMode.Prerender },
  { path: 'privacidade', renderMode: RenderMode.Prerender },
  { path: 'termos', renderMode: RenderMode.Prerender },
  { path: 'politica-editorial', renderMode: RenderMode.Prerender },
  { path: 'sobre', renderMode: RenderMode.Prerender },
  { path: 'contato', renderMode: RenderMode.Prerender },
  // Obrigatoriamente prerenderizada: é o fallback offline do service worker.
  { path: 'sem-conexao', renderMode: RenderMode.Prerender },

  // Conteúdo público renderizado no servidor.
  { path: 'landing', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  { path: 'jogo/:slug', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  { path: 'noticias', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  { path: 'noticias/:slug', renderMode: RenderMode.Server, headers: EDGE_CACHE_10_MIN },
  { path: 'reviews', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  { path: 'listas', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  {
    path: 'recomendacoes',
    renderMode: RenderMode.Server,
    headers: EDGE_CACHE_5_MIN,
  },
  { path: 'player/:gamertag', renderMode: RenderMode.Server, headers: EDGE_CACHE_5_MIN },
  {
    path: 'player/:gamertag/listas',
    renderMode: RenderMode.Server,
    headers: EDGE_CACHE_5_MIN,
  },
  {
    path: 'player/:gamertag/listas/:slug',
    renderMode: RenderMode.Server,
    headers: EDGE_CACHE_5_MIN,
  },
  {
    path: 'player/:gamertag/conexoes',
    renderMode: RenderMode.Server,
    headers: EDGE_CACHE_5_MIN,
  },
  {
    path: 'zcoins/leaderboard/weekly',
    renderMode: RenderMode.Server,
    headers: EDGE_CACHE_5_MIN,
  },

  // 404 precisa de status HTTP real, não só do visual da página.
  // Sem cache de propósito: uma URL que hoje é 404 costuma ser conteúdo novo
  // amanhã, e cachear a negativa atrasaria a descoberta pelo crawler.
  { path: '404', renderMode: RenderMode.Server, status: 404 },

  // Área logada, admin, autenticação e busca: renderizadas só no cliente.
  // Precisam estar enumeradas porque o catch-all abaixo responde 404.
  { path: '', renderMode: RenderMode.Client },
  { path: 'changelog', renderMode: RenderMode.Client },
  { path: 'entrar', renderMode: RenderMode.Client },
  { path: 'registrar', renderMode: RenderMode.Client },
  { path: 'recuperar-senha', renderMode: RenderMode.Client },
  { path: 'redefinir-senha', renderMode: RenderMode.Client },
  { path: 'verificacao', renderMode: RenderMode.Client },
  { path: 'comecar', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'minha-conta', renderMode: RenderMode.Client },
  { path: 'buscar', renderMode: RenderMode.Client },
  { path: 'loja', renderMode: RenderMode.Client },
  { path: 'sessions', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'sorteios/**', renderMode: RenderMode.Client },

  // Catch-all com status real. Sem isso, qualquer URL inexistente devolvia 200
  // com o visual de 404 — soft-404: o Google mantém a URL elegível para
  // indexação e ela continua consumindo crawl budget.
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
