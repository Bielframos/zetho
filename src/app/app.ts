import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { UserStore } from './core/auth/user.store';
import { UiSerchInput } from './shared/ui/molecules/search-input/search-input';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [UiSerchInput, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  userStore = inject(UserStore)
  private route = inject(Router)
  private meta = inject(Meta)

  onSearch(query: string) {
    this.route.navigate(['/buscar'], { queryParams: { q: query } })
  }

  isAuthRoute() {
    const path = this.route.url
    const authRoutes = ['/entrar', '/registrar']
    return authRoutes.some(route => path.startsWith(route))
  }
}
