import { AppProfileLayout } from '../../shared/app/profile-layout/profile-layout';
import { ConnectionsPage } from './pages/connections/connections';
import { ListPage } from './pages/list/list';
import { ListsPage } from './pages/lists/lists';
import { ProfilePage } from './pages/profile/profile';
import { profileResolver } from './profile.resolver';

export const PROFILE_ROUTES = [
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
