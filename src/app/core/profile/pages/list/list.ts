import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiDraggableList } from './modules/draggable-list';
import { AppListMenu } from './modules/list-menu';
import { AuthStore } from '../../../auth/auth.store';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ListController } from '../../../lists/list.controller';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.html',
  imports: [UiDraggableList, UiLoading, ReactiveFormsModule, AppListMenu],
})
export class ListPage {
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);
  controller = inject(ListController);

  itsMe = computed(
    () => this.authStore.profile()?.$id === this.profileStore.current()?.$id,
  );
}
