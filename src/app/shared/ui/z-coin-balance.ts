import { Component, inject, input } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-z-coin-balance',
  standalone: true,
  template: `
    @if (authStore.profile()) {
      @if (compact()) {
        <div class="flex shrink-0 items-center gap-1" title="Z-Coins">
          <img src="/animated_z_coin.gif" alt="" class="h-6 w-6" />
          <strong class="text-2xl leading-none text-gray-12 font-display font-normal tabular-nums"
            >{{ authStore.profile()?.zcoinBalance ?? 0 }}<span class="sr-only"> Z-Coins</span></strong
          >
        </div>
      } @else {
        <div class="flex items-center justify-center gap-1">
          <img src="/animated_z_coin.gif" alt="" class="h-8 w-8" />
          <div class="flex flex-col leading-none">
            <strong class="text-3xl text-gray-12 font-display font-normal"
              >{{ authStore.profile()?.zcoinBalance ?? 0 }}
              <span class="font-normal">Z-Coins</span></strong
            >
          </div>
        </div>
      }
    }
  `,
})
export class ZCoinBalance {
  authStore = inject(AuthStore);
  compact = input(false);
}
