import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameRow, GameWithEntry, ZEntryRow } from '../../types';
import type { GameMedia, GameHero } from './game.types';
import { AuthStore } from '../auth/auth.store';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameService } from './games.service';

@Injectable({ providedIn: 'root' })
export class GameController {
  private router = inject(Router);

  game = signal<GameRow | null>(null);
  similarGames = signal<GameWithEntry[] | null>(null);
  zEntry = signal<ZEntryRow | null>(null);
  medias = signal<GameMedia[]>([]);
  heroImage = signal<GameHero | null>(null);
  errors = signal<Record<string, any>>({});
  loading = signal(false);
  updating = signal(false);
  isUpcomingRelease = computed(() => {
    const game = this.game();
    if (!game) return false;

    if (game.releaseDate == null || game.releaseYear == null) return true;

    const rawReleaseDate = game?.rawReleaseDate;

    if (!rawReleaseDate) return false;

    const releaseDate = new Date(rawReleaseDate);

    if (Number.isNaN(releaseDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return releaseDate.getTime() > today.getTime();
  });

  constructor(
    private gameService: GameService,
    private zEntryService: ZEntryService,
    private authStore: AuthStore,
  ) {}

  async loadPage(slug: string) {
    try {
      // Limpar estado anterior para evitar flickering
      this.game.set(null);
      this.similarGames.set(null);
      this.zEntry.set(null);
      this.medias.set([]);
      this.heroImage.set(null);
      this.errors.set({});
      this.loading.set(true);

      const user = this.authStore.user();
      const profile = this.authStore.profile();

      const data = await this.gameService.loadGamePage(slug, {
        userId: user?.$id,
        fingerprint: profile?.fingerprint,
      });

      this.game.set(data.game);
      this.zEntry.set(data.zEntry);
      this.similarGames.set(data.similarGames);
      this.medias.set(data.medias);
      this.heroImage.set(data.heroImage);
    } catch (e) {
      if (e instanceof Error && e.message === 'game_not_found') {
        this.router.navigate(['/404']);
      }

      this.errors.update((state) => ({ ...state, page: e }));
    } finally {
      this.loading.set(false);
    }
  }

  async handleEntry({
    action,
    value,
  }:
    | { action: 'updateStatus'; value: ZEntryRow['status'] }
    | { action: 'like'; value: boolean }
    | { action: 'hype'; value: boolean }) {
    const game = this.game();
    const zEntry = this.zEntry();
    const profile = this.authStore.profile();

    if (!game) return;
    if (this.updating()) return;
    if (!profile) {
      this.errors.update((state) => ({ ...state, entry: 'auth_required' }));
      return;
    }

    if (
      action === 'updateStatus' &&
      value !== 'wishlist' &&
      this.isUpcomingRelease()
    ) {
      this.errors.update((state) => ({
        ...state,
        entry: 'progress_not_available_for_unreleased_game',
      }));
      return;
    }

    try {
      this.updating.set(true);

      const updated = await this.zEntryService.createEntryLog(
        profile.fingerprint,
        game.$id,
        zEntry,
        action === 'updateStatus'
          ? { status: value }
          : action === 'hype'
            ? { hyped: value }
            : { liked: value },
      );

      this.zEntry.set(updated);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      this.updating.set(false);
    }
  }
}
