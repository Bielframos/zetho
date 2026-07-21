import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { ListsController } from '../../../lists/lists.controller';
import { NotificationStore } from '../../../notifications/notification.store';
import { UiModal } from '../../../../shared/ui/modal/modal';
import { ZereiListRow } from '../../../lists/lists.type';

export interface FeedGame {
  $id?: string;
  name: string;
  slug: string;
  coverUrl: string | null;
}

/**
 * Preview de um jogo dentro do feed + ações rápidas (adicionar à biblioteca,
 * aos desejos ou a uma lista) para o usuário agir sem sair do fluxo. Cada ação
 * é otimista/fire-and-forget: como o feed é sobre a atividade de outras pessoas,
 * não carregamos o z-entry do espectador — apenas registramos e refletimos o
 * "feito" localmente.
 */
@Component({
  selector: 'ui-feed-game',
  standalone: true,
  imports: [RouterLink, UiModal],
  template: `
    <div class="flex flex-col gap-2.5">
      <a
        [routerLink]="['/jogo', game().slug]"
        class="group flex items-center gap-3"
      >
        @if (game().coverUrl) {
          <img
            [src]="game().coverUrl"
            class="h-16 w-11 shrink-0 rounded object-cover"
            alt="Capa"
          />
        }
        <span
          class="min-w-0 flex-1 truncate font-medium text-gray-12 group-hover:underline"
          >{{ game().name }}</span
        >
      </a>

      @if (isAuthed()) {
        <div class="flex items-center gap-5 text-sm text-gray-11">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-gray-12 disabled:cursor-default"
            [class.text-blue-11]="libraryDone()"
            [disabled]="busyLibrary() || libraryDone()"
            (click)="addToLibrary()"
            [attr.aria-label]="
              libraryDone() ? 'Na sua biblioteca' : 'Adicionar à biblioteca'
            "
          >
            <i [class]="libraryDone() ? 'ph-fill ph-books' : 'ph ph-books'"></i>
            {{ libraryDone() ? 'Na biblioteca' : 'Biblioteca' }}
          </button>

          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-gray-12 disabled:cursor-default"
            [class.text-blue-11]="wishlistDone()"
            [disabled]="busyWishlist() || wishlistDone()"
            (click)="addToWishlist()"
            [attr.aria-label]="
              wishlistDone() ? 'Nos seus desejos' : 'Adicionar aos desejos'
            "
          >
            <i
              [class]="
                wishlistDone()
                  ? 'ph-fill ph-shopping-bag-open'
                  : 'ph ph-shopping-bag'
              "
            ></i>
            {{ wishlistDone() ? 'Nos desejos' : 'Desejos' }}
          </button>

          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-gray-12"
            (click)="openListModal()"
            aria-label="Adicionar a uma lista"
          >
            <i class="ph ph-list-plus"></i>
            Lista
          </button>
        </div>
      }
    </div>

    <ui-modal
      [(isOpen)]="listModalOpen"
      title="Salvar em uma lista"
      actionLabel="Salvar"
      (submit)="handleAddToList($event)"
    >
      <div
        class="my-4 flex flex-col divide-y divide-gray-6 overflow-y-auto border-y border-gray-6"
      >
        @for (list of listController.lists(); track list.$id) {
          <label
            [htmlFor]="'feed-' + game().slug + '-' + list.$id"
            class="flex flex-1 cursor-pointer gap-2 p-4 text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 has-checked:bg-blue-4"
          >
            @if (selectedList()?.$id === list.$id) {
              <i class="ph-fill ph-radio-button text-blue-9"></i>
            } @else {
              <i class="ph ph-circle text-gray-6"></i>
            }
            {{ list.title }}
            <input
              [id]="'feed-' + game().slug + '-' + list.$id"
              type="radio"
              name="feed-list"
              [value]="list.$id"
              class="hidden"
              (click)="selectList(list)"
            />
          </label>
        } @empty {
          <span class="p-4 text-gray-11">Você ainda não tem nenhuma lista.</span>
        }
      </div>
    </ui-modal>
  `,
})
export class UiFeedGame {
  private authStore = inject(AuthStore);
  private zEntryService = inject(ZEntryService);
  private notification = inject(NotificationStore);
  listController = inject(ListsController);

  game = input.required<FeedGame>();

  isAuthed = computed(() => this.authStore.isAuthenticated());
  libraryDone = signal(false);
  wishlistDone = signal(false);
  busyLibrary = signal(false);
  busyWishlist = signal(false);
  listModalOpen = signal(false);
  selectedList = signal<ZereiListRow | undefined>(undefined);

  private get fingerprint() {
    return this.authStore.profile()?.fingerprint ?? '';
  }

  async addToLibrary() {
    if (this.busyLibrary() || this.libraryDone()) return;
    const fingerprint = this.fingerprint;
    const gameId = this.game().$id;
    if (!fingerprint || !gameId) return;

    this.busyLibrary.set(true);
    try {
      await this.zEntryService.createEntryLog(fingerprint, gameId, null, {
        status: 'backlog',
      });
      this.libraryDone.set(true);
      this.notification.show({
        message: `${this.game().name} entrou na sua biblioteca.`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      this.notification.show({
        message: 'Não foi possível adicionar à biblioteca.',
        type: 'error',
      });
    } finally {
      this.busyLibrary.set(false);
    }
  }

  async addToWishlist() {
    if (this.busyWishlist() || this.wishlistDone()) return;
    const fingerprint = this.fingerprint;
    const gameId = this.game().$id;
    if (!fingerprint || !gameId) return;

    this.busyWishlist.set(true);
    try {
      await this.zEntryService.createEntryLog(fingerprint, gameId, null, {
        status: 'wishlist',
      });
      this.wishlistDone.set(true);
      this.notification.show({
        message: `${this.game().name} entrou nos seus desejos.`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      this.notification.show({
        message: 'Não foi possível adicionar aos desejos.',
        type: 'error',
      });
    } finally {
      this.busyWishlist.set(false);
    }
  }

  openListModal() {
    const fingerprint = this.fingerprint;
    if (fingerprint && this.listController.lists().length === 0) {
      void this.listController.loadLists({ ownerFingerprint: fingerprint });
    }
    this.listModalOpen.set(true);
  }

  selectList(list: ZereiListRow) {
    this.selectedList.set(list);
  }

  handleAddToList({ close }: { close: () => void }) {
    const list = this.selectedList();
    if (!list) {
      close();
      return;
    }

    void this.listController.addItem({
      list,
      game: this.game() as unknown as Parameters<
        ListsController['addItem']
      >[0]['game'],
    });
    this.notification.show({
      message: `Adicionado em ${list.title}.`,
      type: 'success',
    });
    this.selectedList.set(undefined);
    close();
  }
}
