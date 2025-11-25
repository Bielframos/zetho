import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { distinctUntilChanged, filter, map } from "rxjs";
import { UserStore } from "../../core/auth/user.store";
import { GameRow, ZEntryRow } from "../../core/types";
import { ZereiService } from "../../core/zerei/zerei.service";
import { UiGameCard } from "../../shared/ui/atoms/game-card/game-card";
import { UiLoading } from "../../shared/ui/molecules/loading";
import { Meta } from "@angular/platform-browser";

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
export class Home implements OnInit {
    private meta = inject(Meta)
    private route = inject(ActivatedRoute)
    private zerei = inject(ZereiService)
    private initialTab = (this.route.snapshot.queryParams['t'] as Exclude<ZEntryRow['status'], null | undefined>) ?? 'completed'
    userStore = inject(UserStore)

    myStats = signal<Awaited<ReturnType<ZereiService['getMyStats']>>>(null)
    pageState = signal(this.zerei.createHomePageState())
    currentTab = signal<Exclude<ZEntryRow['status'], null | undefined>>(this.initialTab)

    // Estatísticas da plataforma para usuários não logados
    platformStats = signal<Awaited<ReturnType<ZereiService['getPlatformStats']>>>(null)
    trendingGames = signal<GameRow[]>([])

    // Guias do dashboard
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

    constructor() {
        effect(() => {
            if (!this.userStore.isAuthenticated()) {
                this.zerei.getPlatformStats().then(v => this.platformStats.set(v))
                this.zerei.getTrendingGames().then(v => this.trendingGames.set(v))
            }
        });
    }

    async ngOnInit() {
        // Metadados
        const description = 'A melhor forma de registrar e acompanhar os jogos que você zerou.';
        const image = 'https://api.zereiapp.com/v1/storage/buckets/zerei-medias/files/zerei-placeholder-img/view?project=690a16460002c718253a&mode=admin';
        const url = 'https://www.zereiapp.com';

        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'keywords', content: 'jogos, zerei, games' });

        this.meta.updateTag({ property: 'og:title', content: 'Zerei App' });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:image', content: image });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:type', content: 'website' });

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
