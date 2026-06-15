import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

export interface RatingRow {
  $id: string;
  gameId: string;
  ownerFingerprint: string;
  rating: number;
  title?: string;
  content?: string;
  $createdAt: string;
  $updatedAt: string;
  profile?: {
    gamertag: string;
    avatarUrl: string | null;
  } | null;
  voteCount?: number;
}

export interface RatingsListResponse {
  items: RatingRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private authStore = inject(AuthStore);

  private async getAuthHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authStore.isAuthenticated()) {
      try {
        const token = await this.authStore.getJwt();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.warn('Failed to retrieve JWT for ratings request', err);
      }
      const fallbackCookie = localStorage.getItem('cookieFallback');
      if (fallbackCookie) {
        headers['x-appwrite-session'] = fallbackCookie;
      }
    }

    return headers;
  }

  async getRatings(gameId: string, page = 1, pageSize = 10): Promise<RatingsListResponse> {
    const url = new URL(`ratings/${gameId}?page=${page}&pageSize=${pageSize}`, environment.zethoApiEndpoint);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch ratings: ${response.statusText}`);
    }

    return await response.json();
  }

  async getMyRating(gameId: string): Promise<RatingRow | null> {
    if (!this.authStore.isAuthenticated()) return null;

    const url = new URL(`ratings/${gameId}/me`, environment.zethoApiEndpoint);
    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), { headers });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to fetch my rating: ${response.statusText}`);
    }

    return await response.json();
  }

  async upsertRating(
    gameId: string,
    payload: { rating: number; title?: string; content?: string },
  ): Promise<RatingRow> {
    const url = new URL(`ratings/${gameId}`, environment.zethoApiEndpoint);
    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to submit rating: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteRating(gameId: string): Promise<void> {
    const url = new URL(`ratings/${gameId}`, environment.zethoApiEndpoint);
    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete rating: ${response.statusText}`);
    }
  }

  async voteRating(ratingId: string, operation: 'up' | 'down'): Promise<{ success: boolean; delta: number; operation: 'up'|'down'; newVoteCount: number }> {
    const url = new URL(`ratings/vote/${ratingId}`, environment.zethoApiEndpoint);
    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ operation }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to vote on rating: ${response.statusText}`);
    }

    return await response.json();
  }
}
