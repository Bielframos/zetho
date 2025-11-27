import { inject, Injectable, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { distinctUntilChanged, map } from "rxjs";
import { ZEntryRow } from "../types";
import { ZereiService } from "./zerei.service";

@Injectable({ providedIn: 'root' })
export class DashboardStore {
    private route = inject(ActivatedRoute)
    private zerei = inject(ZereiService)
    private initialTab = (this.route.snapshot.queryParams['t'] as Exclude<ZEntryRow['status'], null | undefined>) ?? 'completed'

    private controller = this.zerei.createDashboardController(24)

    currentTab = signal<Exclude<ZEntryRow['status'], null | undefined>>(this.initialTab)
    loading = this.controller.loading
    total = this.controller.total
    games = this.controller.games
    hasMore = this.controller.hasMore
    isInitialized = this.controller.isInitialized
    loadMore = this.controller.loadMore
    init = this.controller.init

    constructor() {
        this.route.queryParams
            .pipe(
                map(params => params['t']),
                distinctUntilChanged()
            )
            .subscribe(t => {
                if (t === this.currentTab()) return
                const status = t ?? 'completed'
                this.currentTab.set(status)
                this.controller.init(status)
            })
    }
}