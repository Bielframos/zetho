import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { AppSearchInput } from './shared/app/search-input/search-input';
import { ToasterComponent } from './core/notifications/toaster.component';

@Component({
  selector: 'app-root',
  imports: [AppSearchInput, RouterLink, RouterOutlet, ToasterComponent],
  templateUrl: './app.html',
})
export class App {
  authStore = inject(AuthStore);
  private route = inject(Router);
  private destroyRef = inject(DestroyRef);
  private lastOnlineRoute = '/';

  constructor() {
    this.trackLastOnlineRoute();
    this.registerConnectionWatch();
  }

  onSearch(query: string) {
    this.route.navigate(['/buscar'], { queryParams: { q: query } });
  }

  isAuthRoute() {
    const path = this.route.url;
    const authRoutes = ['/entrar', '/registrar'];
    return authRoutes.some((route) => path.startsWith(route));
  }

  isOfflineRoute() {
    return this.route.url.startsWith('/sem-conexao');
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
