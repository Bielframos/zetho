import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { UiLoading } from '../../shared/ui/loading';
import { UiDraggableList } from './modules/draggable-list';
import { AppListMenu } from './modules/list-menu';
import { UserStore } from '../../core/auth/user.store';
import { ProfileStore } from '../../core/userProfiles/profile.store';
import { ListController } from '../../core/lists/list.controller';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.html',
  imports: [UiDraggableList, UiLoading, ReactiveFormsModule, AppListMenu],
})
export class List {
  private userStore = inject(UserStore);
  private profileStore = inject(ProfileStore);
  private route = inject(ActivatedRoute);
  controller = inject(ListController);

  itsMe = computed(
    () => this.userStore.profile()?.$id === this.profileStore.current()?.$id,
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
