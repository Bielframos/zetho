import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { GameRow } from '../../../game.types';
import { GameStore } from '../../../game.store';

@Component({
  selector: 'ui-game-header',
  standalone: true,
  template: `
    <header class="relative border-b-8 border-gray-6 px-4 pt-8 pb-6 md:pt-10">
      <!-- Nota: canto superior esquerdo do quadro -->
      <div class="absolute left-4 top-6 z-10">
        <ng-content select="[headerRating]"></ng-content>
      </div>

      <!-- Ações: canto superior direito do quadro, empilhadas -->
      <div class="absolute right-4 top-6 z-10">
        <ng-content select="[headerActions]"></ng-content>
      </div>

      <!-- Coluna central: capa, título, metadados, descrição -->
      <div
        class="mx-auto flex max-w-xl flex-col items-center gap-4 px-14 text-center"
      >
        @if (displayGame()) {
          <div class="w-28 shrink-0 shadow-2xl shadow-gray-1/50 md:w-[150px]">
            <ui-game-card
              [game]="displayGame()!"
              transitionScope="header"
              [priority]="true"
              [width]="150"
              readonlyMode
            ></ui-game-card>
          </div>
        }

        @if (game()) {
          <div class="flex flex-col items-center gap-2">
            <h1 class="text-3xl leading-tight text-balance md:text-4xl">
              {{ game()?.name }}
            </h1>

            <!-- Metadados: ano · empresa · gêneros -->
            <p
              class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-11"
            >
              @if (game()?.releaseYear) {
                <span>{{ game()?.releaseYear }}</span>
              }
              @if (developerNames(); as devs) {
                <span class="text-gray-6" aria-hidden="true">·</span>
                <span class="text-gray-12">{{ devs }}</span>
              }
              @if (game()?.genres?.length) {
                <span class="text-gray-6" aria-hidden="true">·</span>
                <span class="flex flex-wrap justify-center gap-x-1">
                  @for (genre of game()?.genres; track $index) {
                    <a
                      [routerLink]="['/buscar']"
                      [queryParams]="{ genre: genre.slug }"
                      class="transition-colors hover:text-blue-11"
                      >{{ genre.name
                      }}{{
                        $index < (game()?.genres?.length ?? 0) - 1 ? ',' : ''
                      }}</a
                    >
                  }
                </span>
              }
            </p>
          </div>

          <button
            type="button"
            (click)="toggleGameInfo()"
            class="ui-action-btn"
            [attr.aria-expanded]="showGameInfo()"
          >
            <i
              class="ph"
              [class.ph-caret-down]="!showGameInfo()"
              [class.ph-caret-up]="showGameInfo()"
            ></i>
            {{ showGameInfo() ? 'Ocultar detalhes' : 'Ver detalhes do jogo' }}
          </button>

          <!-- Descrição expandida (disclosure) -->
          <div
            class="w-full max-w-lg"
            [class.hidden]="!showGameInfo()"
          >
            <p class="font-light leading-7 text-gray-12">
              {{ game()?.summaryPt ? game()?.summaryPt : game()?.summary }}
            </p>

            @if (game()?.summaryPt) {
              <button
                (click)="toggleSummary()"
                class="mx-auto mt-3 block w-fit cursor-pointer rounded-lg border border-dashed border-gray-6 px-2 py-0.5 text-xs text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
              >
                {{
                  showOriginalSummary()
                    ? 'Esconder resumo original'
                    : 'Mostrar resumo original'
                }}
              </button>

              <div
                class="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                [class.max-h-0]="!showOriginalSummary()"
                [class.max-h-[800px]]="showOriginalSummary()"
                [class.opacity-0]="!showOriginalSummary()"
                [class.opacity-100]="showOriginalSummary()"
              >
                <p
                  class="mt-3 border-t border-gray-6 pt-3 text-sm font-light leading-6 text-gray-11"
                >
                  {{ game()?.summary }}
                </p>
              </div>
            }

            <p class="mt-4 text-sm text-gray-11">
              {{ releaseLabel() }}
              <span class="text-gray-12">{{ releaseValue() }}</span>
            </p>
          </div>
        }
      </div>
    </header>
  `,
  imports: [UiGameCard, RouterLink],
})
export class UiGameHeader {
  private gameStore = inject(GameStore);

  game = input<GameRow | null>();
  displayGame = computed(() => this.game() ?? this.gameStore.currentGame());

  showGameInfo = signal(false);
  showOriginalSummary = signal(false);
  toggleGameInfo = () => this.showGameInfo.update((value) => !value);
  toggleSummary = () => this.showOriginalSummary.update((value) => !value);

  developerNames = computed(() => {
    const companies = this.game()?.involvedCompanies;
    if (!companies?.length) return '';
    return companies
      .map((company: { name?: string }) => company?.name)
      .filter(Boolean)
      .join(', ');
  });

  releaseLabel = computed(() => {
    const game = this.game();
    const releaseDate = game?.releaseDate;
    const releaseYear = game?.releaseYear;

    if (!releaseDate || !releaseYear) {
      return 'Lançamento a definir';
    }

    const rawReleaseDate = game?.rawReleaseDate;

    if (rawReleaseDate) {
      const release = new Date(rawReleaseDate);
      if (!Number.isNaN(release.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return release.getTime() > today.getTime()
          ? 'Chega em '
          : 'Lançado em ';
      }
    }

    return 'Lançado em ';
  });

  releaseValue = computed(() => {
    const game = this.game();
    const releaseDate = game?.releaseDate;
    const releaseYear = game?.releaseYear;

    if (!releaseDate || !releaseYear) {
      return '';
    }

    return releaseDate;
  });
}
