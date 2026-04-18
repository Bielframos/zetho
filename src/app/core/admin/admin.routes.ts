import { Routes } from '@angular/router';
import { adminGuard } from '../auth/auth.guards';
import { AdminLayout } from './layout/admin-layout';
import { AdminGamesPage } from './pages/admin-games/admin-games';
import { AdminProfilesPage } from './pages/admin-profiles/admin-profiles';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'admin',
    component: AdminLayout,
    canMatch: [adminGuard],
    title: 'Zetho | Painel Admin',
    children: [
      { path: '', redirectTo: 'games', pathMatch: 'full' },
      { path: 'games', component: AdminGamesPage, title: 'Admin | Games' },
      { path: 'perfis', component: AdminProfilesPage, title: 'Admin | Perfis' },
    ],
  },
];
