import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from './notification.store';
import { Notification } from './notification.types';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed right-4 bottom-4 z-50 flex flex-col gap-2 w-80">
      @for (n of store.list(); track $index) {
        <div
          class="px-4 py-2 rounded-r-xl bg-blue-2 border-l-4 text-gray-11 flex justify-between"
          [ngClass]="{
            'border-green-400': n.type === 'success',
            'border-blue-9': n.type === 'info',
            'border-red-400': n.type === 'error',
          }"
        >
          <div class="flex-1 text-sm">{{ n.message }}</div>
          <button
            class="ml-2 text-xs text-gray-11 hover:text-gray-12 hover:cursor-pointer"
            (click)="store.dismiss(n.id)"
            aria-label="Fechar"
          >
            <i class="ph ph-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class ToasterComponent {
  constructor(public store: NotificationStore) {}

  // helper para template typing (opcional)
  trackById(_index: number, item: Notification) {
    return item.id;
  }
}
