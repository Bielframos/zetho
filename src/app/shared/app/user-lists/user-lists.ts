import { Component, computed, inject, input } from '@angular/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ZereiListRow } from '../../../types';
import { UiListCard } from '../../ui/list-card';
import { UiEmptyState } from '../../ui/empty-state';
import { AppNewListDialog } from '../new-list-dialog/new-list-dialog';
import { ListsController } from '../../../core/lists/lists.controller';

@Component({
  selector: 'app-user-lists',
  standalone: true,
  templateUrl: './user-lists.html',
  imports: [AppNewListDialog, UiListCard, UiEmptyState],
})
export class AppUserLists {
  authStore = inject(AuthStore);
  profileStore = inject(ProfileStore);
  controller = inject(ListsController);
  lists = input<ZereiListRow[]>([]);

  disableGrid = input(false);
  fromMe = input(false);

  ownerGamertag = computed(() => {
    if (this.fromMe()) return this.authStore.profile()?.gamertag || '';
    else return this.profileStore.current()?.gamertag || '';
  });
}
