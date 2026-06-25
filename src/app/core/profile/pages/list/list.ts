import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UiLoading } from '../../../../shared/ui/loading';
import { UiDraggableList } from './modules/draggable-list';
import { AppListMenu } from './modules/list-menu';
import { AuthStore } from '../../../auth/auth.store';
import { ProfileStore } from '../../../userProfiles/profile.store';
import { ListController } from '../../../lists/list.controller';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import {
  DashboardService,
  ListSocialState,
} from '../../../dashboard/dashboard.service';

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
  private dashboardService = inject(DashboardService);
  controller = inject(ListController);
  socialState = signal<ListSocialState | null>(null);

  itsMe = computed(
    () => this.authStore.profile()?.$id === this.profileStore.current()?.$id,
  );

  constructor() {
    effect(() => {
      const listId = this.controller.list()?.$id;
      if (listId) {
        void this.loadSocialState(listId);
      }
    });
  }

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

  async toggleLike() {
    const list = this.controller.list();
    if (!list) return;

    const previous = this.socialState();
    this.applyOptimisticSocialState('like');

    try {
      this.socialState.set(
        await this.dashboardService.toggleListLike(list.$id),
      );
    } catch (e) {
      console.error(e);
      this.socialState.set(previous);
    }
  }

  async toggleSave() {
    const list = this.controller.list();
    if (!list) return;

    const previous = this.socialState();
    this.applyOptimisticSocialState('save');

    try {
      this.socialState.set(
        await this.dashboardService.toggleListSave(list.$id),
      );
    } catch (e) {
      console.error(e);
      this.socialState.set(previous);
    }
  }

  private async loadSocialState(listId: string) {
    try {
      this.socialState.set(
        await this.dashboardService.getListSocialState(listId),
      );
    } catch (e) {
      console.error(e);
    }
  }

  private applyOptimisticSocialState(action: 'like' | 'save') {
    const list = this.controller.list();
    const current = this.socialState();
    if (!list || !current) return;

    if (action === 'like') {
      const likedByMe = !current.likedByMe;
      this.socialState.set({
        ...current,
        likedByMe,
        likeCount: Math.max(0, current.likeCount + (likedByMe ? 1 : -1)),
      });
      return;
    }

    const savedByMe = !current.savedByMe;
    this.socialState.set({
      ...current,
      savedByMe,
      saveCount: Math.max(0, current.saveCount + (savedByMe ? 1 : -1)),
    });
  }
}
