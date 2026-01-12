import { Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ProfileStore } from '../../../core/stores/profile.store';

@Injectable({ providedIn: 'root' })
export class ProfileLayoutStore {
    currentTab = signal<string | undefined>('');
    sidebarComponent = signal<any | null>(null);

    constructor(
        private router: Router,
        private profileStore: ProfileStore
    ) {
        this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe(() => {
                const segments = this.router.url
                    .split('?')[0]
                    .split('#')[0]
                    .split('/')
                    .filter(Boolean);

                if (segments[0] !== 'player') return

                const profile = this.profileStore.current()
                const gamertag = segments[1];
                const lastSegment = segments.at(-1);

                if (profile?.gamertag !== gamertag) {
                    this.profileStore.update(gamertag)
                }

                this.currentTab.set(
                    lastSegment === gamertag ? 'games' : lastSegment,
                );
            });
    }

}
