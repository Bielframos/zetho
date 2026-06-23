import {
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { NotificationStore } from '../../../notifications/notification.store';
import { UiLoading } from '../../../../shared/ui/loading';
import type { InviteBonusResponse } from '../../../userProfiles/userProfile.types';
import {
  BuyTicketsResponse,
  RaffleEntry,
  RaffleItem,
} from '../../raffle.types';
import { RafflesService } from '../../raffles.service';

@Component({
  selector: 'app-raffle-detail-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, UiLoading],
  templateUrl: './raffle-detail.html',
})
export class RaffleDetailPage {
  private rafflesService = inject(RafflesService);
  private notification = inject(NotificationStore);
  private route = inject(ActivatedRoute);
  authStore = inject(AuthStore);

  raffleId = toSignal(this.route.paramMap.pipe(map((p) => p.get('raffleId'))), {
    initialValue: null,
  });

  raffle = signal<RaffleItem | null>(null);
  entries = signal<RaffleEntry[]>([]);

  loading = signal(true);
  loadError = signal<string | null>(null);

  buyLoading = signal(false);

  drawResult = signal<BuyTicketsResponse | null>(null);
  revealStep = signal(0);
  revealedNumbers = signal<number[]>([]);
  expandedEntryId = signal<string | null>(null);
  userBonus = signal<InviteBonusResponse | null>(null);
  inviteCopied = signal(false);
  generateInviteLoading = signal(false);

  private revealDialog =
    viewChild<ElementRef<HTMLDialogElement>>('revealDialog');

  ticketCountControl = new FormControl<number>(1, {
    validators: [Validators.required, Validators.min(1), Validators.max(10)],
  });

  ticketCount = toSignal(
    this.ticketCountControl.valueChanges.pipe(startWith(1)),
    { initialValue: 1 },
  );

  constructor() {
    effect(() => {
      const id = this.raffleId();
      if (id) void this.loadPage(id);
    });

    effect(() => {
      const step = this.revealStep();
      const dialog = this.revealDialog()?.nativeElement;
      if (!dialog) return;
      if (step > 0 && !dialog.open) {
        dialog.showModal();
      } else if (step === 0 && dialog.open) {
        dialog.close();
      }
    });
  }

  private async loadPage(raffleId: string) {
    try {
      this.loading.set(true);
      this.loadError.set(null);

      await this.rafflesService.loadRaffleById(raffleId);
      this.raffle.set(this.rafflesService.currentRaffle());

      if (this.authStore.isAuthenticated()) {
        const entriesRes = await this.rafflesService.getEntries(raffleId);
        this.entries.set(entriesRes.entries);

        void this.authStore
          .getInviteBonus()
          .then((b) => this.userBonus.set(b))
          .catch(() => {});
      }
    } catch {
      this.loadError.set('Não foi possível carregar os dados do sorteio.');
    } finally {
      this.loading.set(false);
    }
  }

  incrementTickets() {
    const current = this.ticketCountControl.value ?? 1;
    if (current < 10) this.ticketCountControl.setValue(current + 1);
  }

  decrementTickets() {
    const current = this.ticketCountControl.value ?? 1;
    if (current > 1) this.ticketCountControl.setValue(current - 1);
  }

  winChance(): string {
    const prob = this.raffle()?.basicProbability;
    const count = this.ticketCount() ?? 1;
    if (!prob || count < 1) return '—';
    const pct = (count / prob) * 100;
    const formatted = pct.toFixed(1);
    return `${formatted}%`;
  }

  async buyTickets() {
    const raffleId = this.raffleId();
    if (!raffleId) return;

    if (!this.authStore.isAuthenticated()) {
      this.notification.show({
        message: 'Entre na sua conta para participar do sorteio.',
        type: 'info',
      });
      return;
    }

    this.ticketCountControl.markAsTouched();
    if (this.ticketCountControl.invalid || this.buyLoading()) return;

    const count = this.ticketCount() ?? 1;
    const ticketPrice = this.raffle()?.ticketPrice ?? 0;
    const bonusPercent = this.userBonus()?.bonusPercent ?? 0;
    const estimatedCost = Math.floor(
      count * ticketPrice * (1 - bonusPercent / 100),
    );

    // Optimistic balance deduction
    this.authStore.adjustZcoinBalance(-estimatedCost);

    try {
      this.buyLoading.set(true);

      const result = await this.rafflesService.buyTickets(raffleId, count);

      // Reconcile with actual server balance
      this.authStore.setZcoinBalance(result.newBalance);

      this.drawResult.set(result);
      void this.runRevealSequence(result);

      const entriesRes = await this.rafflesService.getEntries(raffleId);
      this.entries.set(entriesRes.entries);
      this.ticketCountControl.setValue(1);
    } catch (e: any) {
      // Revert optimistic deduction
      this.authStore.adjustZcoinBalance(estimatedCost);
      this.notification.show({
        message: e?.message ?? 'Erro ao comprar tickets.',
        type: 'error',
      });
    } finally {
      this.buyLoading.set(false);
    }
  }

  onDialogCancel(event: Event) {
    event.preventDefault();
    if (this.revealStep() >= 4) {
      this.closeReveal();
    }
  }

  discountedTotal(): number {
    const base = (this.ticketCount() ?? 1) * (this.raffle()?.ticketPrice ?? 0);
    const bonus = this.userBonus()?.bonusPercent ?? 0;
    return Math.floor(base * (1 - bonus / 100));
  }

  async copyInviteCode() {
    const code = this.authStore.profile()?.inviteCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.inviteCopied.set(true);
      setTimeout(() => this.inviteCopied.set(false), 2000);
    } catch {
      this.notification.show({
        message: 'Não foi possível copiar o código.',
        type: 'error',
      });
    }
  }

  async generateInviteCode() {
    this.generateInviteLoading.set(true);
    try {
      await this.authStore.generateInviteCode();
    } catch {
      this.notification.show({
        message: 'Erro ao gerar código de convite.',
        type: 'error',
      });
    } finally {
      this.generateInviteLoading.set(false);
    }
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

  closeReveal() {
    this.revealStep.set(0);
    this.drawResult.set(null);
    this.revealedNumbers.set([]);
  }

  toggleEntry(id: string) {
    this.expandedEntryId.update((curr) => (curr === id ? null : id));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async runRevealSequence(result: BuyTicketsResponse) {
    this.revealedNumbers.set([]);
    this.revealStep.set(1);

    await this.delay(800);
    this.revealStep.set(2);

    for (const num of result.luckyNumbers) {
      await this.delay(450);
      this.revealedNumbers.update((ns) => [...ns, num]);
    }

    await this.delay(700);
    this.revealStep.set(3);

    await this.delay(1200);
    this.revealStep.set(4);
  }

  gameName(): string {
    const r = this.raffle();
    if (!r) return '';
    if (typeof r.game === 'object' && r.game !== null) return r.game.name;
    return r.game as string;
  }

  gameCover(): string | null {
    const r = this.raffle();
    if (!r) return null;
    if (typeof r.game === 'object' && r.game !== null) return r.game.coverUrl;
    return null;
  }

  gameSlug(): string | null {
    const r = this.raffle();
    if (!r) return null;
    if (typeof r.game === 'object' && r.game !== null) return r.game.slug;
    return null;
  }

  policyLabel(): string {
    return this.raffle()?.rewardPolicy === 'first-come'
      ? 'Primeiro a chegar'
      : 'Sorteio aleatório';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
