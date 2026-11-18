import {
  Component,
  DestroyRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiLoading } from '../../shared/ui/loading';
import { AuthStore } from '../auth/auth.store';
import { SeoService } from '../system/seo/seo.service';
import { SpecialThemesStore } from './special-themes.store';
import { themeCampaignId } from './theme-campaign-route';
import { ThemesService } from './themes.service';
import type { ThemeCampaign } from './themes.types';

const dates = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeZone: 'America/Recife',
});

@Component({
  selector: 'app-theme-campaign',
  imports: [RouterLink, UiLoading],
  templateUrl: './theme-campaign.html',
  host: { class: 'block' },
})
export class ThemeCampaignPage {
  readonly auth = inject(AuthStore);
  readonly themes = inject(SpecialThemesStore);
  private readonly api = inject(ThemesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly seo = inject(SeoService);
  private request?: AbortController;
  private boundaryTimer?: ReturnType<typeof setTimeout>;
  readonly id = signal(
    themeCampaignId(this.route.snapshot.paramMap.get('id')) ?? '',
  );
  readonly campaign = signal<ThemeCampaign | null>(null);
  readonly loading = signal(true);
  readonly authReady = signal(false);
  readonly claiming = signal(false);
  readonly error = signal('');
  readonly claimError = signal('');
  readonly owner = computed(() =>
    this.themes.owned().some((theme) => theme.id === this.id()),
  );
  readonly equipped = computed(() => this.themes.selectedId() === this.id());
  readonly canActivate = computed(() =>
    this.themes.available().some((theme) => theme.id === this.id()),
  );
  readonly tropical = computed(() => this.id() === 'tropical-6');
  readonly windowLabel = computed(() => {
    const campaign = this.campaign();
    if (!campaign) return '';
    const start = Date.parse(campaign.startsAt);
    const end = Date.parse(campaign.endsAt);
    return Number.isFinite(start) && Number.isFinite(end) && end > start
      ? dates.formatRange(start, end - 1)
      : '';
  });

  constructor() {
    this.applySeo();
    afterNextRender(() => {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe((params) => {
          this.id.set(themeCampaignId(params.get('id')) ?? '');
          this.applySeo();
          this.campaign.set(null);
          this.claimError.set('');
          this.claiming.set(false);
          void this.load();
        });
      void this.auth.ready.then(() => this.authReady.set(true));
    });
    this.destroy.onDestroy(() => {
      this.request?.abort();
      clearTimeout(this.boundaryTimer);
    });
  }

  async load() {
    this.request?.abort();
    clearTimeout(this.boundaryTimer);
    const request = new AbortController();
    this.request = request;
    this.loading.set(true);
    this.error.set('');
    try {
      const id = this.id();
      if (!id) {
        this.error.set('Tema especial não encontrado.');
        return;
      }
      const details = await this.api.getThemeCampaign(id, request.signal);
      if (!request.signal.aborted) {
        this.campaign.set(details);
        const boundary =
          details.status === 'upcoming' ? details.startsAt : details.endsAt;
        const delay = Date.parse(boundary) - Date.parse(details.serverTime);
        if (details.status !== 'ended' && delay > 0) {
          this.boundaryTimer = this.zone.runOutsideAngular(() =>
            setTimeout(
              () => this.zone.run(() => void this.load()),
              Math.min(delay + 250, 86_400_000),
            ),
          );
        }
      }
    } catch (error) {
      if (!request.signal.aborted) {
        this.error.set(
          (error as { status?: number }).status === 404
            ? 'Tema especial não encontrado.'
            : 'Não foi possível carregar a campanha.',
        );
      }
    } finally {
      if (!request.signal.aborted) this.loading.set(false);
    }
  }

  private applySeo() {
    if (!this.tropical()) return;
    this.seo.apply({
      title: 'Tropical 6 | Zetho',
      description:
        'O pôr do sol de Vice City chegou mais cedo ao Zetho. Resgate o Tropical 6 de graça e dê um novo visual à sua biblioteca.',
      canonical: '/temas/tropical-6',
      ogImage: '/tropical-6-palms.webp',
    });
  }

  async claim() {
    if (
      this.claiming() ||
      !this.auth.isAuthenticated() ||
      this.campaign()?.status !== 'open'
    )
      return;
    const request = this.request;
    this.claiming.set(true);
    this.claimError.set('');
    try {
      await this.themes.claim(this.id());
    } catch (error) {
      if (request?.signal.aborted) return;
      const failure = error as { status?: number; message?: string };
      if (failure.status === 409) {
        this.claimError.set(
          failure.message || 'O resgate não está disponível.',
        );
        this.claiming.set(false);
        void this.load();
      } else {
        this.claimError.set(
          'Não foi possível resgatar o tema. Tente novamente.',
        );
      }
    } finally {
      if (request === this.request) this.claiming.set(false);
    }
  }
}
