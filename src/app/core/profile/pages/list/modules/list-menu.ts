import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiCheckbox } from '../../../../../shared/ui/checkbox';
import { UiInput } from '../../../../../shared/ui/input/input';
import { UiModal } from '../../../../../shared/ui/modal/modal';
import { Router } from '@angular/router';
import { ProfileStore } from '../../../../userProfiles/profile.store';
import { ListController } from '../../../../lists/list.controller';

@Component({
  selector: 'app-list-menu',
  template: `
    <button
      ngMenuTrigger
      #origin
      #trigger="ngMenuTrigger"
      [menu]="formatMenu()"
      class="ui-secondary-btn focus:ring-2 ring-blue-3 outline-none"
      data-size="icon"
    >
      <i class="ph ph-dots-three-vertical"></i>
    </button>

    <ng-template
      [cdkConnectedOverlayOpen]="trigger.expanded()"
      [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
      [cdkConnectedOverlayPositions]="[
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 4,
        },
      ]"
      cdkAttachPopoverAsChild
    >
      <div ngMenu class="menu" #formatMenu="ngMenu">
        <ng-template ngMenuContent>
          <div ngMenuItem value="Editar lista" (click)="openModal()">
            <i class="ph ph-pencil-line" aria-hidden="true"> </i>
            <span class="label">Editar lista</span>
          </div>

          <div ngMenuItem value="Excluir lista" (click)="handleDeleteList()">
            <i class="ph ph-trash text-danger" aria-hidden="true"> </i>
            <span class="label">Excluir lista</span>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <!-- Modal de edição da lista -->
    <ui-modal
      [(isOpen)]="modalIsOpen"
      [isOpen]="false"
      title="Editar lista"
      actionLabel="Salvar"
      (submit)="handleUpdateList($event)"
    >
      @if (controller.list()) {
        <form
          [formGroup]="form"
          method="dialog"
          class="flex flex-col gap-4 mt-4 mb-6"
        >
          <ui-input
            label="Nome da lista"
            name="listName"
            placeholder="Top 100 de todos os tempos"
            formControlName="listName"
            variant="secondary"
          ></ui-input>

          <fieldset class="flex flex-col gap-1">
            <label
              for="listDescription"
              class="text-sm text-gray-12 text-start px-4"
            >
              Descrição
            </label>

            <textarea
              name="listDescription"
              placeholder="Uma lista com os 100 melhores jogos de todos os tempos, selecionados com muito carinho."
              class="border rounded-lg px-4 w-full py-2 font-light bg-blue-1/60 border-gray-6 placeholder:text-gray-10 text-gray-12 outline-none focus:ring-2 focus:ring-focus-ring transition-colors duration-200 ease-in-out disabled:border-gray-3 disabled:bg-transparent disabled:text-gray-11 min-h-[80px] max-h-[160px] mb-4"
              formControlName="listDescription"
            ></textarea>

            <ui-checkbox
              name="isPublic"
              label="Tornar pública"
              formControlName="isPublic"
            ></ui-checkbox>
          </fieldset>
        </form>
      }
    </ui-modal>
  `,
  imports: [
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    ReactiveFormsModule,
    UiCheckbox,
    UiInput,
    UiModal,
  ],
})
export class AppListMenu {
  private router = inject(Router);
  private profileStore = inject(ProfileStore);
  controller = inject(ListController);
  formatMenu = viewChild<Menu<string>>('formatMenu');

  modalIsOpen = signal(false);

  form = new FormGroup({
    listName: new FormControl('', { nonNullable: true }),
    listDescription: new FormControl('', { nonNullable: true }),
    isPublic: new FormControl(false, { nonNullable: true }),
  });

  async handleUpdateList({ close }: { close: () => void }) {
    const data = this.form.getRawValue();
    await this.controller.updateList({
      title: data.listName,
      description: data.listDescription,
      isPublic: data.isPublic,
    });

    close();
  }

  async handleDeleteList() {
    try {
      const system = this.controller.list()?.ownerType === 'system';
      await this.controller.deleteList();
      if (this.controller.error()) return;
      if (system) { await this.router.navigate(['/listas']); return; }
      this.router.navigate([
        'player',
        this.profileStore.current()?.gamertag,
        'listas',
      ]);
    } catch {}
  }

  openModal() {
    this.modalIsOpen.set(true);
  }

  constructor() {
    effect(() => {
      const list = this.controller.list();

      if (!list) return;

      untracked(() => {
        this.form.patchValue({
          listName: list.title,
          listDescription: list.description,
          isPublic: list.isPublic,
        });
      });
    });
  }
}
