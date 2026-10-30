import {
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SocialApi } from '../../shared/infra/social-api';
import { ContentIntentService } from './content-intent.service';
import { AcquisitionAnalytics } from './acquisition-analytics.service';
import { ZEntryService } from '../zEntries/zEntries.service';

@Component({
  selector: 'app-content-game-cta',
  imports: [RouterLink],
  template: `
    <div class="flex flex-wrap items-center gap-3 py-3">
      <a
        [routerLink]="['/jogo', game().slug]"
        class="min-w-0 flex-1 text-blue-11 hover:underline"
        >{{ game().name }}</a
      >
      <button
        type="button"
        class="ui-secondary-btn text-sm"
        [disabled]="busy() || saved()"
        (click)="save()"
      >
        {{
          busy() ? 'Salvando…' : saved() ? 'Na sua biblioteca' : 'Quero jogar'
        }}
      </button>
    </div>
    @if (confirm()) {
      <p class="text-sm text-gray-11">
        Confirme “Quero jogar” para salvar este jogo na sua conta.
      </p>
      <button type="button" class="ui-ghost-btn text-sm" (click)="cancel()">
        Cancelar
      </button>
    }
    <p aria-live="polite" class="text-sm text-gray-11">{{ message() }}</p>
  `,
})
export class ContentGameCta implements OnDestroy {
  game = input.required<{ id: string; name: string; slug: string }>();
  contentId = input.required<string>();
  slug = input.required<string>();
  source = input<'news' | 'editorial_list'>('news');
  private auth = inject(AuthStore);
  private api = inject(SocialApi);
  private entries = inject(ZEntryService);
  private intent = inject(ContentIntentService);
  private analytics = inject(AcquisitionAnalytics);
  private router = inject(Router);
  busy = signal(false);
  saved = signal(false);
  message = signal('');
  confirm = signal(false);
  private generation = 0;

  constructor() {
    effect(() => {
      const owner = this.auth.profile()?.fingerprint;
      const game = this.game();
      untracked(() => {
        const generation = ++this.generation;
        this.saved.set(false);
        this.busy.set(false);
        this.message.set('');
        const pending = this.intent.read();
        this.confirm.set(
          !!owner &&
            pending?.gameId === game.id &&
            pending.contentId === this.contentId() &&
            pending.owner === owner,
        );
        if (owner)
          void this.entries
            .getEntry(owner, game.id)
            .then((entry) => {
              if (generation === this.generation)
                this.saved.set(!!entry?.status);
            })
            .catch(() => undefined);
      });
    });
  }
  ngOnDestroy() {
    this.generation++;
  }
  cancel() {
    this.intent.clear();
    this.confirm.set(false);
  }
  async save() {
    if (this.busy() || this.saved()) return;
    const game = this.game();
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(game.id) || !game.slug) return;
    const intent = this.intent.start({
      source: this.source(),
      contentId: this.contentId(),
      slug: this.slug(),
      gameId: game.id,
      position: this.source() === 'news' ? 'related_games' : 'list_item',
    });
    if (!intent) return;
    this.busy.set(true);
    this.analytics.emit('content_cta_click');
    await this.auth.ready;
    const owner = this.auth.profile()?.fingerprint;
    if (!owner) {
      try {
        await this.router.navigate(['/entrar']);
      } finally {
        this.busy.set(false);
      }
      return;
    }
    this.intent.bind(owner);
    if (!this.intent.read()) {
      this.busy.set(false);
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.message.set('');
    try {
      const result = await this.api.request<{ firstGameSaved?: boolean }>(
        'social/entries/ensure',
        'POST',
        { gameId: game.id, requestId: intent.requestId },
        () =>
          generation === this.generation &&
          this.auth.profile()?.fingerprint === owner &&
          this.intent.read()?.requestId === intent.requestId,
      );
      if (
        generation !== this.generation ||
        this.auth.profile()?.fingerprint !== owner
      )
        return;
      this.saved.set(true);
      this.confirm.set(false);
      this.message.set('Jogo salvo na sua biblioteca.');
      this.analytics.emit('content_action_complete');
      if (result.firstGameSaved) this.analytics.emit('first_game_saved');
      this.intent.clear();
    } catch {
      if (generation === this.generation)
        this.message.set(
          'Não foi possível confirmar o salvamento. Tente novamente.',
        );
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
}
