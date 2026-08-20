import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DashboardService,
  PublicListItem,
} from '../../../dashboard/dashboard.service';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiSkeleton } from '../../../../shared/ui/skeleton';

type PublicListCover = {
  gameName: string;
  gameCoverUrl: string;
};

const PAGE_SIZE = 12;

@Component({
  selector: 'app-public-lists',
  standalone: true,
  imports: [RouterLink, UiLoading, UiSkeleton],
  templateUrl: './public-lists.html',
})
export class PublicListsPage implements OnDestroy {
  private dashboardService = inject(DashboardService);
  private sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;

  lists = signal<PublicListItem[]>([]);
  total = signal(0);
  page = signal(1);
  hasMore = signal(false);
  loading = signal(false);
  loadingMore = signal(false);
  error = signal<string | null>(null);

  constructor() {
    void this.loadInitial();
    afterNextRender(() => this.setupInfiniteScroll());
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  coversFor(list: PublicListItem): PublicListCover[] {
    if (list.coverImageUrls && list.coverImageUrls.length > 0) {
      return list.coverImageUrls.slice(0, 3).map((url) => ({
        gameName: list.title ?? '',
        gameCoverUrl: url,
      }));
    }
    return list.latestAdditions
      ? list.latestAdditions
          .map((item) => {
            try {
              const cover = JSON.parse(item) as Partial<PublicListCover>;
              return typeof cover.gameName === 'string' &&
                typeof cover.gameCoverUrl === 'string' &&
                cover.gameCoverUrl
                ? (cover as PublicListCover)
                : null;
            } catch {
              return null;
            }
          })
          .filter((cover): cover is PublicListCover => cover !== null)
          .slice(0, 3)
      : [];
  }

  async retry() {
    if (this.lists().length === 0) {
      await this.loadInitial();
      return;
    }

    await this.loadMore();
  }

  async loadMore() {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    this.error.set(null);
    const nextPage = this.page() + 1;

    try {
      const response = await this.dashboardService.getPublicLists(
        nextPage,
        PAGE_SIZE,
      );
      this.lists.update((current) => [...current, ...response.items]);
      this.total.set(response.total);
      this.page.set(response.page);
      this.hasMore.set(response.hasMore);
    } catch (error) {
      console.error(error);
      this.error.set('Não foi possível carregar mais listas.');
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async loadInitial() {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.dashboardService.getPublicLists(1, PAGE_SIZE);
      this.lists.set(response.items);
      this.total.set(response.total);
      this.page.set(response.page);
      this.hasMore.set(response.hasMore);
    } catch (error) {
      console.error(error);
      this.error.set('Não foi possível carregar as listas públicas.');
    } finally {
      this.loading.set(false);
    }
  }

  private setupInfiniteScroll() {
    const element = this.sentinel()?.nativeElement;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void this.loadMore();
      },
      { rootMargin: '600px' },
    );
    this.observer.observe(element);
  }
}
