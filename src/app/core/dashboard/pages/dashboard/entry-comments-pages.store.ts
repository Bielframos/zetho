import { inject, Injectable, signal } from '@angular/core';
import { DashboardService, EntryComment } from '../../dashboard.service';
import { NotificationStore } from '../../../system/notifications/notification.store';

export type CommentPage = {
  items: EntryComment[];
  page: number;
  hasMore: boolean;
  loading: boolean;
};

const emptyPage = (): CommentPage => ({
  items: [],
  page: 0,
  hasMore: false,
  loading: false,
});

@Injectable()
export class EntryCommentsPagesStore {
  private readonly service = inject(DashboardService);
  private readonly notifications = inject(NotificationStore);
  private entryId: string | null = null;
  private generation = 0;
  private removedIds = new Set<string>();

  readonly roots = signal<CommentPage>(emptyPage());
  readonly replies = signal<Record<string, CommentPage>>({});

  reset(entryId: string | null) {
    this.generation += 1;
    this.entryId = entryId;
    this.removedIds.clear();
    this.roots.set(emptyPage());
    this.replies.set({});
  }

  async loadRoots() {
    const entryId = this.entryId;
    const current = this.roots();
    if (!entryId || current.loading || (current.page > 0 && !current.hasMore)) {
      return;
    }

    const generation = this.generation;
    this.roots.set({ ...current, loading: true });
    const page = current.page + 1;
    try {
      const result = await this.service.getEntryComments(entryId, page);
      if (!this.isCurrent(entryId, generation)) return;
      const latest = this.roots();
      this.roots.set({
        ...latest,
        items: this.mergePageItems(latest.items, result.items),
        page,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      if (!this.isCurrent(entryId, generation)) return;
      this.roots.update((latest) => ({ ...latest, loading: false }));
      this.showError(error);
    }
  }

  async loadReplies(parentId: string) {
    const entryId = this.entryId;
    const current = this.replyPage(parentId);
    if (!entryId || current.loading || (current.page > 0 && !current.hasMore)) {
      return;
    }

    const generation = this.generation;
    this.setReplyPage(parentId, { ...current, loading: true });
    const page = current.page + 1;
    try {
      const result = await this.service.getEntryComments(
        entryId,
        page,
        20,
        parentId,
      );
      if (
        !this.isCurrent(entryId, generation) ||
        this.removedIds.has(parentId)
      ) {
        return;
      }
      const latest = this.replyPage(parentId);
      this.setReplyPage(parentId, {
        ...latest,
        items: this.mergePageItems(latest.items, result.items),
        page,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      if (
        !this.isCurrent(entryId, generation) ||
        this.removedIds.has(parentId)
      ) {
        return;
      }
      const latest = this.replyPage(parentId);
      this.setReplyPage(parentId, { ...latest, loading: false });
      this.showError(error);
    }
  }

  replyPage(parentId: string): CommentPage {
    return this.replies()[parentId] ?? emptyPage();
  }

  prependRoot(comment: EntryComment) {
    this.roots.update((state) => ({
      ...state,
      items: [comment, ...state.items],
    }));
  }

  prependReply(parentId: string, comment: EntryComment) {
    if (this.removedIds.has(parentId) || this.removedIds.has(comment.$id))
      return;
    const current = this.replyPage(parentId);
    this.setReplyPage(parentId, {
      ...current,
      items: [comment, ...current.items],
    });
    this.incrementReplyCount(parentId, 1);
  }

  removeComment(comment: EntryComment) {
    const loadedComments = [
      ...this.roots().items,
      ...Object.values(this.replies()).flatMap((page) => page.items),
    ];
    const removed = new Set([comment.$id]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const candidate of loadedComments) {
        if (
          candidate.parentId &&
          removed.has(candidate.parentId) &&
          !removed.has(candidate.$id)
        ) {
          removed.add(candidate.$id);
          expanded = true;
        }
      }
    }
    for (const id of removed) this.removedIds.add(id);

    this.roots.update((state) => ({
      ...state,
      items: state.items.filter((item) => !removed.has(item.$id)),
    }));
    this.replies.update((map) => {
      const next: Record<string, CommentPage> = {};
      for (const [parentId, page] of Object.entries(map)) {
        if (!removed.has(parentId)) {
          next[parentId] = {
            ...page,
            items: page.items.filter((item) => !removed.has(item.$id)),
          };
        }
      }
      return next;
    });
    if (comment.parentId) this.incrementReplyCount(comment.parentId, -1);
  }

  private incrementReplyCount(commentId: string, delta: number) {
    const update = (comment: EntryComment) =>
      comment.$id === commentId
        ? { ...comment, replyCount: Math.max(0, comment.replyCount + delta) }
        : comment;
    this.roots.update((state) => ({
      ...state,
      items: state.items.map(update),
    }));
    this.replies.update((map) => {
      const next: Record<string, CommentPage> = {};
      for (const [key, page] of Object.entries(map)) {
        next[key] = { ...page, items: page.items.map(update) };
      }
      return next;
    });
  }

  private mergePageItems(existing: EntryComment[], fetched: EntryComment[]) {
    const merged = new Map<string, EntryComment>();
    for (const item of existing) {
      if (!this.removedIds.has(item.$id)) merged.set(item.$id, item);
    }
    for (const item of fetched) {
      if (!this.removedIds.has(item.$id) && !merged.has(item.$id)) {
        merged.set(item.$id, item);
      }
    }
    return [...merged.values()];
  }

  private setReplyPage(parentId: string, page: CommentPage) {
    this.replies.update((map) => ({ ...map, [parentId]: page }));
  }

  private isCurrent(entryId: string, generation: number) {
    return this.entryId === entryId && this.generation === generation;
  }

  private showError(error: unknown) {
    this.notifications.show({
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a ação.',
      type: 'error',
    });
  }
}
