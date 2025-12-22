import { NgClass } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { ZEntry, ZEntryRow } from '../../../core/types';
import { ZEntryService } from '../../../core/services/zEntries.service';
import { UserStore } from '../../../core/auth/user.store';

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
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.7695 1.84668H18.4619V3.69238H20.3076V5.53809H22.1543V9.23047H24V14.7695H22.1543V18.4619H20.3076V20.3076H18.4619V22.1543H14.7695V24H9.23047V22.1543H5.53809V20.3076H3.69238V18.4619H1.8457V14.7695H0V9.23047H1.8457V5.53809H3.69238V3.69238H5.53809V1.84668H9.23047V0H14.7695V1.84668ZM5.53809 4.61523V8.30762H12.9229V10.1543H11.0771V12H9.23047V13.8457H7.38477V15.6924H5.53809V19.3848H18.4619V15.6924H12.9229V13.8457H14.7695V12H16.6152V10.1543H18.4619V4.61523H5.53809Z"
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
      <button (click)="handleLike()" class="ui-secondary-btn w-full rounded-b-none">
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
  private zEntryService = inject(ZEntryService);
  private userStore = inject(UserStore);
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

    if (!this.userStore.isAuthenticated()) {
      alert('Só usuários logados podem criar ou atualizar seus registros.')
      return
    }

    const profile = this.userStore.profile()
    const newStatus = status === existing?.status ? null : status;

    const updated = await this.zEntryService.createEntry(profile!.fingerprint, {
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

    if (!this.userStore.isAuthenticated()) {
      alert('Só usuários logados podem curtir um jogo.')
      return
    }

    this.isLiking.set(true);

    try {
      const profile = this.userStore.profile()

      const updated = await this.zEntryService.likeAGame(profile!.fingerprint, {
        zEntryId: existing?.$id,
        gameId: gameId,
        prev: existing,
      });

      if (updated) this.onZEntryUpdate.emit(updated);
    } finally {
      this.isLiking.set(false);
    }
  }
}
