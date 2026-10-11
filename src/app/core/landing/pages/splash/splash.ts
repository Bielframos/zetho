import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';

@Component({
  selector: 'app-splash',
  standalone: true,
  template: `
    <div
      class="min-h-dvh flex items-center justify-center bg-gray-1 select-none"
    >
      <span class="font-display text-4xl text-gray-10 animate-pulse">zetho</span>
    </div>
  `,
})
export class SplashPage implements OnInit {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.authStore.ready;

    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl('/feed', { replaceUrl: true });
    } else {
      void this.router.navigateByUrl('/landing', { replaceUrl: true });
    }
  }
}
