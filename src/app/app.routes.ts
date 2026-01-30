import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './core/auth/auth.routes';
import { DASHBOARD_ROUTES } from './core/dashboard/dashboard.routes';
import { GAME_ROUTES } from './core/games/game.routes';
import { LANDING_ROUTES } from './core/landing/landing.routes';
import { SEARCH_ROUTES } from './core/search/search.routes';
import { PROFILE_ROUTES } from './core/profile/profile.routes';

export const routes: Routes = [
  ...LANDING_ROUTES,
  ...AUTH_ROUTES,
  ...GAME_ROUTES,
  ...SEARCH_ROUTES,
  ...DASHBOARD_ROUTES,
  ...PROFILE_ROUTES,
];
