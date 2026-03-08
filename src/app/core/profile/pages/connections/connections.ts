import { Component, inject } from '@angular/core';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ConnectionsController } from '../../../connections/connections.controller';
import { NgClass } from '@angular/common';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';

@Component({
  selector: 'app-connections',
  standalone: true,
  templateUrl: './connections.html',
  imports: [NgClass, UiProfileCard, UiLoading],
})
export class ConnectionsPage {
  private profileStore = inject(ProfileStore);
  controller = inject(ConnectionsController);

  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(null);
  }

  get currentProfile() {
    return this.profileStore.current();
  }

  get itsMe() {
    return this.profileStore.itsMe();
  }
}
