import { computed, Injectable, signal } from '@angular/core';
import { AppwriteException } from 'appwrite';
import { distinctUntilChanged, filter } from 'rxjs';
import { CreateListInput, ListService } from '../lists/list.service';
import { AppError, GameRow, ZereiListRow } from '../../types';
import { ProfileStore } from '../userProfiles/profile.store';
import { ZCoinsService } from '../zCoins/zcoins.service';

export type ParsedZereiListRow = ZereiListRow & {
  parsedLatestAdditions?: {
    orderKey: string;
    gameId: string;
    gameName: string;
    gameCoverUrl: string;
  }[];
};

const PAGE_SIZE = 12;

/**
 * Controller responsável por gerenciar listas de jogos do usuário.
 */
@Injectable({ providedIn: 'root' })
export class ListsController {
  /** Listas do usuário */
  lists = signal<ParsedZereiListRow[]>([]);

  /** Paginação */
  total = signal(0);
  currentPage = signal(0);
  offset = computed(() => (this.currentPage() - 1) * PAGE_SIZE);
  pageCount = computed(() => Math.ceil(this.total() / PAGE_SIZE));
  hasMore = signal(false);

  /** Estados */
  loading = signal(false);
  awaitingCreation = signal(false);
  error = signal<AppError | undefined>(undefined);

  constructor(
    private listService: ListService,
    private profileStore: ProfileStore,
    private zCoinsService: ZCoinsService,
  ) {
    this.profileStore.profile$
      .pipe(
        filter((profile) => profile !== null && profile !== undefined),
        distinctUntilChanged(
          (prev, next) =>
            prev.$id === next.$id &&
            prev.fingerprint === next.fingerprint &&
            prev.gamertag === next.gamertag,
        ),
      )
      .subscribe((profile) => {
        this.resetState();
        void this.loadLists({
          ownerFingerprint: profile.fingerprint,
          onlyPublicOnes: this.profileStore.itsMe() ? undefined : true,
        });
      });
  }

  /* =======================
     Carregamento
     ======================= */

  async loadLists({
    ownerFingerprint,
    loadMore = false,
    onlyPublicOnes,
  }: {
    ownerFingerprint: string;
    loadMore?: boolean;
    onlyPublicOnes?: boolean;
  }) {
    try {
      if (this.loading()) return;
      this.loading.set(true);

      if (!loadMore) {
        this.currentPage.set(1);
      } else {
        this.currentPage.update((p) => p + 1);
      }

      const lists = await this.listService.getLists({
        userFingerprint: ownerFingerprint,
        offset: this.offset(),
        onlyPublicOnes,
      });

      const parsedRows = lists.rows.map(this.parseList);

      if (loadMore) {
        this.lists.update((state) => [...state, ...parsedRows]);
      } else {
        this.lists.set(parsedRows);
      }

      const loaded = this.lists().length;
      this.hasMore.set(loaded < lists.total);
      this.total.set(lists.total);
    } catch (e) {
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } finally {
      this.loading.set(false);
    }
  }

  /* =======================
     Criação
     ======================= */

  async createList(input: CreateListInput) {
    try {
      this.awaitingCreation.set(true);
      const newList = await this.listService.createList(input);
      this.lists.update((state) => [this.parseList(newList), ...state]);
      void this.zCoinsService.applyInput('create_list').catch(() => undefined);
    } catch (e) {
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } finally {
      this.awaitingCreation.set(false);
    }
  }

  /* =======================
     Itens
     ======================= */

  async addItem({
    list,
    game,
  }: {
    list?: ZereiListRow;
    game?: GameRow | null;
  }) {
    if (!list || !game) {
      this.error.set({
        message: 'Lista ou jogo não informados.',
        code: 400,
        type: 'bad_request',
      });
      return;
    }

    try {
      const response = await this.listService.addToList({ list, game });

      this.lists.update((prev) =>
        prev.map((item) =>
          item.$id === list.$id ? this.parseList(response.updatedList) : item,
        ),
      );

      void this.zCoinsService
        .applyInput('add_game_to_list')
        .catch(() => undefined);
    } catch (e) {
      const error = e as AppwriteException;
      console.error(e);

      this.error.set({
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
  }

  /* =======================
     Helpers
     ======================= */

  private parseList(list: ZereiListRow): ParsedZereiListRow {
    return {
      ...list,
      parsedLatestAdditions: list.latestAdditions?.map((item) =>
        JSON.parse(item),
      ),
    };
  }

  private resetState() {
    this.lists.set([]);
    this.total.set(0);
    this.currentPage.set(0);
    this.hasMore.set(true);
    this.error.set(undefined);
  }
}
