import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameStore } from '../../../core/games/game.store';
import { GameRow, GameWithEntry, ZEntry } from '../../../types';

type EntryStatus = Exclude<ZEntry['status'], 'wishlist' | null | undefined>;

@Component({
  selector: 'ui-game-card',
  standalone: true,
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
  imports: [NgTemplateOutlet, RouterLink],
})
export class UiGameCard {
  private gameStore = inject(GameStore);

  private isEntryStatus(
    status: ZEntry['status'] | null | undefined,
  ): status is EntryStatus {
    return (
      status === 'completed' ||
      status === 'backlog' ||
      status === 'playing' ||
      status === 'dropped'
    );
  }

  game = input.required<GameRow | GameWithEntry>();
  width = input<number>();
  readonlyMode = input(false, { transform: booleanAttribute });
  entryStatus = input<ZEntry['status'] | undefined>(undefined);

  displayGame = computed(() => this.game() || this.gameStore.currentGame());

  statusConfig: Record<
    EntryStatus,
    { bgClass: string; iconClass?: string; label: string }
  > = {
    completed: {
      bgClass: 'bg-blue-9 text-white',
      label: 'Zerei',
    },
    backlog: {
      bgClass: 'bg-green-400 text-blue-2',
      iconClass: 'ph-fill ph-books',
      label: 'Backlog',
    },
    playing: {
      bgClass: 'bg-purple-400 text-blue-2',
      iconClass: 'ph-fill ph-game-controller',
      label: 'Jogando',
    },
    dropped: {
      bgClass: 'bg-red-400 text-blue-2',
      iconClass: 'ph-fill ph-x-circle',
      label: 'Dropei',
    },
  };

  activeEntryStatus = computed<EntryStatus | null>(() => {
    const propStatus = this.entryStatus();

    if (this.isEntryStatus(propStatus)) return propStatus;

    const gameWithEntry = this.displayGame() as GameRow & {
      zEntry?: { status?: ZEntry['status'] | null };
    };

    const status = gameWithEntry?.zEntry?.status;

    return this.isEntryStatus(status) ? status : null;
  });

  entryIndicator = computed(() => {
    const status = this.activeEntryStatus();

    if (!status) return null;

    return {
      status,
      ...this.statusConfig[status],
    };
  });

  updateGame() {
    if (this.game()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.gameStore.setGame(this.game()!);
    }
  }
}
