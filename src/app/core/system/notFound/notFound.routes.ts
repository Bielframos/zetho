import { Routes } from '@angular/router';
import { NotFoundPage } from './pages/not-found';

export const NOT_FOUND_ROUTES: Routes = [
  { path: '404', component: NotFoundPage },
  {
    path: '**',
    component: NotFoundPage,
  },
];
