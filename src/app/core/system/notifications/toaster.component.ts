import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from './notification.store';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed right-4 bottom-4 z-50 flex flex-col gap-2 w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      @for (n of store.list(); track n.id) {
        <div
          class="pointer-events-auto overflow-hidden rounded-b-2xl border border-gray-6 border-t-2 bg-gray-1/95 backdrop-blur px-4 py-3 shadow-lg shadow-black/10 flex items-center gap-3 transition-all duration-200"
          [class.opacity-0]="n.closing"
          [class.translate-x-4]="n.closing"
          [class.scale-95]="n.closing"
          [class.animate-toast-in]="!n.closing"
          [class.animate-toast-out]="n.closing"
          [ngClass]="{
            'border-t-success-line': n.type === 'success',
            'border-t-blue-9': n.type === 'info',
            'border-t-danger-line': n.type === 'error',
          }"
        >
          @if (n.type !== 'error') {
            <img
              [src]="n.iconUrl ?? '/z-coin.webp'"
              alt=""
              class="h-6 w-6 shrink-0 rounded-full bg-gray-2 object-cover"
            />
          }

          <div class="flex-1 text-sm leading-5 text-gray-11 pt-1">
            {{ n.message }}
          </div>
          <button
            class="text-xs text-gray-11 hover:text-gray-12 hover:cursor-pointer mt-1"
            (click)="store.dismiss(n.id)"
            aria-label="Fechar"
          >
            <i class="ph ph-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateX(12px) scale(0.96);
        }

        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes toast-out {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        to {
          opacity: 0;
          transform: translateX(12px) scale(0.96);
        }
      }

      .animate-toast-in {
        animation: toast-in 180ms ease-out;
      }

      .animate-toast-out {
        animation: toast-out 180ms ease-in;
      }
    `,
  ],
})
export class ToasterComponent {
  constructor(public store: NotificationStore) {}
}
