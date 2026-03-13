import { Component, input } from '@angular/core';
import { ShortNumberPipe } from '../../../../../utils/pipes';
import { ZStatsRow } from '../../../../zStats/zStats.types';

@Component({
  selector: 'ui-game-stats',
  standalone: true,
  template: `
    <div class="@container">
      <div
        class="flex flex-col @md:grid max-md:divide-y divide-gray-6 grid-cols-2 overflow-hidden md:rounded-2xl p-2 bg-blue-2 h-full"
      >
        <!-- Zerado -->
        <div
          class="col-span-2 @md:border-b border-gray-6 px-4 py-4 text-gray-11 flex justify-between items-center"
        >
          <div class="flex gap-2 items-center">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.7695 1.84668H18.4619V3.69238H20.3076V5.53809H22.1543V9.23047H24V14.7695H22.1543V18.4619H20.3076V20.3076H18.4619V22.1543H14.7695V24H9.23047V22.1543H5.53809V20.3076H3.69238V18.4619H1.8457V14.7695H0V9.23047H1.8457V5.53809H3.69238V3.69238H5.53809V1.84668H9.23047V0H14.7695V1.84668ZM5.53809 4.61523V8.30762H12.9229V10.1543H11.0771V12H9.23047V13.8457H7.38477V15.6924H5.53809V19.3848H18.4619V15.6924H12.9229V13.8457H14.7695V12H16.6152V10.1543H18.4619V4.61523H5.53809Z"
                fill="var(--color-gray-11)"
              />
            </svg>
            <span>Zerado</span>
          </div>
          <span>{{ stats()?.completedCount | shortNumber }}</span>
        </div>

        <!-- Demais categorias -->
        @for (item of entries; track $index) {
          <div
            class="{{
              item.classes
            }} px-4 py-4 text-gray-11 flex justify-between items-center"
          >
            <div class="flex gap-2 items-center">
              <i class="{{ item.icon }} text-gray-11"></i>
              <span>{{ item.label }}</span>
            </div>
            <span>{{ stats()?.[item.key] | shortNumber }}</span>
          </div>
        }
      </div>
    </div>
  `,
  imports: [ShortNumberPipe],
  host: {
    class: 'contents',
  },
})
export class UiGameStats {
  stats = input<ZStatsRow>();

  // Estrutura para reduzir repetição no template
  entries = [
    {
      key: 'backlogCount',
      label: 'Backlog',
      icon: 'ph-fill ph-books',
      classes: '@md:border-b @md:border-r border-gray-6',
    },
    {
      key: 'playingCount',
      label: 'Jogando',
      icon: 'ph-fill ph-game-controller',
      classes: '@md:border-b border-gray-6',
    },
    {
      key: 'droppedCount',
      label: 'Droparam',
      icon: 'ph-fill ph-x-circle',
      classes: '@md:border-r border-gray-6',
    },
    {
      key: 'wishlistCount',
      label: 'Lista de Desejos',
      icon: 'ph-fill ph-list-star',
      classes: '',
    },
  ] as const;
}
