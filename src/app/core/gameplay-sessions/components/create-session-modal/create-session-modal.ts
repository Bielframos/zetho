import { Component, inject, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiModal } from '../../../../shared/ui/modal/modal';
import { UiInput } from '../../../../shared/ui/input/input';
import { UiToggle } from '../../../../shared/ui/toggle';
import {
  UiCombobox,
  UiComboboxOption,
  UiComboboxSearch,
} from '../../../../shared/ui/combobox/combobox';
import { GameService } from '../../../games/games.service';
import { NotificationStore } from '../../../system/notifications/notification.store';
import {
  CreateSessionDto,
  SessionPrivacy,
} from '../../gameplay-sessions.types';
import { GameplaySessionsService } from '../../gameplay-sessions.service';

@Component({
  selector: 'app-create-session-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UiModal, UiInput, UiToggle, UiCombobox],
  template: `
    <ui-modal
      [(isOpen)]="isOpen"
      title="Criar Jogatina"
      description="Escolha um jogo e defina quando a partida começa."
      actionLabel="Criar Jogatina"
      [showCloseButton]="true"
      [loading]="loading()"
      loadingIndicator="spinner"
      (submit)="onSubmit($event)"
    >
      <form class="space-y-5 py-4">
        <ui-combobox
          label="Jogo da Jogatina"
          placeholder="Busque pelo nome do jogo"
          emptyText="Nenhum jogo encontrado."
          [required]="true"
          [minQueryLength]="2"
          [search]="searchGames"
          [(selectedOptions)]="selectedGames"
        />

        <!-- Session Title -->
        <div>
          <ui-input
            label="Título da Jogatina"
            name="title"
            placeholder="Ex: Corujão de Sexta, Ranked Push, Raid Semanal..."
            [(ngModel)]="form.title"
            [required]="true"
            variant="secondary"
          />
        </div>

        <!-- Limit of Players & Date/Time -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ui-input
            label="Limite de Vagas"
            type="number"
            name="maxPlayers"
            placeholder="Ex: 4"
            [(ngModel)]="form.maxPlayers"
            [required]="true"
            variant="secondary"
          />

          <div>
            <label class="mb-1.5 block text-sm text-gray-12">
              Data e horário de início
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              [(ngModel)]="form.scheduledAt"
              [min]="minimumScheduledAt"
              class="w-full rounded-lg border border-gray-6 bg-transparent px-3 py-2 text-sm text-gray-12 outline-none focus:ring-2 focus:ring-focus-ring"
              required
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="mb-1.5 block text-sm text-gray-12">
            Descrição ou requisitos
          </label>
          <textarea
            name="description"
            rows="3"
            [(ngModel)]="form.description"
            placeholder="Requisitos, comunicação ou regras da Jogatina"
            class="w-full resize-none rounded-lg border border-gray-6 bg-transparent p-3 text-sm text-gray-12 outline-none placeholder:text-gray-10 focus:ring-2 focus:ring-focus-ring"
          ></textarea>
        </div>

        <fieldset>
          <legend class="mb-2 text-sm text-gray-12">Tags da Jogatina</legend>
          <div class="flex flex-wrap gap-2">
            @for (tag of predefinedTags; track tag) {
              <button
                type="button"
                class="ui-action-btn"
                [class.bg-blue-3]="hasTag(tag)"
                [class.text-blue-11]="hasTag(tag)"
                [attr.aria-pressed]="hasTag(tag)"
                (click)="toggleTag(tag)"
              >
                @if (hasTag(tag)) {
                  <i class="ph-fill ph-check-circle"></i>
                } @else {
                  <i class="ph ph-plus"></i>
                }
                {{ tag }}
              </button>
            }
          </div>
        </fieldset>

        <div class="border-t border-gray-6 py-4">
          <ui-toggle
            label="Jogatina privada"
            [ngModel]="form.privacy === 'closed'"
            (ngModelChange)="onPrivacyToggle($event)"
            name="privacy"
          />
          <p class="mt-2 text-xs text-gray-10">
            Somente jogadores convidados poderão participar.
          </p>
        </div>
      </form>
    </ui-modal>
  `,
})
export class CreateSessionModalComponent {
  private gameService = inject(GameService);
  private notification = inject(NotificationStore);
  private sessionsService = inject(GameplaySessionsService);

  isOpen = model<boolean>(false);
  loading = signal(false);

  created = output<CreateSessionDto>();

  selectedGames = signal<UiComboboxOption[]>([]);
  readonly minimumScheduledAt = this.toLocalDateTimeInput(new Date());

  readonly predefinedTags = [
    'Necessário microfone',
    'PVP',
    'PVE',
    'Comunicação não ofensiva',
    'Cooperativo',
    'Competitivo',
    'Casual',
    'Iniciantes bem-vindos',
  ];

  readonly searchGames: UiComboboxSearch = async (query) => {
    const response = await this.gameService.searchGame(query, { pageSize: 6 });
    return response.rows.map((game) => ({
      id: game.$id,
      label: game.name,
      description: game.releaseYear || undefined,
      imageUrl: game.coverUrl,
      imageShape: 'cover',
    }));
  };

  form = {
    title: '',
    description: '',
    maxPlayers: 4,
    privacy: 'public' as SessionPrivacy,
    scheduledAt: this.defaultScheduledAt(),
    tags: [] as string[],
  };

  hasTag(tag: string): boolean {
    return this.form.tags.includes(tag);
  }

  toggleTag(tag: string): void {
    this.form.tags = this.hasTag(tag)
      ? this.form.tags.filter((currentTag) => currentTag !== tag)
      : [...this.form.tags, tag];
  }

  onPrivacyToggle(isPrivate: boolean): void {
    this.form.privacy = isPrivate ? 'closed' : 'public';
  }

  async onSubmit({ close }: { close: () => void }): Promise<void> {
    const game = this.selectedGames()[0];
    if (!game || !this.form.title) {
      this.notification.show({
        message: 'Selecione um jogo e preencha o título da Jogatina.',
        type: 'error',
      });
      return;
    }
    const scheduledAt = new Date(this.form.scheduledAt);
    if (
      !Number.isFinite(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      this.notification.show({
        message: 'Escolha uma data e horário futuros para a Jogatina.',
        type: 'error',
      });
      return;
    }
    const maxPlayers = Number(this.form.maxPlayers);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 100) {
      this.notification.show({
        message: 'O limite de vagas deve ficar entre 2 e 100.',
        type: 'error',
      });
      return;
    }

    const dto: CreateSessionDto = {
      gameId: game.id,
      gameName: game.label,
      gameCoverUrl: game.imageUrl,
      title: this.form.title.trim(),
      description: this.form.description,
      maxPlayers,
      privacy: this.form.privacy,
      scheduledAt: scheduledAt.toISOString(),
      tags: this.form.tags,
    };

    this.loading.set(true);
    try {
      const created = await this.sessionsService.createSession(dto);
      if (created) {
        this.created.emit(dto);
        close();
        this.resetForm();
      }
    } finally {
      this.loading.set(false);
    }
  }

  private resetForm(): void {
    this.selectedGames.set([]);
    this.form = {
      title: '',
      description: '',
      maxPlayers: 4,
      privacy: 'public',
      scheduledAt: this.defaultScheduledAt(),
      tags: [],
    };
  }

  private defaultScheduledAt(): string {
    return this.toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000));
  }

  private toLocalDateTimeInput(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  }
}
