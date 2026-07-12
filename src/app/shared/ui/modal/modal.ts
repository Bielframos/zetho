import {
  Component,
  contentChild,
  effect,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { ModalTriggerDirective } from './modal-trigger.directive';
import { UiLoading } from '../loading';

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
      class="m-0 bg-gray-1 text-gray-12 open:flex open:flex-col h-dvh w-screen max-h-none max-w-none rounded-none border-0 p-6 lg:mx-auto lg:h-auto lg:max-h-[70%] lg:w-[90%] lg:max-w-lg lg:self-center lg:rounded-lg lg:border lg:border-gray-6"
    >
      <header class="w-full text-start">
        <h5 class="text-2xl">{{ title() }}</h5>
        <p class="text-gray-11">{{ description() }}</p>
      </header>

      <div
        class="min-h-0 flex-1 overflow-y-auto lg:flex-none lg:overflow-visible"
      >
        <ng-content></ng-content>
      </div>

      <footer class="mt-auto w-full flex justify-end gap-2 pt-4 lg:mt-0">
        <button (click)="closeModal()" class="ui-secondary-btn">
          Cancelar
        </button>

        <button
          [class.ui-primary-btn]="!destructive()"
          [class.ui-destructive-btn]="destructive()"
          (click)="handleSubmit()"
        >
          @if (loading()) {
            <ui-loading [inline]="true" size="sm"></ui-loading>
          } @else {
            {{ actionLabel() }}
          }
        </button>
      </footer>
    </dialog>
  `,
  styles: `
    dialog::backdrop {
      background-color: hsla(0 0% 0% / 0.8);
    }
  `,
  imports: [UiLoading],
})
export class UiModal {
  isOpen = model<boolean | null>(null);
  actionLabel = input.required<string>();
  trigglerLabel = input<string>();
  title = input.required<string>();
  description = input('');
  submit = output<{ close: () => void }>();
  loading = input(false);
  destructive = input(false);

  private modal = viewChild<ElementRef<HTMLDialogElement>>('modal');
  private trigger = contentChild(ModalTriggerDirective);

  hasCustomTrigger() {
    return (
      !!this.trigger() || (this.isOpen() !== null && !this.trigglerLabel())
    );
  }

  showModal() {
    this.modal()?.nativeElement.showModal();
  }

  closeModal() {
    this.modal()?.nativeElement.close();
    this.isOpen.set(false);
  }

  handleSubmit() {
    this.submit.emit({ close: this.closeModal.bind(this) });
  }

  ngAfterContentInit() {
    if (this.trigger()) {
      this.trigger()!.onTrigger = () => this.showModal();
    }
  }

  constructor() {
    effect(() => {
      if (this.isOpen()) this.showModal();
      else this.closeModal();
    });
  }
}
