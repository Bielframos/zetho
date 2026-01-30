import { Component, computed, inject, input } from '@angular/core';
import { UserStore } from '../../../core/auth/user.store';
import { ProfileStore } from '../../../core/userProfiles/profile.store';
import { ZereiListRow } from '../../../types';
import { UiListCard } from '../../ui/molecules/list-card';
import { AppNewListDialog } from '../new-list-dialog/new-list-dialog';
import { ListsController } from '../../../core/lists/lists.controller';

@Component({
  selector: 'app-user-lists',
  standalone: true,
  templateUrl: './user-lists.html',
  imports: [AppNewListDialog, UiListCard],
})
export class AppUserLists {
  userStore = inject(UserStore);
  profileStore = inject(ProfileStore);
  controller = inject(ListsController);
  lists = input<ZereiListRow[]>([]);

  disableGrid = input(false);
  fromMe = input(false);

  ownerGamertag = computed(() => {
    if (this.fromMe()) return this.userStore.profile()?.gamertag || '';
    else return this.profileStore.current()?.gamertag || '';
  });
}
