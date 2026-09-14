import { Routes } from '@angular/router';
import { RankingPage } from './pages/ranking/ranking';

export const RANKING_ROUTES: Routes = [
  {
    path: 'ranking',
    component: RankingPage,
    title: 'Zetho | Rankings & Placares',
  },
];
