import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../seo/seo.service';
import { GameController } from '../../game.controller';
import { UiGameActions } from './modules/game-actions';
import { UiGameHeader } from './modules/game-header';
import { UiGameLobby } from './modules/game-lobby';
import { UiGameMedias } from './modules/game-medias';
import { UiGameSimilar } from './modules/game-similar';
import { UiGameStats } from './modules/game-stats';
import { UiZEntryActions } from './modules/z-entry-actions';
import { UiGameRating } from './modules/game-rating';
import { UiGameReviews } from './modules/game-reviews';
import { UiGameNews } from './modules/game-news';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiTab, UiTabs, UiTabSwipe } from '../../../../shared/ui/tabs';
import { UiShareModal } from '../../../share/share-modal';
import { ShareCardData } from '../../../share/share.types';
import { RatingsService } from '../../../ratings/ratings.service';

type GameTab = 'lobby' | 'stats' | 'reviews' | 'news' | 'midias' | 'similar';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    UiZEntryActions,
    RouterLink,
    UiGameHeader,
    UiGameStats,
    UiGameLobby,
    UiGameActions,
    UiGameMedias,
    UiGameSimilar,
    UiGameRating,
    UiGameReviews,
    UiGameNews,
    UiLoading,
    UiTabs,
    UiTabSwipe,
    UiShareModal,
  ],
  templateUrl: './game.html',
})
export class GamePage {
  /* ---------------------------------------------------------
   * INJEÇÕES DE DEPENDÊNCIA
   * --------------------------------------------------------- */
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  private ratingsService = inject(RatingsService);
  controller = inject(GameController);
  authStore = inject(AuthStore);

  activeTab = signal<GameTab>('lobby');
  visitedTabs = signal<Set<GameTab>>(new Set<GameTab>(['lobby']));
  myRating = signal<number | null>(null);

  shareModal = viewChild<UiShareModal>('shareModal');

  shareData = computed<ShareCardData | null>(() => {
    const game = this.controller.game();
    const profile = this.authStore.profile();
    if (!game || !profile) return null;
    return {
      kind: 'zerei',
      game: {
        name: game.name,
        coverUrl: game.coverUrl,
        releaseYear: game.releaseYear,
      },
      author: {
        gamertag: profile.gamertag,
        avatarUrl: profile.avatarUrl ?? null,
      },
      completedCount: profile.totalsCompleted ?? null,
      rating: this.myRating(),
    };
  });

  openShare() {
    this.shareModal()?.open();
  }

  tabs = computed<UiTab[]>(() => {
    const list: UiTab[] = [
      { id: 'lobby', label: 'Lobby' },
      { id: 'stats', label: 'Estatísticas' },
      {
        id: 'reviews',
        label: 'Reviews',
        badge: this.controller.game()?.ratingCount ?? null,
      },
      { id: 'news', label: 'Notícias' },
    ];
    if (this.controller.medias().length > 0) {
      list.push({ id: 'midias', label: 'Mídias' });
    }
    if (this.controller.similarGames()?.length) {
      list.push({ id: 'similar', label: 'Talvez você goste' });
    }
    return list;
  });

  openTab(tab: string) {
    const next = tab as GameTab;
    this.activeTab.set(next);
    this.visitedTabs.update((set) => new Set(set).add(next));
  }

