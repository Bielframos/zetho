import { Component, effect, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GameSearchController } from "../../core/controllers/gameSearch.controller";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { UiLoading } from "../../shared/ui/molecules/loading";

@Component({
    selector: 'app-search-page',
    standalone: true,
    imports: [UiGameCard, UiLoading],
    templateUrl: './search.html',
    host: {
        class: 'flex flex-col h-full flex-1'
    }
})
export class Search {
    private searchController = inject(GameSearchController)
    private route = inject(ActivatedRoute)

    query = signal<string>('')
    searchGame = signal<ReturnType<GameSearchController['create']> | null>(null);

    constructor() {
        effect(() => {
            const q = this.query();

            if (!q) {
                this.searchGame.set(null);
                return;
            }

            const controller = this.searchController.create(q);
            this.searchGame.set(controller);
        });
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['q']) this.query.set(params['q'])
        })
    }
}