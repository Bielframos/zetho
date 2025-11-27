import { Component, inject } from "@angular/core";
import { UserStore } from "../../core/auth/user.store";
import { DashboardStore } from "../../core/zerei/dashboard.store";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { UiLoading } from "../../shared/ui/molecules/loading";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [UiLoading, UiGameCard],
    templateUrl: './app-dashboard.html'
})
export class AppDashboard {
    userStore = inject(UserStore)
    dashboardStore = inject(DashboardStore)

    ngOnInit() {
        if (!this.dashboardStore.isInitialized()) {
            this.dashboardStore.init(this.dashboardStore.currentTab());
        }
    }
}
