import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiLoading } from '../../shared/ui/loading';
import { SeoService } from '../system/seo/seo.service';
import { Founder, FoundersService } from './founders.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-founders-page',
  imports: [RouterLink, UiLoading],
  templateUrl: './founders.html',
})
export class FoundersPage implements OnInit {
  private readonly service = inject(FoundersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly founders = signal<Founder[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly failedAvatars = signal<ReadonlySet<string>>(new Set());
  readonly badgeImageUrl = new URL('achievements/founder-badge/image', environment.zethoApiEndpoint).toString();
  readonly badgeImageFailed = signal(false);

  constructor() {
    inject(SeoService).apply({
      title: 'Fundadores | Zetho',
      description: 'Conheça os fundadores que fazem parte do início da comunidade Zetho.',
      canonical: '/fundadores',
      robots: 'index,follow',
      ogType: 'website',
    });
  }

  ngOnInit() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const founders = await this.service.list();
      if (!this.destroyRef.destroyed) this.founders.set(founders);
    } catch {
      if (!this.destroyRef.destroyed) this.error.set(true);
    } finally {
      if (!this.destroyRef.destroyed) this.loading.set(false);
    }
  }

  avatarFailed(gamertag: string) {
    this.failedAvatars.update((failed) => new Set([...failed, gamertag]));
  }
}
