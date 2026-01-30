import { Component, inject } from '@angular/core';
import { UserStore } from '../../../core/auth/user.store';
import { UiGameCard } from '../../../shared/ui/game-card/game-card';
import { UiLoading } from '../../../shared/ui/loading';
import { ZEntriesController } from '../../../core/zEntries/zEntries.controller';

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
