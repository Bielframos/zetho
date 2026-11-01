import { environment } from '../../../environments/environment';
import {
  Component,
  Injectable,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { SocialApi } from '../infra/social-api';

@Injectable({ providedIn: 'root' })
export class FounderDirectory {
  private readonly api = inject(SocialApi);
  readonly numbers = signal<ReadonlyMap<string, number>>(new Map());
  private pending: Promise<void> | null = null;
  private refreshedAt = 0;
  private generation = 0;
  invalidate() {
    this.generation++;
    this.refreshedAt = 0;
    this.pending = null;
    this.numbers.set(new Map());
  }
  load(): Promise<void> {
    if (this.pending) return this.pending;
    if (Date.now() - this.refreshedAt < 60_000) return Promise.resolve();
    const generation = this.generation;
    this.pending = this.api
      .requestPublic<{ gamertag: string; number: number }[]>(
        'achievements/founders',
      )
      .then((rows) => {
        if (generation !== this.generation) return;
        this.numbers.set(
          new Map(rows.map((row) => [row.gamertag, row.number])),
        );
        this.refreshedAt = Date.now();
      })
      .catch(() => {
        /* Keep identities usable while the directory is unavailable. */
      })
      .finally(() => {
        if (generation === this.generation) this.pending = null;
      });
    return this.pending;
  }
}

@Component({
  selector: 'ui-founder-badge',
  standalone: true,
  host: {
    class: 'inline-flex max-w-full align-middle',
    '[style.display]': "number() === undefined ? 'none' : 'inline-flex'",
  },
  template: `@if (number() !== undefined) {
    <span
      class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-normal tabular-nums text-gray-11"
      [attr.aria-label]="label()"
      [title]="label()"
    >
      @if (!imageFailed()) {
        <img [src]="imageUrl" alt="" width="20" height="20" loading="lazy"
          class="h-5 w-5 shrink-0 object-contain" (error)="imageFailed.set(true)" />
      } @else {
        <i class="ph-fill ph-seal-check" aria-hidden="true"></i>
      }
      <span>#{{ formattedNumber() }}</span>
    </span>
  }`,
})
export class UiFounderBadge {
  readonly imageUrl = new URL('achievements/founder-badge/image', environment.zethoApiEndpoint).toString();
  readonly imageFailed = signal(false);
  readonly gamertag = input<string | null | undefined>();
  private readonly directory = inject(FounderDirectory);
  readonly number = computed(() =>
    this.directory.numbers().get(this.gamertag() ?? ''),
  );
  readonly formattedNumber = computed(() =>
    String(this.number()).padStart(4, '0'),
  );
  readonly label = computed(() => `Fundador #${this.formattedNumber()}`);
  constructor() {
    effect(() => {
      if (this.gamertag()) void this.directory.load();
    });
  }
}
