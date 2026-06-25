import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

type ProfileSummary = {
  gamertag: string;
  avatarUrl: string | null;
};

type GameSummary = {
  name: string;
  slug: string;
  coverUrl: string | null;
};

export interface DashboardFeedItem {
  $id: string;
  type: 'rating' | 'comment' | 'list';
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  rating?: number;
  voteCount?: number;
  likeCount?: number;
  saveCount?: number;
  itemCount?: number;
  latestAdditions?: string[];
  $createdAt: string;
  userProfile?: ProfileSummary | null;
  gameId?: string;
  game?: GameSummary | null;
}

export interface TrendingListItem {
  $id: string;
  ownerFingerprint: string;
  title: string;
  slug: string;
  description?: string;
  itemCount: number;
  likeCount: number;
  saveCount: number;
  latestAdditions: string[];
  likedByMe: boolean;
  savedByMe: boolean;
  author?: ProfileSummary | null;
}

export interface ListSocialState {
  listId: string;
  likeCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private authStore = inject(AuthStore);

  private async getAuthHeaders(includeContentType = false) {
    const headers: Record<string, string> = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.authStore.isAuthenticated()) {
      const token = await this.authStore.getJwt();
      headers['Authorization'] = `Bearer ${token}`;

      const fallbackCookie = localStorage.getItem('cookieFallback');
      if (fallbackCookie) {
        headers['x-appwrite-session'] = fallbackCookie;
      }
    }

    return headers;
  }

  async getPersonalFeed(
    page: number = 1,
    pageSize: number = 12,
  ): Promise<{ items: DashboardFeedItem[]; hasMore: boolean }> {
    const url = new URL('dashboard/feed', environment.zethoApiEndpoint);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('pageSize', pageSize.toString());
    const response = await fetch(url.toString(), {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch personal feed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getTrendingLists(limit = 12): Promise<{ items: TrendingListItem[] }> {
    const url = new URL('lists/trending', environment.zethoApiEndpoint);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trending lists: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSavedLists(
    page: number = 1,
    pageSize: number = 12,
  ): Promise<{ items: TrendingListItem[]; hasMore: boolean }> {
    const url = new URL('lists/saved', environment.zethoApiEndpoint);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('pageSize', pageSize.toString());

    const response = await fetch(url.toString(), {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch saved lists: ${response.statusText}`);
    }

    return await response.json();
  }

  async getListSocialState(listId: string): Promise<ListSocialState> {
    const response = await fetch(
      new URL(`lists/${listId}/social`, environment.zethoApiEndpoint),
      { headers: await this.getAuthHeaders() },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch list social state: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  async toggleListLike(listId: string): Promise<ListSocialState> {
    return this.toggleListAction(listId, 'like');
  }

  async toggleListSave(listId: string): Promise<ListSocialState> {
    return this.toggleListAction(listId, 'save');
  }

  private async toggleListAction(listId: string, action: 'like' | 'save') {
    const response = await fetch(
      new URL(`lists/${listId}/${action}`, environment.zethoApiEndpoint),
      {
        method: 'POST',
        headers: await this.getAuthHeaders(true),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Failed to ${action} list`);
    }

    return (await response.json()) as ListSocialState;
  }
}
