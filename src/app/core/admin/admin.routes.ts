import { Routes } from '@angular/router';
import { adminGuard } from '../auth/auth.guards';
import { AdminLayout } from './layout/admin-layout';
import { AdminGamesPage } from './pages/admin-games/admin-games';
import { AdminProfilesPage } from './pages/admin-profiles/admin-profiles';
import { AdminRafflesPage } from './pages/admin-raffles/admin-raffles';
import { AdminThemesPage } from './pages/admin-themes/admin-themes';

/**
 * Filhas de `/admin`, carregadas via `loadChildren` a partir de
 * `app.routes.ts`. O prefixo `admin` vive lá; aqui os paths são relativos.
 */
export const ADMIN_ROUTES_CHILDREN: Routes = [
  {
    path: '',
    component: AdminLayout,
    canMatch: [adminGuard],
    title: 'Zetho | Painel Admin',
    children: [
      { path: '', redirectTo: 'games', pathMatch: 'full' },
      {
        path: 'listas-editoriais',
        loadComponent: () =>
          import('../editorial-lists/editorial-review-page').then(
            (m) => m.EditorialReviewPage,
          ),
        title: 'Admin | Listas editoriais',
      },
      { path: 'games', component: AdminGamesPage, title: 'Admin | Games' },
      { path: 'perfis', component: AdminProfilesPage, title: 'Admin | Perfis' },
      {
        path: 'sorteios',
        component: AdminRafflesPage,
        title: 'Admin | Sorteios',
      },
      { path: 'temas', component: AdminThemesPage, title: 'Admin | Temas' },
    ],
  },
];
