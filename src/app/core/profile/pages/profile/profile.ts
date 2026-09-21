import { Component } from '@angular/core';
import { UiUserLibGrid } from './modules/profile-entries';
import { AppProfileSidebar } from './modules/profile-sidebar';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';
import { AnnualGoalWidget } from './modules/annual-goal';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [UiUserLibGrid, AnnualGoalWidget],
  templateUrl: './profile.html',
})
export class ProfilePage {
  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(AppProfileSidebar);
  }
}