  onSwipe(direction: 'next' | 'prev') {
    const ids = this.tabs().map((tab) => tab.id);
    const currentIndex = ids.indexOf(this.activeTab());
    const nextIndex =
      direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < ids.length) {
      this.openTab(ids[nextIndex]);
    }
  }

  scrollToReviews() {
    this.openTab('reviews');
    setTimeout(() => {
      document
        .getElementById('tabs-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  // Slug vindo da rota
  slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );

  /* ---------------------------------------------------------
   * CICLO DE VIDA VIA SIGNAL EFFECTS
   * --------------------------------------------------------- */
  constructor() {
    // Abre o compartilhamento no momento "Zerei!" (pico emocional).
    effect(() => {
      const zeroedCount = this.controller.justZeroed();
      if (zeroedCount > 0) {
        untracked(() => this.shareModal()?.open());
      }
    });

    // Atualiza o estado quando o slug mudar
    effect(() => {
      const slug = this.slug();
      if (!slug) return;

      untracked(() => {
        void this.controller.loadPage(slug);
      });
    });

    // Carrega a nota do usuário para o jogo (usada opcionalmente no card de
    // compartilhamento).
    effect(() => {
      const game = this.controller.game();
      const authed = this.authStore.isAuthenticated();
      if (!game || !authed) {
        this.myRating.set(null);
        return;
      }

      untracked(() => {
        this.ratingsService
          .getMyRating(game.$id)
          .then((mine) => this.myRating.set(mine?.rating ?? null))
          .catch(() => this.myRating.set(null));
      });
    });

    // Atualiza o título da página quando o jogo carregar
    effect(() => {
      const game = this.controller.game();
      if (!game) return;

      const canonical = `/jogo/${game.slug}`;
      const description =
        game.summary?.trim() ||
        `Veja detalhes, avaliações e estatísticas de ${game.name} no Zetho.`;

      // Indexável só com conteúdo original. Sem review de texto, o único
      // conteúdo desta página é o `summary` do IGDB — idêntico ao de IGDB,
      // Steam e Metacritic. Indexar milhares dessas páginas dilui o crawl
      // budget e troca um problema de originalidade por outro.
      //
      // `noindex,follow` e não `Disallow`: a página continua rastreável e vira
      // indexável sozinha assim que ganhar a primeira crítica.
      const indexable = game.seo?.indexable ?? false;

      this.seo.apply({
        title: `${game.name} — Zetho`,
        description,
        canonical,
        robots: indexable ? 'index,follow' : 'noindex,follow',
        ogType: 'website',
        ogImage: game.coverUrl,
      });

      const genres = Array.isArray(game.genres)
        ? game.genres
            .map((genre: { name?: string } | string) => {
              if (typeof genre === 'string') return null;
              return genre?.name;
            })
            .filter((genreName): genreName is string => !!genreName)
        : [];

      const developers = Array.isArray(game.involvedCompanies)
        ? game.involvedCompanies
            .map((company: { name?: string }) => company?.name)
            .filter(Boolean)
        : [];

      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: game.name,
        description,
        url: this.seo.toAbsoluteUrl(canonical),
        image: game.coverUrl,
        genre: genres,
        publisher: {
          '@type': 'Organization',
          name: 'Zetho',
        },
      };

      if (developers.length) {
        jsonLd['author'] = developers.map((name) => ({
          '@type': 'Organization',
          name,
        }));
      }

      // `ratingAvg` é `double` opcional: pode vir null com `ratingCount > 0`,
      // e `toFixed` em null estoura o effect inteiro.
      if (game.ratingCount > 0 && typeof game.ratingAvg === 'number') {
        jsonLd['aggregateRating'] = {
          '@type': 'AggregateRating',
          ratingValue: Number(game.ratingAvg.toFixed(1)),
          ratingCount: game.ratingCount,
          bestRating: 5,
          worstRating: 0.5,
        };
      }

      // Só as críticas de fato renderizadas nesta URL. Emitir markup de
      // conteúdo que não está visível na página é ação manual de spam
      // estruturado — pior que não ter markup nenhum.
      const renderedReviews = this.controller.communityReviews();
      if (renderedReviews.length) {
        jsonLd['review'] = renderedReviews.map((review) => ({
          '@type': 'Review',
          reviewBody: this.stripHtml(review.content ?? ''),
          datePublished: review.$createdAt,
          author: {
            '@type': 'Person',
            name: review.profile?.gamertag ?? 'Jogador do Zetho',
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 0.5,
          },
        }));
      }

      jsonLd['breadcrumb'] = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: this.seo.toAbsoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: game.name,
            item: this.seo.toAbsoluteUrl(canonical),
          },
        ],
      };

      this.seo.setJsonLd('game-page', jsonLd);
    });
  }

  /** O `content` das críticas é HTML do Tiptap; `reviewBody` precisa ser texto. */
  private stripHtml(value: string) {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  formatReviewDate(value: string) {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('game-page');
  }
}
