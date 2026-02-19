import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
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
  private route = inject(ActivatedRoute);
  controller = inject(ListController);

  itsMe = computed(
    () => this.authStore.profile()?.$id === this.profileStore.current()?.$id,
  );

  slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const slug = this.slug();
      const profile = this.profileStore.current();

      if (profile && slug) {
        untracked(() => {
          void this.controller.load({ slug });
        });
      }
    });
  }
}
