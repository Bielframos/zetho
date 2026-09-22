import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { appwrite, Query } from '../../shared/infra/appwrite/appwrite.client';
import { CommentRow } from './comment.types';

const TABLE_ID = 'game_comments';

export type CommentInput = {
  gameId: string;
  userProfileId: string;
  content: string;
  parentId?: string;
  depth?: number;
};

export type VoteAction = {
  op: 'add' | 'remove';
  type: 'up' | 'down';
  userId: string;
  prevVoteId: string;
};

@Injectable({ providedIn: 'root' })
export class CommentsRepository {
  private readonly api = inject(SocialApi);
  async create(input: CommentInput) {
    return this.api.request<CommentRow>('social/comments', 'POST', {
      gameId: input.gameId,
      content: input.content,
      parentId: input.parentId,
    });
  }

  async list(queries: any[]) {
    return appwrite.databases.listRows<CommentRow>({
      databaseId: 'app',
      tableId: 'game_comments',
      queries,
    });
  }

  async vote(commentId: string, type: 'up' | 'down' | null) {
    return this.api.request<{ voteCount: number; viewerVote: 'up' | 'down' | null }>(
      `social/comments/${encodeURIComponent(commentId)}/vote`, 'POST', { type },
    );
  }

  async delete(commentId: string) {
    return this.api.request<void>(`social/comments/${encodeURIComponent(commentId)}`, 'DELETE');
  }
}
