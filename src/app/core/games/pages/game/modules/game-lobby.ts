import { Component, inject, signal } from '@angular/core';
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
          class="max-h-[160px] min-h-[64px] w-full border-y border-gray-6 bg-transparent px-4 py-2 font-light text-gray-12 outline-none transition-colors duration-200 ease-in-out placeholder:text-gray-10 focus:ring-2 focus:ring-blue-6 disabled:border-gray-3 disabled:bg-transparent disabled:text-gray-11 md:border"
          [formControl]="comment"
          required
        ></textarea>

        <div class="mt-2 flex justify-between">
          <div>
            <small
              class="transition-colors"
              [class.text-green-300]="charsCount() > 3 && charsCount() < 350"
              [class.text-red-300]="charsCount() > 350"
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
  controller = inject(CommentsController);

  isLoading = signal(false);
  comment = new FormControl('', {
    nonNullable: true,
    validators: [Validators.minLength(3), Validators.maxLength(350)],
  });
  charsCount = signal(0);
  result = signal<{ error?: boolean; message?: string }>({});

  constructor() {
    this.comment.valueChanges.subscribe((value) =>
      this.charsCount.set(value.length),
    );
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
}
