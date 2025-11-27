import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { UserStore } from "../../core/auth/user.store";
import { DashboardStore } from "../../core/stores/dashboard.store";
import { ZereiService } from "../../core/services/zerei.service";

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink],
    templateUrl: './app-layout.html'
})
export class AppLayout {
    private zerei = inject(ZereiService)
    private dashboard = inject(DashboardStore)
    userStore = inject(UserStore)

    currentTab = this.dashboard.currentTab
    myStats = signal<Awaited<ReturnType<ZereiService['getMyStats']>>>(null)

    tabs = computed(() => [
        {
            key: 'completed',
            label: 'Zerados',
            count: this.myStats()?.completedCount ?? 0
        },
        {
            key: 'backlog',
            label: 'Backlog',
            count: this.myStats()?.backlogCount ?? 0
        },
        {
            key: 'playing',
            label: 'Jogando',
            count: this.myStats()?.playingCount ?? 0
        },
        {
            key: 'dropped',
            label: 'Dropados',
            count: this.myStats()?.droppedCount ?? 0
        },
        {
            key: 'wishlist',
            label: 'Lista de desejos',
            count: this.myStats()?.wishlistCount ?? 0
        }
    ]);

    get user() { return this.userStore.user() }
    get profile() { return this.userStore.profile() }

    async ngOnInit() {
        try {
            const userStats = await this.zerei.getMyStats()
            this.myStats.set(userStats)
        } catch (e) {
            console.error(e)
        }
    }
}
