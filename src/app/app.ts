import { ColorModeStore } from './core/system/color-mode/color-mode.store';
import { FollowControl } from './shared/ui/follow-control';
import { ProfileThemeContrast } from './shared/ui/profile-theme-contrast';
import { ColorModeSelector } from './shared/ui/color-mode-selector';
import { CommonModule, DOCUMENT } from '@angular/common';
import { UiSheet } from './shared/ui/sheet.directive';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationStart,
  NavigationCancel,
  NavigationError,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { AppSearchInput } from './shared/app/search-input/search-input';
import { ToasterComponent } from './core/system/notifications/toaster.component';
import { environment } from '../environments/environment';
import { ZCoinsService } from './core/zCoins/zcoins.service';
import { ZCoinBalance } from './shared/ui/z-coin-balance';
import { ProfileStore } from './core/userProfiles/profile.store';
import { ProfileLayoutStore } from './shared/app/profile-layout/profile-layout.store';
import { NotificationStore } from './core/system/notifications/notification.store';
import { UserProfileRow } from './types';
import { getThemeMediaUrl } from './core/themes/theme-media';

import { NotificationsSheetComponent } from './core/system/notifications/notifications-sheet.component';
import { InAppNotificationStore } from './core/system/notifications/in-app-notification.store';

@Component({
  selector: 'app-root',
  imports: [FollowControl,ProfileThemeContrast,
    ColorModeSelector,
    UiSheet,
    AppSearchInput,
    NgComponentOutlet,
    NgTemplateOutlet,
    NotificationsSheetComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToasterComponent,
    ZCoinBalance,
  ],
  templateUrl: './app.html',
})
export class App {
  // Color listeners must live even on standalone routes without the selector.
  private readonly colorMode = inject(ColorModeStore);

  authStore = inject(AuthStore);
  profileStore = inject(ProfileStore);
  profileLayoutStore = inject(ProfileLayoutStore);
  appVersion = environment.appVersion;
  featureRaffles = environment.features.raffles;
  private route = inject(Router);
  private destroyRef = inject(DestroyRef);
  private zCoinsService = inject(ZCoinsService);
  private notification = inject(NotificationStore);
  private inAppNotifications = inject(InAppNotificationStore);
  private document = inject(DOCUMENT);
  private searchFocusTimer?: ReturnType<typeof setTimeout>;
  private lastOnlineRoute = '/';
  private dailyLoginAttemptedFor = '';
  private notificationsLoadedForProfile = '';
  mobileMenuOpen = signal(false);
  profileNavigationPending = signal(false);
  profileTabs = [
    {
      key: 'games',
      label: 'Jogos',
      icon: 'ph-game-controller',
    },
    {
      key: 'listas',
      label: 'Listas',
      icon: 'ph-list-star',
    },
    {
      key: 'conexoes',
      label: 'Conexões',
      icon: 'ph-users-three',
    },
  ];

  get searchShortcut() {
    return /Mac|iPhone|iPad/.test(
      this.document.defaultView?.navigator.platform ?? '',
    )
      ? '⌘ K'
      : 'Ctrl K';
  }

  navigationGroups() {
    const authenticated = this.authStore.isAuthenticated();
    return [
      [
        ...(authenticated
          ? [
              { label: 'Feed', icon: 'ph-house', route: ['/feed'] },
              {
                label: 'Meu perfil',
                icon: 'ph-user-circle',
                route: this.profileRoute(),
              },
            ]
          : []),
        { label: 'Buscar', icon: 'ph-magnifying-glass', route: ['/buscar'] },
      ],
      [
        ...(authenticated
          ? [
              {
                label: 'Jogatina',
                icon: 'ph-game-controller',
                route: ['/sessions'],
              },
              {
                label: 'Próximo jogo',
                icon: 'ph-sparkle',
                route: ['/recomendacoes'],
              },
              { label: 'Z Shop', icon: 'ph-storefront', route: ['/loja'] },
            ]
          : []),
        { label: 'Rankings', icon: 'ph-ranking', route: ['/ranking'] },
        ...(this.featureRaffles
          ? [{ label: 'Sorteios', icon: 'ph-gift', route: ['/sorteios'] }]
          : []),
      ],
      [
        { label: 'Fórum', icon: 'ph-chats-circle', route: ['/forum'] },
        { label: 'Reviews', icon: 'ph-star', route: ['/reviews'] },
        { label: 'Notícias', icon: 'ph-newspaper', route: ['/noticias'] },
        { label: 'Listas', icon: 'ph-list-dashes', route: ['/listas'] },
      ],
    ];
  }

