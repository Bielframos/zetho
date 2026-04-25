import { Component, inject, input, signal } from '@angular/core';
import { UiModal } from '../../../../../shared/ui/modal/modal';
import { ModalTriggerDirective } from '../../../../../shared/ui/modal/modal-trigger.directive';
import { AuthStore } from '../../../../auth/auth.store';
import { GameController } from '../../../game.controller';
import { ListsController } from '../../../../lists/lists.controller';
import { GameRow } from '../../../game.types';
import { ZereiListRow } from '../../../../lists/lists.type';

@Component({
  selector: 'ui-game-actions',
  standalone: true,
  template: `
    <div class="flex gap-2 flex-wrap justify-center px-4">
      <!-- Ação de curtida -->
      <button
        (click)="handleLike()"
        class="p-2 rounded-xl bg-blue-2 hover:bg-blue-3 flex cursor-pointer"
        [aria-label]="gameController.zEntry()?.liked ? 'Descurtir' : 'Curtir'"
      >
        @if (gameController.zEntry()?.liked) {
          <i class="ph-fill ph-heart text-red-400"></i>
        } @else {
          <i class="ph ph-heart"></i>
        }
      </button>

      <!-- Ação de hype -->
      <button
        (click)="handleHype()"
        class="p-2 rounded-xl bg-blue-2 hover:bg-blue-3 flex cursor-pointer"
        [aria-label]="gameController.zEntry()?.hyped ? 'Remover hype' : 'Hypar'"
      >
        @if (gameController.zEntry()?.hyped) {
          <i class="ph-fill ph-fire text-orange-400"></i>
        } @else {
          <i class="ph ph-fire"></i>
        }
      </button>

      <!-- Ações de lista de desejos -->
      <button
        (click)="
          gameController.handleEntry({
            action: 'updateStatus',
            value: 'wishlist',
          })
        "
        class="rounded-xl px-4 py-1 h-[36px] bg-blue-2 hover:bg-blue-3 flex items-center gap-2 cursor-pointer"
      >
        @if (gameController.zEntry()?.status === 'wishlist') {
          <i class="ph-fill ph-shopping-bag-open text-blue-9"></i>
        } @else {
          <i class="ph ph-shopping-bag"></i>
        }

        Wishlist
      </button>

      <!-- Modal para registro do jogo em uma lista -->
      <ui-modal
        title="Selecione uma lista"
        actionLabel="Salvar na lista"
        (submit)="handleAddToList($event)"
      >
        <button
          modalTrigger
          class="rounded-xl h-[36px] px-4 py-1 bg-blue-2 hover:bg-blue-3 flex items-center gap-2 cursor-pointer"
        >
          <i class="ph ph-list-plus"></i>
          Adicionar à lista
        </button>

        <div
          class="flex flex-col my-4 overflow-y-auto divide-y divide-gray-6 bg-blue-1/60 border border-gray-6 rounded-2xl"
        >
          @for (list of listController.lists(); track $index) {
            <label
              [htmlFor]="list.$id"
              class="flex flex-1 gap-2 p-4 cursor-pointer has-checked:bg-blue-4 hover:bg-blue-3 first:rounded-t-xl last:rounded-b-xl transition-colors"
            >
              @if (selectedList()?.$id === list.$id) {
                <i class="ph-fill ph-radio-button text-blue-9"></i>
              } @else {
                <i class="ph ph-circle text-gray-6"></i>
              }
              {{ list.title }}
              <input
                [id]="list.$id"
                type="radio"
                name="list"
                [value]="list.$id"
                class="hidden"
                (click)="selectList(list)"
              />
            </label>
          } @empty {
            <span class="p-4">Você ainda não tem nenhuma lista.</span>
          }

          @if (listController.hasMore() && profile; as currentProfile) {
            <footer class="w-full flex justify-center">
              <button
                class="ui-primary-btn"
                (click)="
                  listController.loadLists({
                    ownerFingerprint: currentProfile.fingerprint,
                    loadMore: true,
                  })
                "
              >
                Carregar mais
              </button>
            </footer>
          }
        </div>

        <div class="h-1"></div>
      </ui-modal>
    </div>
  `,
  imports: [UiModal, ModalTriggerDirective],
})
export class UiGameActions {
  authStore = inject(AuthStore);
  gameController = inject(GameController);
  listController = inject(ListsController);
  game = input<GameRow | null>();
  isLiking = signal(false);
  isHyping = signal(false);

  constructor() {
    const profile = this.profile;
    if (!profile) return;

    void this.listController.loadLists({
      ownerFingerprint: profile.fingerprint,
    });
  }

  get profile() {
    return this.authStore.profile();
  }

  selectedList = signal<ZereiListRow | undefined>(undefined);
  selectList(list: ZereiListRow) {
    this.selectedList.set(list);
  }

  handleAddToList({ close }: { close: () => void }) {
    this.listController.addItem({
      list: this.selectedList(),
      game: this.game(),
    });
    close();
  }

  async handleLike() {
    if (!this.authStore.isAuthenticated()) return;

    this.isLiking.set(true);

    try {
      await this.gameController.handleEntry({
        action: 'like',
        value: !this.gameController.zEntry()?.liked,
      });
    } finally {
      this.isLiking.set(false);
    }
  }

  async handleHype() {
    if (!this.authStore.isAuthenticated()) return;

    this.isHyping.set(true);

    try {
      await this.gameController.handleEntry({
        action: 'hype',
        value: !this.gameController.zEntry()?.hyped,
      });
    } finally {
      this.isHyping.set(false);
    }
  }
}
