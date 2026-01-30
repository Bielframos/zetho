import { Routes } from '@angular/router';
import { userGuard } from './core/auth/auth.guards';
import { AUTH_ROUTES } from './core/auth/auth.routes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Home } from './pages/home/home';
import { List } from './pages/list/list';
import { Lists } from './pages/lists/lists';
import { Profile } from './pages/profile/profile';
import { Search } from './pages/search/search';
import { AppProfileLayout } from './shared/app/profile-layout/profile-layout';

export const routes: Routes = [
  { path: '', component: Home },
  ...AUTH_ROUTES,
  {
    path: 'dashboard',
    component: Dashboard,
    canMatch: [userGuard],
    title: 'Zetho',
  },
  { path: 'buscar', component: Search, title: 'Zetho | Busque um jogo' },
  {
    path: 'player/:gamertag',
    component: AppProfileLayout,
    canMatch: [userGuard],
    children: [
      { path: '', component: Profile },
      { path: 'listas', component: Lists },
      { path: 'listas/:slug', component: List },
    ],
  },
];
