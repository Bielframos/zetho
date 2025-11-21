import { Component, effect, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ZEntryRow } from "../../core/types";
import { ZereiService } from "../../core/zerei/zerei.service";
import { UiLoading } from "../../shared/ui/molecules/loading";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { distinctUntilChanged, filter, map } from "rxjs";

const validStatuses: Exclude<ZEntryRow['status'], null | undefined>[] = [
    'completed',
    'backlog',
    'playing',
    "dropped",
    "wishlist"
]

function isValidStatus(value: any): value is Exclude<ZEntryRow['status'], null | undefined> {
    return validStatuses.includes(value)
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, UiLoading, UiGameCard],
    templateUrl: './home.html'
})
export class Home {
    private route = inject(ActivatedRoute)
    private zerei = inject(ZereiService)
    private initialTab = (this.route.snapshot.queryParams['t'] as Exclude<ZEntryRow['status'], null | undefined>) ?? 'completed'

    myStats = signal<Awaited<ReturnType<ZereiService['getMyStats']>>>(null)
    pageState = signal(this.zerei.createHomePageState())
    currentTab = signal<Exclude<ZEntryRow['status'], null | undefined>>(this.initialTab)

    async ngOnInit() {
        try {
            const userStats = await this.zerei.getMyStats()
            this.myStats.set(userStats)
            this.pageState().init(this.currentTab())
        } catch (e) {
            console.error(e)
        }

        this.route.queryParams
            .pipe(
                map(params => params['t']),
                filter(isValidStatus),
                distinctUntilChanged()
            )
            .subscribe(t => {
                if (t === this.currentTab()) return
                this.currentTab.set(t)
                this.pageState().init(t)
            })
    }
}
