import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { GameRepository } from '../../core/games/games.repository';
import { GameService } from '../../core/games/games.service';
import { ProfileStore } from '../../core/userProfiles/profile.store';
import type { GameRow, UserProfileRow } from '../../types';
import {
  UiCombobox,
  UiComboboxOption,
  UiComboboxSearch,
} from './combobox/combobox';
import { igdbCoverLoader } from './game-card/game-card';
import { UiModal } from './modal/modal';

export const MAX_FAVORITE_GAMES = 3;

type Slot =
  | { kind: 'game'; game: GameRow }
  | { kind: 'loading' }
  | { kind: 'empty' };

type DraftItem = { id: string; label: string; imageUrl?: string };

/**
 * Top 3 de jogos favoritos do perfil.
 *
 * - `panel`: bloco com título, para a coluna lateral do desktop.
 * - `strip`: faixa compacta para o mobile; o conteúdo projetado (redes) ocupa
 *   a coluna ao lado das capas.
 *
 * O dono vê slots vazios para escolher; visitantes só veem jogos preenchidos e
 * a seção some quando não há nenhum.
 */
@Component({
  selector: 'ui-profile-favorites',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, UiModal, UiCombobox],
  host: { class: 'block' },
  template: `
    <ng-template #covers>
      <ul class="grid grid-cols-3 gap-1.5" aria-label="Jogos favoritos">
        @for (slot of slots(); track $index) {
          <li class="min-w-0">
            @switch (slot.kind) {
              @case ('game') {
                <a
                  [routerLink]="['/jogo', slot.game.slug]"
                  [title]="slot.game.name"
                  [attr.aria-label]="$index + 1 + 'º favorito: ' + slot.game.name"
                  class="profile-theme-divider group relative block aspect-3/4 overflow-hidden rounded-md border border-gray-6 bg-gray-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  @if (slot.game.coverUrl) {
                    <img
                      [src]="coverSrc(slot.game.coverUrl)"
                      alt=""
                      loading="lazy"
                      class="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  } @else {
                    <span
                      class="background-pattern flex size-full items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-11"
                      >{{ slot.game.name }}</span
                    >
                  }
                  <span
                    class="absolute left-1 top-1 flex size-4 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium leading-none text-white"
                    aria-hidden="true"
                    >{{ $index + 1 }}</span
                  >
                  <span
                    class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-medium leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                    ><span class="line-clamp-2">{{ slot.game.name }}</span></span
                  >
                </a>
              }
              @case ('loading') {
                <div
                  class="aspect-3/4 rounded-md bg-gray-3 motion-safe:animate-pulse"
                  aria-hidden="true"
                ></div>
              }
              @case ('empty') {
                <button
                  type="button"
                  class="profile-theme-divider flex aspect-3/4 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-6 text-gray-10 transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  [attr.aria-label]="'Escolher ' + ($index + 1) + 'º jogo favorito'"
                  (click)="openEditor()"
                >
                  <i class="ph ph-plus" aria-hidden="true"></i>
                </button>
              }
            }
          </li>
        }
      </ul>
    </ng-template>

    <ng-template #heading>
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-xs uppercase tracking-wider text-gray-10">Favoritos</h3>
        @if (isOwner()) {
          <button
            type="button"
            class="cursor-pointer rounded text-xs text-blue-11 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            (click)="openEditor()"
          >
            Editar
          </button>
        }
      </div>
    </ng-template>

    @if (variant() === 'strip') {
      @if (visible() || hasSocials()) {
        <div class="flex items-end gap-3 px-4 pb-3 pt-2.5">
          @if (visible()) {
            <div class="w-[min(14.5rem,64%)] shrink-0">
              <ng-container *ngTemplateOutlet="covers" />
            </div>
          }
          <div class="flex min-w-0 flex-1 flex-col justify-between gap-2 self-stretch">
            @if (visible()) {
              <ng-container *ngTemplateOutlet="heading" />
            }
            <ng-content />
          </div>
        </div>
      }
    } @else if (visible()) {
      <div class="profile-theme-divider flex flex-col gap-2 border-t border-gray-6 px-4 pb-3.5 pt-3">
        <ng-container *ngTemplateOutlet="heading" />
        <ng-container *ngTemplateOutlet="covers" />
      </div>
    }

    @if (isOwner()) {
      <ui-modal
        [(isOpen)]="editorOpen"
        title="Jogos favoritos"
        description="Escolha até 3 jogos para fixar no seu perfil."
        actionLabel="Salvar"
        [showCloseButton]="true"
        [loading]="saving()"
        loadingIndicator="spinner"
        (submit)="save($event)"
      >
        <div class="flex flex-col gap-5 py-4">
          @if (draft().length) {
            <ol class="flex flex-col divide-y divide-gray-6 border-y border-gray-6">
              @for (item of draft(); track item.id; let i = $index; let last = $last) {
                <li class="flex items-center gap-3 py-2">
                  <span class="w-4 shrink-0 text-center text-sm text-gray-10">{{ i + 1 }}</span>
                  @if (item.imageUrl) {
                    <img
                      [src]="coverSrc(item.imageUrl)"
                      alt=""
                      class="h-12 w-9 shrink-0 rounded bg-gray-4 object-cover"
                    />
                  } @else {
                    <span class="background-pattern h-12 w-9 shrink-0 rounded" aria-hidden="true"></span>
                  }
                  <span class="min-w-0 flex-1 wrap-anywhere text-sm text-gray-12">{{ item.label }}</span>
                  <button
                    type="button"
                    class="ui-ghost-btn"
                    data-size="icon"
                    [disabled]="i === 0"
                    [attr.aria-label]="'Mover ' + item.label + ' para cima'"
                    (click)="move(i, -1)"
                  >
                    <i class="ph ph-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    class="ui-ghost-btn"
                    data-size="icon"
                    [disabled]="last"
                    [attr.aria-label]="'Mover ' + item.label + ' para baixo'"
                    (click)="move(i, 1)"
                  >
                    <i class="ph ph-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    class="ui-ghost-btn"
                    data-size="icon"
                    [attr.aria-label]="'Remover ' + item.label"
                    (click)="remove(item.id)"
                  >
                    <i class="ph ph-x"></i>
                  </button>
                </li>
              }
            </ol>
          } @else {
            <p class="text-sm text-gray-11">Nenhum jogo escolhido ainda.</p>
          }

          @if (draft().length < max) {
            <ui-combobox
              label="Adicionar jogo"
              placeholder="Busque pelo nome do jogo"
              emptyText="Nenhum jogo encontrado."
              [minQueryLength]="2"
              [search]="searchGames"
              [selectedOptions]="picked()"
              (selectedOptionsChange)="onPick($event)"
            />
          }
        </div>
      </ui-modal>
    }
  `,
})
export class UiProfileFavorites {
  private readonly repository = inject(GameRepository);
  private readonly gameService = inject(GameService);
  private readonly authStore = inject(AuthStore);
  private readonly profileStore = inject(ProfileStore);

