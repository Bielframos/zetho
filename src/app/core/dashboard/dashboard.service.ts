import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface CommunityHighlight {
  $id: string;
  _highlightType: 'rating' | 'comment';
  content?: string;
  rating?: number;
  voteCount?: number;
  $createdAt: string;
  userProfile?: { gamertag: string; avatarUrl: string | null } | null;
  gameId?: string;
  game?: { name: string; slug: string; coverUrl: string | null } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  async getCommunityHighlights(page: number = 1, pageSize: number = 12): Promise<{ items: CommunityHighlight[], hasMore: boolean }> {
    const url = new URL('gazetho-public/community-highlights', environment.zethoApiEndpoint);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('pageSize', pageSize.toString());
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch highlights: ${response.statusText}`);
    }

    return await response.json();
  }
}
