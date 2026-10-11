import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

export type RecommendationScope = 'any' | 'library' | 'new';
export interface RecommendationQuota {
  cost: number;
  limit: number;
  remaining: number;
  nextAvailableAt: string;
}
export interface GameRecommendation {
  quota?: RecommendationQuota;
  id: string;
  source: 'library' | 'new';
  game: {
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
    releaseYear: string | null;
    genres: string[];
    ratingAvg: number | null;
  };
  reason: string;
  matchSignals: string[];
  basedOnGames: { id: string; name: string }[];
  cost: number;
  balance: number;
  generatedAt: string;
}
export interface RecommendationHistory {
  quota?: RecommendationQuota;
  items: GameRecommendation[];
  nextCursor: string | null;
}
export class RecommendationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly nextAvailableAt?: string,
  ) {
    super(`Recommendation request failed (${status})`);
  }
}

@Injectable({ providedIn: 'root' })
export class GameRecommenderService {
  private readonly auth = inject(AuthStore);

  suggest(scope: RecommendationScope, key: string) {
    return this.request<GameRecommendation>('', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ scope }),
    });
  }

  history(cursor?: string | null) {
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.set('cursor', cursor);
    return this.request<RecommendationHistory>(`?${params}`, { method: 'GET' });
  }

  private async request<T>(suffix: string, init: RequestInit): Promise<T> {
    const jwt = await this.auth.getJwt();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${jwt}`);
    headers.set('Content-Type', 'application/json');
    const response = await fetch(
      new URL(
        `agents/game-recommender/suggestions${suffix}`,
        environment.zethoApiEndpoint,
      ),
      {
        ...init,
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      let details: { code?: unknown; nextAvailableAt?: unknown } = {};
      try {
        details = (await response.json()) as typeof details;
      } catch {
        /* Some infrastructure errors do not return JSON. */
      }
      throw new RecommendationError(
        response.status,
        typeof details.code === 'string' ? details.code : undefined,
        typeof details.nextAvailableAt === 'string'
          ? details.nextAvailableAt
          : undefined,
      );
    }
    return response.json() as Promise<T>;
  }
}
