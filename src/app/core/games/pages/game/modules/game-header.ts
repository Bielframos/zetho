import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { UiSkeleton } from '../../../../../shared/ui/skeleton';
import { GameRow } from '../../../game.types';

@Component({
  selector: 'ui-game-header',
  standalone: true,
  template: `
    <header class="flex flex-col items-center text-center pt-8 md:pt-10">
      <div class="mx-auto w-fit shadow-2xl shadow-gray-1/40">
        <ui-game-card
          [game]="game()!"
          [width]="240"
          readonlyMode
        ></ui-game-card>
      </div>

      <div
        class="mt-6 flex w-full max-w-3xl flex-col items-center justify-center gap-2 max-md:border-b-8 border-gray-6"
      >
        @if (game()) {
          <h1 class="text-4xl leading-tight md:text-5xl">{{ game()?.name }}</h1>

          <button
            type="button"
            (click)="toggleGameInfo()"
            class="ui-action-btn mb-6"
            [attr.aria-expanded]="showGameInfo()"
          >
            <i
              class="ph"
              [class.ph-caret-down]="!showGameInfo()"
              [class.ph-caret-up]="showGameInfo()"
            ></i>
            {{ showGameInfo() ? 'Ocultar detalhes' : 'Ver detalhes do jogo' }}
          </button>

          <div class="w-full" [class.hidden]="!showGameInfo()">
            <div
              class="grid w-full divide-y divide-gray-6 border-y border-gray-6 text-left sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:text-center"
            >
              <!-- Nome dos desenvolvedores -->
              <div class="px-4 py-3">
                <span class="text-xs font-light uppercase text-gray-11"
                  >Desenvolvido por</span
                >
                <br />
                <span class="text-sm text-gray-12">
                  @for (company of game()?.involvedCompanies; track $index) {
                    {{ company.name }}
                    @if ($index < game()?.involvedCompanies.length - 1) {
                      <span>, </span>
                    }
                  } @empty {
                    Não informado
                  }
                </span>
              </div>

              <!-- Data de lançamento -->
              <div class="px-4 py-3">
                <span class="text-xs font-light uppercase text-gray-11">{{
                  releaseLabel()
                }}</span>
                <br />
                <span class="text-sm text-gray-12">{{ releaseValue() }}</span>
              </div>
            </div>

            <div class="px-4 pt-6 text-left sm:text-center">
              <p class="font-light leading-7 text-gray-12">
                {{ game()?.summaryPt ? game()?.summaryPt : game()?.summary }}
              </p>

              @if (game()?.summaryPt) {
                <button
                  (click)="toggleSummary()"
                  class="mt-3 w-fit cursor-pointer rounded-lg border border-dashed border-gray-6 px-2 py-0.5 text-xs text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
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
            </div>

            <!-- Genêros do game -->
            <div
              class="mt-6 grid w-full divide-y divide-gray-6 border-t border-gray-6 text-left sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:text-center"
            >
              <div class="px-4 py-3">
                <span class="text-xs font-light uppercase text-gray-11"
                  >Gêneros</span
                >
                <br />
                <span class="text-sm text-gray-12">
                  @for (genre of game()?.genres; track $index) {
                    <a
                      [routerLink]="['/buscar']"
                      [queryParams]="{ genre: genre.slug }"
                      class="transition-colors hover:text-blue-11"
                      >{{ genre.name }}</a
                    >
                    @if ($index < (game()?.genres?.length ?? 0) - 1) {
                      <span>, </span>
                    }
                  } @empty {
                    Não informado
                  }
                </span>
              </div>

              <div class="px-4 py-3 flex flex-col gap-1 sm:text-center">
                <span class="text-xs font-light uppercase text-gray-11"
                  >ID do jogo</span
                >
                <span class="text-sm text-gray-12">{{ game()?.$id }}</span>
              </div>
            </div>
          </div>
        } @else {
          <ui-skeleton [height]="40" [width]="70"></ui-skeleton>
          <ui-skeleton [height]="40" [width]="20"></ui-skeleton>

          <div class="flex flex-col gap-1 w-full max-sm:items-center">
            <ui-skeleton [height]="16" [width]="60"></ui-skeleton>
            <ui-skeleton [height]="16" [width]="70"></ui-skeleton>
            <ui-skeleton [height]="16" [width]="60"></ui-skeleton>
            <ui-skeleton [height]="16" [width]="55"></ui-skeleton>
          </div>

          <ui-skeleton [height]="40" [width]="20"></ui-skeleton>
        }
      </div>
    </header>
  `,
  imports: [UiGameCard, UiSkeleton, RouterLink],
})
export class UiGameHeader {
  game = input<GameRow | null>();

  showGameInfo = signal(false);
  showOriginalSummary = signal(false);
  toggleGameInfo = () => this.showGameInfo.update((value) => !value);
  toggleSummary = () => this.showOriginalSummary.update((value) => !value);

  releaseLabel = computed(() => {
    const game = this.game();
    const releaseDate = game?.releaseDate;
    const releaseYear = game?.releaseYear;

    if (!releaseDate || !releaseYear) {
      return 'Data de lançamento';
    }

    const rawReleaseDate = game?.rawReleaseDate;

    if (rawReleaseDate) {
      const release = new Date(rawReleaseDate);
      if (!Number.isNaN(release.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return release.getTime() > today.getTime()
          ? 'Data de lançamento:'
          : 'Lançado em';
      }
    }

    return 'Lançado em';
  });

  releaseValue = computed(() => {
    const game = this.game();
    const releaseDate = game?.releaseDate;
    const releaseYear = game?.releaseYear;

    if (!releaseDate || !releaseYear) {
      return 'A definir';
    }

    return releaseDate;
  });
}
