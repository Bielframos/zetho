import {
  Component,
  contentChild,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ModalTriggerDirective } from './modal-trigger.directive';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    <ng-content select="[modalTrigger]" (click)="showModal()"></ng-content>

    @if (!hasCustomTrigger()) {
      <button class="ui-primary-btn" (click)="showModal()">
        {{ trigglerLabel() }}
      </button>
    }

    <dialog
      #modal
      class="self-center mx-auto w-[90%] max-h-[60%] overflow-hidden max-w-lg p-6 rounded-lg border border-gray-6 bg-blue-1 text-gray-12"
    >
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
            {{ actionLabel() }}
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
  imports: [],
})
export class UiModal {
  actionLabel = input.required<string>();
  trigglerLabel = input<string>();
  title = input.required<string>();
  description = input('');
  submit = output<void>();
  loading = input(false);

  private modal = viewChild<ElementRef<HTMLDialogElement>>('modal');
  private trigger =
    contentChild(ModalTriggerDirective);

  hasCustomTrigger() {
    return !!this.trigger();
  }

  showModal() {
    this.modal()?.nativeElement.showModal();
  }

  closeModal() {
    this.modal()?.nativeElement.close();
  }

  handleSubmit() {
    this.submit.emit();
  }

  ngAfterContentInit() {
    if (this.trigger()) {
      this.trigger()!.onTrigger = () => this.showModal();
    }
  }
}
