import { NgClass } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { ZEntry, ZEntryRow } from '../../../core/types';
import { ZereiService } from '../../../core/zerei/zerei.service';

@Component({
  selector: 'ui-game-user-actions',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="mt-4 grid grid-cols-4 md:grid-cols-2 border-t md:border bg-blue-2 border-gray-6 rounded-lg overflow-hidden fixed md:relative bottom-0 left-0 w-full z-999 animate-fade-in-slide"
    >
      @for (action of actions; track action.key) {
      <button
        (click)="handleZEntry(action.key)"
        class="flex flex-col gap-2 items-center justify-center px-4 py-4 w-full cursor-pointer transition-colors text-sm md:text-md md:border-b border-gray-6"
        [ngClass]="[
          action.key === 'completed' || action.key === 'playing' ? 'md:border-r' : '',
          action.key === zEntry()?.status ? activeClasses[action.key] : inactiveClasses[action.key]
        ]"
      >
        @switch (action.key) { @case ('completed') {
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.3125 11.0996H1.3418L14.0645 23.8223C13.3937 23.9386 12.704 24 12 24C5.37258 24 0 18.6274 0 12C0 6.80406 3.30252 2.37992 7.92285 0.710938L18.3125 11.0996ZM12 0C18.6274 0 24 5.37258 24 12C24 17.1965 20.6963 21.6195 16.0752 23.2881L5.6875 12.9004H22.6582L9.93457 0.176758C10.6056 0.0603575 11.2957 0 12 0Z"
            fill="currentcolor"
          />
        </svg>
        } @case ('backlog') {
        <i class="ph-fill ph-books"></i>
        } @case ('playing') {
        <i class="ph-fill ph-game-controller"></i>
        } @case ('dropped') {
        <i class="ph-fill ph-x-circle"></i>
        } }

        {{ action.label }}
      </button>
      }
    </div>

    <!-- Curtida e lista de desejos -->
    <div
      class="mt-4 border border-gray-6 divide-y divide-gray-6 rounded-lg overflow-hidden animate-fade-in-slide"
      style="animation-delay: 300ms"
    >
      <button
      (click)="handleLike()"
        class="ui-secondary-btn w-full rounded-b-none"
      >
        @if (zEntry()?.liked) {
        <i class="ph-fill ph-heart text-red-400"></i>
        } @else {
        <i class="ph ph-heart"></i>
        }
        {{ zEntry()?.liked ? 'Descurtir' : 'Curtir' }}
      </button>
      <button
       (click)="handleZEntry('wishlist')"
        [ngClass]="[
          'ui-secondary-btn w-full rounded-t-none',
          zEntry()?.status === 'wishlist' ? 'text-blue-12' : ''
        ]"
      >
        <i class="ph ph-list-star"></i>
        {{ zEntry()?.status === 'wishlist' ? 'Na lista de desejos' : 'Quero comprar' }}
      </button>
    </div>
  `,
})
export class UiGameUserActions {
  private zerei = inject(ZereiService);
  private isLiking = signal(false);
  gameId = input.required<string>();
  zEntry = input<ZEntryRow | null>(null);
  onZEntryUpdate = output<ZEntryRow>();

  actions: {
    key: Exclude<ZEntry['status'], 'wishlist' | null | undefined>;
    label: string;
    icon?: string;
  }[] = [
      { key: 'completed', label: 'Zerei' },
      { key: 'backlog', label: 'Backlog', icon: 'ph-fill ph-books' },
      { key: 'playing', label: 'Jogando', icon: 'ph-fill ph-game-controller' },
      { key: 'dropped', label: 'Dropei', icon: 'ph-fill ph-x-circle' },
    ];

  activeClasses = {
    completed: 'bg-blue-9 text-white hover:bg-blue-10',
    backlog: 'bg-green-400 text-white hover:text-green-300 hover:bg-transparent',
    playing: 'bg-purple-400 text-white hover:text-purple-300 hover:bg-transparent',
    dropped: 'bg-red-400 text-white hover:text-red-300 hover:bg-transparent',
  };

  inactiveClasses = {
    completed: 'text-gray-11 hover:bg-blue-9 hover:text-white',
    backlog: 'text-gray-11 hover:text-green-300',
    playing: 'text-gray-11 hover:text-purple-300',
    dropped: 'text-gray-11 hover:text-red-300',
  };

  async handleZEntry(status: ZEntry['status']) {
    const existing = this.zEntry();

    if (!this.gameId()) return;

    const newStatus = status === existing?.status ? null : status;

    const updated = await this.zerei.createZEntry({
      zEntryId: existing?.$id,
      gameId: this.gameId(),
      status: newStatus,
      prev: existing,
    });

    if (updated) this.onZEntryUpdate.emit(updated);
  }

  async handleLike() {
    const gameId = this.gameId();
    const existing = this.zEntry();

    if (!gameId || this.isLiking()) return;

    this.isLiking.set(true);

    try {
      const updated = await this.zerei.likeAGame({
        zEntryId: existing?.$id,
        gameId: gameId,
        prev: existing
      });

      if (updated) this.onZEntryUpdate.emit(updated);
    } finally {
      this.isLiking.set(false);
    }
  }
}
