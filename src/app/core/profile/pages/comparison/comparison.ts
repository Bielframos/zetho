import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiEmptyState } from '../../../../shared/ui/empty-state';
import { UiSegmentedControl, UiSegmentOption } from '../../../../shared/ui/segmented-control';
import { UiZethoIcon } from '../../../../shared/ui/zetho-icon';
import { UiLoading } from '../../../../shared/ui/loading';
import { AuthStore } from '../../../auth/auth.store';
import { ZEntryService } from '../../../zEntries/zEntries.service';
import { SeoService } from '../../../system/seo/seo.service';
import {
  ComparisonOrder,
  ComparisonPageResult,
  ComparisonRow,
  ComparisonService,
  ComparisonView,
} from './comparison.service';

@Component({
  selector: 'app-profile-comparison',
  imports: [RouterLink, UiEmptyState, UiLoading, UiSegmentedControl, UiZethoIcon],
  templateUrl: './comparison.html',
})
export class ProfileComparisonPage {
  readonly auth = inject(AuthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ComparisonService);
  private entries = inject(ZEntryService);
  private destroyRef = inject(DestroyRef);
  private seo = inject(SeoService);
  private generation = 0;
  private alive = true;
  private wishlistOwner = '';
  readonly gamertag = signal('');
  readonly view = signal<ComparisonView>('common');
  readonly order = signal<ComparisonOrder>('similar');
  readonly offset = signal(0);
  readonly result = signal<ComparisonPageResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly wishlisted = signal(new Set<string>());
  readonly saving = signal(new Set<string>());
  readonly actionErrors = signal<Record<string, string>>({});
  readonly orders: readonly UiSegmentOption<ComparisonOrder>[] = [
    { id: 'similar', label: 'Notas parecidas' },
    { id: 'different', label: 'Maiores diferenças' },
  ];
  private readonly ratingNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  formatRating(rating: number) { return this.ratingNumber.format(rating); }

  readonly tabs: { key: ComparisonView; label: string }[] = [
    { key: 'common', label: 'Jogos em comum' },
    { key: 'opinions', label: 'Opiniões em comum' },
    { key: 'discoveries', label: 'Descobertas' },
  ];

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.alive = false;
      this.generation++;
    });
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.gamertag.set(params.get('gamertag') ?? ''));
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const view = params.get('view');
        this.view.set(
          view === 'opinions' || view === 'discoveries' ? view : 'common',
        );
        this.order.set(
          params.get('order') === 'different' ? 'different' : 'similar',
        );
        const offset = Number(params.get('offset') ?? 0);
        this.offset.set(
          Number.isSafeInteger(offset) && offset >= 0 ? offset : 0,
        );
      });
    effect(() => {
      const gamertag = this.gamertag();
      const profile = this.auth.profile();
      const authenticated = this.auth.isAuthenticated();
      const view = this.view();
      const order = this.order();
      const offset = this.offset();
      this.generation++;
      if (this.wishlistOwner !== (profile?.$id ?? '')) {
        this.wishlistOwner = profile?.$id ?? '';
        this.wishlisted.set(new Set());
        this.actionErrors.set({});
      }
      this.result.set(null);
      if (!authenticated || !profile) {
        this.loading.set(false);
        this.error.set('Entre na sua conta para comparar jogadores.');
        return;
      }
      if (gamertag === profile.gamertag) {
        this.loading.set(false);
        this.error.set('Visite o perfil de outro jogador para comparar.');
        return;
      }
      this.seo.apply({
        title: `Comparar com ${gamertag} — Zetho`,
        canonical: `/player/${encodeURIComponent(gamertag)}/comparar`,
        robots: 'noindex,nofollow',
      });
      void this.load(gamertag, view, order, offset);
    });
  }

  async load(
    gamertag = this.gamertag(),
    view = this.view(),
    order = this.order(),
    offset = this.offset(),
  ) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.load(gamertag, view, order, offset);
      if (this.alive && generation === this.generation) this.result.set(result);
    } catch {
      if (this.alive && generation === this.generation)
        this.error.set(
          'Não foi possível carregar a comparação. O perfil pode estar indisponível.',
        );
    } finally {
      if (this.alive && generation === this.generation) this.loading.set(false);
    }
  }

  change(view = this.view(), order = this.order(), offset = 0) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view, order, offset },
      queryParamsHandling: 'merge',
    });
  }

  status(value: string | null) {
    return (
      (
        {
          completed: 'Zerou',
          backlog: 'Na biblioteca',
          playing: 'Jogando',
          dropped: 'Abandonou',
          wishlist: 'Lista de desejos',
        } as Record<string, string>
      )[value ?? ''] ?? 'Fora da biblioteca'
    );
  }

  async addToWishlist(row: ComparisonRow) {
    const profile = this.auth.profile();
    const id = row.game.id;
    if (!profile || this.saving().has(id) || this.wishlisted().has(id)) return;
    this.saving.update((current) => new Set(current).add(id));
    this.actionErrors.update((current) => ({ ...current, [id]: '' }));
    try {
      const current = await this.entries.getEntry(profile.fingerprint, id);
      if (!this.alive || this.auth.profile()?.$id !== profile.$id) return;
      // Recheck the current library before writing; never toggle or overwrite an existing status.
      if (!current?.status)
        await this.entries.createEntryLog(profile.fingerprint, id, current, {
          status: 'wishlist',
        });
      if (this.alive && this.auth.profile()?.$id === profile.$id)
        this.wishlisted.update((current) => new Set(current).add(id));
    } catch {
      this.actionErrors.update((current) => ({
        ...current,
        [id]: 'Não foi possível adicionar. Tente novamente.',
      }));
    } finally {
      this.saving.update((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }
}
