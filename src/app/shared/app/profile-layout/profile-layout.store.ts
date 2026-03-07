import { Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfileLayoutStore {
  private knownTabs = ['games', 'listas'];

  currentTab = signal<string | undefined>('');
  sidebarComponent = signal<any | null>(null);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const segments = this.router.url
          .split('?')[0]
          .split('#')[0]
          .split('/')
          .filter(Boolean);

        if (segments[0] !== 'player') return;

        const lastSegment = segments.at(-1);

        this.currentTab.set(
          this.knownTabs.includes(lastSegment || '') ? lastSegment : 'games',
        );
      });
  }
}
