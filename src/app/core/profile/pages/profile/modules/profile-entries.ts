import { Component, inject } from '@angular/core';
import { UiLoading } from '../../../../../shared/ui/loading';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { AuthStore } from '../../../../auth/auth.store';
import { ZEntriesController } from '../../../../zEntries/zEntries.controller';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-proflie-entries',
  standalone: true,
  imports: [UiLoading, UiGameCard, RouterLink],
  templateUrl: './profile-entries.html',
})
export class UiUserLibGrid {
  authStore = inject(AuthStore);
  controller = inject(ZEntriesController);
}
