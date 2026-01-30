import { Routes } from '@angular/router';
import { SearchPage } from './pages/search/search';

export const SEARCH_ROUTES: Routes = [
  { path: 'buscar', component: SearchPage, title: 'Zetho | Busque um jogo' },
];
