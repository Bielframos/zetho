import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-z-coin-balance',
  standalone: true,
  template: `
    @if (authStore.profile()) {
      <div class="flex items-center gap-2">
        <img src="/animated_z_coin.gif" alt="" class="h-8 w-8" />
        <div class="flex flex-col leading-none">
          <strong class="text-3xl text-gray-12 font-display">{{
            authStore.profile()?.zcoinBalance ?? 0
          }}</strong>
        </div>
      </div>
    }
  `,
})
export class ZCoinBalance {
  authStore = inject(AuthStore);
}
