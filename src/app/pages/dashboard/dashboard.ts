import { Component, inject } from "@angular/core";
import { UserStore } from "../../core/auth/user.store";
import { ShortNumberPipe } from "../../core/modules/pipes";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink, ShortNumberPipe],
    templateUrl: './dashboard.html',
})
export class Dashboard {
    userStore = inject(UserStore)
    get profile() { return this.userStore.profile() }

    entries = [
        {
            key: 'totalsBacklog',
            label: 'Backlog',
            icon: 'ph-fill ph-books',
            classes: '@md:border-b @md:border-r border-gray-6',
            tab: 'backlog'
        },
        {
            key: 'totalsPlaying',
            label: 'Jogando',
            icon: 'ph-fill ph-game-controller',
            classes: '@md:border-b border-gray-6',
            tab: 'playing'
        },
        {
            key: 'totalsDropped',
            label: 'Dropados',
            icon: 'ph-fill ph-x-circle',
            classes: '@md:border-r border-gray-6',
            tab: 'dropped'
        },
        {
            key: 'totalsWishlist',
            label: 'Lista de Desejos',
            icon: 'ph-fill ph-list-star',
            classes: '',
            tab: 'wishlist'
        },
    ] as const;
}
