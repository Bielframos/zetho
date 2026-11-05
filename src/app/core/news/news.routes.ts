import { Routes } from '@angular/router';

export const NEWS_ROUTES: Routes = [
  {
    path: 'noticias',
    loadComponent: () =>
      import('./pages/news-list').then((m) => m.NewsListPage),
  },
  {
    path: 'noticias/:slug',
    loadComponent: () =>
      import('./pages/news-detail').then((m) => m.NewsDetailPage),
  },
];
