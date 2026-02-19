import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/auth.store';
import { AppSearchInput } from './shared/app/search-input/search-input';

@Component({
  selector: 'app-root',
  imports: [AppSearchInput, RouterLink, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  authStore = inject(AuthStore);
  private route = inject(Router);

  onSearch(query: string) {
    this.route.navigate(['/buscar'], { queryParams: { q: query } });
  }

  isAuthRoute() {
    const path = this.route.url;
    const authRoutes = ['/entrar', '/registrar'];
    return authRoutes.some((route) => path.startsWith(route));
  }

  isGameRoute() {
    const path = this.route.url;
    return path.startsWith('/jogo');
  }
}
