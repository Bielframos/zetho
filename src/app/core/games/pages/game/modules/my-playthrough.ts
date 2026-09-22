import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../auth/auth.store';
import { GameController } from '../../../game.controller';
import { ZEntryService } from '../../../../zEntries/zEntries.service';

@Component({
  selector: 'ui-my-playthrough',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="p-4 space-y-5">
      <h2 class="text-xl text-gray-12">Minha jogatina</h2>
      @if (!auth.isAuthenticated()) {
        <p class="text-gray-11">Entre para registrar sua jogatina.</p>
        <a routerLink="/entrar" class="ui-primary-btn">Entrar</a>
      } @else if (controller.loading() || !controller.game()) {
        <p class="text-gray-11">Carregando sua jogatina...</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          <fieldset class="sm:col-span-2">
            <legend class="mb-2 text-sm text-gray-11">Plataforma</legend>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              @for (item of platforms; track item.value) {
                <button
                  type="button"
                  class="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm focus:ring-2 focus:ring-blue-6"
                  [class.border-blue-9]="platform() === item.value"
                  [class.bg-blue-9/15]="platform() === item.value"
                  [class.border-gray-6]="platform() !== item.value"
                  [attr.aria-pressed]="platform() === item.value"
                  (click)="
                    platform.set(platform() === item.value ? '' : item.value)
                  "
                >
                  <i
                    class="ph-fill {{ item.icon }} text-lg"
                    aria-hidden="true"
                  ></i>
                  <span>{{ item.value }}</span>
                </button>
              }
            </div>
            <p class="mt-1 text-xs text-gray-11">
              Toque novamente para remover a plataforma.
            </p>
          </fieldset>
          <label class="grid gap-2 text-sm text-gray-11"
            >Tipo de conclusão
            <select
              class="rounded-lg border border-gray-6 bg-gray-2 p-2 text-gray-12 focus:ring-2 focus:ring-blue-6"
              [disabled]="controller.zEntry()?.status !== 'completed'"
              [value]="completion()"
              (change)="completion.set($any($event.target).value)"
            >
              <option value="">Não informado</option>
              @for (item of completions; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
          <label class="grid gap-2 text-sm text-gray-11"
            >Horas jogadas
            <input
              class="rounded-lg border border-gray-6 bg-gray-2 p-2 text-gray-12 focus:ring-2 focus:ring-blue-6"
              type="number"
              min="0"
              max="35791394"
              step="0.01"
              placeholder="Ex.: 12,5"
              [value]="hours()"
              (input)="hours.set($any($event.target).value)"
            />
          </label>
        </div>
        @if (
          !controller.zEntry()?.status ||
          controller.zEntry()?.status === 'wishlist'
        ) {
          <p class="text-sm text-gray-11">
            Escolha primeiro um status de jogatina acima para salvar estes
            detalhes.
          </p>
        } @else if (controller.zEntry()?.status !== 'completed') {
          <p class="text-sm text-gray-11">
            O tipo de conclusão fica disponível após marcar o jogo como zerado.
            As horas só entram na média comunitária nesse status.
          </p>
        }
        @if (error()) {
          <p
            role="alert"
            class="rounded-lg border border-red-6 bg-red-3/30 p-3 text-sm text-red-11"
          >
            {{ error() }}
          </p>
        }
        @if (success()) {
          <p role="status" class="text-sm text-green-11">Jogatina salva.</p>
        }
        <button
          class="ui-primary-btn"
          [disabled]="
            saving() ||
            controller.updating() ||
            !controller.zEntry()?.status ||
            controller.zEntry()?.status === 'wishlist'
          "
          (click)="save()"
        >
          {{ saving() ? 'Salvando...' : 'Salvar jogatina' }}
        </button>
      }
    </section>
  `,
})
export class UiMyPlaythrough {
  auth = inject(AuthStore);
  controller = inject(GameController);
  private entries = inject(ZEntryService);
  saving = signal(false);
  error = signal('');
  success = signal(false);
  platform = signal('');
  completion = signal('');
  hours = signal('');
  platforms = [
    { value: 'PC/Steam', icon: 'ph-steam-logo' },
    { value: 'PS5', icon: 'ph-game-controller' },
    { value: 'Xbox Series', icon: 'ph-joystick' },
    { value: 'Nintendo Switch', icon: 'ph-device-tablet' },
    { value: 'Retro/Emulador', icon: 'ph-cpu' },
    { value: 'Mobile', icon: 'ph-device-mobile' },
  ];
  completions = [
    'Campanha Principal',
    'História + Extras',
    '100%/Platina/Mestre',
  ];

  constructor() {
    effect(() => {
      const entry = this.controller.zEntry();
      untracked(() => {
        this.platform.set(entry?.playedPlatform ?? '');
        this.completion.set(entry?.completionType ?? '');
        this.hours.set(
          entry?.playtimeMinutes == null
            ? ''
            : String(entry.playtimeMinutes / 60),
        );
      });
    });
  }

  async save() {
    const game = this.controller.game();
    const profile = this.auth.profile();
    if (
      !game ||
      !profile ||
      this.saving() ||
      this.controller.updating() ||
      !this.controller.zEntry()?.status ||
      this.controller.zEntry()?.status === 'wishlist'
    )
      return;
    const raw = this.hours().trim().replace(',', '.');
    const parsed = raw === '' ? null : Number(raw);
    const minutes = parsed == null ? null : Math.round(parsed * 60);
    if (
      parsed != null &&
      (!Number.isFinite(parsed) ||
        parsed < 0 ||
        !Number.isSafeInteger(minutes) ||
        minutes! > 2147483647)
    ) {
      this.error.set('Informe um número válido de horas.');
      return;
    }
    if (
      this.platform() &&
      !this.platforms.some((item) => item.value === this.platform())
    ) {
      this.error.set('Selecione uma plataforma válida.');
      return;
    }
    if (this.completion() && !this.completions.includes(this.completion())) {
      this.error.set('Selecione um tipo de conclusão válido.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set(false);
    try {
      await this.entries.createEntryLog(
        profile.fingerprint,
        game.$id,
        this.controller.zEntry(),
        {
          playedPlatform: this.platform() || null,
          completionType:
            this.controller.zEntry()?.status === 'completed'
              ? this.completion() || null
              : null,
          playtimeMinutes: minutes,
        },
      );
      const current = this.controller.zEntry();
      if (current)
        this.controller.zEntry.set({
          ...current,
          playedPlatform: this.platform() || null,
          completionType:
            current.status === 'completed' ? this.completion() || null : null,
          playtimeMinutes: minutes,
        });
      this.success.set(true);
    } catch {
      this.error.set('Não foi possível salvar sua jogatina. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
