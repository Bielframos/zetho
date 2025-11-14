import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/auth.store';
import { UiSerchInput } from './shared/ui/molecules/search-input/search-input';

@Component({
  selector: 'app-root',
  imports: [UiSerchInput, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  authStore = inject(AuthStore);
  private route = inject(Router)

  onSearch(query: string) {
    this.route.navigate(['/buscar'], { queryParams: { q: query } })
  }

  ngOnInit() {
    this.authStore.init();
  }
}
