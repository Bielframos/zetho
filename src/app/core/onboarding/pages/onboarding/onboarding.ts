import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
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
import { NotificationStore } from '../../../system/notifications/notification.store';
import { GameWithEntry, ZEntryRow } from '../../../../types';
import { safeLocalStorage } from '../../../../utils/platform-storage';
import { isQuickEntryAvailable } from '../../../../shared/ui/game-card/game-quick-entry.store';
import { appwrite } from '../../../../shared/infra/appwrite/appwrite.client';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [AppStartingRating, UiLoading],
  templateUrl: './onboarding.html',
  host: { class: 'block' },
})
export class OnboardingPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private gameService = inject(GameService);
  private zEntryService = inject(ZEntryService);
  private ratingsService = inject(RatingsService);
  private connectionsService = inject(ConnectionsService);
  private dashboardService = inject(DashboardService);
  private notification = inject(NotificationStore);
  private heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly owner = this.authStore.profile()?.fingerprint ?? '';
  private readonly storageKey = `zetho:onboarding:v2:${this.owner}`;
  private destroyed = false;
  private searchVersion = 0;
  private suggestionsVersion = 0;
  private searchTimer?: ReturnType<typeof setTimeout>;
  private retryAction?: () => Promise<void>;

  step = signal(1);
  query = signal('');
  searching = signal(false);
  searchError = signal(false);
  results = signal<GameWithEntry[]>([]);
  marked = signal<Map<string, GameWithEntry>>(new Map());
  markedList = computed(() => Array.from(this.marked().values()));
  markedCount = computed(() => this.marked().size);
  availableResults = computed(() =>
    this.results().filter((g) => !this.marked().has(g.$id)),
  );
  rateableGames = computed(() =>
    this.markedList().filter((g) =>
      ['playing', 'completed'].includes(g.zEntry?.status ?? ''),
    ),
  );
  ratings = signal<Record<string, number>>({});
  pending = signal<Set<string>>(new Set());
  restoring = signal(false);
  restoreError = signal(false);
  actionError = signal('');
  busy = computed(() => this.restoring() || this.pending().size > 0);
  suggestions = signal<SuggestedConnection[]>([]);
  loadingSuggestions = signal(false);
  suggestionsError = signal(false);
  followingIds = signal<Set<string>>(new Set());
  readonly statusOptions = [
    { value: 'playing', label: 'Jogando' },
    { value: 'wishlist', label: 'Quero jogar' },
    { value: 'completed', label: 'Já zerei' },
  ];
  canPlay = isQuickEntryAvailable;

  async ngOnInit() {
    await this.restore();
    if (!this.destroyed) void this.runSearch();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.searchVersion++;
    this.suggestionsVersion++;
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  private persist() {
    if (!this.owner || this.destroyed) return;
    // Store only the resume context. Entries and ratings are reloaded from the server.
    const games = this.markedList().map((g) => ({
      $id: g.$id,
      name: g.name,
      coverUrl: g.coverUrl,
      slug: g.slug,
      releaseDate: g.releaseDate,
      releaseYear: g.releaseYear,
    }));
    safeLocalStorage.setItem(
      this.storageKey,
      JSON.stringify({ step: this.step(), games }),
    );
  }

  async restore() {
    this.restoring.set(true);
    this.restoreError.set(false);
    try {
      const raw = safeLocalStorage.getItem(this.storageKey);
      if (!raw || !this.owner) return;
      let draft;
      try {
        draft = JSON.parse(raw);
      } catch {
        safeLocalStorage.removeItem(this.storageKey);
        return;
      }
      if (!Array.isArray(draft?.games) || ![1, 2, 3, 4].includes(draft?.step)) {
        safeLocalStorage.removeItem(this.storageKey);
        return;
      }
      const games = draft.games.filter(
        (g: GameWithEntry) =>
          typeof g?.$id === 'string' && typeof g?.name === 'string',
      ) as GameWithEntry[];
      const restored = await Promise.all(
        games.map(async (game) => {
          const [zEntry, rating] = await Promise.all([
            this.zEntryService.getEntry(this.owner, game.$id),
            this.ratingsService.getMyRating(game.$id),
          ]);
          return { game: { ...game, zEntry }, rating: rating?.rating ?? 0 };
        }),
      );
      if (this.destroyed) return;
      this.marked.set(
        new Map(
          restored
            .filter((r) => !!r.game.zEntry?.status)
            .map((r) => [r.game.$id, r.game]),
        ),
      );
      this.ratings.set(
        Object.fromEntries(restored.map((r) => [r.game.$id, r.rating])),
      );
      this.step.set(draft.step);
      if (draft.step === 3) void this.loadSuggestions();
    } catch {
      this.restoreError.set(true);
    } finally {
      this.restoring.set(false);
    }
  }

  onQueryInput(value: string) {
    this.query.set(value);
    this.searchVersion++; // Invalidate even while the next request is debounced.
    this.results.set([]);
    this.searchError.set(false);
    this.searching.set(true);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.runSearch(), 350);
  }

  async runSearch() {
    const version = ++this.searchVersion;
    const q = this.query().trim();
    this.searchError.set(false);
    if (q.length === 1) {
      this.searching.set(false);
      this.results.set([]);
      return;
    }
    this.searching.set(true);
    try {
      const res = await this.gameService.searchGame(q, {
        pageSize: 8,
        fingerprint: this.owner,
      });
      if (version === this.searchVersion) this.results.set(res.rows);
    } catch {
      if (version === this.searchVersion) this.searchError.set(true);
    } finally {
      if (version === this.searchVersion) this.searching.set(false);
    }
  }

  private setPending(key: string, active: boolean) {
    this.pending.update((current) => {
      const next = new Set(current);
      if (active) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  statusFor(game: GameWithEntry) {
    return (
      this.marked().get(game.$id)?.zEntry?.status ?? game.zEntry?.status ?? ''
    );
  }

  async onStatusChange(game: GameWithEntry, event: Event) {
    const select = event.target as HTMLSelectElement;
    await this.saveStatus(game, select.value as ZEntryRow['status']);
    select.value = this.statusFor(game);
  }

  async saveStatus(game: GameWithEntry, status: ZEntryRow['status']) {
    if (
      !this.owner ||
      this.pending().has(game.$id) ||
      this.restoring() ||
      this.restoreError()
    )
      return;
    if (
      status &&
      !['playing', 'backlog', 'completed', 'dropped', 'wishlist'].includes(
        status,
      )
    )
      return;
    if ((status === 'playing' || status === 'completed') && !this.canPlay(game))
      return;
    this.setPending(game.$id, true);
    this.actionError.set('');
    try {
      const current = await this.zEntryService.getEntry(this.owner, game.$id);
      const entry =
        current?.status === (status || null)
          ? current
          : await this.zEntryService.createEntryLog(
              this.owner,
              game.$id,
              current,
              { status: status || null },
            );
      const updated = {
        ...game,
        zEntry: { ...current, ...entry, status: status || null } as ZEntryRow,
      };
      this.marked.update((map) => {
        const next = new Map(map);
        if (status) next.set(game.$id, updated);
        else next.delete(game.$id);
        return next;
      });
      this.results.update((rows) =>
        rows.map((g) => (g.$id === game.$id ? updated : g)),
      );
      this.persist();
      // A failed rating read must not undo a successfully saved shelf entry.
      if (status && this.ratings()[game.$id] === undefined) {
        try {
          const rating = await this.ratingsService.getMyRating(game.$id);
          this.ratings.update((values) => ({
            ...values,
            [game.$id]: rating?.rating ?? 0,
          }));
        } catch {
          this.actionError.set(
            `O jogo foi salvo, mas não conseguimos carregar a nota de ${game.name}. Tente novamente antes de avaliar.`,
          );
          this.retryAction = () => this.saveStatus(updated, status);
        }
      }
    } catch {
      this.actionError.set(
        `Não foi possível atualizar ${game.name}. Tente novamente para confirmar a alteração.`,
      );
      this.retryAction = () => this.saveStatus(game, status);
    } finally {
      this.setPending(game.$id, false);
    }
  }

  async retry() {
    if (!this.busy()) await this.retryAction?.();
  }

  async rateGame(gameId: string, rating: number) {
    if (this.pending().has(gameId) || this.ratings()[gameId] === undefined)
      return;
    this.setPending(gameId, true);
    this.actionError.set('');
    try {
      if (rating === 0) await this.ratingsService.deleteRating(gameId);
      else await this.ratingsService.upsertRating(gameId, { rating });
      this.ratings.update((values) => ({ ...values, [gameId]: rating }));
    } catch {
      this.actionError.set(
        'Não foi possível salvar a nota. A nota anterior foi mantida.',
      );
      this.retryAction = () => this.rateGame(gameId, rating);
    } finally {
      this.setPending(gameId, false);
    }
  }

  goToStep(step: number) {
    if (this.busy() || this.restoreError()) return;
    this.step.set(step);
    this.persist();
    if (step === 3) void this.loadSuggestions();
    setTimeout(() => {
      if (!this.destroyed) this.heading()?.nativeElement.focus();
    });
  }

  async loadSuggestions() {
    const version = ++this.suggestionsVersion;
    this.loadingSuggestions.set(true);
    this.suggestionsError.set(false);
    try {
      const res = await this.dashboardService.getSuggestedConnections(
        6,
        this.markedList().map((g) => g.$id),
      );
      const profileId = this.authStore.profile()?.$id;
      const followed = await Promise.all(
        res.items.map(async (person) =>
          profileId &&
          (await this.connectionsService.getConnection(person.$id, profileId))
            ? person.$id
            : null,
        ),
      );
      if (version !== this.suggestionsVersion) return;
      this.suggestions.set(res.items);
      this.followingIds.set(
        new Set(followed.filter((id): id is string => !!id)),
      );
    } catch {
      if (version === this.suggestionsVersion) this.suggestionsError.set(true);
    } finally {
      if (version === this.suggestionsVersion)
        this.loadingSuggestions.set(false);
    }
  }

  async follow(item: SuggestedConnection) {
    const profileId = this.authStore.profile()?.$id;
    const key = `follow:${item.$id}`;
    if (
      !profileId ||
      this.followingIds().has(item.$id) ||
      this.pending().has(key)
    )
      return;
    this.setPending(key, true);
    this.actionError.set('');
    try {
      // Check before the toggle endpoint so retries never unfollow an existing connection.
      if (!(await this.connectionsService.getConnection(item.$id, profileId))) {
        await this.connectionsService.followOrUnfollow(item.$id, profileId);
      }
      this.followingIds.update((ids) => new Set(ids).add(item.$id));
    } catch {
      this.actionError.set(
        `Não foi possível seguir ${item.gamertag}. Tente novamente.`,
      );
      this.retryAction = () => this.follow(item);
    } finally {
      this.setPending(key, false);
    }
  }

  suggestionAvatar(item: SuggestedConnection) {
    return (
      item.avatarUrl ||
      appwrite.avatars.getInitials({
        name: item.gamertag,
        width: 80,
        height: 80,
        background: '3e63dd',
      })
    );
  }

  async leave(complete = false) {
    if (this.busy()) return;
    if (!complete && !this.restoreError()) this.persist();
    const profile = this.authStore.profile();
    const first = this.markedList()[0];
    const navigated =
      first && profile?.gamertag
        ? await this.router.navigate(['/player', profile.gamertag], {
            queryParams: { t: first.zEntry?.status },
          })
        : await this.router.navigate(['/buscar']);
    if (navigated && complete) safeLocalStorage.removeItem(this.storageKey);
    else if (!navigated)
      this.notification.show({
        message: 'Não foi possível abrir a página. Tente novamente.',
        type: 'error',
      });
  }
}
