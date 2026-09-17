import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SessionsListPage } from './pages/sessions-list/sessions-list';
import { SessionDetailPage } from './pages/session-detail/session-detail';

/** Assíncrono pelo mesmo motivo dos guards em `auth.guards.ts`. */
export const requireAuthenticatedUser: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await authStore.ready;

  return authStore.isAuthenticated() ? true : router.createUrlTree(['/entrar']);
};

export const GAMEPLAY_SESSIONS_ROUTES: Routes = [
  {
    path: 'jogatina/:id',
    component: SessionDetailPage,
    title: 'Jogatina | Zetho',
  },
  {
    path: 'sessions',
    component: SessionsListPage,
    canActivate: [requireAuthenticatedUser],
    title: 'Zetho | Jogatina',
  },
];
