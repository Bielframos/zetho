import { Component, inject } from '@angular/core';
import { UiLoading } from '../../../../../shared/ui/loading';
import { UiGameCard } from '../../../../../shared/ui/game-card/game-card';
import { UserStore } from '../../../../auth/user.store';
import { ZEntriesController } from '../../../../zEntries/zEntries.controller';

@Component({
  selector: 'ui-proflie-entries',
  standalone: true,
  imports: [UiLoading, UiGameCard],
  templateUrl: './profile-entries.html',
})
export class UiUserLibGrid {
  userStore = inject(UserStore);
  controller = inject(ZEntriesController);
}
