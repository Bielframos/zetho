import { Component, inject, input, output, signal } from '@angular/core';
import { AuthStore } from '../../auth/auth.store';
import { NotificationStore } from '../../system/notifications/notification.store';
import { UiLoading } from '../../../shared/ui/loading';
import { RatingsService } from '../ratings.service';

@Component({
  selector: 'ui-feed-review-votes',
  standalone: true,
  imports: [UiLoading],
  host: { class: 'shrink-0' },
  template: `
    <div
      class="flex items-center text-sm text-gray-11"
      [attr.aria-busy]="pending()"
    >
      <button
        type="button"
        class="ui-ghost-btn"
        data-size="icon"
        aria-label="Votar a favor da review"
        title="Votar a favor da review"
        [disabled]="pending()"
        (click)="vote('up')"
      >
        <i class="ph ph-arrow-up" aria-hidden="true"></i>
      </button>
      <span
        class="min-w-5 text-center font-medium tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (pending()) {
          <ui-loading [inline]="true" size="sm" />
        } @else {
          <span class="sr-only">Votos: </span>{{ voteCount() }}
        }
      </span>
      <button
        type="button"
        class="ui-ghost-btn"
        data-size="icon"
        aria-label="Votar contra a review"
        title="Votar contra a review"
        [disabled]="pending()"
        (click)="vote('down')"
      >
        <i class="ph ph-arrow-down" aria-hidden="true"></i>
      </button>
    </div>
  `,
})
export class FeedReviewVotes {
  readonly reviewId = input.required<string>();
  readonly voteCount = input(0);
  readonly countChanged = output<number>();
  readonly pending = signal(false);
  private readonly ratings = inject(RatingsService);
  private readonly auth = inject(AuthStore);
  private readonly notification = inject(NotificationStore);

  async vote(operation: 'up' | 'down') {
    if (this.pending()) return;
    if (!this.auth.isAuthenticated()) {
      this.notification.show({
        message: 'Entre na sua conta para votar na review.',
        type: 'error',
      });
      return;
    }
    this.pending.set(true);
    try {
      const result = await this.ratings.voteRating(this.reviewId(), operation);
      this.countChanged.emit(result.newVoteCount);
    } catch {
      this.notification.show({
        message: 'Não foi possível registrar seu voto. Tente novamente.',
        type: 'error',
      });
    } finally {
      this.pending.set(false);
    }
  }
}
