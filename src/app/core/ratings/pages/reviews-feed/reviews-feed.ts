import { FeedReviewContent } from '../../components/feed-review-content';
import { FeedReviewVotes } from '../../components/feed-review-votes';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InfiniteScrollDirective } from '../../../../shared/ui/infinite-scroll';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiSkeleton } from '../../../../shared/ui/skeleton';
import { RelativeTimePipe } from '../../../../utils/pipes';
import { createSsrTaskRunner } from '../../../../utils/ssr-task';
import {
  RatingFeedRow,
  RatingsService,
} from '../../ratings.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-reviews-feed',
  standalone: true,
  imports: [
    FeedReviewContent,
    FeedReviewVotes,
    InfiniteScrollDirective,
    RelativeTimePipe,
    RouterLink,
    UiLoading,
    UiSkeleton,
  ],
  templateUrl: './reviews-feed.html',
})
export class ReviewsFeedPage {
  private readonly ratingsService = inject(RatingsService);
  private readonly runAsSsrTask = createSsrTaskRunner();

  readonly reviews = signal<RatingFeedRow[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly loadMoreError = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly hasMore = computed(() => this.page() < this.totalPages());

  constructor() {
    void this.loadInitial();
  }

  updateReviewVoteCount(reviewId: string, voteCount: number) {
    this.reviews.update((reviews) =>
      reviews.map((review) =>
        review.$id === reviewId ? { ...review, voteCount } : review,
      ),
    );
  }

  retry() {
    void this.loadInitial();
  }

  async loadMore() {
    if (
      this.loading() ||
      this.loadingMore() ||
      this.loadMoreError() ||
      !this.hasMore()
    ) {
      return;
    }

    this.loadingMore.set(true);
    const nextPage = this.page() + 1;

    try {
      const response = await this.ratingsService.getRatingsFeed(
        nextPage,
        PAGE_SIZE,
      );
      this.reviews.update((reviews) =>
        this.mergeReviews(reviews, response.items),
      );
      this.page.set(response.page);
      this.totalPages.set(response.totalPages);
    } catch {
      this.loadMoreError.set(true);
    } finally {
      this.loadingMore.set(false);
    }
  }

  retryLoadMore() {
    this.loadMoreError.set(false);
    void this.loadMore();
  }

  authorInitial(review: RatingFeedRow) {
    return review.author?.gamertag.trim().charAt(0).toUpperCase() || 'Z';
  }

  private loadInitial() {
    return this.runAsSsrTask(async () => {
      this.loading.set(true);
      this.error.set(false);
      this.loadMoreError.set(false);

      try {
        const response = await this.ratingsService.getRatingsFeed(1, PAGE_SIZE);
        this.reviews.set(response.items);
        this.page.set(response.page);
        this.totalPages.set(response.totalPages);
      } catch {
        this.reviews.set([]);
        this.error.set(true);
      } finally {
        this.loading.set(false);
      }
    });
  }

  private mergeReviews(
    current: RatingFeedRow[],
    incoming: RatingFeedRow[],
  ) {
    const ids = new Set(current.map((review) => review.$id));
    return [
      ...current,
      ...incoming.filter((review) => !ids.has(review.$id)),
    ];
  }
}
