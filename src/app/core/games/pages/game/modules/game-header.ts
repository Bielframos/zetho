import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { UiSkeleton } from '../../../../../shared/ui/skeleton';
import { GameRow } from '../../../game.types';

@Component({
  selector: 'ui-game-header',
  standalone: true,
  template: `
    <header class="p-6 max-md:py-10 md:rounded-2xl sm:flex gap-10">
      <div class="mx-auto w-fit">
        <ui-game-card
          [game]="game()!"
          [width]="240"
          readonlyMode
        ></ui-game-card>
      </div>

      <div
        class="flex flex-1 flex-col gap-4 max-sm:mt-6 max-sm:text-center max-sm:items-center justify-center"
      >
        @if (game()) {
          <h1 class="text-4xl">{{ game()?.name }}</h1>

          <div class="flex gap-4 max-sm:justify-center">
            <!-- Nome dos desenvolvedores -->
            <div class="border-r pr-4 border-blue-6">
              <span class="text-sm font-light text-gray-11"
                >Desenvolvido por</span
              >
              <br />
              @for (company of game()?.involvedCompanies; track $index) {
                <span
                  >{{ company.name }}
                  @if ($index < game()?.involvedCompanies.length - 1) {
                    <span>, </span>
                  }
                </span>
              }
            </div>

            <!-- Data de lançamento -->
            <div>
              <span class="text-sm font-light text-gray-11">{{
                releaseLabel()
              }}</span>
              <br />
              <span>{{ releaseValue() }}</span>
            </div>
          </div>

          <div>
            <p class="font-light">
              {{ game()?.summaryPt ? game()?.summaryPt : game()?.summary }}
            </p>

            @if (game()?.summaryPt) {
              <button
                (click)="toggleSummary()"
                class="text-xs border border-dashed border-gray-6 rounded-full w-fit px-2 py-0.5 hover:bg-gray-2 cursor-pointer mt-2"
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
                <p class="font-light mt-2 text-sm">
                  {{ game()?.summary }}
                </p>
              </div>
            }
          </div>

          <!-- Genêros do game -->
          <div>
            <span class="text-sm font-light text-gray-11">Gêneros</span> <br />
            @for (genre of game()?.genres; track $index) {
              <a
                [routerLink]="['/buscar']"
                [queryParams]="{ genre: genre.slug }"
                class="hover:text-blue-11 transition-colors"
                >{{ genre.name }}</a
              >
              @if ($index < (game()?.genres?.length ?? 0) - 1) {
                <span>, </span>
              }
            }
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

  showOriginalSummary = signal(false);
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
