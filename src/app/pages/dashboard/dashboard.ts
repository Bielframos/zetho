import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStore } from '../../core/auth/user.store';
import { AppUserLists } from '../../shared/app/user-lists/user-lists';
import { DASHBOARD_ENTRIES } from './utils';
import { ProfileStore } from '../../core/userProfiles/profile.store';
import { ShortNumberPipe } from '../../utils/pipes';
import { ListsController } from '../../core/lists/lists.controller';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ShortNumberPipe, AppUserLists],
  templateUrl: './dashboard.html',
})
export class Dashboard {
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
