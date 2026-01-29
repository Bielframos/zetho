import { Injectable } from '@angular/core';
import { Query, ID } from '../appwrite/appwrite.client';
import { CommentRow } from '../types';
import { CommentInput, CommentsRepository } from './comments.repository';

export type VoteAction = {
  op: 'add' | 'remove';
  type: 'up' | 'down';
  userId: string;
  prevVoteId: string;
};

const TABLE_ID = 'game_comments';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private repo: CommentsRepository) {}

  async createComment(input: CommentInput) {
    const comment = await this.repo.create(input);

    if (input.parentId) {
      await this.repo.incrementReplies(input.parentId);
    }

    return comment;
  }

  async getComments(gameId: string, opts?: any) {
    const queries = [
      Query.equal('gameId', gameId),
      Query.limit(opts?.pageSize ?? 6),
      Query.offset(opts?.offset ?? 0),
      Query.orderDesc('$createdAt'),
      Query.select(['*', 'userProfile.gamertag', 'votes.*']),
    ];

    if (opts?.byParent) {
      queries.push(Query.equal('parentId', opts.byParent));
    }

    if (opts?.onlyRootComments) {
      queries.push(Query.isNull('parentId'), Query.orderAsc('voteCount'));
    }

    return this.repo.list(queries);
  }

  async vote(params: {
    comment: CommentRow;
    operation: 'up' | 'down';
    userId: string;
  }) {
    const { comment, operation, userId } = params;

    const prevVote = comment.votes?.find((v) => v.userId === userId);

    let delta = 0;
    let persist: () => Promise<any>;

    if (!prevVote) {
      delta = operation === 'up' ? 1 : -1;
      persist = () =>
        this.repo.saveVote(ID.unique(), {
          type: operation,
          comment: comment.$id,
          userId,
        });
    } else if (prevVote.type === operation) {
      delta = operation === 'up' ? -1 : 1;
      persist = () => this.repo.deleteVote(prevVote.$id);
    } else {
      delta = operation === 'up' ? 2 : -2;
      persist = () =>
        this.repo.saveVote(prevVote.$id, {
          type: operation,
          comment: comment.$id,
          userId,
        });
    }

    await this.repo.incrementVote(comment.$id, delta);
    await persist();

    return { delta, operation, prevVote };
  }
}
