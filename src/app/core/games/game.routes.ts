import { Routes } from '@angular/router';
import { GamePage } from './pages/game/game';

export const GAME_ROUTES: Routes = [
  { path: 'jogo/:slug', component: GamePage },
];
