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

  ngOnInit() {
    const description = 'A melhor forma de registrar e acompanhar os jogos que você zerou.';
    const image = 'https://api.zereiapp.com/v1/storage/buckets/zerei-medias/files/zerei-placeholder-img/view?project=690a16460002c718253a&mode=admin';
    const url = 'https://www.zereiapp.com';

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: 'jogos, zerei, games' });

    this.meta.updateTag({ property: 'og:title', content: 'Zerei App' });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
