import { isPlatformBrowser, Location } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthService } from '../../auth.service';
import { AuthStore } from '../../auth.store';

@Component({
  selector: 'app-verification-page',
  standalone: true,
  imports: [UiLoading, RouterLink],
  templateUrl: './verification.html',
  host: { class: 'flex w-full flex-1' },
})
export class VerificationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStore);
  readonly loading = signal(true);
  readonly verified = signal(false);
  readonly error = signal('');
  private generation = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.generation++);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      void this.verify(params.get('userId'), params.get('secret'));
    });
  }

  private async verify(userId: string | null, secret: string | null) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.verified.set(false);
    this.error.set('');
    if (!userId || !secret) {
      this.error.set(
        'Este link está incompleto. Solicite um novo e-mail de confirmação em Minha conta.',
      );
      this.loading.set(false);
      return;
    }
    try {
      // Appwrite validates token expiry. Redeem only in the browser, even during SSR.
      await this.authService.verifyEmail(userId, secret);
      if (generation !== this.generation) return;
      this.verified.set(true);
      this.location.replaceState('/verificacao');
      await this.authStore.ready;
      if (generation !== this.generation) return;
      if (this.authStore.user()?.$id === userId) {
        await this.authStore.refresh();
        if (
          generation === this.generation &&
          this.authStore.user()?.$id === userId
        ) {
          await this.router.navigate(['/fundador'], { replaceUrl: true });
        }
      }
    } catch {
      if (generation === this.generation)
        this.error.set(
          'Não foi possível confirmar com este link. Ele pode ter expirado ou já ter sido utilizado. Entre na sua conta para conferir ou solicitar um novo e-mail.',
        );
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  async signIn() {
    if (this.authStore.user()) await this.authStore.logout();
    await this.router.navigate(['/entrar'], { queryParams: { founder: '1' } });
  }
}
