import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './core/auth/auth.routes';
import { CHANGELOG_ROUTES } from './core/changelog/changelog.routes';
import { DASHBOARD_ROUTES } from './core/dashboard/dashboard.routes';
import { GAME_ROUTES } from './core/games/game.routes';
import { LANDING_ROUTES } from './core/landing/landing.routes';
import { LEGAL_ROUTES } from './core/legal/legal.routes';
import { NOT_FOUND_ROUTES } from './core/system/notFound/notFound.routes';
import { OFFLINE_ROUTES } from './core/system/offline/offline.routes';
import { ONBOARDING_ROUTES } from './core/onboarding/onboarding.routes';
import { PROFILE_ROUTES } from './core/profile/profile.routes';
import { RAFFLES_ROUTES } from './core/raffles/raffles.routes';
import { SEARCH_ROUTES } from './core/search/search.routes';
import { ZCOINS_ROUTES } from './core/zCoins/zcoins.routes';
import { RANKING_ROUTES } from './core/ranking/ranking.routes';
import { GAMEPLAY_SESSIONS_ROUTES } from './core/gameplay-sessions/gameplay-sessions.routes';
import { NEWS_ROUTES } from './core/news/news.routes';
import { environment } from '../environments/environment';
import { userGuardWithSsr } from './core/auth/auth.guards';

export const routes: Routes = [
  ...LANDING_ROUTES,
  ...CHANGELOG_ROUTES,
  ...LEGAL_ROUTES,
  ...AUTH_ROUTES,
  // Carregada sob demanda: o admin arrasta `ngx-tiptap` + `@tiptap/*` junto.
  // Como a rota é `RenderMode.Client` e nunca renderiza no servidor, manter
  // esse peso no bundle inicial (e no do servidor) é desperdício puro.
  {
    path: 'admin',
    loadChildren: () =>
      import('./core/admin/admin.routes').then((m) => m.ADMIN_ROUTES_CHILDREN),
  },
  ...GAMEPLAY_SESSIONS_ROUTES,
  {
    path: 'recomendacoes',
    canMatch: [userGuardWithSsr],
    title: 'Zetho | Seu próximo jogo',
    loadComponent: () =>
      import('./core/game-recommender/game-recommender').then(
        (m) => m.GameRecommenderPage,
      ),
  },
  ...GAME_ROUTES,
  ...NEWS_ROUTES,
  {
    path: 'reviews',
    loadComponent: () =>
      import('./core/ratings/pages/reviews-feed/reviews-feed').then(
        (m) => m.ReviewsFeedPage,
      ),
  },
  {
    path: 'listas',
    loadComponent: () =>
      import('./core/lists/pages/public-lists/public-lists').then(
        (m) => m.PublicListsPage,
      ),
  },
  ...(environment.features.raffles ? RAFFLES_ROUTES : []),
  ...SEARCH_ROUTES,
  ...OFFLINE_ROUTES,
  ...DASHBOARD_ROUTES,
  ...ONBOARDING_ROUTES,
  ...PROFILE_ROUTES,
  ...ZCOINS_ROUTES,
  ...RANKING_ROUTES,
  ...NOT_FOUND_ROUTES,
];
