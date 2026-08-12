import { Routes } from '@angular/router';
import { NewsDetailPage } from './pages/news-detail';
import { NewsListPage } from './pages/news-list';

export const NEWS_ROUTES: Routes = [
  { path: 'noticias', component: NewsListPage },
  { path: 'noticias/:slug', component: NewsDetailPage },
];
