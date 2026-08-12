import {
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiLoading } from '../../../shared/ui/loading';
import { SeoService } from '../../seo/seo.service';
import { NewsService } from '../news.service';
import type { NewsDetail } from '../news.types';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [RouterLink, UiLoading],
  template: `
    <main class="mx-auto min-h-dvh w-full max-w-3xl">
      @if (loading()) {
        <div class="border-y border-gray-6">
          <ui-loading fallback="Carregando notícia..." variant="subtle" />
        </div>
      } @else if (news(); as item) {
        <article>
          <header class="border-b border-gray-6 px-4 py-6">
            <a
              routerLink="/noticias"
              class="text-sm text-blue-11 hover:underline"
              ><i class="ph ph-arrow-left"></i> Notícias</a
            >
            <div class="mt-5 flex flex-wrap gap-2">
              @for (tag of item.tags; track tag) {
                <span
                  class="rounded-full bg-blue-3 px-2 py-0.5 text-xs text-blue-11"
                  >#{{ tag }}</span
                >
              }
            </div>
            <h1 class="mt-3 text-3xl leading-tight text-gray-12 md:text-5xl">
              {{ item.title }}
            </h1>
            @if (item.subtitle) {
              <p class="mt-3 text-lg leading-7 text-gray-11">
                {{ item.subtitle }}
              </p>
            }
            <p class="mt-5 text-sm text-gray-10">
              {{ formatDate(item.$createdAt) }}
              @if (item.author?.name) {
                · por {{ item.author?.name }}
              }
            </p>
          </header>
          <div
            class="prose prose-invert prose-sm max-w-none px-4 py-6 text-gray-11 prose-headings:text-gray-12 prose-a:text-blue-11 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
            [innerHTML]="item.body"
          ></div>
          @if (item.relatedGames.length || item.originalSourceUrl) {
            <footer class="border-t border-gray-6 px-4 py-5">
              @if (item.relatedGames.length) {
                <div class="mb-5">
                  <h2 class="text-sm text-gray-10">Jogos relacionados</h2>
                  <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    @for (game of item.relatedGames; track game.id) {
                      <a
                        [routerLink]="['/jogo', game.slug]"
                        class="text-blue-11 hover:underline"
                        >{{ game.name }}</a
                      >
                    }
                  </div>
                </div>
              }
              @if (item.originalSourceUrl) {
                <a
                  [href]="item.originalSourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-blue-11 hover:underline"
                  >Ver fonte original <i class="ph ph-arrow-square-out"></i
                ></a>
              }
            </footer>
          }
        </article>
      } @else {
        <div class="p-8 text-center text-gray-11">
          Não foi possível carregar esta notícia.
        </div>
      }
    </main>
  `,
})
export class NewsDetailPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(NewsService);
  private seo = inject(SeoService);
  slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );
  news = signal<NewsDetail | null>(null);
  loading = signal(true);
  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      untracked(() => void this.load(slug));
    });
  }
  private async load(slug: string) {
    this.loading.set(true);
    this.news.set(null);
    try {
      const news = await this.service.findBySlug(slug);
      if (!news) {
        void this.router.navigate(['/404']);
        return;
      }
      this.news.set(news);
      this.seo.apply({
        title: `${news.title} — Zetho`,
        description: news.subtitle ?? news.title,
        canonical: `/noticias/${news.slug}`,
        robots: 'index,follow',
        ogType: 'article',
        twitterCard: 'summary',
      });
      this.seo.setJsonLd('news-page', {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: news.title,
        description: news.subtitle ?? news.title,
        datePublished: news.$createdAt,
        dateModified: news.$updatedAt,
        mainEntityOfPage: new URL(
          `/noticias/${news.slug}`,
          window.location.origin,
        ).toString(),
      });
    } catch {
      this.news.set(null);
    } finally {
      this.loading.set(false);
    }
  }
  ngOnDestroy() {
    this.seo.clearJsonLd('news-page');
  }
  formatDate(value: string) {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
