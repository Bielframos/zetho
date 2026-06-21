import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameController } from '../../../game.controller';
import { ZEntry } from '../../../../zEntries/zEntries.types';

@Component({
  selector: 'ui-z-entry-actions',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="grid w-full auto-rows-auto divide-x grid-cols-4 divide-gray-6 animate-fade-in-slide md:h-full"
    >
      @for (action of actions; track action.key) {
        <button
          (click)="onStatusAction(action.key)"
          [disabled]="isCoolingDown"
          class="flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-2 py-4 text-sm transition-colors md:text-md"
          [ngClass]="[
            action.key === controller.zEntry()?.status
              ? activeClasses[action.key]
              : inactiveClasses[action.key],
          ]"
        >
          @switch (action.key) {
            @case ('completed') {
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
            }
            @case ('backlog') {
              <i class="ph-fill ph-books"></i>
            }
            @case ('playing') {
              <i class="ph-fill ph-game-controller"></i>
            }
            @case ('dropped') {
              <i class="ph-fill ph-x-circle"></i>
            }
          }

          {{ action.label }}
        </button>
      }
    </div>
  `,
  host: {
    class: 'w-full max-w-[318px]',
  },
})
export class UiZEntryActions {
  controller = inject(GameController);

  actions: {
    key: Exclude<ZEntry['status'], 'wishlist' | null | undefined>;
    label: string;
    icon?: string;
  }[] = [
    { key: 'completed', label: 'Zerei' },
    { key: 'backlog', label: 'Biblioteca', icon: 'ph-fill ph-books' },
    { key: 'playing', label: 'Jogando', icon: 'ph-fill ph-game-controller' },
    { key: 'dropped', label: 'Dropei', icon: 'ph-fill ph-x-circle' },
  ];

  activeClasses = {
    completed: 'bg-blue-9 text-white hover:bg-blue-10',
    backlog:
      'bg-green-400 text-white hover:text-green-300 hover:bg-transparent',
    playing:
      'bg-purple-400 text-white hover:text-purple-300 hover:bg-transparent',
    dropped: 'bg-red-400 text-white hover:text-red-300 hover:bg-transparent',
  };

  inactiveClasses = {
    completed: 'text-gray-11 hover:bg-blue-9 hover:text-white',
    backlog: 'text-gray-11 hover:text-green-300 hover:bg-green-600/10',
    playing: 'text-gray-11 hover:text-purple-300 hover:bg-purple-600/10',
    dropped: 'text-gray-11 hover:text-red-300 hover:bg-red-600/10',
  };

  isCoolingDown = false;
  cooldownDurationMs = 1500;

  onStatusAction(
    actionKey: Exclude<ZEntry['status'], 'wishlist' | null | undefined>,
  ) {
    if (this.isCoolingDown) return;

    this.isCoolingDown = true;
    this.controller.handleEntry({ action: 'updateStatus', value: actionKey });

    window.setTimeout(() => {
      this.isCoolingDown = false;
    }, this.cooldownDurationMs);
  }
}
