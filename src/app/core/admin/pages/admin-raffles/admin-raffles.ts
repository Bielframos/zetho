import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiLoading } from '../../../../shared/ui/loading';
import { AdminService } from '../../admin.service';
import { AdminApiError, AdminRaffleResponse } from '../../admin.types';

type RaffleFormMode = 'none' | 'simple' | 'with-keys';

interface ParsedKey {
  key: string;
  platform: string;
}

@Component({
  selector: 'app-admin-raffles-page',
  standalone: true,
  imports: [ReactiveFormsModule, UiInput, UiLoading],
  templateUrl: './admin-raffles.html',
})
export class AdminRafflesPage {
  private adminService = inject(AdminService);

  // --- Create raffle form ---
  createMode = signal<RaffleFormMode>('none');
  createLoading = signal(false);
  createResult = signal<AdminRaffleResponse | null>(null);
  createError = signal<string | null>(null);

  raffleForm = new FormGroup({
    gameId: new FormControl('', { validators: [Validators.required] }),
    rewardPolicy: new FormControl<'one_key' | 'all_keys'>('one_key', {
      validators: [Validators.required],
    }),
    basicProbability: new FormControl<number | null>(null),
    ticketPrice: new FormControl<number | null>(null),
    keysText: new FormControl(''),
  });

  // --- Raffles list ---
  raffles = signal<AdminRaffleResponse[]>([]);
  listLoading = signal(false);
  listError = signal<string | null>(null);

  // --- Activate ---
  activatingId = signal<string | null>(null);
  activateError = signal<string | null>(null);

  // --- Add keys ---
  addKeysOpenId = signal<string | null>(null);
  addKeysText = signal('');
  addKeysLoading = signal(false);
  addKeysError = signal<string | null>(null);
  addKeysResult = signal<string | null>(null);

  constructor() {
    void this.loadRaffles();
  }

  async loadRaffles() {
    try {
      this.listLoading.set(true);
      this.listError.set(null);
      const res = await this.adminService.listRaffles({ limit: 50 });
      this.raffles.set(res.raffles);
    } catch (e) {
      const err = e as AdminApiError;
      this.listError.set(err.message ?? 'Erro ao carregar sorteios.');
    } finally {
      this.listLoading.set(false);
    }
  }

  setCreateMode(mode: RaffleFormMode) {
    this.createMode.set(mode);
    this.createResult.set(null);
    this.createError.set(null);
    this.raffleForm.reset({ rewardPolicy: 'one_key' });
  }

  private parseKeys(text: string): ParsedKey[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const commaIdx = line.indexOf(',');
        if (commaIdx === -1) return { key: line, platform: 'other' };
        return {
          key: line.slice(0, commaIdx).trim(),
          platform: line.slice(commaIdx + 1).trim() || 'other',
        };
      })
      .filter((k) => k.key.length > 0);
  }

  async submitCreate() {
    this.raffleForm.markAllAsTouched();
    this.createResult.set(null);
    this.createError.set(null);

    if (this.raffleForm.invalid || this.createLoading()) return;

    const { gameId, rewardPolicy, basicProbability, ticketPrice, keysText } =
      this.raffleForm.value;

    const body = {
      gameId: gameId!,
      rewardPolicy: rewardPolicy!,
      ...(basicProbability != null ? { basicProbability } : {}),
      ...(ticketPrice != null ? { ticketPrice } : {}),
    };

    try {
      this.createLoading.set(true);
      let result: AdminRaffleResponse;

      if (this.createMode() === 'with-keys') {
        const keys = this.parseKeys(keysText ?? '');
        result = await this.adminService.createRaffleWithKeys({
          ...body,
          keys,
        });
      } else {
        result = await this.adminService.createRaffle(body);
      }

      this.createResult.set(result);
      this.raffleForm.reset({ rewardPolicy: 'one_key' });
      await this.loadRaffles();
    } catch (e) {
      const err = e as AdminApiError;
      this.createError.set(err.message ?? 'Erro ao criar sorteio.');
    } finally {
      this.createLoading.set(false);
    }
  }

  async activateRaffle(raffleId: string) {
    try {
      this.activatingId.set(raffleId);
      this.activateError.set(null);
      await this.adminService.activateRaffle(raffleId);
      await this.loadRaffles();
    } catch (e) {
      const err = e as AdminApiError;
      this.activateError.set(err.message ?? 'Erro ao ativar sorteio.');
    } finally {
      this.activatingId.set(null);
    }
  }

  toggleAddKeys(raffleId: string) {
    const current = this.addKeysOpenId();
    this.addKeysOpenId.set(current === raffleId ? null : raffleId);
    this.addKeysText.set('');
    this.addKeysError.set(null);
    this.addKeysResult.set(null);
  }

  async submitAddKeys(raffleId: string) {
    const keys = this.parseKeys(this.addKeysText());
    if (keys.length === 0 || this.addKeysLoading()) return;

    try {
      this.addKeysLoading.set(true);
      this.addKeysError.set(null);
      const res = await this.adminService.addKeysToRaffle(raffleId, keys);
      this.addKeysResult.set(`${res.added} chave(s) adicionada(s).`);
      this.addKeysText.set('');
      await this.loadRaffles();
    } catch (e) {
      const err = e as AdminApiError;
      this.addKeysError.set(err.message ?? 'Erro ao adicionar chaves.');
    } finally {
      this.addKeysLoading.set(false);
    }
  }

  policyLabel(policy: string): string {
    return policy === 'one_key' ? 'Primeiro a chegar' : 'Até esgotar chaves';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
      new Date(value),
    );
  }
}
