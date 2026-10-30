import {
  Component,
  inject,
  signal,
  effect,
  RESPONSE_INIT,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SocialApi } from '../../shared/infra/social-api';
import { SeoService } from '../system/seo/seo.service';
import { ContentGameCta } from '../acquisition/content-game-cta';
import { createSsrTaskRunner } from '../../utils/ssr-task';
import { UiLoading } from '../../shared/ui/loading';

interface EditorialList {
  id: string;
  slug: string;
  title: string;
  description: string;
  criteria: string;
  month?: string;
  items: {
    reason: string;
    sources: string[];
    releaseDate?: string;
    game: { id: string; name: string; slug: string };
  }[];
}
@Component({
  selector: 'app-editorial-list-page',
  imports: [RouterLink, ContentGameCta, UiLoading],
  template: `<main class="mx-auto max-w-3xl px-4 py-6">
    <a routerLink="/listas-editoriais" class="text-blue-11 hover:underline"
      >Listas do Zetho</a
    >
    @if (loading()) {
      <ui-loading />
    } @else if (item(); as list) {
      <article>
        <h1 class="mt-4 text-3xl">{{ list.title }}</h1>
        <p class="my-3 text-gray-11">{{ list.description }}</p>
        <p class="text-sm text-gray-10">
          Por Zetho · Seleção editorial com apoio de IA e revisão humana
        </p>
        @if (list.month) {
          <p class="mt-3 text-sm">Período: {{ list.month }}</p>
        }
        <h2 class="mt-6 text-xl">Critérios da seleção</h2>
        <p class="my-3 text-gray-11">{{ list.criteria }}</p>
        <ol class="divide-y divide-gray-6">
          @for (entry of list.items; track entry.game.id; let index = $index) {
            <li class="py-5">
              <h2 class="text-xl">{{ index + 1 }}. {{ entry.game.name }}</h2>
              <p class="my-3 text-gray-11">{{ entry.reason }}</p>
              @if (entry.releaseDate) {
                <p class="text-sm">Lançamento: {{ entry.releaseDate }}</p>
              }
              <div class="flex flex-wrap gap-3">
                @for (source of entry.sources; track source) {
                  <a
                    [href]="source"
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    class="text-sm text-blue-11 hover:underline"
                    >Fonte</a
                  >
                }
              </div>
              <app-content-game-cta
                [game]="entry.game"
                [contentId]="list.id"
                [slug]="list.slug"
                source="editorial_list"
              />
            </li>
          }
        </ol>
      </article>
    } @else if (error()) {
      <p role="alert" class="py-6">Não foi possível carregar as listas.</p>
    } @else {
      <h1 class="my-6 text-3xl">Listas editoriais do Zetho</h1>
      @for (list of lists(); track list.id) {
        <article class="border-b border-gray-6 py-5">
          <a
            [routerLink]="['/listas-editoriais', list.slug]"
            class="text-xl text-blue-11 hover:underline"
            >{{ list.title }}</a
          >
          <p class="mt-2 text-gray-11">{{ list.description }}</p>
        </article>
      } @empty {
        <p class="text-gray-11">Ainda não há listas editoriais publicadas.</p>
      }
    }
  </main>`,
})
export class EditorialListPage implements OnDestroy {
  private api = inject(SocialApi);
  private seo = inject(SeoService);
  private response = inject(RESPONSE_INIT, { optional: true });
  private params = toSignal(inject(ActivatedRoute).paramMap);
  private run = createSsrTaskRunner();
  private generation = 0;
  loading = signal(true);
  error = signal(false);
  item = signal<EditorialList | null>(null);
  lists = signal<EditorialList[]>([]);
  constructor() {
    effect(() => {
      const slug = this.params()?.get('slug');
      void this.run(() => this.load(slug ?? null));
    });
  }
  ngOnDestroy() {
    this.generation++;
    this.seo.clearJsonLd('editorial-list');
  }
  private async load(slug: string | null) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set(false);
    this.item.set(null);
    this.seo.clearJsonLd('editorial-list');
    try {
      if (slug) {
        const list = await this.api.requestPublic<EditorialList>(
          `editorial-lists/public/${encodeURIComponent(slug)}`,
        );
        if (generation !== this.generation) return;
        this.item.set(list);
        this.seo.apply({
          title: `${list.title} — Zetho`,
          description: list.description,
          canonical: `/listas-editoriais/${list.slug}`,
          robots: 'index,follow',
        });
        this.seo.setJsonLd('editorial-list', {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: list.title,
          description: list.criteria,
          itemListElement: list.items.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: entry.game.name,
            url: this.seo.toAbsoluteUrl(`/jogo/${entry.game.slug}`),
          })),
        });
      } else {
        const lists =
          await this.api.requestPublic<EditorialList[]>('editorial-lists');
        if (generation !== this.generation) return;
        this.lists.set(lists);
        this.seo.apply({
          title: 'Listas editoriais — Zetho',
          description: 'Seleções de jogos da equipe editorial do Zetho.',
          canonical: '/listas-editoriais',
          robots: 'index,follow',
        });
      }
    } catch (error) {
      if (generation !== this.generation) return;
      this.error.set(true);
      this.seo.apply({
        title: 'Lista indisponível — Zetho',
        description: 'Não foi possível carregar a lista.',
        robots: 'noindex,follow',
      });
      if (this.response) {
        this.response.status = String(error).includes('404') ? 404 : 503;
        this.response.headers = { 'Cache-Control': 'no-store' };
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
}
