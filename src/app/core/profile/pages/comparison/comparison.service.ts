import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../../../shared/infra/social-api';

export type ComparisonView = 'common' | 'opinions' | 'discoveries';
export type ComparisonOrder = 'similar' | 'different';
export interface ComparisonRow {
  game: { id: string; name: string; slug: string; coverUrl: string | null };
  me: { status: string | null; rating: number | null };
  other: { status: string | null; rating: number | null };
  difference: number | null;
}
export interface ComparisonPageResult {
  me: { id: string; gamertag: string };
  other: { id: string; gamertag: string };
  rows: ComparisonRow[];
  total: number;
  offset: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private api = inject(SocialApi);
  load(
    gamertag: string,
    view: ComparisonView,
    order: ComparisonOrder,
    offset: number,
  ) {
    const params = new URLSearchParams({
      view,
      order,
      offset: String(offset),
      limit: '20',
    });
    return this.api.request<ComparisonPageResult>(
      `profile/${encodeURIComponent(gamertag)}/compare?${params}`,
      'GET',
    );
  }
}
