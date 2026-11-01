import { Routes } from '@angular/router';

export const FORUM_ROUTES: Routes = [
  {
    path: 'forum/:slug/respostas/:parentId',
    loadComponent: () =>
      import('./pages/forum-replies-page').then((m) => m.ForumRepliesPage),
  },
  {
    path: 'forum',
    loadComponent: () =>
      import('./pages/forum-feed/forum-feed').then((m) => m.ForumFeedPage),
  },
  {
    path: 'forum/:slug',
    loadComponent: () =>
      import('./pages/forum-post/forum-post').then((m) => m.ForumPostPage),
  },
];
