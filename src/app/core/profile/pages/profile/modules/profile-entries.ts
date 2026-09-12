import { Component, effect, inject, signal } from '@angular/core';
import { UiLoading } from '../../../../../shared/ui/loading';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { InfiniteScrollDirective } from '../../../../../shared/ui/infinite-scroll';
import { ZEntriesController } from '../../../../zEntries/zEntries.controller';
import { RouterLink } from '@angular/router';
import { ProfileStore } from '../../../../userProfiles/profile.store';
import { GameRepository } from '../../../../games/games.repository';
import type { GameRow } from '../../../../../types';

const SUGGESTED_GAME_SLUGS = [
  'battlefield-6',
  'valorant',
  'counter-strike-2',
  'ea-sports-fc-26',
  'call-of-duty-warzone--2',
] as const;

@Component({
  selector: 'ui-proflie-entries',
  standalone: true,
  imports: [UiLoading, UiGameCard, RouterLink, InfiniteScrollDirective],
  templateUrl: './profile-entries.html',
})
export class UiUserLibGrid {
  private gameRepository = inject(GameRepository);
  private suggestionLoadedForProfile: string | null = null;

  readonly controller = inject(ZEntriesController);
  readonly profileStore = inject(ProfileStore);
  readonly suggestedGame = signal<GameRow | null>(null);
  readonly loadingSuggestion = signal(false);

  constructor() {
    effect(() => {
      const profile = this.profileStore.current();
      const shouldLoadSuggestion =
        this.profileStore.itsMe() &&
        !this.controller.initialLoading() &&
        this.controller.offset() > 0 &&
        this.controller.entries().length === 0;

      if (
        !profile ||
        !shouldLoadSuggestion ||
        this.suggestionLoadedForProfile === profile.$id
      ) {
        return;
      }

      this.suggestionLoadedForProfile = profile.$id;
      void this.loadSuggestion();
    });
  }

  private async loadSuggestion() {
    this.loadingSuggestion.set(true);

    try {
      const games = await this.gameRepository.findBySlugs(
        [...SUGGESTED_GAME_SLUGS],
        ['$id', 'name', 'slug', 'releaseYear', 'releaseDate', 'coverUrl'],
      );

      if (games.length === 0) return;

      const randomIndex = Math.floor(Math.random() * games.length);
      this.suggestedGame.set(games[randomIndex]);
    } catch {
      this.suggestedGame.set(null);
    } finally {
      this.loadingSuggestion.set(false);
    }
  }
}
