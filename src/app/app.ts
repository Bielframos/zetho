import { CommonModule, DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { NgComponentOutlet } from '@angular/common';
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
  imports: [
    A11yModule,
    AppSearchInput,
    NgComponentOutlet,
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
  private lastOnlineRoute = '/';
  private dailyLoginAttemptedFor = '';
  private notificationsLoadedForProfile = '';
  mobileMenuOpen = signal(false);
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

  constructor() {
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

  isAuthRoute() {
    const path = this.currentPath();
    const authRoutes = [
      '/entrar',
      '/registrar',
      '/recuperar-senha',
      '/redefinir-senha',
      '/verificacao',
    ];
    return authRoutes.some((route) => path.startsWith(route));
  }

  isSplashRoute() {
    return this.currentPath() === '/';
  }

  isOfflineRoute() {
    return this.currentPath().startsWith('/sem-conexao');
  }

  profileRoute() {
    const gamertag = this.authStore.profile()?.gamertag;
    return gamertag ? ['/player', gamertag] : ['/dashboard'];
  }

  toggleMobileMenu() {
    const open = !this.mobileMenuOpen();
    this.mobileMenuOpen.set(open);
    this.document.body.style.overflow = open ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  closeMobileMenuOnEscape() {
    if (this.mobileMenuOpen()) this.closeMobileMenu();
  }

  isProfileRoute() {
    return this.currentPath().startsWith('/player/');
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
