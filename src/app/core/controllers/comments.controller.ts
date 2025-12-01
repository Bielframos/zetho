import { computed, effect, Injectable, signal, untracked } from '@angular/core';
import { UserStore } from '../auth/user.store';
import { CommentService, type VoteAction } from '../services/comments.service';
import { GameStore } from '../stores/game.store';
import { CommentRow } from '../types';
import { ID } from 'appwrite';

@Injectable({ providedIn: 'root' })
export class CommentsController {
    rootComments = signal<CommentRow[]>([]);
    childComments = signal<Record<string, {
        comments: CommentRow[],
        pagination?: { total: number, offset: number, hasMore: boolean },
        hidden?: boolean
    }>>({});

    total = signal(0);
    currentPage = signal(0);
    offset = computed(() => (this.currentPage() - 1) * 6);
    pageCount = computed(() => Math.ceil(this.total() / 6));

    hasMore = computed(() => this.currentPage() < this.pageCount());
    loading = signal<boolean>(false);
    loadingReplies = signal<Record<string, boolean>>({});

    constructor(
        private userStore: UserStore,
        private gameStore: GameStore,
        private commentService: CommentService,
    ) {
        effect(() => {
            const id = this.gameStore.currentGame()?.$id;
            if (!id) return;

            untracked(() => {
                this.resetState();
                this.loadRootComments({ loadMore: true });
            });
        });
    }

    async loadRootComments({ loadMore } = { loadMore: true }) {
        if (this.loading()) return;
        this.loading.set(true);

        if (loadMore) {
            this.currentPage.update((p) => p + 1);
        }

        try {
            const result = await this.commentService.getComments(
                this.gameStore.currentGame()!.$id,
                {
                    onlyRootComments: true,
                    offset: this.offset(),
                },
            );

            this.rootComments.update((state) => [...state, ...result.rows]);
            this.total.set(result.total);
        } catch (e) {
            console.error('ERRO', e);
            alert('Erro ao carregar comentários.');
        } finally {
            this.loading.set(false);
        }
    }

    async loadReplies(parentId: string) {
        this.loadingReplies.update((map) => ({ ...map, [parentId]: true }));
        const pagination = this.childComments()[parentId]?.pagination

        if (pagination && !pagination.hasMore) {
            this.childComments.update((map) => {
                const ref = this.childComments()[parentId]
                return {
                    ...map,
                    [parentId]: { ...ref, hidden: false },
                }
            });

            this.loadingReplies.update((map) => ({ ...map, [parentId]: false }));
            return
        }

        try {
            const result = await this.commentService.getComments(
                this.gameStore.currentGame()!.$id,
                { byParent: parentId, pageSize: 4, offset: pagination?.offset || 0 },
            );

            const total = result.total
            const offset = (pagination?.offset || 0) + 4
            const hasMore = offset < total

            this.childComments.update((map) => {
                const loadedReplies = this.childComments()[parentId]?.comments ?? []
                return {
                    ...map,
                    [parentId]: { comments: [...loadedReplies, ...result.rows], pagination: { total, offset, hasMore } },
                }
            });
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar respostas.');
        } finally {
            this.loadingReplies.update((map) => ({ ...map, [parentId]: false }));
        }
    }

    async toggleHiddenReplies(parentId: string) {
        const repliesRef = this.childComments()[parentId]
        if (repliesRef) {
            this.childComments.update(map => ({
                ...map,
                [parentId]: { ...repliesRef, hidden: !repliesRef.hidden || true }
            }))
        }
    }

    async addComment(content: string, parentId?: string, depth?: number) {
        try {
            const newComment = await this.commentService.createComment({
                gameId: this.gameStore.currentGame()!.$id,
                userProfileId: this.userStore.profile()!.$id,
                content,
                parentId,
                depth,
            });

            if (!newComment) return;

            if (!parentId) {
                this.rootComments.update((list) => [newComment, ...list]);
                return;
            }

            this.childComments.update((map) => ({
                ...map,
                [parentId]: { comments: [newComment, ...(map[parentId].comments ?? [])] },
            }));
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar comentário.');
        }
    }

    async vote({ operation, commentId, parentId }: {
        operation: 'up' | 'down',
        commentId: string,
        parentId?: string
    }) {
        try {
            const userId = this.userStore.user()!.$id;

            let targetComment: CommentRow | undefined;
            if (parentId) {
                const ref = this.childComments()[parentId];
                targetComment = ref?.comments.find(c => c.$id === commentId);
            } else {
                targetComment = this.rootComments().find(c => c.$id === commentId);
            }

            if (!targetComment) {
                console.warn('Comentário não encontrado localmente ao votar', { commentId, parentId });
                return;
            }

            const prevVote = (targetComment.votes ?? [])
                .find(v => v.userId === userId) as NonNullable<CommentRow['votes']>[number] | undefined;

            let action: VoteAction;
            let delta = 0;

            if (!prevVote) {
                action = {
                    op: 'add',
                    type: operation,
                    prevVoteId: ID.unique(),
                    userId
                };
                delta = operation === 'up' ? 1 : -1;
            } else {
                if (prevVote.type === operation) {
                    action = {
                        op: 'remove',
                        type: operation,
                        prevVoteId: prevVote.$id,
                        userId
                    };
                    delta = operation === 'up' ? -1 : 1;
                } else {
                    action = {
                        op: 'add',
                        type: operation,
                        prevVoteId: prevVote.$id,
                        userId
                    };
                    delta = operation === 'up' ? 2 : -2;
                }
            }

            const applyLocalUpdate = (comment: CommentRow) => {
                const updated: CommentRow = {
                    ...comment,
                    voteCount: (comment.voteCount ?? 0) + delta,
                    votes: (() => {
                        let list = [...(comment.votes ?? [])];

                        if (prevVote) {
                            list = list.filter(v => v.$id !== prevVote.$id);
                        }

                        if (action.op === 'add') {
                            list.unshift({
                                $id: action.prevVoteId || 'temp-local-id',
                                type: action.type,
                                userId,
                                comment: comment.$id as any
                            });
                        }

                        return list;
                    })()
                };

                return updated;
            };

            if (parentId) {
                this.childComments.update(state => {
                    const ref = state[parentId];
                    if (!ref) return state;

                    const comments = ref.comments.map(c =>
                        c.$id === commentId ? applyLocalUpdate(c) : c
                    );

                    return {
                        ...state,
                        [parentId]: { ...ref, comments }
                    };
                });
            } else {
                this.rootComments.update(list =>
                    list.map(c =>
                        c.$id === commentId ? applyLocalUpdate(c) : c
                    )
                );
            }

            // 4. Persistência
            await this.commentService.vote({ commentId, action });

        } catch (e) {
            console.error(e);
            alert('Erro ao registrar seu voto.');
        }
    }

    getUserVoteFor(comment: CommentRow) {
        const userId = this.userStore.user()?.$id;
        if (!userId) return undefined;
        return (comment.votes ?? []).find(v => v.userId === userId)?.type;
    }

    private resetState() {
        this.rootComments.set([]);
        this.childComments.set({});
        this.total.set(0);
        this.currentPage.set(0);
    }
}
