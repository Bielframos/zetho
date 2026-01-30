import { AppProfileLayout } from '../../shared/app/profile-layout/profile-layout';
import { userGuard } from '../auth/auth.guards';
import { ListPage } from './pages/list/list';
import { ListsPage } from './pages/lists/lists';
import { ProfilePage } from './pages/profile/profile';

export const PROFILE_ROUTES = [
  {
    path: 'player/:gamertag',
    component: AppProfileLayout,
    canMatch: [userGuard],
    children: [
      { path: '', component: ProfilePage },
      { path: 'listas', component: ListsPage },
      { path: 'listas/:slug', component: ListPage },
    ],
  },
];
