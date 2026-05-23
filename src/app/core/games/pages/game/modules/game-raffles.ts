import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameController } from '../../../game.controller';
import { RafflesService } from '../../../../raffles/raffles.service';
import { RaffleItem } from '../../../../raffles/raffle.types';

@Component({
  selector: 'ui-game-raffles',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (raffles().length > 0) {
      <section class="max-md:px-4">
        <ul class="flex flex-col gap-3">
          @for (raffle of raffles(); track raffle.$id) {
            <li>
              <a
                [routerLink]="['/sorteios', raffle.$id]"
                (click)="selectRaffle(raffle)"
                class="flex items-center gap-4 rounded-2xl bg-gray-2 p-4 hover:bg-gray-3 transition-colors"
              >
                <div
                  class="h-11 w-11 flex items-center justify-center rounded-full bg-blue-2 shrink-0"
                >
                  <i class="ph ph-ticket text-blue-9 text-[22px]"></i>
                </div>

                <div class="flex-1 min-w-0">
                  @if (raffle.ticketPrice) {
                    <p class="font-medium text-gray-12 text-sm leading-snug">
                      Concorra a este jogo por
                      <span class="text-blue-11"
                        >{{ raffle.ticketPrice }} Z-Coins</span
                      >
                    </p>
                  } @else {
                    <p class="font-medium text-gray-12 text-sm leading-snug">
                      Concorra a uma chave gratuitamente
                    </p>
                  }
                  <div
                    class="flex items-center gap-3 mt-1 text-xs text-gray-10 flex-wrap"
                  >
                    @if (raffle.active) {
                      <span
                        class="rounded-full bg-green-900/40 border border-green-700/40 text-green-300 px-2 py-0.5"
                      >
                        Ativo
                      </span>
                    } @else {
                      <span
                        class="rounded-full bg-gray-3 text-gray-10 px-2 py-0.5"
                      >
                        Encerrado
                      </span>
                    }
                    @if (raffle.availableKeysCount > 0) {
                      <span>
                        {{ raffle.availableKeysCount }}
                        chave{{
                          raffle.availableKeysCount !== 1 ? 's' : ''
                        }}
                        disponíve{{
                          raffle.availableKeysCount !== 1 ? 'is' : 'l'
                        }}
                      </span>
                    }
                  </div>
                </div>

                <i class="ph ph-arrow-right text-gray-10 shrink-0"></i>
              </a>
            </li>
          }
        </ul>
      </section>
      <hr class="border-blue-2 w-full my-10 max-md:mx-4 max-md:w-auto" />
    }
  `,
})
export class UiGameRaffles {
  private gameController = inject(GameController);
  private rafflesService = inject(RafflesService);

  raffles = signal<RaffleItem[]>([]);

  constructor() {
    effect(() => {
      const game = this.gameController.game();
      if (game?.$id) void this.loadRaffles(game.$id);
    });
  }

  private async loadRaffles(gameId: string) {
    try {
      const res = await this.rafflesService.listRaffles({ gameId, limit: 10 });
      this.raffles.set(res.raffles);
    } catch {
      this.raffles.set([]);
    }
  }

  selectRaffle(raffle: RaffleItem) {
    this.rafflesService.currentRaffle.set(raffle);
  }
}
