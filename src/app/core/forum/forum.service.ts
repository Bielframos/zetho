import { inject, Injectable } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { CommentRow } from '../comments/comment.types';
import { SocialApi } from '../../shared/infra/social-api';
import {
  ForumPostDetailResponse,
  ForumPostsPageResponse,
  ForumRepliesPageResponse,
  ForumSort,
} from './forum.types';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly api = inject(SocialApi);
  private readonly authStore = inject(AuthStore);

  async getPosts(params: {
    page?: number;
    pageSize?: number;
    gameId?: string;
    gameSlug?: string;
    sort?: ForumSort;
  } = {}): Promise<ForumPostsPageResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.gameId) query.set('gameId', params.gameId);
    if (params.gameSlug) query.set('gameSlug', params.gameSlug);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const path = `forum/posts${qs ? `?${qs}` : ''}`;
    return this.getWithOptionalAuth<ForumPostsPageResponse>(path);
  }

  async getPostBySlugOrId(
    slugOrId: string,
    params: { commentId?: string | null; sort?: ForumSort } = {},
  ): Promise<ForumPostDetailResponse | null> {
    const query = new URLSearchParams();
    if (params.commentId) query.set('commentId', params.commentId);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const path = `forum/posts/${encodeURIComponent(slugOrId)}${qs ? `?${qs}` : ''}`;
    try {
      return await this.getWithOptionalAuth<ForumPostDetailResponse>(path);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async getReplies(
    parentId: string,
    params: { page?: number; pageSize?: number; sort?: ForumSort } = {},
  ): Promise<ForumRepliesPageResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const path = `forum/comments/${encodeURIComponent(parentId)}/replies${qs ? `?${qs}` : ''}`;
    return this.getWithOptionalAuth<ForumRepliesPageResponse>(path);
  }

  async createPost(input: {
    gameId: string;
    title: string;
    content: string;
  }): Promise<CommentRow> {
    return this.api.request<CommentRow>('social/comments', 'POST', {
      gameId: input.gameId,
      title: input.title,
      content: input.content,
    });
  }

  async createReply(input: {
    gameId: string;
    parentId: string;
    content: string;
  }): Promise<CommentRow> {
    return this.api.request<CommentRow>('social/comments', 'POST', {
      gameId: input.gameId,
      parentId: input.parentId,
      content: input.content,
    });
  }

  async updateComment(
    commentId: string,
    input: { title?: string; content: string },
  ): Promise<CommentRow> {
    return this.api.request<CommentRow>(
      `social/comments/${encodeURIComponent(commentId)}`,
      'PATCH',
      input,
    );
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.api.request<void>(
      `social/comments/${encodeURIComponent(commentId)}`,
      'DELETE',
    );
  }

  async voteComment(
    commentId: string,
    type: 'up' | 'down' | null,
  ): Promise<{ voteCount: number; viewerVote: 'up' | 'down' | null }> {
    return this.api.request<{
      voteCount: number;
      viewerVote: 'up' | 'down' | null;
    }>(`social/comments/${encodeURIComponent(commentId)}/vote`, 'POST', {
      type,
    });
  }

  private async getWithOptionalAuth<T>(path: string): Promise<T> {
    if (this.authStore.isAuthenticated()) {
      try {
        return await this.api.request<T>(path, 'GET');
      } catch (error) {
        if (this.isNotFoundError(error)) {
          throw error;
        }
        return this.api.requestPublic<T>(path);
      }
    }

    return this.api.requestPublic<T>(path);
  }

  private isNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.message.includes('404') ||
      error.message.includes('not_found') ||
      error.message.includes('não encontrada')
    );
  }
}
