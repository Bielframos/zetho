import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  model,
} from '@angular/core';

const locks = new WeakMap<Document, { count: number; overflow: string }>();

/** Native modal semantics plus a shared, interruptible enter/leave lifecycle. */
@Directive({
  selector: 'dialog[uiSheet]',
  host: {
    class: 'ui-sheet',
    '(cancel)': 'onCancel($event)',
    '(close)': 'onNativeClose()',
    '(click)': 'onBackdropClick($event)',
  },
})
export class UiSheet {
  sheetOpen = model(false);
  private readonly panel =
    inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private timer?: ReturnType<typeof setTimeout>;
  private locked = false;
  private trigger?: HTMLElement;

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (this.sheetOpen()) this.open();
      else this.beginClose();
    });
    inject(DestroyRef).onDestroy(() => this.finishClose());
  }

  private open() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.panel.classList.remove('sheet-closing');
    if (!this.panel.open) {
      this.trigger =
        this.document.activeElement instanceof HTMLElement
          ? this.document.activeElement
          : undefined;
      this.panel.showModal();
    }
    if (!this.locked) {
      const state = locks.get(this.document) ?? {
        count: 0,
        overflow: this.document.body.style.overflow,
      };
      state.count++;
      locks.set(this.document, state);
      this.document.body.style.overflow = 'hidden';
      this.locked = true;
    }
  }

  close() {
    this.sheetOpen.set(false);
    this.beginClose();
  }

  private beginClose() {
    if (!this.panel.open || this.timer) return;
    this.panel.classList.add('sheet-closing');
    if (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
        .matches
    ) {
      this.finishClose();
    } else {
      this.timer = setTimeout(() => this.finishClose(), 220);
    }
  }

  private finishClose() {
    clearTimeout(this.timer);
    this.timer = undefined;
    const wasOpen = this.panel.open;
    if (wasOpen) this.panel.close();
    this.panel.classList.remove('sheet-closing');
    if (this.locked) {
      const state = locks.get(this.document);
      if (state && --state.count === 0) {
        this.document.body.style.overflow = state.overflow;
        locks.delete(this.document);
      }
      this.locked = false;
    }
    if (wasOpen && this.trigger?.isConnected)
      this.trigger.focus({ preventScroll: true });
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.close();
  }

  onNativeClose() {
    if (!this.panel.open) {
      this.sheetOpen.set(false);
      this.finishClose();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target !== this.panel) return;
    const bounds = this.panel.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.close();
  }
}
