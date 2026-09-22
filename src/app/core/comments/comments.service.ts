import { Injectable } from '@angular/core';
import { Query } from '../../shared/infra/appwrite/appwrite.client';
import { CommentRow } from '../../types';
import { CommentInput, CommentsRepository } from './comments.repository';

export type VoteAction = {
  op: 'add' | 'remove';
  type: 'up' | 'down';
  userId: string;
  prevVoteId: string;
};

export type CommentThread = {
  target: CommentRow;
  parent: CommentRow;
  replies: CommentRow[];
  totalReplies: number;
};

type GetCommentsOptions = {
  pageSize?: number;
  offset?: number;
  byParent?: string;
  onlyRootComments?: boolean;
};

const TABLE_ID = 'game_comments';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private repo: CommentsRepository) {}

  async createComment(input: CommentInput) {
    return this.repo.create(input);
  }

  async deleteComment(comment: CommentRow) {
    await this.repo.delete(comment.$id);
  }

  async getComments(gameId: string, opts?: GetCommentsOptions) {
    const queries = [
      Query.equal('gameId', gameId),
      Query.limit(opts?.pageSize ?? 6),
      Query.offset(opts?.offset ?? 0),
      Query.orderDesc('$createdAt'),
      Query.select([
        '*',
        'userProfile.gamertag',
        'userProfile.avatarUrl',
        'votes.*',
      ]),
    ];

    if (opts?.byParent) {
      queries.push(Query.equal('parentId', opts.byParent));
    }

    if (opts?.onlyRootComments) {
      queries.push(Query.isNull('parentId'), Query.orderAsc('voteCount'));
    }

    return this.repo.list(queries);
  }

  async getCommentThread(
    gameId: string,
    commentId: string,
  ): Promise<CommentThread | null> {
    const target = await this.getCommentById(gameId, commentId);
    if (!target) return null;

    const parent = target.parentId
      ? await this.getCommentById(gameId, target.parentId)
      : target;
    if (!parent) return null;

    const repliesResult = await this.getComments(gameId, {
      byParent: parent.$id,
      pageSize: 100,
      offset: 0,
    });

    return {
      target,
      parent,
      replies: repliesResult.rows,
      totalReplies: repliesResult.total,
    };
  }

  async vote(params: {
    comment: CommentRow;
    operation: 'up' | 'down';
    userId: string;
  }) {
    const { comment, operation, userId } = params;

    const prevVote = comment.votes?.find((v) => v.userId === userId);

    const nextVote = prevVote?.type === operation ? null : operation;
    const result = await this.repo.vote(comment.$id, nextVote);
    const delta = result.voteCount - (comment.voteCount ?? 0);
    return { delta, operation, prevVote };
  }

  private async getCommentById(gameId: string, commentId: string) {
    const result = await this.repo.list([
      Query.equal('$id', commentId),
      Query.equal('gameId', gameId),
      Query.limit(1),
      Query.select([
        '*',
        'userProfile.gamertag',
        'userProfile.avatarUrl',
        'votes.*',
      ]),
    ]);

    return result.rows[0] ?? null;
  }
}
