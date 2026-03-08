import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiDraggableList } from './modules/draggable-list';
import { AppListMenu } from './modules/list-menu';
import { AuthStore } from '../../../auth/auth.store';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ListController } from '../../../lists/list.controller';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.html',
  imports: [UiDraggableList, UiLoading, ReactiveFormsModule, AppListMenu],
})
export class ListPage {
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);
  controller = inject(ListController);

  itsMe = computed(
    () => this.authStore.profile()?.$id === this.profileStore.current()?.$id,
  );

  ngOnInit() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug')),
        distinctUntilChanged(),
      )
      .subscribe((slug) => {
        if (slug) {
          // Atualiza o slug no controller para carregar a lista correta
          this.controller.slug$.next(slug);
        }
      });
  }
}
