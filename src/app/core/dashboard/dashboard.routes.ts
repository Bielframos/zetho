import { Routes } from '@angular/router';
import { userGuard } from '../auth/auth.guards';
import { DashboardPage } from './pages/dashboard/dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: DashboardPage,
    canMatch: [userGuard],
    title: 'Início',
  },
];
