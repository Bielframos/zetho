import {
  Component,
  effect,
  inject,
  RESPONSE_INIT,
  SecurityContext,
  signal,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ForumService } from '../forum.service';
import { ForumPostItem, ForumReplyItem } from '../forum.types';
import { SeoService } from '../../system/seo/seo.service';
import { createSsrTaskRunner } from '../../../utils/ssr-task';
import { UiLoading } from '../../../shared/ui/loading';

@Component({
  selector: 'app-forum-replies-page',
  imports: [RouterLink, UiLoading],
  template: `<main class="mx-auto max-w-3xl p-4">
    @if (loading()) {
      <ui-loading />
    } @else if (post(); as topic) {
      <a
        [routerLink]="['/forum', topic.slug]"
        class="text-blue-11 hover:underline"
        >{{ topic.title }}</a
      >
      <h1 class="my-5 text-2xl">
        Respostas da discussão · Página {{ page() }}
      </h1>
      @for (reply of replies(); track reply.$id) {
        <article class="border-t border-gray-6 py-4">
          <p class="text-sm text-gray-10">
            {{ reply.author?.gamertag || 'Comunidade Zetho' }}
          </p>
          <div
            class="prose my-3 max-w-none"
            [innerHTML]="safeHtml(reply.content)"
          ></div>
          <a
            [routerLink]="['/forum', topic.slug]"
            [queryParams]="{ commentId: reply.$id }"
            class="text-sm text-blue-11 hover:underline"
            >Ver na discussão</a
          >
          @if (reply.replyCount > 0) {
            <a
              [routerLink]="['/forum', topic.slug, 'respostas', reply.$id]"
              class="ml-4 text-sm text-blue-11 hover:underline"
              >Ver respostas</a
            >
          }
        </article>
      } @empty {
        <p class="py-4 text-gray-11">Nenhuma resposta nesta página.</p>
      }
      <nav
        class="flex justify-between border-t border-gray-6 py-4"
        aria-label="Páginas de respostas"
      >
        @if (page() > 1) {
          <a
            [routerLink]="[]"
            [queryParams]="{ page: page() - 1 }"
            class="text-blue-11 hover:underline"
            >Anterior</a
          >
        }
        @if (hasMore()) {
          <a
            [routerLink]="[]"
            [queryParams]="{ page: page() + 1 }"
            class="text-blue-11 hover:underline"
            >Próxima</a
          >
        }
      </nav>
    } @else {
      <p role="alert">Não foi possível carregar as respostas.</p>
    }
  </main>`,
})
export class ForumRepliesPage implements OnDestroy {
  private forum = inject(ForumService);
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.paramMap);
  private query = toSignal(this.route.queryParamMap);
  private response = inject(RESPONSE_INIT, { optional: true });
  private seo = inject(SeoService);
  private sanitizer = inject(DomSanitizer);
  private run = createSsrTaskRunner();
  private generation = 0;
  loading = signal(true);
  post = signal<ForumPostItem | null>(null);
  replies = signal<ForumReplyItem[]>([]);
  page = signal(1);
  hasMore = signal(false);
  constructor() {
    effect(() => {
      const slug = this.params()?.get('slug');
      const parentId = this.params()?.get('parentId');
      const page = Number(this.query()?.get('page') ?? 1);
      if (slug && parentId)
        void this.run(() =>
          this.load(
            slug,
            parentId,
            Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1,
          ),
        );
    });
  }
  ngOnDestroy() {
    this.generation++;
  }
  safeHtml(value: string) {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }
  private async load(slug: string, parentId: string, page: number) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.post.set(null);
    this.replies.set([]);
    this.seo.apply({
      title: 'Respostas — Fórum Zetho',
      description: 'Respostas públicas da comunidade.',
      canonical: `/forum/${slug}`,
      robots: 'noindex,follow',
    });
    try {
      // Resolve ancestry through the public contract before reading descendants.
      const detail = await this.forum.getPostBySlugOrId(parentId);
      if (!detail || detail.post.slug !== slug) {
        if (this.response) this.response.status = 404;
        return;
      }
      const result = await this.forum.getReplies(parentId, {
        page,
        pageSize: 20,
        sort: 'recent',
      });
      if (generation !== this.generation) return;
      this.post.set(detail.post);
      this.replies.set(result.items);
      this.page.set(result.page);
      this.hasMore.set(result.hasMore);
      if (!result.items.length && page > 1 && this.response)
        this.response.status = 404;
    } catch {
      if (this.response) this.response.status = 503;
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }
}
