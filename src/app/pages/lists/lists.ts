import { Component, effect, inject, untracked } from '@angular/core';
import { ProfileLayoutStore } from '../../shared/app/profile-layout/profile-layout.store';
import { AppUserLists } from '../../shared/app/user-lists/user-lists';
import { AppNewListDialog } from '../../shared/app/new-list-dialog/new-list-dialog';
import { ProfileStore } from '../../core/userProfiles/profile.store';
import { UserStore } from '../../core/auth/user.store';
import { ListsController } from '../../core/lists/lists.controller';

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [AppUserLists, AppNewListDialog],
  templateUrl: './lists.html',
})
export class Lists {
  private userStore = inject(UserStore);
  private profileStore = inject(ProfileStore);
  controller = inject(ListsController);

  get itsMe() {
    return this.userStore.profile()?.$id === this.profileStore.current()?.$id;
  }

  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(null);

    effect(() => {
      const profile = this.profileStore.current();
      const userFingerprint = profile?.fingerprint;

      if (profile) {
        untracked(() => {
          void this.controller.loadLists({
            ownerFingerprint: userFingerprint!,
            onlyPublicOnes: this.profileStore.itsMe() ? undefined : true,
          });
        });
      }
    });
  }
}
