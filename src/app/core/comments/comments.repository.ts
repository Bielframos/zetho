import { Injectable, inject } from '@angular/core';
import { SocialApi } from '../../shared/infra/social-api';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';
import { CommentRow } from './comment.types';

export type CommentInput = {
  gameId: string;
  userProfileId: string;
  title?: string;
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
      title: input.title,
      content: input.content,
      parentId: input.parentId,
    });
  }

  async update(commentId: string, input: { title?: string; content: string }) {
    return this.api.request<CommentRow>(
      `social/comments/${encodeURIComponent(commentId)}`,
      'PATCH',
      input,
    );
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
      `social/comments/${encodeURIComponent(commentId)}/vote`,
      'POST',
      { type },
    );
  }

  async delete(commentId: string) {
    return this.api.request<void>(
      `social/comments/${encodeURIComponent(commentId)}`,
      'DELETE',
    );
  }
}
