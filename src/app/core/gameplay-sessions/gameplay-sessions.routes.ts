import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SessionsListPage } from './pages/sessions-list/sessions-list';

export const requireAuthenticatedUser: CanActivateFn = () =>
  inject(AuthStore).isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/entrar']);

export const GAMEPLAY_SESSIONS_ROUTES: Routes = [
  {
    path: 'sessions',
    component: SessionsListPage,
    canActivate: [requireAuthenticatedUser],
    title: 'Zetho | Jogatina',
  },
];
