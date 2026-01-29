import { Component, inject, input, signal } from '@angular/core';
import { UserStore } from '../../../core/auth/user.store';

import { GameRow, ZereiListRow } from '../../../core/types';
import { UiModal } from '../../../shared/ui/molecules/modal/modal';
import { ModalTriggerDirective } from '../../../shared/ui/molecules/modal/modal-trigger.directive';
import { NgClass } from '@angular/common';
import { GameController } from '../../../core/games/gamePage.controller';
import { ListsController } from '../../../core/lists/lists.controller';

@Component({
  selector: 'ui-game-actions',
  standalone: true,
  template: `
    <div class="flex gap-2 flex-wrap justify-center mb-4">
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

      <!-- Ações de lista de desejos -->
      <button
        (click)="
          gameController.handleEntry({
            action: 'updateStatus',
            value: 'wishlist',
          })
        "
        [ngClass]="[
          'rounded-xl px-4 py-1 h-[36px] bg-blue-2 hover:bg-blue-3 flex items-center gap-2',
          gameController.zEntry()?.status === 'wishlist' ? 'text-blue-12' : '',
        ]"
      >
        <i class="ph ph-list-star"></i>
        {{
          gameController.zEntry()?.status === 'wishlist'
            ? 'Na lista de desejos'
            : 'Quero comprar'
        }}
      </button>

      <!-- Modal para registro do jogo em uma lista -->
      <ui-modal
        title="Selecione uma lista"
        actionLabel="Salvar na lista"
        (submit)="handleAddToList($event)"
      >
        <button
          modalTrigger
          class="rounded-xl h-[36px] px-4 py-1 bg-blue-2 hover:bg-blue-3 flex items-center gap-2"
        >
          <i class="ph ph-list-plus"></i>
          Adicionar à lista
        </button>

        <div class="flex flex-col my-4 overflow-y-auto transition-colors gap-1">
          @for (list of listController.lists(); track $index) {
            <label
              [htmlFor]="list.$id"
              class="flex flex-1 gap-2 p-4 cursor-pointer has-checked:bg-blue-3"
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

          @if (listController.hasMore()) {
            <footer class="w-full flex justify-center">
              <button
                class="ui-primary-btn"
                (click)="
                  listController.loadLists({
                    ownerFingerprint: this.profile.fingerprint,
                    loadMore: true,
                  })
                "
              >
                Carregar mais
              </button>
            </footer>
          }
        </div>
      </ui-modal>
    </div>
  `,
  imports: [UiModal, ModalTriggerDirective, NgClass],
})
export class UiGameActions {
  userStore = inject(UserStore);
  gameController = inject(GameController);
  listController = inject(ListsController);
  game = input<GameRow | null>();
  isLiking = signal(false);

  constructor() {
    void this.listController.loadLists({
      ownerFingerprint: this.profile.fingerprint,
    });
  }

  get profile() {
    return this.userStore.profile()!;
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
}
