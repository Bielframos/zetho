import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { NewsDetail, NewsListResponse } from './news.types';

@Injectable({ providedIn: 'root' })
export class NewsService {
  async list(
    params: { page?: number; pageSize?: number; gameId?: string } = {},
  ) {
    const url = new URL('noticias', environment.zethoApiEndpoint);
    if (params.page) url.searchParams.set('page', String(params.page));
    if (params.pageSize)
      url.searchParams.set('pageSize', String(params.pageSize));
    if (params.gameId) url.searchParams.set('gameId', params.gameId);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as NewsListResponse;
  }

  async findBySlug(slug: string) {
    const response = await fetch(
      new URL(
        `noticias/${encodeURIComponent(slug)}`,
        environment.zethoApiEndpoint,
      ),
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return (await response.json()) as NewsDetail;
  }
}
