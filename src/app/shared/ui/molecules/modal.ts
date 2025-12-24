import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    <button class="ui-primary-btn" (click)="showModal()">
      {{ trigglerLabel() }}
    </button>

    <dialog #modal class="self-center mx-auto w-[90%] max-w-lg p-6 rounded-lg border border-gray-6 bg-blue-1">
      <header class="w-full text-start">
        <h5 class="text-2xl text-blue-12">{{ title() }}</h5>
        <p>{{ description() }}</p>
      </header>

      <ng-content></ng-content>

      <footer class="w-full flex justify-end gap-2">
        <button (click)="closeModal()" class="ui-secondary-btn">
            Cancelar
        </button>

        <button class="ui-primary-btn" (click)="handleSubmit()">
           @if (loading()) {
            <i class="ph ph-spinner animate-spin"></i>
           } @else {
             {{actionLabel()}}
           }
        </button>
      </footer>
    </dialog>
  `,
  styles: `
  dialog::backdrop {
    background-color: hsla(0 0% 0% / 0.4);
  }
  `,
  imports: []
})
export class UiModal {
  trigglerLabel = input.required<string>();
  actionLabel = input.required<string>();
  title = input.required<string>();
  description = input('');
  submit = output<void>()
  loading = input(false)

  private modal = viewChild<ElementRef<HTMLDialogElement>>('modal');

  showModal() {
    this.modal()?.nativeElement.showModal();
  }

  closeModal() {
    this.modal()?.nativeElement.close();
  }

  handleSubmit() {
    this.submit.emit()
  }
}
