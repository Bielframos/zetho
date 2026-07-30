import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from './core/admin/admin.routes';
import { AUTH_ROUTES } from './core/auth/auth.routes';
import { CHANGELOG_ROUTES } from './core/changelog/changelog.routes';
import { DASHBOARD_ROUTES } from './core/dashboard/dashboard.routes';
import { GAME_ROUTES } from './core/games/game.routes';
import { LANDING_ROUTES } from './core/landing/landing.routes';
import { NOT_FOUND_ROUTES } from './core/notFound/notFound.routes';
import { OFFLINE_ROUTES } from './core/offline/offline.routes';
import { ONBOARDING_ROUTES } from './core/onboarding/onboarding.routes';
import { PROFILE_ROUTES } from './core/profile/profile.routes';
import { RAFFLES_ROUTES } from './core/raffles/raffles.routes';
import { SEARCH_ROUTES } from './core/search/search.routes';
import { ZCOINS_ROUTES } from './core/zCoins/zcoins.routes';
import { GAMEPLAY_SESSIONS_ROUTES } from './core/gameplay-sessions/gameplay-sessions.routes';
import { environment } from '../environments/environment';

export const routes: Routes = [
  ...LANDING_ROUTES,
  ...CHANGELOG_ROUTES,
  ...AUTH_ROUTES,
  ...ADMIN_ROUTES,
  ...GAMEPLAY_SESSIONS_ROUTES,
  ...GAME_ROUTES,
  ...(environment.features.raffles ? RAFFLES_ROUTES : []),
  ...SEARCH_ROUTES,
  ...OFFLINE_ROUTES,
  ...DASHBOARD_ROUTES,
  ...ONBOARDING_ROUTES,
  ...PROFILE_ROUTES,
  ...ZCOINS_ROUTES,
  ...NOT_FOUND_ROUTES,
];
