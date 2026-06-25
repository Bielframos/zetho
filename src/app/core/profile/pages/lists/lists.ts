import { Component, effect, inject, signal } from '@angular/core';
import { ProfileLayoutStore } from '../../../../shared/app/profile-layout/profile-layout.store';
import { AppUserLists } from '../../../../shared/app/user-lists/user-lists';
import { AppNewListDialog } from '../../../../shared/app/new-list-dialog/new-list-dialog';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { AuthStore } from '../../../auth/auth.store';
import { ListsController } from '../../../lists/lists.controller';
import { DashboardService, TrendingListItem } from '../../../dashboard/dashboard.service';
import { UiListCard } from '../../../../shared/ui/list-card';

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [AppUserLists, AppNewListDialog, UiListCard],
  templateUrl: './lists.html',
})
export class ListsPage {
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);
  controller = inject(ListsController);

  private dashboardService = inject(DashboardService);
  
  activeTab = signal<'minhas' | 'salvas'>('minhas');
  
  savedLists = signal<any[]>([]);
  savedTotal = signal(0);
  loadingSaved = signal(false);

  get itsMe() {
    return this.authStore.profile()?.$id === this.profileStore.current()?.$id;
  }

  constructor(private layoutStore: ProfileLayoutStore) {
    this.layoutStore.sidebarComponent.set(null);

    effect(() => {
      if (this.activeTab() === 'salvas' && this.savedLists().length === 0) {
        void this.loadSavedLists();
      }
    });
  }

  async loadSavedLists() {
    this.loadingSaved.set(true);
    try {
      const response = await this.dashboardService.getSavedLists();
      const parsed = response.items.map(item => ({
        ...item,
        parsedLatestAdditions: item.latestAdditions?.map(a => JSON.parse(a)),
      }));
      this.savedLists.set(parsed);
      this.savedTotal.set(parsed.length);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingSaved.set(false);
    }
  }
}
