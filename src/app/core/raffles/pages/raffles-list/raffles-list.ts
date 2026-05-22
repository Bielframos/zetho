import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RafflesService } from '../../raffles.service';
import { RaffleItem } from '../../raffle.types';
import { SeoService } from '../../../seo/seo.service';

@Component({
  selector: 'app-raffles-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './raffles-list.html',
})
export class RafflesListPage {
  private rafflesService = inject(RafflesService);
  private seo = inject(SeoService);

  activeTab = signal<'active' | 'ended'>('active');

  activeRaffles = signal<RaffleItem[]>([]);
  endedRaffles = signal<RaffleItem[]>([]);

  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.seo.apply({
      title: 'Sorteios | Zetho',
      description:
        'Participe dos sorteios de jogos e ganhe chaves na plataforma Zetho.',
      canonical: '/sorteios',
      robots: 'index,follow',
      ogType: 'website',
    });
  }

  async ngOnInit() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const [activeRes, endedRes] = await Promise.all([
        this.rafflesService.listRaffles({ active: true, limit: 50 }),
        this.rafflesService.listRaffles({ active: false, limit: 50 }),
      ]);

      this.activeRaffles.set(activeRes.raffles);
      this.endedRaffles.set(endedRes.raffles);
    } catch {
      this.error.set('Não foi possível carregar os sorteios agora.');
    } finally {
      this.loading.set(false);
    }
  }

  selectTab(tab: 'active' | 'ended') {
    this.activeTab.set(tab);
  }

  gameName(raffle: RaffleItem): string {
    if (typeof raffle.game === 'object' && raffle.game !== null) {
      return raffle.game.name;
    }
    return raffle.game as string;
  }

  gameCover(raffle: RaffleItem): string | null {
    if (typeof raffle.game === 'object' && raffle.game !== null) {
      return raffle.game.coverUrl;
    }
    return null;
  }

  policyLabel(policy: string): string {
    return policy === 'first-come' ? 'Primeiro a chegar' : 'Sorteio aleatório';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  navigateToDetail(raffle: RaffleItem) {
    this.rafflesService.currentRaffle.set(raffle);
  }
}
