import { Component, input } from '@angular/core';
import { GameRow } from '../../../core/types';

@Component({
  selector: 'ui-game-header',
  standalone: true,
  template: `
    <header>
      <h1 class="text-4xl text-center md:text-start">{{ game()?.name }}</h1>
      <div class="flex gap-4 mt-6">
        <!-- Nome dos desenvolvedores -->
        <div class="border-r pr-4 border-blue-6">
          <span class="text-sm font-light text-gray-11">Desenvolvido por</span> <br />
          @for (company of game()?.involvedCompanies; track $index) {
          <span
            >{{ company.name }} @if ($index < game()?.involvedCompanies.length - 1) {<span>, </span>}
          </span>
          }
        </div>

        <!-- Data de lançamento -->
        <div>
          <span class="text-sm font-light text-gray-11">Lançado em</span> <br />
          <span>{{ game()?.releaseDate }}</span>
        </div>
      </div>

      <p class="font-light mt-6">{{ game()?.summary }}</p>

      <!-- Genêros do game -->
      <div class="mt-6">
        <span class="text-sm font-light text-gray-11">Gêneros</span> <br />
        @for (genre of game()?.genres; track $index) {
        <span>{{ genre.name }} @if ($index < game()?.genres.length - 1) {<span>, </span>} </span>
        }
      </div>

      <hr class="border-blue-6 w-full my-10" />
    </header>
  `,
  imports: [],
})
export class UiGameHeader {
  game = input<GameRow | null>();
}
