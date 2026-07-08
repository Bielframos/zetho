import { Injectable } from '@angular/core';
import { appwrite, Query } from '../appwrite/appwrite.client';
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
  async create(input: CommentInput) {
    return appwrite.databases.createRow<CommentRow>({
      databaseId: 'app',
      tableId: 'game_comments',
      rowId: 'unique()',
      data: {
        gameId: input.gameId,
        userProfile: input.userProfileId as any,
        content: input.content,
        parentId: input.parentId,
        depth: input.depth,
      },
    });
  }

  async incrementReplies(parentId: string) {
    return appwrite.databases.incrementRowColumn({
      databaseId: 'app',
      tableId: 'game_comments',
      rowId: parentId,
      column: 'replyCount',
      value: 1,
    });
  }

  async decrementReplies(parentId: string) {
    return appwrite.databases.incrementRowColumn({
      databaseId: 'app',
      tableId: 'game_comments',
      rowId: parentId,
      column: 'replyCount',
      value: -1,
    });
  }

  async list(queries: any[]) {
    return appwrite.databases.listRows<CommentRow>({
      databaseId: 'app',
      tableId: 'game_comments',
      queries,
    });
  }

  async incrementVote(commentId: string, value: number) {
    return appwrite.databases.incrementRowColumn({
      databaseId: 'app',
      tableId: 'game_comments',
      rowId: commentId,
      column: 'voteCount',
      value,
    });
  }

  async saveVote(voteId: string, data: any) {
    return appwrite.databases.upsertRow({
      databaseId: 'app',
      tableId: 'game_comment_votes',
      rowId: voteId,
      data,
    });
  }

  async deleteVote(voteId: string) {
    return appwrite.databases.deleteRow({
      databaseId: 'app',
      tableId: 'game_comment_votes',
      rowId: voteId,
    });
  }

  async delete(commentId: string) {
    return appwrite.databases.deleteRow({
      databaseId: 'app',
      tableId: 'game_comments',
      rowId: commentId,
    });
  }
}
