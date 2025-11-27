import { Component, effect, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { UserStore } from "../../core/auth/user.store";
import { GameRow } from "../../core/types";
import { ZereiService } from "../../core/zerei/zerei.service";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { UiLoading } from "../../shared/ui/molecules/loading";

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, UiLoading, UiGameCard],
    templateUrl: './home.html'
})
export class Home {
    platformStats = signal<Awaited<ReturnType<ZereiService['getPlatformStats']>>>(null)
    trendingGames = signal<GameRow[]>([])


    constructor(private router: Router, private userStore: UserStore, private zerei: ZereiService) {
        if (this.userStore.isAuthenticated()) {
            this.router.navigateByUrl('/app');
        }

        this.zerei.getPlatformStats().then(v => this.platformStats.set(v))
        this.zerei.getTrendingGames().then(v => this.trendingGames.set(v))
    }
}
