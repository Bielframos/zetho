import { Component } from '@angular/core';
import { UiUserLibGrid } from './modules/profile-entries';
import { AppProfileSidebar } from './modules/profile-sidebar';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [UiUserLibGrid],
  templateUrl: './profile.html',
})
export class ProfilePage {
  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(AppProfileSidebar);
  }
}
