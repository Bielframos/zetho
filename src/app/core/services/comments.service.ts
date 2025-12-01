import { Injectable } from "@angular/core";
import { appwrite, Query } from "../appwrite/appwrite.client";
import { CommentRow } from "../types";

export type VoteAction =
    | { op: 'add', type: 'up' | 'down', userId: string, prevVoteId?: string }
    | { op: 'remove', type: 'up' | 'down', userId: string, prevVoteId: string }

const TABLE_ID = 'game_comments'

@Injectable({ providedIn: 'root' })
export class CommentService {
    constructor() { }

    /**
     * Método para registrar comentário no banco de dados
     * @param param0 
     * @returns 
     */
    async createComment({ gameId, userProfileId, content, parentId, depth }: {
        gameId: string,
        userProfileId: string,
        content: string,
        parentId?: string,
        depth?: number
    }) {
        const [newComment, _] = await Promise.all([
            appwrite.databases.createRow<CommentRow>({
                databaseId: 'app',
                tableId: TABLE_ID,
                rowId: 'unique()',
                data: {
                    gameId: gameId,
                    userProfile: userProfileId as any,
                    content,
                    parentId,
                    depth
                }
            }),
            parentId ?
                appwrite.databases.incrementRowColumn({
                    databaseId: 'app',
                    tableId: TABLE_ID,
                    rowId: parentId, column:
                        'replyCount',
                    value: 1
                }) : null
        ])
        return newComment
    }

    /**
     * Método para buscar comentários
     * @param gameId 
     * @param opts 
     * @returns 
     */
    async getComments(gameId: string, opts?: {
        byParent?: string,
        onlyRootComments?: boolean,
        pageSize?: number,
        offset?: number
    }) {
        let queries = [
            Query.equal('gameId', gameId),
            Query.select(['$id', '$createdAt', 'userProfile.gamertag', 'content', 'voteCount', 'votes.$id', 'votes.type', 'replyCount', 'depth']),
            Query.limit(opts?.pageSize || 6),
            Query.offset(opts?.offset || 0),
            Query.orderDesc('$createdAt')
        ]

        if (opts?.byParent) queries.push(Query.equal('parentId', opts.byParent))
        else if (opts?.onlyRootComments) queries.push(Query.isNull('parentId'), Query.orderAsc('voteCount'))

        return await appwrite.databases.listRows<CommentRow>({
            databaseId: 'app',
            tableId: TABLE_ID,
            queries
        })
    }

    async vote({
        commentId,
        action
    }: {
        commentId: string,
        action: VoteAction
    }) {

        if (action.op === 'add') {
            if (action.type === 'up') {
                await appwrite.databases.incrementRowColumn({
                    databaseId: 'app',
                    tableId: TABLE_ID,
                    rowId: commentId,
                    column: 'voteCount',
                    value: 1
                });
            } else {
                await appwrite.databases.decrementRowColumn({
                    databaseId: 'app',
                    tableId: TABLE_ID,
                    rowId: commentId,
                    column: 'voteCount',
                    value: 1
                });
            }

            return await appwrite.databases.upsertRow({
                databaseId: 'app',
                tableId: 'game_comment_votes',
                rowId: action.prevVoteId || 'unique()',
                data: {
                    type: action.type,
                    comment: commentId as any,
                    userId: action.userId
                }
            });
        }

        if (action.op === 'remove') {
            if (action.type === 'up') {
                await appwrite.databases.decrementRowColumn({
                    databaseId: 'app',
                    tableId: TABLE_ID,
                    rowId: commentId,
                    column: 'voteCount',
                    value: 1
                });
            } else {
                await appwrite.databases.incrementRowColumn({
                    databaseId: 'app',
                    tableId: TABLE_ID,
                    rowId: commentId,
                    column: 'voteCount',
                    value: 1
                });
            }

            await appwrite.databases.deleteRow({
                databaseId: 'app',
                tableId: 'game_comment_votes',
                rowId: action.prevVoteId!
            });
        }

        return null;
    }
}