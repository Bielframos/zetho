import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentsController } from '../../../core/controllers/comments.controller';
import { AppCommentItem } from '../../../shared/ui/molecules/comment-item/comment-item';

@Component({
  selector: 'ui-game-lobby',
  standalone: true,
  imports: [AppCommentItem, ReactiveFormsModule],
  template: `
    <article class="flex flex-col gap-4">
      <header class="flex gap-4 items-center">
        <div
          class="h-10 w-10 flex items-center justify-center rounded-full bg-blue-3"
        >
          <i class="ph ph-users-three text-blue-9 text-[24px]"></i>
        </div>
        <div>
          <h3 class="text-blue-12 text-2xl">Lobby</h3>
          <small class="text-gray-11">Troque ideias com outros jogadores</small>
        </div>
      </header>

      <div>
        <textarea
          name="comment"
          id="comment"
          placeholder="Diga algo sobre este jogo…"
          class="rounded-lg px-4 w-full py-2 font-light border-gray-6 bg-blue-2 placeholder:text-gray-10 text-gray-12 outline-none focus:ring-2 focus:ring-blue-6 transition-colors duration-200 ease-in-out disabled:border-gray-3 disabled:bg-transparent disabled:text-gray-11 min-h-[64px] max-h-[160px]"
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
              <i class="ph ph-spinner animate-spin"></i>
            }
            Comentar
          </button>
        </div>
      </div>

      @for (comment of controller.rootComments(); track comment.$id) {
        <app-comment-item
          [comment]="comment"
          [replies]="controller.childComments()[comment.$id]?.comments || []"
          [isLoadingReplies]="controller.loadingReplies()[comment.$id]"
          (loadReplies)="controller.loadReplies(comment.$id)"
          (reply)="controller.addComment($event, comment.$id, 1)"
        />
      }

      @if (controller.hasMore()) {
        <footer class="w-full flex justify-center">
          <button
            class="ui-primary-btn"
            (click)="controller.loadRootComments({loadMore: true})"
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
