import { Component, effect, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ZereiService } from "../../core/zerei/zerei.service";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";

@Component({
    selector: 'app-search-page',
    standalone: true,
    imports: [UiGameCard],
    templateUrl: './search.html'
})
export class Search {
    private zerei = inject(ZereiService)
    private route = inject(ActivatedRoute)

    query = signal<string>('')
    searchGame = signal<ReturnType<ZereiService['createGameSearch']> | null>(null);

    constructor() {
        effect(() => {
            const q = this.query();

            if (!q) {
                this.searchGame.set(null);
                return;
            }

            const controller = this.zerei.createGameSearch(q);
            this.searchGame.set(controller);
        });
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['q']) this.query.set(params['q'])
        })
    }
}