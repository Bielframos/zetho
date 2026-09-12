import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

/** Modal side panel: native top layer keeps it above sticky/animated app shells. */
@Component({
  selector: 'ui-sidebar',
  standalone: true,
  template: `
    <dialog
      #panel
      [attr.aria-label]="title()"
      class="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md border-0 border-l border-gray-6 bg-gray-1 p-0 text-gray-12 open:flex open:flex-col"
      (cancel)="onCancel($event)"
      (close)="onClose()"
      (click)="onBackdropClick($event)"
    >
      <header class="flex shrink-0 items-center justify-between gap-4 border-b border-gray-6 px-4 py-4">
        <h2 class="text-xl">{{ title() }}</h2>
        <button type="button" class="ui-ghost-btn" data-size="icon" aria-label="Fechar painel" (click)="close()">
          <i class="ph ph-x" aria-hidden="true"></i>
        </button>
      </header>
      <div class="discreet-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    dialog::backdrop {
      background: rgb(0 0 0 / 0.7);
    }
  `,
})
export class UiSidebar {
  isOpen = model(false);
  title = input('Filtros');

  private panel = viewChild<ElementRef<HTMLDialogElement>>('panel');
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private releaseScroll?: () => void;

  constructor() {
    effect(() => {
      const panel = this.panel()?.nativeElement;
      if (!panel || !isPlatformBrowser(this.platformId)) return;
      if (this.isOpen()) {
        if (!panel.open) panel.showModal();
        if (!this.releaseScroll) {
          const body = this.document.body;
          const overflow = body.style.overflow;
          body.style.overflow = 'hidden';
          this.releaseScroll = () => { body.style.overflow = overflow; };
        }
      } else {
        this.close();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.panel()?.nativeElement.close?.();
      this.unlockScroll();
    });
  }

  close() {
    this.panel()?.nativeElement.close();
    this.isOpen.set(false);
    this.unlockScroll();
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.close();
  }

  onClose() {
    // A queued close event from the previous opening must not close a reopened panel.
    if (!this.panel()?.nativeElement.open) {
      this.isOpen.set(false);
      this.unlockScroll();
    }
  }

  onBackdropClick(event: MouseEvent) {
    const panel = this.panel()?.nativeElement;
    if (!panel || event.target !== panel) return;
    const bounds = panel.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      this.close();
    }
  }

  private unlockScroll() {
    this.releaseScroll?.();
    this.releaseScroll = undefined;
  }
}
