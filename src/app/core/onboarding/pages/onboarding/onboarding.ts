import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppStartingRating } from '../../../../shared/ui/star-rating/star-rating';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthStore } from '../../../auth/auth.store';
import { GameService } from '../../../games/games.service';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { RatingsService } from '../../../ratings/ratings.service';
import { ConnectionsService } from '../../../connections/connections.service';
import {
  DashboardService,
  SuggestedConnection,
} from '../../../dashboard/dashboard.service';
import { NotificationStore } from '../../../notifications/notification.store';
import { GameWithEntry, ZEntryRow } from '../../../../types';
import { appwrite } from '../../../appwrite/appwrite.client';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [AppStartingRating, UiLoading],
  templateUrl: './onboarding.html',
  host: { class: 'block' },
})
export class OnboardingPage {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private gameService = inject(GameService);
  private zEntryService = inject(ZEntryService);
  private ratingsService = inject(RatingsService);
  private connectionsService = inject(ConnectionsService);
  private dashboardService = inject(DashboardService);
  private notification = inject(NotificationStore);

  step = signal(1);

  // Passo 1 — busca e marcação
  query = signal('');
  searching = signal(false);
  results = signal<GameWithEntry[]>([]);
  marked = signal<Map<string, GameWithEntry>>(new Map());
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  markedList = computed(() => Array.from(this.marked().values()));
  markedCount = computed(() => this.marked().size);

  // Passo 3 — sugestões
  suggestions = signal<SuggestedConnection[]>([]);
  loadingSuggestions = signal(false);
  followingIds = signal<Set<string>>(new Set());

  private get fingerprint() {
    return this.authStore.profile()?.fingerprint ?? '';
  }

  onQueryInput(value: string) {
    this.query.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.runSearch(), 350);
  }

  private async runSearch() {
    const q = this.query().trim();
    if (q.length < 2) {
      this.results.set([]);
      return;
    }
    this.searching.set(true);
    try {
      const res = await this.gameService.searchGame(q, {
        pageSize: 12,
        fingerprint: this.fingerprint,
      });
      this.results.set(res.rows);
    } catch (e) {
      console.error(e);
    } finally {
      this.searching.set(false);
    }
  }

  isMarked(game: GameWithEntry) {
    return this.marked().has(game.$id);
  }

  async toggleMark(game: GameWithEntry) {
    if (this.isMarked(game)) {
      this.marked.update((map) => {
        const next = new Map(map);
        next.delete(game.$id);
        return next;
      });
      return;
    }

    this.marked.update((map) => new Map(map).set(game.$id, game));
    try {
      await this.zEntryService.createEntryLog(
        this.fingerprint,
        game.$id,
        (game.zEntry as ZEntryRow | null) ?? null,
        { status: 'completed' },
      );
    } catch (e) {
      console.error(e);
      this.marked.update((map) => {
        const next = new Map(map);
        next.delete(game.$id);
        return next;
      });
      this.notification.show({
        message: 'Não foi possível registrar o jogo.',
        type: 'error',
      });
    }
  }

  gameCover(game: GameWithEntry) {
    return game.coverUrl || '';
  }

  suggestionAvatar(item: SuggestedConnection) {
    if (item.avatarUrl) return item.avatarUrl;
    return appwrite.avatars.getInitials({
      name: item.gamertag,
      width: 80,
      height: 80,
      background: '3e63dd',
    });
  }

  async rateGame(gameId: string, rating: number) {
    try {
      await this.ratingsService.upsertRating(gameId, { rating });
      this.notification.show({ message: 'Nota registrada!', type: 'success' });
    } catch (e) {
      console.error(e);
      this.notification.show({
        message: 'Não foi possível salvar a nota.',
        type: 'error',
      });
    }
  }

  async goToStep(step: number) {
    if (step === 3) {
      void this.loadSuggestions();
    }
    this.step.set(step);
  }

  private async loadSuggestions() {
    this.loadingSuggestions.set(true);
    try {
      const gameIds = this.markedList().map((g) => g.$id);
      const res = await this.dashboardService.getSuggestedConnections(
        6,
        gameIds,
      );
      this.suggestions.set(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingSuggestions.set(false);
    }
  }

  async follow(item: SuggestedConnection) {
    const myProfileId = this.authStore.profile()?.$id;
    if (!myProfileId || this.followingIds().has(item.$id)) return;

    this.followingIds.update((set) => new Set(set).add(item.$id));
    try {
      await this.connectionsService.followOrUnfollow(item.$id, myProfileId);
    } catch (e) {
      console.error(e);
      this.followingIds.update((set) => {
        const next = new Set(set);
        next.delete(item.$id);
        return next;
      });
    }
  }

  isFollowing(item: SuggestedConnection) {
    return this.followingIds().has(item.$id);
  }

  finish() {
    void this.router.navigate(['/dashboard']);
  }
}