  readonly max = MAX_FAVORITE_GAMES;

  profile = input.required<UserProfileRow>();
  variant = input<'panel' | 'strip'>('panel');

  readonly isOwner = this.profileStore.itsMe;

  private readonly ids = computed(
    () => (this.profile().favoriteGameIds ?? []).slice(0, MAX_FAVORITE_GAMES),
    { equal: (a, b) => a.join('|') === b.join('|') },
  );

  readonly games = signal<GameRow[]>([]);
  readonly loading = signal(false);

  readonly slots = computed<Slot[]>(() => {
    const ids = this.ids();
    const games = this.games();
    const owner = this.isOwner();
    const loading = this.loading();
    const slots: Slot[] = [];
    for (let i = 0; i < MAX_FAVORITE_GAMES; i++) {
      const game = ids[i] ? games.find((g) => g.$id === ids[i]) : undefined;
      if (game) slots.push({ kind: 'game', game });
      else if (ids[i] && loading) slots.push({ kind: 'loading' });
      else if (owner) slots.push({ kind: 'empty' });
    }
    return slots;
  });

  readonly visible = computed(() => this.slots().length > 0);
  readonly hasSocials = computed(() => {
    const p = this.profile();
    return !!(p.socialSteam || p.socialXbox || p.socialPsn);
  });

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly draft = signal<DraftItem[]>([]);
  readonly picked = signal<UiComboboxOption[]>([]);
  private readonly combobox = viewChild(UiCombobox);

  readonly searchGames: UiComboboxSearch = async (query) => {
    const response = await this.gameService.searchGame(query, { pageSize: 6 });
    const taken = new Set(this.draft().map((item) => item.id));
    return response.rows.map((game) => ({
      id: game.$id,
      label: game.name,
      description: taken.has(game.$id)
        ? 'Já está nos favoritos'
        : game.releaseYear || undefined,
      imageUrl: game.coverUrl,
      imageShape: 'cover' as const,
      disabled: taken.has(game.$id),
    }));
  };

  constructor() {
    effect((onCleanup) => {
      const ids = this.ids();
      let current = true;
      onCleanup(() => (current = false));

      if (!ids.length) {
        untracked(() => {
          this.games.set([]);
          this.loading.set(false);
        });
        return;
      }

      untracked(() => {
        this.loading.set(true);
        this.repository
          .findByIds(ids, {
            fields: ['$id', 'name', 'slug', 'coverUrl'],
            pageSize: MAX_FAVORITE_GAMES,
          })
          .then((rows) => {
            if (current) this.games.set(rows);
          })
          .catch(() => {
            if (current) this.games.set([]);
          })
          .finally(() => {
            if (current) this.loading.set(false);
          });
      });
    });
  }

  coverSrc(url: string) {
    return igdbCoverLoader({ src: url, width: 180 });
  }

  openEditor() {
    const games = this.games();
    this.draft.set(
      this.ids()
        .map((id) => games.find((g) => g.$id === id))
        .filter((g): g is GameRow => !!g)
        .map((g) => ({ id: g.$id, label: g.name, imageUrl: g.coverUrl })),
    );
    this.picked.set([]);
    this.editorOpen.set(true);
  }

  onPick(options: UiComboboxOption[]) {
    const option = options[0];
    if (!option) return;
    this.draft.update((items) =>
      items.length >= MAX_FAVORITE_GAMES ||
      items.some((item) => item.id === option.id)
        ? items
        : [
            ...items,
            { id: option.id, label: option.label, imageUrl: option.imageUrl },
          ],
    );
    this.combobox()?.selectedOptions.set([]);
  }

  move(index: number, delta: -1 | 1) {
    this.draft.update((items) => {
      const target = index + delta;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  remove(id: string) {
    this.draft.update((items) => items.filter((item) => item.id !== id));
  }

  async save({ close }: { close: () => void }) {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      await this.authStore.updateProfile({
        favoriteGameIds: this.draft().map((item) => item.id),
      });
      const updated = this.authStore.profile();
      if (updated) this.profileStore.set(updated);
      close();
    } catch {
      // authStore.updateProfile já avisa o erro; o modal continua aberto.
    } finally {
      this.saving.set(false);
    }
  }
}
