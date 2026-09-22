import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  PlatformsRepository,
  platformLogo,
} from '../../../../zEntries/platforms.repository';
import { UiSelect, UiSelectOption } from '../../../../../shared/ui/select';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../auth/auth.store';
import { GameController } from '../../../game.controller';
import { ZEntryService } from '../../../../zEntries/zEntries.service';

@Component({
  selector: 'ui-my-playthrough',
  standalone: true,
  imports: [RouterLink, UiSelect],
  styles: [
    `
      .playtime-input {
        appearance: textfield;
        -moz-appearance: textfield;
      }
      .playtime-input::-webkit-inner-spin-button,
      .playtime-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `,
  ],
  template: `
    <section class="p-4 space-y-5">
      @if (!auth.isAuthenticated()) {
        <p class="text-gray-11">Entre para registrar sua jogatina.</p>
        <a routerLink="/entrar" class="ui-primary-btn">Entrar</a>
      } @else if (controller.loading() || !controller.game()) {
        <p class="text-gray-11">Carregando sua jogatina...</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <ui-select
              label="Plataforma"
              [options]="platformOptions()"
              [searchable]="true"
              [disabled]="platformsLoading() || !!platformsError()"
              [(value)]="platform"
            />
            @if (platformsLoading()) {
              <p class="mt-2 text-xs text-gray-11">Carregando plataformas…</p>
            }
            @if (platformsError()) {
              <p role="alert" class="mt-2 text-sm text-red-11">
                {{ platformsError() }}
              </p>
              <button
                type="button"
                class="ui-ghost-btn"
                (click)="loadPlatforms()"
              >
                Tentar novamente
              </button>
            }
          </div>
          <ui-select
            label="Tipo de conclusão"
            [options]="completionOptions"
            [disabled]="controller.zEntry()?.status !== 'completed'"
            [(value)]="completion"
          />
          <label class="grid gap-2 text-sm text-gray-11"
            >Horas jogadas
            <input
              class="playtime-input min-h-12 w-full rounded-lg border border-gray-6 bg-gray-2 px-3 py-2 text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-6"
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
        <div class="flex justify-end">
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
        </div>
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
  private readonly platformsRepository = inject(PlatformsRepository);
  readonly platforms = signal<UiSelectOption[]>([]);
  readonly platformsLoading = signal(true);
  readonly platformsError = signal('');
  private readonly legacyPlatform = signal('');
  readonly platformOptions = computed<UiSelectOption[]>(() => {
    const options: UiSelectOption[] = [
      { value: '', label: 'Não informado' },
      ...this.platforms(),
    ];
    const legacy = this.legacyPlatform();
    if (legacy)
      options.push({
        value: 'legacy:' + legacy,
        label: legacy,
        logo: platformLogo(legacy),
      });
    const savedId = this.controller.zEntry()?.playedPlatformId;
    if (savedId && !options.some((option) => option.value === savedId))
      options.push({ value: savedId, label: 'Plataforma indisponível' });
    return options;
  });
  async loadPlatforms() {
    this.platformsLoading.set(true);
    this.platformsError.set('');
    try {
      this.platforms.set(await this.platformsRepository.list());
    } catch {
      this.platformsError.set('Não foi possível carregar as plataformas.');
    } finally {
      this.platformsLoading.set(false);
    }
  }
  completions = [
    'Campanha Principal',
    'História + Extras',
    '100%/Platina/Mestre',
  ];

  readonly completionOptions = [
    { value: '', label: 'Não informado', icon: 'ph-minus-circle' },
    {
      value: 'Campanha Principal',
      label: 'Campanha principal',
      icon: 'ph-flag-checkered',
    },
    {
      value: 'História + Extras',
      label: 'História + extras',
      icon: 'ph-medal',
    },
    {
      value: '100%/Platina/Mestre',
      label: '100% / Platina / Mestre',
      icon: 'ph-trophy',
    },
  ];

  constructor() {
    void this.loadPlatforms();
    effect(() => {
      const entry = this.controller.zEntry();
      untracked(() => {
        this.legacyPlatform.set(entry?.playedPlatform ?? '');
        this.platform.set(
          entry?.playedPlatformId ??
            (entry?.playedPlatform ? 'legacy:' + entry.playedPlatform : ''),
        );
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
      !this.platformOptions().some((item) => item.value === this.platform())
    ) {
      this.error.set('Selecione uma plataforma válida.');
      return;
    }
    if (this.completion() && !this.completions.includes(this.completion())) {
      this.error.set('Selecione um tipo de conclusão válido.');
      return;
    }
    const platformChanged =
      this.platform() !==
      (this.controller.zEntry()?.playedPlatformId ??
        (this.controller.zEntry()?.playedPlatform
          ? 'legacy:' + this.controller.zEntry()!.playedPlatform
          : ''));
    const platformUpdate = !platformChanged
      ? {}
      : this.platform().startsWith('legacy:')
        ? { playedPlatform: this.platform().slice(7), playedPlatformId: null }
        : { playedPlatformId: this.platform() || null, playedPlatform: null };
    this.saving.set(true);
    this.error.set('');
    this.success.set(false);
    try {
      await this.entries.createEntryLog(
        profile.fingerprint,
        game.$id,
        this.controller.zEntry(),
        {
          ...platformUpdate,
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
          ...platformUpdate,
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
