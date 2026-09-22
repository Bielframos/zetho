import { Component, input } from '@angular/core';
import { ShortNumberPipe } from '../../../../../utils/pipes';
import { ZStatsRow } from '../../../../zStats/zStats.types';

@Component({
  selector: 'ui-game-stats',
  standalone: true,
  template: `
    <div class="flex flex-col divide-y divide-gray-6">
      @if (isUpcomingRelease()) {
        @for (item of upcomingEntries; track item.key) {
          <div class="flex items-center justify-between px-4 py-4 text-gray-11">
            <div class="flex items-center gap-2">
              @if (item.key === 'completedCount') {
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
              } @else {
                <i class="{{ item.icon }} text-gray-11"></i>
              }
              <span class="text-sm">{{ item.label }}</span>
            </div>
            <span class="text-lg tabular-nums text-gray-12">{{
              getItemValue(item.key) | shortNumber
            }}</span>
          </div>
        }
      } @else {
        <!-- Zerado -->
        <div class="flex items-center justify-between px-4 py-4 text-gray-11">
          <div class="flex items-center gap-2">
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
            <span class="text-sm">Zerado</span>
          </div>
          <span class="text-lg tabular-nums text-gray-12">{{
            stats()?.completedCount | shortNumber
          }}</span>
        </div>

        <div class="flex items-center justify-between px-4 py-4 text-gray-11">
          <span class="text-sm">Média de horas para zerar</span>
          <span class="text-lg tabular-nums text-gray-12">
            {{ stats()?.completedPlaytimeCount ? ((stats()!.completedPlaytimeMinutes ?? 0) / stats()!.completedPlaytimeCount! / 60).toFixed(1) + ' h' : 'Sem dados' }}
          </span>
        </div>
        <!-- Demais categorias -->
        @for (item of entries; track $index) {
          <div class="flex items-center justify-between px-4 py-4 text-gray-11">
            <div class="flex items-center gap-2">
              <i class="{{ item.icon }} text-gray-11"></i>
              <span class="text-sm">{{ item.label }}</span>
            </div>
            <span class="text-lg tabular-nums text-gray-12">{{
              stats()?.[item.key] | shortNumber
            }}</span>
          </div>
        }
      }
    </div>
  `,
  imports: [ShortNumberPipe],
})
export class UiGameStats {
  stats = input<ZStatsRow>();
  isUpcomingRelease = input(false);
  gameHypes = input<number | null | undefined>(undefined);

  getItemValue(key: (typeof this.upcomingEntries)[number]['key']) {
    if (key === 'hypes') {
      return (this.gameHypes() ?? 0) + (this.stats()?.hypes ?? 0);
    }

    return this.stats()?.[key] ?? 0;
  }

  // Estrutura para reduzir repetição no template
  entries = [
    {
      key: 'backlogCount',
      label: 'Na biblioteca',
      icon: 'ph-fill ph-books',
    },
    {
      key: 'playingCount',
      label: 'Jogando',
      icon: 'ph-fill ph-game-controller',
    },
    {
      key: 'droppedCount',
      label: 'Dropados',
      icon: 'ph-fill ph-x-circle',
    },
    {
      key: 'wishlistCount',
      label: 'Lista de Desejos',
      icon: 'ph-fill ph-list-star',
    },
  ] as const;

  upcomingEntries = [
    {
      key: 'hypes',
      label: 'Hypes',
      icon: 'ph-fill ph-fire',
    },
    {
      key: 'completedCount',
      label: 'Zerado',
      icon: '',
    },
    {
      key: 'backlogCount',
      label: 'Na biblioteca',
      icon: 'ph-fill ph-books',
    },
    {
      key: 'playingCount',
      label: 'Jogando',
      icon: 'ph-fill ph-game-controller',
    },
    {
      key: 'droppedCount',
      label: 'Dropados',
      icon: 'ph-fill ph-x-circle',
    },
    {
      key: 'wishlistCount',
      label: 'Lista de Desejos',
      icon: 'ph-fill ph-list-star',
    },
  ] as const;
}
