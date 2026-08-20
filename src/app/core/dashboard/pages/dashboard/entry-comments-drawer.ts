import { CommonModule, DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import {
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DashboardFeedItem,
  DashboardService,
  EntryComment,
} from '../../dashboard.service';
import { AuthStore } from '../../../auth/auth.store';
import { appwrite } from '../../../../shared/infra/appwrite/appwrite.client';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { UiLoading } from '../../../../shared/ui/loading';
import {
  CommentService,
  CommentThread,
} from '../../../comments/comments.service';
import { CommentRow } from '../../../../types';

type CommentPage = {
  items: EntryComment[];
  page: number;
  hasMore: boolean;
  loading: boolean;
};

@Component({
  selector: 'ui-entry-comments-drawer',
  standalone: true,
  imports: [
    A11yModule,
    CommonModule,
    FormsModule,
    RouterLink,
    RelativeTimePipe,
    UiLoading,
  ],
  template: `
    <div
      class="fixed inset-0 z-50 bg-black/70"
      aria-hidden="true"
      (click)="closed.emit()"
    ></div>
    <aside
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-4 bg-gray-1 text-gray-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-comments-title"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header
        class="flex items-center justify-between border-b border-gray-6 p-4"
      >
        <div class="min-w-0">
          <h2 id="entry-comments-title" class="text-xl">
            {{ isCommentMode() ? 'Respostas' : 'Comentários' }}
          </h2>
          <p class="truncate text-xs text-gray-10">
            {{ item().userProfile?.gamertag || 'Jogador' }} ·
            {{ item().game?.name }}
          </p>
        </div>
        <button
          type="button"
          class="ui-ghost-btn"
          data-size="icon"
          aria-label="Fechar comentários"
          (click)="closed.emit()"
        >
          <i class="ph ph-x"></i>
        </button>
      </header>

      @if (isCommentMode() && commentThreadParent(); as parentComment) {
      <div class="border-b border-gray-6 p-4">
        <div class="flex items-start gap-2">
          <img
            [src]="avatar(toEntryComment(parentComment))"
            alt=""
            class="h-8 w-8 shrink-0 rounded-full bg-gray-3 object-cover"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 text-xs">
              <a
                [routerLink]="['/player', parentComment.userProfile.gamertag]"
                class="font-medium text-gray-12 hover:underline"
                >{{ parentComment.userProfile.gamertag || 'Jogador' }}</a
              >
              <span class="text-gray-10">{{
                parentComment.$createdAt | relativeTime
              }}</span>
            </div>
            <div
              class="mt-1 whitespace-pre-wrap break-words text-sm font-light text-gray-11 prose prose-invert prose-sm prose-gray max-w-none prose-p:my-0"
              [innerHTML]="parentComment.content"
            ></div>
          </div>
        </div>
      </div>
      }

      <form class="border-b border-gray-6 p-4" (submit)="submitComment($event)">
        <textarea
          name="entryComment"
          [(ngModel)]="newComment"
          maxlength="350"
          class="min-h-20 max-h-40 w-full rounded-lg border border-gray-6 bg-transparent px-3 py-2 text-sm text-gray-12 outline-none placeholder:text-gray-10 focus:ring-2 focus:ring-blue-6"
          [placeholder]="
            isCommentMode()
              ? 'Escreva uma resposta…'
              : 'Comente sobre este registro…'
          "
        ></textarea>
        <div class="mt-2 flex items-center justify-between gap-3">
          <span class="text-xs text-gray-10">{{ newComment.length }}/350</span>
          <button
            type="submit"
            class="ui-primary-btn"
            data-size="sm"
            [disabled]="submitting() || !newComment.trim()"
          >
            @if (submitting()) {
            <ui-loading [inline]="true" size="sm" />
            }
            {{ isCommentMode() ? 'Responder' : 'Comentar' }}
          </button>
        </div>
      </form>

      <div class="flex-1 overflow-y-auto discreet-scrollbar">
        @if (isCommentMode()) {
        <!-- Comment mode: thread via CommentService -->
        @if (commentThreadLoading()) {
        <div class="flex justify-center py-10"><ui-loading /></div>
        } @else if (commentThreadReplies().length > 0) {
        <div class="flex flex-col divide-y divide-gray-6">
          @for (reply of commentThreadReplies(); track reply.$id) {
          <article class="p-4">
            <ng-container
              [ngTemplateOutlet]="commentBody"
              [ngTemplateOutletContext]="{ $implicit: toEntryComment(reply) }"
            />
          </article>
          }
        </div>
        } @else {
        <p class="p-6 text-center text-sm text-gray-11">
          Seja a primeira pessoa a responder.
        </p>
        } } @else {
        <!-- Entry mode: comments via DashboardService -->
        @if (roots().loading && roots().items.length === 0) {
        <div class="flex justify-center py-10"><ui-loading /></div>
        } @else {
        <div class="flex flex-col divide-y divide-gray-6">
          @for (comment of roots().items; track comment.$id) {
          <article class="p-4">
            <ng-container
              [ngTemplateOutlet]="commentBody"
              [ngTemplateOutletContext]="{ $implicit: comment }"
            />

            @if (comment.replyCount > 0) {
            <button
              type="button"
              class="mt-3 text-sm text-blue-11 hover:underline"
              (click)="loadReplies(comment.$id)"
            >
              @if (replyPage(comment.$id).loading) {
              Carregando…
              } @else if (replyPage(comment.$id).items.length === 0) {
              Ver {{ comment.replyCount }} resposta(s)
              } @else if (replyPage(comment.$id).hasMore) {
              Carregar mais respostas
              } @else {
              Respostas
              }
            </button>
            }

            @if (replyPage(comment.$id).items.length > 0) {
            <div
              class="mt-4 flex flex-col gap-4 border-l border-gray-6 pl-4"
            >
              @for (
                reply of replyPage(comment.$id).items;
                track reply.$id
              ) {
              <article>
                <ng-container
                  [ngTemplateOutlet]="commentBody"
                  [ngTemplateOutletContext]="{ $implicit: reply }"
                />

                @if (reply.replyCount > 0) {
                <button
                  type="button"
                  class="mt-2 text-xs text-blue-11 hover:underline"
                  (click)="loadReplies(reply.$id)"
                >
                  @if (replyPage(reply.$id).loading) {
                  Carregando…
                  } @else if (
                    replyPage(reply.$id).items.length === 0
                  ) {
                  Ver {{ reply.replyCount }} resposta(s)
                  } @else if (replyPage(reply.$id).hasMore) {
                  Carregar mais
                  } @else {
                  Respostas
                  }
                </button>
                }

                @if (replyPage(reply.$id).items.length > 0) {
                <div
                  class="mt-3 flex flex-col gap-3 border-l border-gray-6 pl-4"
                >
                  @for (
                    leaf of replyPage(reply.$id).items;
                    track leaf.$id
                  ) {
                  <ng-container
                    [ngTemplateOutlet]="commentBody"
                    [ngTemplateOutletContext]="{ $implicit: leaf }"
                  />
                  }
                </div>
                }
              </article>
              }
            </div>
            }
          </article>
          } @empty {
          <p class="p-6 text-center text-sm text-gray-11">
            Seja a primeira pessoa a comentar.
          </p>
          }
        </div>

        @if (roots().hasMore) {
        <div class="flex justify-center border-t border-gray-6 p-4">
          <button
            type="button"
            class="ui-secondary-btn"
            data-size="sm"
            [disabled]="roots().loading"
            (click)="loadRoots()"
          >
            Carregar mais
          </button>
        </div>
        } }
        <!-- /Entry mode -->
        }
      </div>
    </aside>

    <ng-template #commentBody let-comment>
      <div class="flex items-start gap-2">
        <img
          [src]="avatar(comment)"
          alt=""
          class="h-8 w-8 shrink-0 rounded-full bg-gray-3 object-cover"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-xs">
            <a
              [routerLink]="['/player', comment.userProfile?.gamertag]"
              class="font-medium text-gray-12 hover:underline"
              >{{ comment.userProfile?.gamertag || 'Jogador' }}</a
            >
            <span class="text-gray-10">{{
              comment.$createdAt | relativeTime
            }}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap break-words text-sm text-gray-11">
            {{ comment.content }}
          </p>
          <div class="mt-2 flex items-center gap-2">
            @if (!isCommentMode() && comment.depth < 2) {
            <button
              type="button"
              class="ui-action-btn"
              (click)="startReply(comment.$id)"
            >
              Responder
            </button>
            }
            @if (canDelete(comment)) {
            <button
              type="button"
              class="ui-action-btn text-red-300"
              data-size="icon"
              aria-label="Excluir comentário"
              [disabled]="deletingIds().has(comment.$id)"
              (click)="deleteComment(comment)"
            >
              <i class="ph ph-trash"></i>
            </button>
            }
          </div>
          @if (replyingTo() === comment.$id) {
          <form class="mt-3" (submit)="submitReply($event, comment)">
            <textarea
              name="reply-{{ comment.$id }}"
              [(ngModel)]="replyContent"
              maxlength="350"
              class="min-h-16 w-full rounded-lg border border-gray-6 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-6"
              placeholder="Escreva uma resposta…"
            ></textarea>
            <div class="mt-2 flex justify-end gap-2">
              <button
                type="button"
                class="ui-ghost-btn"
                data-size="sm"
                (click)="cancelReply()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="ui-primary-btn"
                data-size="sm"
                [disabled]="submitting() || !replyContent.trim()"
              >
                Responder
              </button>
            </div>
          </form>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class EntryCommentsDrawer implements OnInit, OnDestroy {
  private service = inject(DashboardService);
  private commentService = inject(CommentService);
  private authStore = inject(AuthStore);
  private notifications = inject(NotificationStore);
  private document = inject(DOCUMENT);

  item = input.required<DashboardFeedItem>();
  closed = output<void>();
  countChanged = output<number>();

  isCommentMode = computed(() => this.item().type === 'comment');

  // Entry mode state
  roots = signal<CommentPage>({
    items: [],
    page: 0,
    hasMore: false,
    loading: false,
  });
  replies = signal<Record<string, CommentPage>>({});
  submitting = signal(false);
  deletingIds = signal<Set<string>>(new Set());
  replyingTo = signal<string | null>(null);
  newComment = '';
  replyContent = '';

  // Comment mode state
  commentThreadLoading = signal(false);
  private commentThread = signal<CommentThread | null>(null);
  commentThreadParent = computed(() => this.commentThread()?.parent ?? null);
  commentThreadReplies = computed<CommentRow[]>(() => {
    const thread = this.commentThread();
    if (!thread) return [];
    // Filter out the parent itself from replies
    return thread.replies.filter((r) => r.$id !== thread.parent.$id);
  });

  ngOnInit() {
    this.document.body.style.overflow = 'hidden';
    if (this.isCommentMode()) {
      void this.loadCommentThread();
    } else {
      void this.loadRoots();
    }
  }

  ngOnDestroy() {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  // ------------------------------------------------------------------
  // Comment mode
  // ------------------------------------------------------------------
  private async loadCommentThread() {
    const feedItem = this.item();
    const gameId = feedItem.gameId ?? feedItem.game?.$id;
    if (!gameId) return;

    this.commentThreadLoading.set(true);
    try {
      const thread = await this.commentService.getCommentThread(
        gameId,
        feedItem.$id,
      );
      this.commentThread.set(thread);
    } catch (error) {
      this.showError(error);
    } finally {
      this.commentThreadLoading.set(false);
    }
  }

  private async submitCommentReply(content: string) {
    const feedItem = this.item();
    const gameId = feedItem.gameId ?? feedItem.game?.$id;
    const profile = this.authStore.profile();
    if (!gameId || !profile) return;

    const parent = this.commentThread()?.parent;
    const parentId = parent?.$id ?? feedItem.parentComment?.$id ?? feedItem.$id;

    this.submitting.set(true);
    try {
      const created = await this.commentService.createComment({
        gameId,
        userProfileId: profile.$id,
        content,
        parentId,
        depth: (parent?.depth ?? 0) + 1,
      });
      // Add reply to thread
      const current = this.commentThread();
      if (current) {
        this.commentThread.set({
          ...current,
          replies: [...current.replies, created],
          totalReplies: current.totalReplies + 1,
        });
      } else {
        // Thread not loaded yet; create a minimal thread from the reply
        this.commentThread.set({
          target: created,
          parent: created,
          replies: [created],
          totalReplies: 1,
        });
      }
      this.newComment = '';
      this.countChanged.emit(1);
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Convert a CommentRow to the EntryComment shape for the template. */
  toEntryComment(row: CommentRow): EntryComment {
    return {
      $id: row.$id,
      $createdAt: row.$createdAt,
      entryId: '',
      profileId: row.userProfile?.$id ?? '',
      content: row.content,
      parentId: row.parentId ?? null,
      depth: row.depth ?? 0,
      replyCount: row.replyCount ?? 0,
      userProfile: row.userProfile
        ? {
            gamertag: row.userProfile.gamertag,
            avatarUrl: row.userProfile.avatarUrl ?? null,
          }
        : null,
    };
  }

  feedItemAvatar() {
    const profile = this.item().userProfile;
    if (profile?.avatarUrl) return profile.avatarUrl;
    return appwrite.avatars.getInitials({
      name: profile?.gamertag || 'Z',
      width: 64,
      height: 64,
      background: '3e63dd',
    });
  }

  // ------------------------------------------------------------------
  // Entry mode
  // ------------------------------------------------------------------
  async loadRoots() {
    const current = this.roots();
    if (current.loading || (current.page > 0 && !current.hasMore)) return;
    this.roots.set({ ...current, loading: true });
    try {
      const page = current.page + 1;
      const result = await this.service.getEntryComments(this.item().$id, page);
      this.roots.set({
        items: [...current.items, ...result.items],
        page,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      this.roots.set({ ...current, loading: false });
      this.showError(error);
    }
  }

  replyPage(parentId: string): CommentPage {
    return (
      this.replies()[parentId] ?? {
        items: [],
        page: 0,
        hasMore: false,
        loading: false,
      }
    );
  }

  async loadReplies(parentId: string) {
    const current = this.replyPage(parentId);
    if (current.loading || (current.page > 0 && !current.hasMore)) return;
    this.setReplyPage(parentId, { ...current, loading: true });
    try {
      const page = current.page + 1;
      const result = await this.service.getEntryComments(
        this.item().$id,
        page,
        20,
        parentId,
      );
      this.setReplyPage(parentId, {
        items: [...current.items, ...result.items],
        page,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      this.setReplyPage(parentId, { ...current, loading: false });
      this.showError(error);
    }
  }

  async submitComment(event: Event) {
    event.preventDefault();
    const content = this.newComment.trim();
    if (!content || this.submitting()) return;

    if (this.isCommentMode()) {
      await this.submitCommentReply(content);
      return;
    }

    this.submitting.set(true);
    try {
      const comment = await this.service.createEntryComment(
        this.item().$id,
        content,
      );
      this.roots.update((state) => ({
        ...state,
        items: [comment, ...state.items],
      }));
      this.newComment = '';
      this.countChanged.emit(1);
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  startReply(commentId: string) {
    this.replyingTo.set(commentId);
    this.replyContent = '';
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.replyContent = '';
  }

  async submitReply(event: Event, parent: EntryComment) {
    event.preventDefault();
    const content = this.replyContent.trim();
    if (!content || this.submitting()) return;
    this.submitting.set(true);
    try {
      const comment = await this.service.createEntryComment(
        this.item().$id,
        content,
        parent.$id,
      );
      const current = this.replyPage(parent.$id);
      this.setReplyPage(parent.$id, {
        ...current,
        items: [comment, ...current.items],
      });
      this.incrementReplyCount(parent.$id, 1);
      this.cancelReply();
      this.countChanged.emit(1);
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  canDelete(comment: EntryComment) {
    return (
      comment.profileId === this.authStore.profile()?.$id ||
      this.authStore.isAdmin()
    );
  }

  async deleteComment(comment: EntryComment) {
    if (!this.canDelete(comment) || this.deletingIds().has(comment.$id)) return;
    if (!confirm('Deseja excluir este comentário e suas respostas?')) return;
    this.deletingIds.update((ids) => new Set(ids).add(comment.$id));
    try {
      const result = await this.service.deleteEntryComment(
        this.item().$id,
        comment.$id,
      );
      this.removeComment(comment);
      this.countChanged.emit(-result.deletedCount);
    } catch (error) {
      this.showError(error);
    } finally {
      this.deletingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(comment.$id);
        return next;
      });
    }
  }

  avatar(comment: EntryComment) {
    if (comment.userProfile?.avatarUrl) return comment.userProfile.avatarUrl;
    return appwrite.avatars.getInitials({
      name: comment.userProfile?.gamertag || 'Z',
      width: 64,
      height: 64,
      background: '3e63dd',
    });
  }

  private removeComment(comment: EntryComment) {
    if (!comment.parentId) {
      this.roots.update((state) => ({
        ...state,
        items: state.items.filter((item) => item.$id !== comment.$id),
      }));
    } else {
      const page = this.replyPage(comment.parentId);
      this.setReplyPage(comment.parentId, {
        ...page,
        items: page.items.filter((item) => item.$id !== comment.$id),
      });
      this.incrementReplyCount(comment.parentId, -1);
    }
    this.replies.update((map) => {
      const next = { ...map };
      delete next[comment.$id];
      return next;
    });
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

  private setReplyPage(parentId: string, page: CommentPage) {
    this.replies.update((map) => ({ ...map, [parentId]: page }));
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
