import { Component, inject } from '@angular/core';
import { UiModal } from '../../../shared/ui/molecules/modal/modal';
import { ModalTriggerDirective } from '../../../shared/ui/molecules/modal/modal-trigger.directive';
import { ListsController } from '../../../core/controllers/lists.controller';
import { UserStore } from '../../../core/auth/user.store';

@Component({
  selector: 'ui-game-actions',
  standalone: true,
  template: `
    <div class="mb-4">
      <ui-modal title="Selecione uma lista" actionLabel="Salvar na lista">
        <button modalTrigger class="ui-action-btn">
          <i class="ph ph-list-plus text-[16px]"></i>
          Adicionar à lista
        </button>

        <div class="flex my-4 overflow-y-auto">
          @for (list of listController.lists(); track $index) {
            @if (listController.hasMore()) {
        <footer class="w-full flex justify-center">
          <button
            class="ui-primary-btn"
            (click)="listController.loadLists({ownerFingerprint: this.profile.fingerprint, loadMore: true})"
          >
            Carregar mais
          </button>
        </footer>
      }
          } @empty {
            Você ainda não tem nenhuma lista.
          }
        </div>
      </ui-modal>
    </div>
  `,
  imports: [UiModal, ModalTriggerDirective],
})
export class UiGameActions {
  userStore = inject(UserStore);
  listController = inject(ListsController);
  get profile() { return this.userStore.profile()! }

  constructor() {
    void this.listController.loadLists({
      ownerFingerprint: this.profile.fingerprint,
    });
  }
}
