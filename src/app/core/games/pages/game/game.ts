import { Component, effect, inject, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { UiGameHeader } from './modules/game-header';
import { UiGameStats } from './modules/game-stats';
import { UiZEntryActions } from './modules/z-entry-actions';
import { UiGameLobby } from './modules/game-lobby';
import { UiGameActions } from './modules/game-actions';
import { UiGameCard } from '../../../../shared/ui/game-card/game-card';
import { GameController } from '../../game.controller';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../seo/seo.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    UiGameCard,
    UiZEntryActions,
    RouterLink,
    UiGameHeader,
    UiGameStats,
    UiGameLobby,
    UiGameActions,
  ],
  templateUrl: './game.html',
})
export class GamePage {
  /* ---------------------------------------------------------
   * INJEÇÕES DE DEPENDÊNCIA
   * --------------------------------------------------------- */
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  controller = inject(GameController);
  authStore = inject(AuthStore);

  // Slug vindo da rota
  slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );

  /* ---------------------------------------------------------
   * CICLO DE VIDA VIA SIGNAL EFFECTS
   * --------------------------------------------------------- */
  constructor() {
    // Atualiza o estado quando o slug mudar
    effect(() => {
      const slug = this.slug();
      if (slug) this.controller.loadPage(slug);
    });

    // Atualiza o título da página quando o jogo carregar
    effect(() => {
      const game = this.controller.game();
      if (!game) return;

      const canonical = `/jogo/${game.slug}`;
      const description =
        game.summary?.trim() ||
        `Veja detalhes, avaliações e estatísticas de ${game.name} no Zetho.`;

      this.seo.apply({
        title: `${game.name} — Zetho`,
        description,
        canonical,
        robots: 'index,follow',
        ogType: 'website',
        ogImage: game.coverUrl,
      });

      const genres = Array.isArray(game.genres)
        ? game.genres
            .map((genre: { name?: string }) => genre?.name)
            .filter(Boolean)
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
        url: new URL(canonical, window.location.origin).toString(),
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

      if (game.ratingCount > 0) {
        jsonLd['aggregateRating'] = {
          '@type': 'AggregateRating',
          ratingValue: Number(game.ratingAvg.toFixed(1)),
          ratingCount: game.ratingCount,
        };
      }

      this.seo.setJsonLd('game-page', jsonLd);
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('game-page');
  }
}
