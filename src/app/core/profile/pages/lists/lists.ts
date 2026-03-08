import { Component, inject } from '@angular/core';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';
import { AppUserLists } from '../../../../shared/app/user-lists/user-lists';
import { AppNewListDialog } from '../../../../shared/app/new-list-dialog/new-list-dialog';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { AuthStore } from '../../../auth/auth.store';
import { ListsController } from '../../../lists/lists.controller';

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [AppUserLists, AppNewListDialog],
  templateUrl: './lists.html',
})
export class ListsPage {
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);
  controller = inject(ListsController);

  get itsMe() {
    return this.authStore.profile()?.$id === this.profileStore.current()?.$id;
  }

  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(null);
  }
}
