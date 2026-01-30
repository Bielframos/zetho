import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShortNumberPipe } from '../../../../utils/pipes';
import { AppUserLists } from '../../../../shared/app/user-lists/user-lists';
import { UserStore } from '../../../auth/user.store';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ListsController } from '../../../lists/lists.controller';
import { DASHBOARD_ENTRIES } from '../../dashboard.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ShortNumberPipe, AppUserLists],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  userStore = inject(UserStore);
  profileStore = inject(ProfileStore);
  controller = inject(ListsController);

  get profile() {
    return this.userStore.profile();
  }
  entries = DASHBOARD_ENTRIES;

  constructor() {
    void this.controller.loadLists({
      ownerFingerprint: this.profile!.fingerprint,
    });
  }
}
