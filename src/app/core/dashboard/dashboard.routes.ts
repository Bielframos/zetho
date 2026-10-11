import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { userGuard } from '../auth/auth.guards';
import { DashboardPage } from './pages/dashboard/dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'dashboard',
    pathMatch: 'full',
    redirectTo: ({ queryParams, fragment }) =>
      inject(Router).createUrlTree(['/feed'], { queryParams, fragment: fragment ?? undefined }),
  },
  {
    path: 'feed',
    component: DashboardPage,
    canMatch: [userGuard],
    title: 'Feed — Zetho',
  },
];
