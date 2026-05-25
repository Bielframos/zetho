import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../seo/seo.service';
import { WeeklyZCoinLeaderboardResponse } from '../../../zCoins/zcoins.types';
import { ZCoinsService } from '../../../zCoins/zcoins.service';

@Component({
  selector: 'app-weekly-zcoin-leaderboard',
  standalone: true,
  templateUrl: './weekly-leaderboard.html',
})
export class WeeklyLeaderboardPage {
  private zCoinsService = inject(ZCoinsService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  authStore = inject(AuthStore);

  leaderboard = signal<WeeklyZCoinLeaderboardResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.seo.apply({
      title: 'Placar semanal de Z-Coins | Zetho',
      description: 'Veja quem mais acumulou Z-Coins na última semana no Zetho.',
      canonical: '/zcoins/leaderboard/weekly',
      robots: 'index,follow',
      ogType: 'website',
    });
  }

  async ngOnInit() {
    const rawLimit = Number.parseInt(
      this.route.snapshot.queryParamMap.get('limit') ?? '20',
      10,
    );

    try {
      this.loading.set(true);
      this.error.set(null);
      this.leaderboard.set(
        await this.zCoinsService.getWeeklyLeaderboard(rawLimit),
      );
    } catch (error) {
      console.error(error);
      this.error.set('Não foi possível carregar o placar semanal agora.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('zcoins-weekly-leaderboard');
  }

  isCurrentUser(userId: string) {
    return this.authStore.profile()?.userId === userId;
  }

  profileUrl(gamertag: string | null) {
    return gamertag ? `/player/${encodeURIComponent(gamertag)}` : '/dashboard';
  }

  formatDate(value: string | null) {
    if (!value) {
      return 'Atualização recente';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  get resetsInString() {
    const resetsIn = this.leaderboard()?.resetsIn;

    if (!resetsIn) {
      return 'Em breve';
    }

    const now = new Date();
    const resetDate = new Date(resetsIn);
    const diffInMs = resetDate.getTime() - now.getTime();

    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 24) {
      return `Reseta em ${diffInHours}h`;
    }

    return `Reseta em ${diffInDays} dia${diffInDays > 1 ? 's' : ''} e ${diffInHours % 24}h`;
  }
}
