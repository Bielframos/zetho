import { Routes } from '@angular/router';
import { userGuard } from '../auth/auth.guards';
import { WeeklyLeaderboardPage } from './pages/weekly-leaderboard/weekly-leaderboard';
import { ShopPage } from './pages/shop/shop';

export const ZCOINS_ROUTES: Routes = [
  {
    path: 'zcoins/leaderboard/weekly',
    component: WeeklyLeaderboardPage,
    title: 'Zetho | Placar semanal de Z-Coins',
  },
  {
    path: 'loja',
    canMatch: [userGuard],
    component: ShopPage,
    title: 'Zetho | Loja (Z Shop)',
  },
];
