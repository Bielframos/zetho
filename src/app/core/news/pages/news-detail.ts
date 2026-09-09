import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiLoading } from '../../../shared/ui/loading';
import { SeoService } from '../../system/seo/seo.service';
import { NewsService } from '../news.service';
import type { NewsDetail } from '../news.types';
import { createSsrTaskRunner } from '../../../utils/ssr-task';

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
            <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-10">
              <span>{{ formatDate(item.$createdAt) }}</span>
              @if (item.author?.name) {
                <span>· por {{ item.author?.name }}</span>
              }
              @if (item.author?.isAutomated) {
                <span>·</span>
                <a
                  routerLink="/politica-editorial"
                  class="inline-flex items-center gap-1 rounded-full border border-gray-6 bg-gray-2/80 px-2 py-0.5 text-[11px] text-gray-11 hover:border-gray-5 hover:text-gray-12 transition-colors"
                  title="Texto produzido por assistente editorial de IA a partir de fontes públicas, sob responsabilidade editorial do Zetho."
                >
                  <i class="ph ph-sparkle text-blue-11" aria-hidden="true"></i>
                  <span>Assistente IA</span>
                </a>
              }
            </div>
          </header>
          <div
            class="prose prose-invert prose-sm max-w-none px-4 py-6 text-gray-11 prose-headings:text-gray-12 prose-a:text-blue-11 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
            [innerHTML]="renderedBody()"
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
                <div>
                  <h2 class="text-sm text-gray-10">Fonte original</h2>
                  <a
                    [href]="item.originalSourceUrl"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    class="mt-1 inline-flex items-center gap-1 break-all text-sm text-blue-11 hover:underline"
                    >{{ sourceHost(item.originalSourceUrl) }}
                    <i class="ph ph-arrow-square-out" aria-hidden="true"></i
                  ></a>
                </div>
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
  private sanitizer = inject(DomSanitizer);
  slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );
  private runAsSsrTask = createSsrTaskRunner();
  news = signal<NewsDetail | null>(null);
  loading = signal(true);

  renderedBody = computed<SafeHtml>(() => {
    const item = this.news();
    if (!item?.body) return '';
    const transformed = this.renderYoutube(item.body);
    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  });

  private renderYoutube(body: string) {
    return body.replace(
      /\[youtube:([a-zA-Z0-9_-]{11})\]/g,
      (_, id) => `
        <div data-youtube-video=""><iframe width="840" height="473" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy" allowfullscreen></iframe></div>
    `,
    );
  }

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      untracked(() => void this.load(slug));
    });
  }
  private load(slug: string) {
    return this.runAsSsrTask(() => this.loadInternal(slug));
  }

  private async loadInternal(slug: string) {
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
      // O `author` do markup precisa dizer a mesma coisa que o byline visível.
      // Conteúdo automatizado é atribuído à organização, nunca a uma Person —
      // divergência entre markup e página é ação manual de spam estruturado.
      const author = news.author?.isAutomated
        ? { '@type': 'Organization', name: 'Zetho' }
        : news.author?.name
          ? { '@type': 'Person', name: news.author.name }
          : { '@type': 'Organization', name: 'Zetho' };

      this.seo.setJsonLd('news-page', {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: news.title,
        description: news.subtitle ?? news.title,
        datePublished: news.$createdAt,
        dateModified: news.$updatedAt,
        inLanguage: 'pt-BR',
        author,
        publisher: {
          '@type': 'Organization',
          name: 'Zetho',
          url: this.seo.toAbsoluteUrl('/'),
        },
        isAccessibleForFree: true,
        mainEntityOfPage: this.seo.toAbsoluteUrl(`/noticias/${news.slug}`),
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
  sourceHost(url: string) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
  formatDate(value: string) {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
