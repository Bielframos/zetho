import { computed, effect, Injectable, signal, untracked } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { CommentService } from './comments.service';
import { GameStore } from '../games/game.store';
import { CommentRow } from '../../types';
import { ZCoinsService } from '../zCoins/zcoins.service';

@Injectable({ providedIn: 'root' })
export class CommentsController {
  rootComments = signal<CommentRow[]>([]);
  childComments = signal<
    Record<
      string,
      {
        comments: CommentRow[];
        pagination?: { total: number; offset: number; hasMore: boolean };
        hidden?: boolean;
      }
    >
  >({});

  total = signal(0);
  currentPage = signal(0);

  offset = computed(() => (this.currentPage() - 1) * 6);
  pageCount = computed(() => Math.ceil(this.total() / 6));
  hasMore = computed(() => this.currentPage() < this.pageCount());

  loading = signal(false);
  loadingReplies = signal<Record<string, boolean>>({});
  deletingCommentIds = signal<Set<string>>(new Set());

  constructor(
    private authStore: AuthStore,
    private gameStore: GameStore,
    private commentService: CommentService,
    private zCoinsService: ZCoinsService,
  ) {
    effect(() => {
      const gameId = this.gameStore.currentGame()?.$id;
      if (!gameId) return;

      untracked(() => {
        this.resetState();
        this.loadRootComments({ loadMore: true });
      });
    });
  }

  /* =======================
     Carregamento
     ======================= */

  async loadRootComments({ loadMore } = { loadMore: true }) {
    if (this.loading()) return;

    this.loading.set(true);
    if (loadMore) this.currentPage.update((p) => p + 1);

    try {
      const result = await this.commentService.getComments(
        this.gameStore.currentGame()!.$id,
        {
          onlyRootComments: true,
          offset: this.offset(),
        },
      );

      this.rootComments.update((list) => [...list, ...result.rows]);
      this.total.set(result.total);
    } finally {
      this.loading.set(false);
    }
  }

  async loadReplies(parentId: string) {
    this.loadingReplies.update((m) => ({ ...m, [parentId]: true }));

    const pagination = this.childComments()[parentId]?.pagination;
    if (pagination && !pagination.hasMore) {
      this.toggleHiddenReplies(parentId, false);
      this.loadingReplies.update((m) => ({ ...m, [parentId]: false }));
      return;
    }

    try {
      const result = await this.commentService.getComments(
        this.gameStore.currentGame()!.$id,
        {
          byParent: parentId,
          pageSize: 4,
          offset: pagination?.offset ?? 0,
        },
      );

      const offset = (pagination?.offset ?? 0) + 4;
      const hasMore = offset < result.total;

      this.childComments.update((map) => {
        const prev = map[parentId]?.comments ?? [];
        return {
          ...map,
          [parentId]: {
            comments: [...prev, ...result.rows],
            pagination: {
              total: result.total,
              offset,
              hasMore,
            },
          },
        };
      });
    } finally {
      this.loadingReplies.update((m) => ({ ...m, [parentId]: false }));
    }
  }

  toggleHiddenReplies(parentId: string, hidden = true) {
    this.childComments.update((map) => {
      const ref = map[parentId];
      if (!ref) return map;

      return {
        ...map,
        [parentId]: { ...ref, hidden },
      };
    });
  }

  /* =======================
     Criação de comentário
     ======================= */

  async addComment(content: string, parentId?: string, depth?: number) {
    const currentGame = this.gameStore.currentGame();
    const profile = this.authStore.profile();

    if (!currentGame || !profile) return;

    const newComment = await this.commentService.createComment({
      gameId: currentGame.$id,
      userProfileId: profile.$id,
      content,
      parentId,
      depth,
    });

    if (!newComment) return;

    void this.zCoinsService.applyInput('engaged').catch(() => undefined);

    if (!parentId) {
      this.rootComments.update((list) => [newComment, ...list]);
      return;
    }

    this.childComments.update((map) => ({
      ...map,
      [parentId]: {
        comments: [newComment, ...(map[parentId]?.comments ?? [])],
      },
    }));
  }

  /* =======================
     Exclusão
     ======================= */

  canDelete(comment: CommentRow) {
    const profileId = this.authStore.profile()?.$id;
    return (
      !!profileId &&
      (comment.userProfile?.$id === profileId || this.authStore.isAdmin())
    );
  }

  async deleteComment(comment: CommentRow) {
    if (
      !this.canDelete(comment) ||
      this.deletingCommentIds().has(comment.$id)
    ) {
      return;
    }

    if (!confirm('Deseja realmente excluir este comentário?')) return;

    this.deletingCommentIds.update((ids) => new Set(ids).add(comment.$id));

    try {
      await this.commentService.deleteComment(comment);
      this.removeLocalComment(comment);
    } finally {
      this.deletingCommentIds.update((ids) => {
        const next = new Set(ids);
        next.delete(comment.$id);
        return next;
      });
    }
  }

