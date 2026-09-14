import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../system/seo/seo.service';
import { UiTabs, UiTab } from '../../../../shared/ui/tabs';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiZethoIcon } from '../../../../shared/ui/zetho-icon';
import { RankingService } from '../../ranking.service';
import {
  ConnectionCompletedGamesLeaderboardResponse,
  RankingTab,
  WeeklyZCoinsLeaderboardResponse,
} from '../../ranking.types';

@Component({
  selector: 'app-ranking-page',
  standalone: true,
  imports: [RouterLink, UiTabs, UiLoading, UiZethoIcon],
  templateUrl: './ranking.html',
})
export class RankingPage implements OnInit, OnDestroy {
  private rankingService = inject(RankingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  authStore = inject(AuthStore);

  readonly tabs: UiTab[] = [
    { id: 'zcoins', label: 'Z-Coins' },
    { id: 'connections', label: 'Jogos Zerados' },
  ];

  activeTab = signal<RankingTab>('zcoins');

  weeklyBoard = signal<WeeklyZCoinsLeaderboardResponse | null>(null);
  loadingZCoins = signal(false);
  errorZCoins = signal<string | null>(null);

  connectionsBoard =
    signal<ConnectionCompletedGamesLeaderboardResponse | null>(null);
  loadingConnections = signal(false);
  errorConnections = signal<string | null>(null);

  isLoggedIn = computed(() => Boolean(this.authStore.user()));

  constructor() {
    this.seo.apply({
      title: 'Rankings da Comunidade | Zetho',
      description:
        'Acompanhe o ranking semanal de Z-Coins e descubra quem mais zerou jogos entre suas conexões no Zetho.',
      canonical: '/ranking',
      robots: 'index,follow',
      ogType: 'website',
    });
  }

  async ngOnInit() {
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'connections' || tabParam === 'zcoins') {
      this.activeTab.set(tabParam);
    }

    if (this.activeTab() === 'connections') {
      await this.loadConnectionsLeaderboard();
    } else {
      await this.loadWeeklyZCoins();
    }
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('zetho-ranking');
  }

  async onTabChange(tabId: string) {
    const tab = tabId as RankingTab;
    if (this.activeTab() === tab) {
      return;
    }

    this.activeTab.set(tab);

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (tab === 'zcoins' && !this.weeklyBoard()) {
      await this.loadWeeklyZCoins();
    } else if (tab === 'connections' && !this.connectionsBoard() && this.isLoggedIn()) {
      await this.loadConnectionsLeaderboard();
    }
  }

  async loadWeeklyZCoins() {
    try {
      this.loadingZCoins.set(true);
      this.errorZCoins.set(null);
      const data = await this.rankingService.getWeeklyZCoins(30);
      this.weeklyBoard.set(data);
    } catch (error) {
      console.error('Erro ao carregar ranking de Z-Coins', error);
      this.errorZCoins.set('Não foi possível carregar o placar semanal agora.');
    } finally {
      this.loadingZCoins.set(false);
    }
  }

  async loadConnectionsLeaderboard() {
    if (!this.isLoggedIn()) {
      return;
    }

    try {
      this.loadingConnections.set(true);
      this.errorConnections.set(null);
      const data = await this.rankingService.getConnectionsCompletedGames(50);
      this.connectionsBoard.set(data);
    } catch (error) {
      console.error('Erro ao carregar ranking de conexões', error);
      this.errorConnections.set(
        'Não foi possível carregar o ranking das suas conexões agora.',
      );
    } finally {
      this.loadingConnections.set(false);
    }
  }

  isCurrentUser(userId: string): boolean {
    return this.authStore.profile()?.userId === userId;
  }

  profileUrl(gamertag: string | null): string {
    return gamertag ? `/player/${encodeURIComponent(gamertag)}` : '/dashboard';
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Atualização recente';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  get resetsInString(): string {
    const resetsIn = this.weeklyBoard()?.resetsIn;

    if (!resetsIn) {
      return 'Em breve';
    }

    const now = new Date();
    const resetDate = new Date(resetsIn);
    const diffInMs = resetDate.getTime() - now.getTime();

    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 24) {
      return `Reseta em ${Math.max(0, diffInHours)}h`;
    }

    return `Reseta em ${diffInDays} dia${diffInDays > 1 ? 's' : ''} e ${diffInHours % 24}h`;
  }
}
