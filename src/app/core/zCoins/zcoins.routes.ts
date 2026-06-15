import { Routes } from '@angular/router';
import { WeeklyLeaderboardPage } from './pages/weekly-leaderboard/weekly-leaderboard';

export const ZCOINS_ROUTES: Routes = [
  {
    path: 'zcoins/leaderboard/weekly',
    component: WeeklyLeaderboardPage,
    title: 'Zetho | Placar semanal de Z-Coins',
  },
];
