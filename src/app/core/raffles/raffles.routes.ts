import { Routes } from '@angular/router';
import { RafflesListPage } from './pages/raffles-list/raffles-list';
import { RaffleDetailPage } from './pages/raffle-detail/raffle-detail';

export const RAFFLES_ROUTES: Routes = [
  {
    path: 'sorteios',
    component: RafflesListPage,
    title: 'Zetho | Sorteios',
  },
  {
    path: 'sorteios/:raffleId',
    component: RaffleDetailPage,
    title: 'Zetho | Sorteio',
  },
];
