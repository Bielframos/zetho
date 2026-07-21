import { Component, Directive, input, output } from '@angular/core';

export interface UiTab {
  id: string;
  label: string;
  badge?: number | null;
}

/**
 * Barra de tabs de navegação (nav-only), signal-driven. Os painéis ficam na
 * página que a usa — este componente só controla a seleção. Segue o padrão de
 * "underline tabs" do design system (AGENTS.md).
 */
@Component({
  selector: 'ui-tabs',
  standalone: true,
  template: `
    <div
      role="tablist"
      class="flex gap-1 overflow-x-auto overflow-y-hidden border-t-8 border-b border-gray-6 px-4"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          role="tab"
          type="button"
          [attr.aria-selected]="active() === tab.id"
          class="-mb-px flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm transition-colors"
          [class.border-blue-9]="active() === tab.id"
          [class.text-gray-12]="active() === tab.id"
          [class.border-transparent]="active() !== tab.id"
          [class.text-gray-10]="active() !== tab.id"
          [class.hover:text-gray-12]="active() !== tab.id"
          (click)="activeChange.emit(tab.id)"
        >
          {{ tab.label }}
          @if (tab.badge) {
            <span
              class="rounded-full bg-blue-3 px-2 py-0.5 text-xs text-blue-11"
            >
              {{ tab.badge }}
            </span>
          }
        </button>
      }
    </div>
  `,
})
export class UiTabs {
  tabs = input.required<UiTab[]>();
  active = input.required<string>();
  activeChange = output<string>();
}

/**
 * Detecta swipe horizontal para navegar entre tabs no mobile. Emite `swipe`
 * com a direção quando o gesto é predominantemente horizontal.
 */
@Directive({
  selector: '[uiTabSwipe]',
  standalone: true,
  host: {
    '(pointerdown)': 'onDown($event)',
    '(pointerup)': 'onUp($event)',
  },
})
export class UiTabSwipe {
  swipe = output<'next' | 'prev'>();

  private startX = 0;
  private startY = 0;

  onDown(event: PointerEvent) {
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  onUp(event: PointerEvent) {
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (Math.abs(dx) > 48 && Math.abs(dy) < 32) {
      this.swipe.emit(dx < 0 ? 'next' : 'prev');
    }
  }
}
