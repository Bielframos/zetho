import { Component } from '@angular/core';
import { UiUserLibGrid } from './modules/profile-entries';
import { ProfileLayoutStore } from '../../shared/app/profile-layout/profile-layout.store';
import { AppProfileSidebar } from './modules/profile-sidebar';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [UiUserLibGrid],
    templateUrl: './profile.html',
})
export class Profile {
    constructor(private layoutStore: ProfileLayoutStore) {
        this.layoutStore.sidebarComponent.set(AppProfileSidebar)
    }
}
