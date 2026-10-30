import { ListPublicationControls } from '../../../lists/list-publication-controls';
import { createSsrTaskRunner } from '../../../../utils/ssr-task';
import { SeoService } from '../../../system/seo/seo.service';
import { RESPONSE_INIT, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  untracked,
} from '@angular/core';
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
import { UiShareModal } from '../../../share/share-modal';
import { ShareCardData } from '../../../share/share.types';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.html',
  imports: [
    ListPublicationControls,
    UiDraggableList,
    UiLoading,
    ReactiveFormsModule,
    AppListMenu,
    UiShareModal,
  ],
})
export class ListPage implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private seo = inject(SeoService);
  private response = inject(RESPONSE_INIT, { optional: true });
  private run = createSsrTaskRunner();
  readonly systemRoute =
    !!inject(ActivatedRoute).snapshot?.data?.['systemList'];
  readonly isSystem = computed(
    () => this.controller.list()?.ownerType === 'system',
  );
  readonly canReview = computed(
    () => this.isSystem() && this.authStore.isAdmin(),
  );
  readonly visible = computed(
    () =>
      !this.isSystem() ||
      (this.controller.list()?.status === 'published' &&
        this.controller.list()?.isPublic === true),
  );
  private socialGeneration = 0;
  async reloadSystem() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) await this.run(() => this.controller.loadSystem(slug));
  }
  ngOnDestroy() {
    this.socialGeneration++;
    this.controller.cancelLoad?.();
    this.seo.clearJsonLd('list-page');
  }

  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);
  private profileStore = inject(ProfileStore);
  private dashboardService = inject(DashboardService);
  controller = inject(ListController);
  socialState = signal<ListSocialState | null>(null);

  shareModal = viewChild<UiShareModal>('shareModal');

  itsMe = computed(() =>
    this.isSystem()
      ? this.canReview() && this.controller.list()?.status === 'draft'
      : this.authStore.profile()?.$id === this.profileStore.current()?.$id,
  );

  shareData = computed<ShareCardData | null>(() => {
    const list = this.controller.list();
    const owner = this.isSystem()
      ? { gamertag: 'Zetho', avatarUrl: null }
      : this.profileStore.current();
    if (!list || !owner) return null;

    const covers = this.controller
      .items()
      .map((item) => item.game?.coverUrl)
      .filter((url): url is string => Boolean(url));

    return {
      kind: 'list',
      author: {
        gamertag: owner.gamertag,
        avatarUrl: owner.avatarUrl ?? null,
      },
      title: list.title,
      covers,
      itemCount: list.itemCount ?? this.controller.totalItems(),
    };
  });

  openShare() {
    this.shareModal()?.open();
  }

  constructor() {
    effect(() => {
      this.authStore.user();
      if (this.systemRoute) untracked(() => void this.reloadSystem());
    });
    effect(() => {
      if (!this.systemRoute) return;
      const list = this.controller.list();
      const error = this.controller.error();
      this.seo.clearJsonLd('list-page');
      if (error) {
        this.seo.apply({
          title: 'Lista indisponível — Zetho',
          description: 'Esta lista não está disponível.',
          robots: 'noindex,follow',
        });
        if (this.response)
          this.response.status = error.code === 404 ? 404 : 503;
      } else if (list) {
        this.seo.apply({
          title: `${list.title} — Zetho`,
          description: list.description ?? list.title,
          canonical: `/listas/${list.slug}`,
          robots:
            list.status === 'published' ? 'index,follow' : 'noindex,follow',
        });
        if (list.status === 'published')
          this.seo.setJsonLd('list-page', {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: list.title,
            itemListElement: this.controller
              .items()
              .map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.game.name,
                url: this.seo.toAbsoluteUrl(`/jogo/${item.game.slug}`),
              })),
          });
      }
    });
    effect(() => {
      const listId = this.controller.list()?.$id;
      this.socialGeneration++;
      this.socialState.set(null);
      if (listId && this.visible()) void this.loadSocialState(listId);
    });
  }

  ngOnInit() {
    if (this.systemRoute) {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => void this.reloadSystem());
      return;
    }
    this.controller.usePersonal?.();
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
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
    const generation = this.socialGeneration;

    try {
      const state = await this.dashboardService.toggleListLike(list.$id);
      if (generation === this.socialGeneration) this.socialState.set(state);
    } catch (e) {
      console.error(e);
      if (generation === this.socialGeneration) this.socialState.set(previous);
    }
  }

  async toggleSave() {
    const list = this.controller.list();
    if (!list) return;

    const previous = this.socialState();
    this.applyOptimisticSocialState('save');
    const generation = this.socialGeneration;

    try {
      const state = await this.dashboardService.toggleListSave(list.$id);
      if (generation === this.socialGeneration) this.socialState.set(state);
    } catch (e) {
      console.error(e);
      if (generation === this.socialGeneration) this.socialState.set(previous);
    }
  }

  private async loadSocialState(listId: string) {
    const generation = this.socialGeneration;
    try {
      const state = await this.dashboardService.getListSocialState(listId);
      if (generation === this.socialGeneration) this.socialState.set(state);
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
