import { UiShareModal } from '../../../share/share-modal';
import { ShareFounderData } from '../../../share/share.types';
import { EmailConfirmationNotice } from '../../components/email-confirmation-notice';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../auth.store';
import { SocialApi } from '../../../../shared/infra/social-api';
import { FounderDirectory } from '../../../../shared/ui/founder-badge';
import { UiLoading } from '../../../../shared/ui/loading';
import { environment } from '../../../../../environments/environment';

export type FounderReceipt =
  | { status: 'awarded'; number: number; code: string }
  | { status: 'verification_required' | 'pending' | 'not_eligible' };

@Component({
  selector: 'app-founder-page',
  standalone: true,
  imports: [RouterLink, UiLoading, UiShareModal, EmailConfirmationNotice],
  templateUrl: './founder.html',
  host: { class: 'flex w-full flex-1' },
})
export class FounderPage {
  readonly auth = inject(AuthStore);
  private readonly api = inject(SocialApi);
  private readonly directory = inject(FounderDirectory);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly receipt = signal<FounderReceipt | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly imageFailed = signal(false);
  readonly imageUrl = new URL(
    'achievements/founder-badge/image',
    environment.zethoApiEndpoint,
  ).toString();
  readonly shareData = computed<ShareFounderData | null>(() => {
    const receipt = this.receipt();
    const profile = this.auth.profile();
    if (!this.auth.user() || receipt?.status !== 'awarded' || !profile?.gamertag)
      return null;
    return {
      kind: 'founder',
      author: { gamertag: profile.gamertag, avatarUrl: profile.avatarUrl },
      code: receipt.code,
      badgeUrl: this.imageUrl,
    };
  });
  private generation = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
    });
    effect(() => {
      const userId = this.auth.user()?.$id;
      this.generation++;
      this.receipt.set(null);
      this.error.set('');
      this.loading.set(true);
      if (!this.browser) return;
      if (userId) void this.load();
      else {
        const generation = this.generation;
        void this.auth.ready.then(() => {
          if (generation === this.generation) this.loading.set(false);
        });
      }
    });
  }

  async load() {
    const userId = this.auth.user()?.$id;
    if (!userId) return;
    const generation = ++this.generation;
    const current = () =>
      generation === this.generation && this.auth.user()?.$id === userId;
    this.loading.set(true);
    this.error.set('');
    try {
      const receipt = await this.api.request<FounderReceipt>(
        'achievements/me/founder',
        'GET',
        undefined,
        current,
      );
      if (!current()) return;
      this.receipt.set(receipt);
      if (receipt.status === 'awarded') {
        this.directory.invalidate();
        void this.directory.load();
      }
    } catch {
      if (current())
        this.error.set(
          'Não foi possível carregar sua insígnia. Tente novamente.',
        );
    } finally {
      if (current()) this.loading.set(false);
    }
  }
}
