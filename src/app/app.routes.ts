import { Routes } from '@angular/router';
import { userGuard } from './core/auth/auth.guards';
import { AUTH_ROUTES } from './core/auth/auth.routes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Home } from './pages/home/home';
import { List } from './pages/list/list';
import { Lists } from './pages/lists/lists';
import { Profile } from './pages/profile/profile';
import { AppProfileLayout } from './shared/app/profile-layout/profile-layout';
import { GAME_ROUTES } from './core/games/game.routes';
import { SEARCH_ROUTES } from './core/search/search.routes';

export const routes: Routes = [
  { path: '', component: Home },
  ...AUTH_ROUTES,
  ...GAME_ROUTES,
  ...SEARCH_ROUTES,
  {
    path: 'dashboard',
    component: Dashboard,
    canMatch: [userGuard],
    title: 'Zetho',
  },
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
