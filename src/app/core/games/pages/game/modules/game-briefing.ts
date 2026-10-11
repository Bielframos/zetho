import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { GameService } from '../../../games.service';
import type { GameBriefing } from '../../../game.types';

@Component({
  selector: 'ui-game-briefing',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="flex flex-col gap-6 p-4 md:p-6" aria-busy="true" aria-label="Carregando briefing do jogo">
        <!-- Skeleton Header -->
        <div class="flex items-center justify-between">
          <div class="h-6 w-36 animate-pulse rounded-full bg-gray-3"></div>
          <div class="h-4 w-20 animate-pulse rounded bg-gray-3"></div>
        </div>

        <!-- Skeleton Overview -->
        <div class="flex flex-col gap-2.5">
          <div class="h-4 w-full animate-pulse rounded bg-gray-3"></div>
          <div class="h-4 w-11/12 animate-pulse rounded bg-gray-3"></div>
          <div class="h-4 w-4/5 animate-pulse rounded bg-gray-3"></div>
        </div>

        <!-- Skeleton Highlights -->
        <div class="flex flex-col gap-3">
          <div class="h-3.5 w-32 animate-pulse rounded bg-gray-3"></div>
          <div class="flex flex-col gap-2">
            <div class="h-4 w-3/4 animate-pulse rounded bg-gray-3"></div>
            <div class="h-4 w-5/6 animate-pulse rounded bg-gray-3"></div>
            <div class="h-4 w-2/3 animate-pulse rounded bg-gray-3"></div>
          </div>
        </div>

        <!-- Skeleton Best For -->
        <div class="flex flex-col gap-3">
          <div class="h-3.5 w-28 animate-pulse rounded bg-gray-3"></div>
          <div class="flex flex-wrap gap-2">
            <div class="h-8 w-28 animate-pulse rounded-lg bg-gray-3"></div>
            <div class="h-8 w-36 animate-pulse rounded-lg bg-gray-3"></div>
            <div class="h-8 w-32 animate-pulse rounded-lg bg-gray-3"></div>
          </div>
        </div>

        <!-- Skeleton Footer -->
        <div class="border-t border-gray-6 pt-3">
          <div class="h-3 w-48 animate-pulse rounded bg-gray-3"></div>
        </div>
      </div>
    } @else if (error()) {
      <div class="flex flex-col items-center p-8 text-center text-gray-11">
        <i class="ph ph-warning-circle mb-2 text-3xl text-gray-10" aria-hidden="true"></i>
        <h3 class="mb-1 text-base text-gray-12">Não foi possível carregar o briefing</h3>
        <p class="max-w-sm text-sm font-light text-gray-10">
          Ocorreu uma instabilidade ao obter o briefing inteligente deste jogo.
        </p>
        <button
          type="button"
          class="ui-secondary-btn mt-4"
          (click)="reload()"
        >
          Tentar novamente
        </button>
      </div>
    } @else if (briefing(); as b) {
      <article class="flex flex-col gap-6 p-4 md:p-6 animate-fade-in-slide">
        <!-- Badge e Identificação -->
        <header class="flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-blue-6/60 bg-blue-3/80 px-2.5 py-1 text-xs font-medium text-blue-11"
          >
            <i class="ph-fill ph-sparkle text-link" aria-hidden="true"></i>
            Briefing Zetho AI
          </span>
          <span class="text-xs font-light text-gray-10">
            {{ b.source === 'stored' ? 'Curadoria em catálogo' : 'Gerado agora' }}
          </span>
        </header>

        <!-- Visão Geral -->
        <div>
          <h2 class="sr-only">Visão Geral</h2>
          <p class="text-base font-light leading-relaxed text-gray-12">
            {{ b.overview }}
          </p>
        </div>

        <!-- Destaques -->
        @if (b.highlights.length) {
          <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-10">
              Destaques da experiência
            </h3>
            <ul class="flex flex-col gap-2.5">
              @for (highlight of b.highlights; track $index) {
                <li class="flex items-start gap-2.5 text-sm leading-normal text-gray-11">
                  <i
                    class="ph-fill ph-check-circle mt-0.5 shrink-0 text-base text-blue-11"
                    aria-hidden="true"
                  ></i>
                  <span>{{ highlight }}</span>
                </li>
              }
            </ul>
          </section>
        }

        <!-- Indicado para quem busca -->
        @if (b.bestFor.length) {
          <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-10">
              Indicado para quem busca
            </h3>
            <div class="flex flex-wrap gap-2">
              @for (target of b.bestFor; track $index) {
                <span
                  class="inline-flex items-center gap-1.5 rounded-lg border border-gray-6 bg-gray-3 px-3 py-1.5 text-xs font-light text-gray-12"
                >
                  <i
                    class="ph-fill ph-thumbs-up text-xs text-blue-11"
                    aria-hidden="true"
                  ></i>
                  <span>{{ target }}</span>
                </span>
              }
            </div>
          </section>
        }

        <!-- Avisos de Conteúdo -->
        @if (b.contentWarning) {
          @if (isDefaultWarning(b.contentWarning)) {
            <div class="flex items-center gap-2 pt-1 text-xs text-gray-10">
              <i class="ph ph-shield-check text-sm text-gray-9" aria-hidden="true"></i>
              <span>{{ b.contentWarning }}</span>
            </div>
          } @else {
            <div
              class="flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-bg p-3 text-xs text-warning"
            >
              <i
                class="ph-fill ph-warning mt-0.5 shrink-0 text-base text-warning"
                aria-hidden="true"
              ></i>
              <div class="flex flex-col gap-0.5">
                <strong class="font-medium text-warning">Aviso de Conteúdo</strong>
                <p class="leading-relaxed opacity-90">{{ b.contentWarning }}</p>
              </div>
            </div>
          }
        }

        <!-- Rodapé com Metadados e Disclaimer -->
        <footer
          class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-6 pt-3 text-xs font-light text-gray-10"
        >
          <span>Curadoria estruturada por IA exclusivamente com fatos catalogados.</span>
          @if (b.generatedAt) {
            <time [attr.datetime]="b.generatedAt">
              Atualizado em {{ formatDate(b.generatedAt) }}
            </time>
          }
        </footer>
      </article>
    }
  `,
})
export class UiGameBriefing {
  gameId = input.required<string>();

  private service = inject(GameService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  briefing = signal<GameBriefing | null>(null);
  loading = signal(true);
  error = signal(false);

  private lastLoadedGameId: string | null = null;

  constructor() {
    effect(() => {
      const id = this.gameId();
      untracked(() => {
        if (!id || id === this.lastLoadedGameId) return;
        void this.load(id);
      });
    });
  }

  private async load(id: string) {
    if (!this.isBrowser) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    try {
      const data = await this.service.getGameBriefing(id);
      if (!data) {
        this.error.set(true);
        this.briefing.set(null);
      } else {
        this.briefing.set(data);
        this.lastLoadedGameId = id;
      }
    } catch {
      this.error.set(true);
      this.briefing.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  reload() {
    const id = this.gameId();
    if (id) {
      this.lastLoadedGameId = null;
      void this.load(id);
    }
  }

  isDefaultWarning(warning: string): boolean {
    const normalized = warning.toLowerCase().trim();
    return (
      normalized.includes('sem avisos de conteúdo') ||
      normalized.includes('não informado') ||
      normalized.includes('não informada')
    );
  }

  formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }
}
