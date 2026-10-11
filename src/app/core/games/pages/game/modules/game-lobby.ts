import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppCommentItem } from '../../../../../shared/app/comment-item/comment-item';
import { UiLoading } from '../../../../../shared/ui/loading';
import { CommentsController } from '../../../../comments/comments.controller';

@Component({
  selector: 'ui-game-lobby',
  standalone: true,
  imports: [AppCommentItem, ReactiveFormsModule, UiLoading],
  template: `
    <article class="flex flex-col">
      <div class="p-4">
        <textarea
          name="comment"
          id="comment"
          placeholder="Diga algo sobre este jogo…"
          class="max-h-[160px] min-h-[64px] w-full border-y border-gray-6 bg-transparent px-4 py-2 font-light text-gray-12 outline-none transition-colors duration-200 ease-in-out placeholder:text-gray-10 focus:ring-2 focus:ring-focus-ring disabled:border-gray-3 disabled:bg-transparent disabled:text-gray-11 md:border"
          [formControl]="comment"
          required
        ></textarea>

        <div class="mt-2 flex justify-between">
          <div>
            <small
              class="transition-colors"
              [class.text-success]="charsCount() > 3 && charsCount() < 350"
              [class.text-danger]="charsCount() > 350"
            >
              <span>{{ charsCount() }}</span>
              /350
            </small>
          </div>
          <button
            class="ui-primary-btn px-2 py-1"
            (click)="createComment()"
            [disabled]="comment.invalid || isLoading()"
          >
            @if (isLoading()) {
              <ui-loading [inline]="true" size="sm"></ui-loading>
            }
            Comentar
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4 px-4 pb-4">
        @for (comment of controller.rootComments(); track comment.$id) {
          <app-comment-item
            [comment]="comment"
            [replies]="controller.childComments()[comment.$id]?.comments || []"
            [isLoadingReplies]="controller.loadingReplies()[comment.$id]"
            [highlightedCommentId]="highlightedCommentId()"
            (loadReplies)="controller.loadReplies(comment.$id)"
            (reply)="controller.addComment($event, comment.$id, 1)"
          />
        }
      </div>

      @if (controller.hasMore()) {
        <footer class="w-full flex justify-center px-4 pb-6 pt-2">
          <button
            class="ui-primary-btn"
            (click)="controller.loadRootComments({ loadMore: true })"
          >
            Carregar mais
          </button>
        </footer>
      }
    </article>
  `,
})
export class UiGameLobby {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private focusRequestId = 0;
  private scrollFrameId: number | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  controller = inject(CommentsController);

  isLoading = signal(false);
  highlightedCommentId = signal<string | null>(null);
  comment = new FormControl('', {
    nonNullable: true,
    validators: [Validators.minLength(3), Validators.maxLength(350)],
  });
  charsCount = signal(0);
  result = signal<{ error?: boolean; message?: string }>({});

  constructor() {
    this.comment.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.charsCount.set(value.length));

    this.destroyRef.onDestroy(() => {
      this.focusRequestId += 1;
      this.clearScheduledHighlight();
    });
  }

  async focusComment(commentId: string) {
    if (!this.isBrowser) return;

    const requestId = ++this.focusRequestId;
    this.clearScheduledHighlight();
    this.highlightedCommentId.set(null);

    const target = await this.controller.preloadCommentThread(commentId);
    if (!target || requestId !== this.focusRequestId) return;

    this.highlightedCommentId.set(target.$id);

    const browserWindow = this.document.defaultView;
    if (!browserWindow) return;

    this.scrollFrameId = browserWindow.requestAnimationFrame(() => {
      this.scrollFrameId = null;
      if (requestId !== this.focusRequestId) return;

      this.document
        .getElementById(`comment-${target.$id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      this.highlightTimer = setTimeout(() => {
        if (requestId === this.focusRequestId) {
          this.highlightedCommentId.set(null);
        }
        this.highlightTimer = null;
      }, 4000);
    });
  }

  clearCommentFocus() {
    this.focusRequestId += 1;
    this.clearScheduledHighlight();
    this.highlightedCommentId.set(null);
  }

  async createComment() {
    try {
      this.isLoading.set(true);
      await this.controller.addComment(this.comment.value);
      this.comment.reset();
    } catch (e) {
      console.error(e);
      this.result.set({
        error: true,
        message: 'Ocorreu um erro ao salvar seu comentário.',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private clearScheduledHighlight() {
    const browserWindow = this.document.defaultView;
    if (this.scrollFrameId !== null && browserWindow) {
      browserWindow.cancelAnimationFrame(this.scrollFrameId);
    }
    this.scrollFrameId = null;

    if (this.highlightTimer !== null) {
      clearTimeout(this.highlightTimer);
    }
    this.highlightTimer = null;
  }
}
