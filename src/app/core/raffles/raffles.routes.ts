import { Routes } from '@angular/router';
import { userGuard } from '../auth/auth.guards';
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
    canMatch: [userGuard],
    title: 'Zetho | Sorteio',
  },
];
