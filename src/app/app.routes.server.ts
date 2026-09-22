import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
    },
  },
];
