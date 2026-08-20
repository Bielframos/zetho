import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InfiniteScrollDirective } from '../../../shared/ui/infinite-scroll';
import { UiLoading } from '../../../shared/ui/loading';
import { UiSkeleton } from '../../../shared/ui/skeleton';
import { SeoService } from '../../system/seo/seo.service';
import { NewsItemComponent } from '../news-item';
import { NewsService } from '../news.service';
import type { NewsSummary } from '../news.types';
import { createSsrTaskRunner } from '../../../utils/ssr-task';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [
    InfiniteScrollDirective,
    NewsItemComponent,
    RouterLink,
    UiLoading,
    UiSkeleton,
  ],
  template: `
    <main class="mx-auto min-h-dvh w-full max-w-2xl">
      <header class="border-b border-gray-6 px-4 py-4">
        <div class="flex items-center gap-3">
          <span
            class="flex h-11 w-11 items-center justify-center border border-gray-6"
            ><i class="ph ph-newspaper text-xl text-blue-11"></i
          ></span>
          <div>
            <h1 class="text-2xl text-gray-12">Notícias</h1>
            <p class="text-sm text-gray-11">
              O que importa no mundo dos jogos.
            </p>
          </div>
        </div>

        <p
          class="mt-4 flex flex-wrap items-center gap-1.5 rounded-md border border-gray-6 bg-gray-2 px-3 py-2 text-xs text-gray-11"
        >
          <i class="ph ph-robot" aria-hidden="true"></i>
          <span>
            Matérias produzidas com apoio de IA a partir de fontes públicas,
            sob responsabilidade editorial do Zetho.
          </span>
          <a routerLink="/politica-editorial" class="text-blue-11 hover:underline"
            >Política Editorial</a
          >
        </p>
      </header>
      @if (loading()) {
        <div class="divide-y divide-gray-6">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="space-y-3 p-4">
              <ui-skeleton [height]="18"></ui-skeleton
              ><ui-skeleton [height]="14" [width]="70"></ui-skeleton>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="p-6 text-center text-gray-11">
          <p>Não foi possível carregar as notícias.</p>
          <button class="ui-secondary-btn mt-4" (click)="resetAndLoad()">
            Tentar novamente
          </button>
        </div>
      } @else if (items().length) {
        <div>
          @for (item of items(); track item.$id; let i = $index) {
            <div class="border-b border-gray-7 last:border-b-0">
              <app-news-item [news]="item" [index]="i + 1" />
            </div>
          }
        </div>
        <div
          uiInfiniteScroll
          [disabled]="loadingMore() || loadMoreError() || !hasMore()"
          rootMargin="600px"
          (scrolled)="loadMore()"
          class="flex min-h-8 items-center justify-center"
        >
          @if (loadingMore()) {
            <ui-loading [inline]="true" size="sm"></ui-loading>
          } @else if (loadMoreError()) {
            <button
              type="button"
              class="ui-secondary-btn my-4"
              (click)="retryLoadMore()"
            >
              Tentar carregar mais
            </button>
          }
        </div>
      } @else {
        <div class="p-8 text-center text-gray-11">
          Nenhuma notícia publicada ainda.
        </div>
      }
    </main>
  `,
})
export class NewsListPage {
  private news = inject(NewsService);
  private seo = inject(SeoService);
  private runAsSsrTask = createSsrTaskRunner();
  items = signal<NewsSummary[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  error = signal(false);
  loadMoreError = signal(false);
  page = signal(1);
  hasMore = signal(false);
  constructor() {
    this.seo.apply({
      title: 'Notícias — Zetho',
      description: 'Notícias de games selecionadas pelo Zetho.',
      canonical: '/noticias',
      robots: 'index,follow',
      ogType: 'website',
      twitterCard: 'summary',
    });
    void this.load();
  }
  async resetAndLoad() {
    this.items.set([]);
    this.page.set(1);
    this.hasMore.set(false);
    this.loadMoreError.set(false);
    await this.load();
  }
  private load() {
    return this.runAsSsrTask(() => this.loadInternal());
  }

  private async loadInternal() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const response = await this.news.list({ page: 1, pageSize: 20 });
      this.items.set(response.items);
      this.page.set(response.page);
      this.hasMore.set(response.hasMore);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  async loadMore() {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.loadMoreError.set(false);
    try {
      const next = this.page() + 1;
      const response = await this.news.list({ page: next, pageSize: 20 });
      this.items.update((items) => [...items, ...response.items]);
      this.page.set(next);
      this.hasMore.set(response.hasMore);
    } catch {
      this.loadMoreError.set(true);
    } finally {
      this.loadingMore.set(false);
    }
  }

  retryLoadMore() {
    void this.loadMore();
  }
}