  @HostListener('document:keydown', ['$event'])
  onSearchShortcut(event: KeyboardEvent) {
    if (
      !this.usesAppShell() ||
      !(event.ctrlKey || event.metaKey) ||
      event.altKey ||
      event.key.toLowerCase() !== 'k'
    )
      return;
    event.preventDefault();
    const openSheets = this.document.querySelectorAll<HTMLDialogElement>(
      'dialog.ui-sheet[open]',
    );
    openSheets.forEach((panel) =>
      panel.dispatchEvent(new Event('cancel', { cancelable: true })),
    );
    this.closeMobileMenu();
    if (this.currentPath() === '/buscar') {
      clearTimeout(this.searchFocusTimer);
      const focusSearch = () =>
        this.document
          .querySelector<HTMLInputElement>('[data-search-input]')
          ?.focus();
      if (openSheets.length)
        this.searchFocusTimer = setTimeout(focusSearch, 230);
      else focusSearch();
    } else {
      void this.route.navigate(['/buscar']);
    }
  }

  constructor() {
    this.route.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart)
          this.profileNavigationPending.set(true);
        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
          this.profileNavigationPending.set(false);
      });
    this.destroyRef.onDestroy(() => clearTimeout(this.searchFocusTimer));
    this.trackLastOnlineRoute();
    this.registerConnectionWatch();
    this.registerDailyLoginReward();
    this.registerInAppNotifications();
  }

  onSearch(query: string) {
    this.route.navigate(['/buscar'], { queryParams: { q: query } });
  }

  getMediaUrl(imageId: string) {
    return getThemeMediaUrl(imageId);
  }

  onSearchInputFocus() {
    if (this.route.url.startsWith('/buscar')) return;
    void this.route.navigate(['/buscar']);
  }

  usesAppShell() {
    return this.usesAuthenticatedAppShell() || this.usesPublicAppShell();
  }

  usesAuthenticatedAppShell() {
    return this.authStore.isAuthenticated() && !this.isAppShellExcludedRoute();
  }

  usesPublicAppShell() {
    return !this.authStore.isAuthenticated() && !this.isAppShellExcludedRoute();
  }

  isLandingRoute() {
    return this.currentPath() === '/landing';
  }

  isAuthRoute() {
    const path = this.currentPath();
    const authRoutes = [
      '/entrar',
      '/registrar',
      '/comecar',
      '/recuperar-senha',
      '/redefinir-senha',
      '/verificacao',
    ];
    return authRoutes.some((route) => path.startsWith(route));
  }

  isOnboardingRoute() {
    return this.currentPath() === '/comecar';
  }

  isSplashRoute() {
    return this.currentPath() === '/';
  }

  isOfflineRoute() {
    return this.currentPath().startsWith('/sem-conexao');
  }

  profileRoute() {
    const gamertag = this.authStore.profile()?.gamertag;
    return gamertag ? ['/player', gamertag] : ['/feed'];
  }

  toggleMobileMenu() {
    const open = !this.mobileMenuOpen();
    this.mobileMenuOpen.set(open);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  comparisonProfile() {
    const profile = this.profileStore.current();
    const path = this.currentPath();
    if (
      !this.authStore.isAuthenticated() ||
      !profile ||
      !this.authStore.profile() ||
      this.profileStore.itsMe() ||
      this.profileNavigationPending() ||
      path.endsWith('/comparar')
    )
      return null;
    const match = /^\/player\/([^/]+)(?:\/|$)/.exec(path);
    return match && decodeURIComponent(match[1]) === profile.gamertag
      ? profile
      : null;
  }

  isProfileRoute() {
    return (
      this.currentPath().startsWith('/player/') &&
      !this.currentPath().endsWith('/comparar')
    );
  }

  get profileSidebarProfile() {
    return this.profileStore.current();
  }

  get profileSidebarHasSocialNicks() {
    const profile = this.profileSidebarProfile;
    return profile?.socialSteam || profile?.socialXbox || profile?.socialPsn;
  }

  async copyProfileSocial(key: string) {
    try {
      const valorParaCopiar =
        this.profileSidebarProfile?.[key as keyof UserProfileRow] ?? '';
      await navigator.clipboard.writeText(String(valorParaCopiar));
      this.notification.show({ message: 'Copiado!', type: 'success' });
    } catch (e) {
      this.notification.show({ message: 'Erro ao copiar', type: 'error' });
    }
  }

  private isAppShellExcludedRoute() {
    const path = this.currentPath();
    const excludedRoutes = [
      '/landing',
      '/entrar',
      '/registrar',
      '/comecar',
      '/recuperar-senha',
      '/redefinir-senha',
      '/verificacao',
    ];

    return (
      path === '/' || excludedRoutes.some((route) => path.startsWith(route))
    );
  }

  private currentPath() {
    return this.route.url.split('?')[0].split('#')[0];
  }

  private trackLastOnlineRoute() {
    const currentPath = this.route.url;
    if (currentPath && !currentPath.startsWith('/sem-conexao')) {
      this.lastOnlineRoute = currentPath;
    }

    this.route.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.closeMobileMenu();
        if (!event.urlAfterRedirects.startsWith('/sem-conexao')) {
          this.lastOnlineRoute = event.urlAfterRedirects;
        }
      });
  }

  private registerConnectionWatch() {
    if (typeof window === 'undefined') {
      return;
    }

    const onOffline = () => this.goToOfflinePage();
    const onOnline = () => this.restoreLastOnlineRoute();

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    });

    if (!navigator.onLine) {
      this.goToOfflinePage();
    }
  }

  private registerDailyLoginReward() {
    effect(() => {
      const profile = this.authStore.profile();

      if (!profile?.userId) {
        this.dailyLoginAttemptedFor = '';
        return;
      }

      const dayKey = `${profile.userId}-${new Date().toISOString().slice(0, 10)}`;

      if (this.dailyLoginAttemptedFor === dayKey) {
        return;
      }

      this.dailyLoginAttemptedFor = dayKey;
      void this.zCoinsService.recordDailyLogin();
    });
  }

  private registerInAppNotifications() {
    effect(() => {
      const profileId = this.authStore.profile()?.$id ?? '';
      if (!profileId) {
        this.notificationsLoadedForProfile = '';
        this.inAppNotifications.clear();
        return;
      }
      if (profileId === this.notificationsLoadedForProfile) return;
      this.notificationsLoadedForProfile = profileId;
      void this.inAppNotifications.loadNotifications();
    });
  }

  private goToOfflinePage() {
    const currentPath = this.route.url;

    if (!currentPath.startsWith('/sem-conexao')) {
      this.lastOnlineRoute = currentPath || '/';
      void this.route.navigateByUrl('/sem-conexao', { replaceUrl: true });
    }
  }

  private restoreLastOnlineRoute() {
    if (!this.isOfflineRoute()) {
      return;
    }

    const targetRoute =
      !this.lastOnlineRoute || this.lastOnlineRoute.startsWith('/sem-conexao')
        ? '/'
        : this.lastOnlineRoute;

    void this.route.navigateByUrl(targetRoute, { replaceUrl: true });
  }
}
