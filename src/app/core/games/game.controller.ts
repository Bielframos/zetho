import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameRow, GameWithEntry, ZEntryRow } from '../../types';
import type { GameMedia, GameHero } from './game.types';
import { AuthStore } from '../auth/auth.store';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameService } from './games.service';
import { ZCoinsService } from '../zCoins/zcoins.service';
import { NotificationStore } from '../notifications/notification.store';
import { createSsrTaskRunner } from '../../utils/ssr-task';
import { RatingsService, type RatingRow } from '../ratings/ratings.service';

@Injectable({ providedIn: 'root' })
export class GameController {
  private router = inject(Router);

  game = signal<GameRow | null>(null);
  similarGames = signal<GameWithEntry[] | null>(null);
  zEntry = signal<ZEntryRow | null>(null);
  medias = signal<GameMedia[]>([]);
  heroImage = signal<GameHero | null>(null);
  errors = signal<Record<string, any>>({});
  // Contador incrementado quando o usuário marca um jogo como zerado; a página
  // observa para abrir o compartilhamento no pico emocional ("Zerei!").
  justZeroed = signal(0);
  loading = signal(false);
  updating = signal(false);
  notificationsEnabled = signal(false);
  updatingNotifications = signal(false);
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

  /**
   * Versão estrita de `isUpcomingRelease`: só retorna `true` quando há uma data
   * de lançamento válida e comprovadamente no futuro. Datas ausentes ou
   * inválidas são tratadas como "já lançado" (o mais seguro). Usada para
   * liberar o hype apenas em jogos ainda não lançados.
   */
  isUpcoming = computed(() => {
    const game = this.game();
    if (!game) return false;

    const rawReleaseDate = game.rawReleaseDate;
    if (!rawReleaseDate) return false;

    const releaseDate = new Date(rawReleaseDate);
    if (Number.isNaN(releaseDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return releaseDate.getTime() > today.getTime();
  });

  /**
   * Registrado como pending task para que o SSR espere os dados do jogo antes
   * de serializar. Sem isso o servidor entrega a página em estado de
   * carregamento — sem `<h1>`, sem descrição e sem JSON-LD.
   */
  private runAsSsrTask = createSsrTaskRunner();

  /**
   * Críticas exibidas estaticamente na página, fora das abas.
   *
   * São o único conteúdo original da página de jogo — o `summary` do IGDB é
   * idêntico ao de IGDB, Steam e Metacritic. Precisam sair no HTML do servidor
   * e fora de qualquer aba: conteúdo escondido é despriorizado pelo Google, e
   * um revisor humano não clica em aba.
   */
  readonly communityReviews = signal<RatingRow[]>([]);

  constructor(
    private gameService: GameService,
    private zEntryService: ZEntryService,
    private authStore: AuthStore,
    private zCoinsService: ZCoinsService,
    private notification: NotificationStore,
    private ratingsService: RatingsService,
  ) {}

  loadPage(slug: string) {
    return this.runAsSsrTask(() => this.loadPageInternal(slug));
  }

  private async loadPageInternal(slug: string) {
    try {
      // Limpar estado anterior para evitar flickering
      this.game.set(null);
      this.similarGames.set(null);
      this.zEntry.set(null);
      this.medias.set([]);
      this.heroImage.set(null);
      this.errors.set({});
      this.notificationsEnabled.set(false);
      this.updatingNotifications.set(false);
      this.loading.set(true);

      const user = this.authStore.user();
      const profile = this.authStore.profile();

      const data = await this.gameService.loadGamePage(slug, {
        userId: user?.$id,
        fingerprint: profile?.fingerprint,
      });

      this.game.set(data.game);
      await this.loadCommunityReviews(data.game?.$id);
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

  /**
   * Só as críticas com texto entram: nota sem texto não é conteúdo.
   * Falha aqui nunca derruba a página — a seção simplesmente não aparece.
   */
  private async loadCommunityReviews(gameId: string | undefined) {
    if (!gameId) {
      this.communityReviews.set([]);
      return;
    }

    try {
      const response = await this.ratingsService.getRatings(gameId, 1, 10);
      const withText = response.items
        .filter((item) => (item.content ?? '').trim().length > 0)
        .sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
        .slice(0, 3);

      this.communityReviews.set(withText);
    } catch {
      this.communityReviews.set([]);
    }
  }

  async refreshGameRating() {
    const currentGame = this.game();
    if (!currentGame) return;

    try {
      this.updating.set(true);
      const game = await this.gameService.getGame(currentGame.slug);
      if (game) {
        this.game.set({
          ...game,
          rawReleaseDate: game.releaseDate,
          releaseDate: new Date(game.releaseDate).toLocaleDateString('pt-br'),
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do jogo:', err);
    } finally {
      this.updating.set(false);
    }
  }

  async toggleNotifications() {
    const game = this.game();

    if (!game) return;
    if (this.updatingNotifications()) return;

    if (!this.authStore.isAuthenticated()) {
      this.errors.update((state) => ({
        ...state,
        notifications: 'auth_required',
      }));
      this.notification.show({
        message: 'Entre na sua conta para ativar notificações.',
        type: 'info',
      });
      return;
    }

    const active = !this.notificationsEnabled();

    this.updatingNotifications.set(true);

    try {
      await this.gameService.toggleNotifications(game.$id, active);
      this.notificationsEnabled.set(active);
      this.notification.show({
        message: active
          ? 'Notificações ativadas para este jogo.'
          : 'Notificações desativadas para este jogo.',
        type: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar as notificações.';

      this.errors.update((state) => ({
        ...state,
        notifications: message,
      }));
      this.notification.show({
        message,
        type: 'error',
      });
    } finally {
      this.updatingNotifications.set(false);
    }
  }

  async handleEntry(
    payload:
      | { action: 'updateStatus'; value: ZEntryRow['status'] }
      | { action: 'like'; value: boolean }
      | { action: 'hype'; value: boolean },
  ) {
    const game = this.game();
    const zEntry = this.zEntry();
    const profile = this.authStore.profile();
    const { action, value } = payload;

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

    // Hype só é permitido para jogos ainda não lançados.
    if (action === 'hype' && !this.isUpcoming()) return;

    const optimisticEntry = this.buildOptimisticEntry(zEntry, payload);
    let rollbackReward: (() => void) | null = null;

    const optimisticReward = this.zCoinsService.previewGameEntryReward({
      action,
      value,
      currentEntry: zEntry,
    });

    if (optimisticReward) {
      rollbackReward =
        this.zCoinsService.applyOptimisticReward(optimisticReward);
    }

    this.zEntry.set(optimisticEntry);

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

      this.zEntry.set({
        ...updated,
        ...optimisticEntry,
      });

      // Marcou como zerado (e não estava antes): dispara a celebração/share.
      if (
        action === 'updateStatus' &&
        value === 'completed' &&
        zEntry?.status !== 'completed'
      ) {
        this.justZeroed.update((count) => count + 1);
      }
    } catch (err) {
      rollbackReward?.();
      this.zEntry.set(zEntry);
      console.error('Erro ao atualizar status:', err);
    } finally {
      this.updating.set(false);
    }
  }

  private buildOptimisticEntry(
    current: ZEntryRow | null,
    payload:
      | { action: 'updateStatus'; value: ZEntryRow['status'] }
      | { action: 'like'; value: boolean }
      | { action: 'hype'; value: boolean },
  ): ZEntryRow {
    const next = current
      ? { ...current }
      : ({
          gameId: this.game()?.$id ?? '',
          liked: false,
          hyped: false,
          status: null,
          ownerFingerprint: this.authStore.profile()?.fingerprint ?? '',
        } as ZEntryRow);

    if (payload.action === 'like') {
      next.liked = payload.value;
      if (payload.value) {
        next.likedEver = true;
        next.likeEver = true;
      }
      return next;
    }

    if (payload.action === 'hype') {
      next.hyped = payload.value;
      return next;
    }

    next.status = payload.value === current?.status ? null : payload.value;

    const rank = (status: ZEntryRow['status'] | undefined | null) => {
      if (status === 'completed') return 3;
      if (status === 'playing') return 2;
      if (status === 'backlog') return 1;
      return 0;
    };

    const currentMaxRank = rank(current?.maxStatusReached ?? current?.status);
    const nextRank = rank(payload.value);

    if (nextRank > currentMaxRank) {
      next.maxStatusReached = payload.value;
    }

    return next;
  }
}