  /* =======================
     Voto
     ======================= */

  async vote(params: {
    operation: 'up' | 'down';
    commentId: string;
    parentId?: string;
  }) {
    const user = this.authStore.user();
    if (!user) return;

    const userId = user.$id;
    const comment = this.findLocalComment(params.commentId, params.parentId);

    if (!comment) return;

    const { delta, operation, prevVote } = await this.commentService.vote({
      comment,
      operation: params.operation,
      userId,
    });

    this.applyLocalVote(
      params.commentId,
      params.parentId,
      delta,
      operation,
      userId,
      prevVote,
    );
  }

  /* =======================
     Helpers de estado local
     ======================= */

  private findLocalComment(
    commentId: string,
    parentId?: string,
  ): CommentRow | undefined {
    if (parentId) {
      return this.childComments()[parentId]?.comments.find(
        (c) => c.$id === commentId,
      );
    }

    return this.rootComments().find((c) => c.$id === commentId);
  }

  private removeLocalComment(comment: CommentRow) {
    const removedIds = new Set<string>([comment.$id]);
    this.collectLoadedDescendantIds(comment.$id, removedIds);

    this.rootComments.update((list) =>
      list.filter((item) => !removedIds.has(item.$id)),
    );

    this.childComments.update((map) => {
      const next = { ...map };

      for (const id of removedIds) {
        delete next[id];
      }

      if (comment.parentId && next[comment.parentId]) {
        const parentRef = next[comment.parentId];
        next[comment.parentId] = {
          ...parentRef,
          comments: parentRef.comments.filter(
            (item) => !removedIds.has(item.$id),
          ),
          pagination: parentRef.pagination
            ? {
                ...parentRef.pagination,
                total: Math.max(0, parentRef.pagination.total - 1),
              }
            : undefined,
        };
      }

      return next;
    });

    if (!comment.parentId) {
      this.total.update((value) => Math.max(0, value - 1));
      return;
    }

    this.decrementLocalReplyCount(comment.parentId);
  }

  private collectLoadedDescendantIds(commentId: string, ids: Set<string>) {
    const comments = this.childComments()[commentId]?.comments ?? [];

    for (const comment of comments) {
      ids.add(comment.$id);
      this.collectLoadedDescendantIds(comment.$id, ids);
    }
  }

  private decrementLocalReplyCount(commentId: string) {
    const update = (comment: CommentRow): CommentRow => ({
      ...comment,
      replyCount: Math.max(0, (comment.replyCount ?? 0) - 1),
    });

    this.rootComments.update((list) =>
      list.map((comment) =>
        comment.$id === commentId ? update(comment) : comment,
      ),
    );

    this.childComments.update((map) => {
      const next = { ...map };

      for (const [parentId, ref] of Object.entries(next)) {
        next[parentId] = {
          ...ref,
          comments: ref.comments.map((comment) =>
            comment.$id === commentId ? update(comment) : comment,
          ),
        };
      }

      return next;
    });
  }

  private applyLocalVote(
    commentId: string,
    parentId: string | undefined,
    delta: number,
    type: 'up' | 'down',
    userId: string,
    prevVote?: { $id: string },
  ) {
    const update = (comment: CommentRow): CommentRow => {
      let votes = [...(comment.votes ?? [])];

      if (prevVote) {
        votes = votes.filter((v) => v.$id !== prevVote.$id);
      }

      if ((delta !== 0 && Math.abs(delta) % 2 === 1) || Math.abs(delta) === 2) {
        votes.unshift({
          $id: prevVote?.$id ?? 'local-temp',
          type,
          userId,
          comment: comment.$id as any,
        });
      }

      return {
        ...comment,
        voteCount: (comment.voteCount ?? 0) + delta,
        votes,
      };
    };

    if (parentId) {
      this.childComments.update((map) => {
        const ref = map[parentId];
        if (!ref) return map;

        return {
          ...map,
          [parentId]: {
            ...ref,
            comments: ref.comments.map((c) =>
              c.$id === commentId ? update(c) : c,
            ),
          },
        };
      });
    } else {
      this.rootComments.update((list) =>
        list.map((c) => (c.$id === commentId ? update(c) : c)),
      );
    }
  }

  getUserVoteFor(comment: CommentRow) {
    const userId = this.authStore.user()?.$id;
    return comment.votes?.find((v) => v.userId === userId)?.type;
  }

  private resetState() {
    this.rootComments.set([]);
    this.childComments.set({});
    this.total.set(0);
    this.currentPage.set(0);
  }
}
