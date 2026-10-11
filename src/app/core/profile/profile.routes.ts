import { userGuard } from '../auth/auth.guards';
import { AppProfileLayout } from '../../shared/app/profile-layout/profile-layout';
import { ConnectionsPage } from './pages/connections/connections';
import { ListPage } from './pages/list/list';
import { ListsPage } from './pages/lists/lists';
import { ProfilePage } from './pages/profile/profile';
import { profileResolver } from './profile.resolver';

export const PROFILE_ROUTES = [
  {
    path: 'player/:gamertag/comparar',
    canMatch: [userGuard],
    loadComponent: () =>
      import('./pages/comparison/comparison').then(
        (m) => m.ProfileComparisonPage,
      ),
  },
  {
    path: 'player/:gamertag',
    component: AppProfileLayout,
    resolve: {
      profile: profileResolver,
    },
    children: [
      { path: '', component: ProfilePage },
      { path: 'listas', component: ListsPage },
      { path: 'listas/:slug', component: ListPage },
      { path: 'conexoes', component: ConnectionsPage },
    ],
  },
];
