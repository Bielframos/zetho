import { Component, input, model } from '@angular/core';
import { UiSheet } from './sheet.directive';

/** Modal side panel: native top layer keeps it above sticky/animated app shells. */
@Component({
  selector: 'ui-sidebar',
  standalone: true,
  imports: [UiSheet],
  template: `
    <dialog
      uiSheet
      [(sheetOpen)]="isOpen"
      [attr.aria-label]="title()"
      class="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md border-0 border-l border-gray-6 bg-gray-1 p-0 text-gray-12 open:flex open:flex-col"
    >
      <header
        class="flex shrink-0 items-center justify-between gap-4 border-b border-gray-6 px-4 py-4"
      >
        <h2 class="text-xl">{{ title() }}</h2>
        <button
          type="button"
          class="ui-ghost-btn"
          data-size="icon"
          aria-label="Fechar painel"
          (click)="close()"
        >
          <i class="ph ph-x" aria-hidden="true"></i>
        </button>
      </header>
      <div
        class="discreet-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
      >
        <ng-content />
      </div>
    </dialog>
  `,
})
export class UiSidebar {
  isOpen = model(false);
  title = input('Filtros');
  close() {
    this.isOpen.set(false);
  }
}
