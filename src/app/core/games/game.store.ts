import { computed, Injectable, signal } from '@angular/core';
import { GameRow } from '../../types';

@Injectable({ providedIn: 'root' })
export class GameStore {
  private _currentGame = signal<GameRow | null>(null);
  readonly currentGame = computed(() => this._currentGame());

  setGame = this._currentGame.set;
}
