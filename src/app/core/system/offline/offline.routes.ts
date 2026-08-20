import { Routes } from '@angular/router';
import { OfflinePage } from './pages/offline';

export const OFFLINE_ROUTES: Routes = [
  {
    path: 'sem-conexao',
    component: OfflinePage,
  },
];
