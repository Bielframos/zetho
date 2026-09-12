import { Component, inject } from '@angular/core';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ConnectionsController } from '../../../connections/connections.controller';
import { UiSegmentedControl, UiSegmentOption } from '../../../../shared/ui/segmented-control';
import { UiProfileCard } from '../../../../shared/ui/profile-card';
import { UiLoading } from '../../../../shared/ui/loading';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';

@Component({
  selector: 'app-connections',
  standalone: true,
  templateUrl: './connections.html',
  imports: [UiSegmentedControl, UiProfileCard, UiLoading],
})
export class ConnectionsPage {
  readonly connectionOptions: UiSegmentOption<'followers' | 'following'>[] = [
    { id: 'followers', label: 'Seguidores' },
    { id: 'following', label: 'Seguindo' },
  ];
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
