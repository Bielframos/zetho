import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ProfileStore } from '../../core/stores/profile.store';
import { UiUserLibGrid } from './modules/profile-entries';
import { ZEntriesController } from '../../core/controllers/zEntries.controller';
import { Meta } from '@angular/platform-browser';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterLink, UiUserLibGrid],
    templateUrl: './profile.html',
})
export class Profile {
    private route = inject(ActivatedRoute);
    private meta = inject(Meta);
    controller = inject(ZEntriesController);
    profileStore = inject(ProfileStore);

    gamertag = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('gamertag'))),
        { initialValue: null },
    );

    currentTab = this.controller.status;

    tabs = computed(() => [
        {
            key: 'completed',
            label: 'Zerados',
            count: this.profileStore.current()?.totalsCompleted ?? 0,
        },
        {
            key: 'backlog',
            label: 'Backlog',
            count: this.profileStore.current()?.totalsBacklog ?? 0,
        },
        {
            key: 'playing',
            label: 'Jogando',
            count: this.profileStore.current()?.totalsPlaying ?? 0,
        },
        {
            key: 'dropped',
            label: 'Dropados',
            count: this.profileStore.current()?.totalsDropped ?? 0,
        },
        {
            key: 'wishlist',
            label: 'Lista de desejos',
            count: this.profileStore.current()?.totalsWishlist ?? 0,
        },
    ]);

    get profile() {
        return this.profileStore.current();
    }

    constructor() {
        this.meta.addTags([{ name: 'og:title', content: `Veja o perfil de ${this.profile?.gamertag} no Zetho` }]);

        effect(() => {
            const gamertag = this.gamertag();
            if (gamertag) this.profileStore.update(gamertag);
        });
    }
}
