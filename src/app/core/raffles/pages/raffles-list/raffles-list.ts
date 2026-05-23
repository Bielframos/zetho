import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/auth.store';
import { NotificationStore } from '../../../notifications/notification.store';
import { RafflesService } from '../../raffles.service';
import { RaffleItem, RaffleMyKey } from '../../raffle.types';
import { SeoService } from '../../../seo/seo.service';

@Component({
  selector: 'app-raffles-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './raffles-list.html',
})
export class RafflesListPage {
  private rafflesService = inject(RafflesService);
  private notification = inject(NotificationStore);
  authStore = inject(AuthStore);
  private seo = inject(SeoService);

  activeTab = signal<'active' | 'ended' | 'my-keys'>('active');

  activeRaffles = signal<RaffleItem[]>([]);
  endedRaffles = signal<RaffleItem[]>([]);
  myKeys = signal<RaffleMyKey[]>([]);
  myKeysLoading = signal(false);
  myKeysLoaded = signal(false);
  myKeysError = signal<string | null>(null);

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

  selectTab(tab: 'active' | 'ended' | 'my-keys') {
    this.activeTab.set(tab);
    if (tab === 'my-keys' && this.authStore.isAuthenticated()) {
      void this.loadMyKeys();
    }
  }

  private async loadMyKeys() {
    if (this.myKeysLoading() || this.myKeysLoaded()) return;

    this.myKeysLoading.set(true);
    this.myKeysError.set(null);

    try {
      const response = await this.rafflesService.getMyKeys();
      this.myKeys.set(response.keys);
      this.myKeysLoaded.set(true);
    } catch {
      this.myKeysError.set('Não foi possível carregar suas chaves agora.');
    } finally {
      this.myKeysLoading.set(false);
    }
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

  raffleLabel(raffleId: string): string {
    const raffle = [...this.activeRaffles(), ...this.endedRaffles()].find(
      (item) => item.$id === raffleId,
    );
    return raffle ? this.gameName(raffle) : raffleId;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  }

  navigateToDetail(raffle: RaffleItem) {
    this.rafflesService.currentRaffle.set(raffle);
  }

  async copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      this.notification.show({
        message: 'Chave copiada para a área de transferência.',
        type: 'success',
      });
    } catch {
      this.notification.show({
        message: 'Não foi possível copiar a chave.',
        type: 'error',
      });
    }
  }
}
