import { Component, input } from '@angular/core';
import { GameRow } from '../../../core/types';
import { UiGameCard } from '../../../shared/ui/atoms/game-card/game-card';

@Component({
  selector: 'ui-game-header',
  standalone: true,
  template: `
    <header class="p-6 bg-blue-2 rounded-2xl sm:flex gap-10">
      <div class="mx-auto w-fit">
        <ui-game-card [game]="game()!" [width]="240" readonlyMode></ui-game-card>
      </div>

      <div class="flex flex-1 flex-col gap-4 max-sm:mt-6 max-sm:text-center justify-center">
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
            <span class="text-sm font-light text-gray-11">Lançado em</span>
            <br />
            <span>{{ game()?.releaseDate }}</span>
          </div>
        </div>

        <p class="font-light">{{ game()?.summary }}</p>

        <!-- Genêros do game -->
        <div>
          <span class="text-sm font-light text-gray-11">Gêneros</span> <br />
          @for (genre of game()?.genres; track $index) {
            <span
              >{{ genre.name }}
              @if ($index < game()?.genres.length - 1) {
                <span>, </span>
              }
            </span>
          }
        </div>
      </div>
    </header>
  `,
  imports: [UiGameCard],
})
export class UiGameHeader {
  game = input<GameRow | null>();
}
