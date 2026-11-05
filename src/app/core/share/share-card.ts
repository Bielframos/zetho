import { UiFounderBadge } from '../../shared/ui/founder-badge';
import { Component, computed, inject, input } from '@angular/core';
import { ShareService } from './share.service';
import {
  SHARE_BACKGROUNDS,
  SHARE_DIMENSIONS,
  ShareBackground,
  ShareCardData,
  ShareFormat,
  ShareFounderData,
  ShareLibraryData,
  ShareListData,
  ShareReviewData,
  ShareZereiData,
} from './share.types';

type StarKind = 'full' | 'half' | 'empty';

/**
 * Card visual de compartilhamento (renderizado no cliente e exportado como
 * PNG). Presentational: recebe dados, formato, fundo e opções, proxia as
 * imagens externas via ShareService e desenha a layout editorial. Estrutura
 * fixa: eyebrow de marca → herói → watermark.
 */
@Component({
  selector: 'ui-share-card',
  imports: [UiFounderBadge],
  standalone: true,
  host: { class: 'block color-mode-fixed-dark' },
  template: `
    <div
      class="relative flex flex-col overflow-hidden text-gray-12"
      [style.--gray-12]="exportForeground()"
      [style.--gray-11]="exportForeground()"
      [style.width.px]="dims().width"
      [style.height.px]="dims().height"
      [style.background]="bg().css"
      style="font-family: 'Readex Pro Variable', system-ui"
    >
      <!-- ===================== EYEBROW / MARCA ===================== -->
      <div class="flex items-center justify-between px-10 pt-10">
        <span
          class="font-display text-2xl leading-none text-gray-12"
          style="font-family: var(--font-display)"
          >zetho</span
        >
        <span
          class="text-xs font-medium uppercase tracking-[0.22em]"
          [style.color]="exportForeground()"
          >{{ eyebrow() }}</span
        >
      </div>

      @if (data().kind === 'founder') {
        <div class="flex min-h-0 flex-1 flex-col items-center justify-center px-10 text-center">
          <p class="text-2xl font-medium leading-tight">Eu faço parte do começo.</p>
          <div role="group" aria-label="Perfil do fundador" class="flex w-full flex-col items-center">
            <div class="relative shrink-0" [style.marginTop.px]="format() === 'story' ? 32 : 16"
              [style.width.px]="format() === 'story' ? 184 : 120"
              [style.height.px]="format() === 'story' ? 184 : 120">
              <img [src]="avatarUrl()" [alt]="'Avatar de @' + data().author.gamertag"
                class="h-full w-full rounded-full object-cover ring-1 ring-gray-6" />
              <img [src]="founder().badgeUrl" alt="Insígnia Fundador do Zetho"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 object-contain"
                [style.width.px]="format() === 'story' ? 80 : 56"
                [style.height.px]="format() === 'story' ? 80 : 56" />
            </div>
            <p class="w-full break-words text-2xl leading-tight"
              [style.marginTop.px]="format() === 'story' ? 40 : 32">{{ '@' + data().author.gamertag }}</p>
          </div>
          <p class="text-xs uppercase tracking-[0.22em]"
            [style.marginTop.px]="format() === 'story' ? 24 : 12">Meu número de fundador</p>
          <p class="mt-2 font-mono font-semibold tabular-nums leading-none tracking-tight"
            [style.fontSize.px]="format() === 'story' ? 88 : 56">{{ founder().code }}</p>
          @if (format() === 'story') {
            <p class="mt-4 text-sm">Minha história com os jogos também está aqui.</p>
          }
        </div>
      }

      <!-- ========================= ZEREI ========================= -->
      @if (data().kind === 'zerei') {
        <div
          class="flex flex-1 flex-col items-center justify-center gap-7 px-10 text-center"
        >
          @if (coverUrl()) {
            <img
              [src]="coverUrl()"
              alt=""
              class="w-40 rounded-xl ring-1 ring-gray-6"
              style="box-shadow: 0 24px 60px rgba(0,0,0,.55)"
            />
          }

          <div class="flex flex-col items-center gap-2">
            <p class="text-3xl leading-tight">{{ zerei().game.name }}</p>
            @if (zerei().game.releaseYear) {
              <p class="text-sm text-gray-11">{{ zerei().game.releaseYear }}</p>
            }
            @if (showRating() && zerei().rating) {
              <div class="mt-1 flex items-center gap-2">
                <div class="flex gap-0.5 text-xl text-gray-12">
                  @for (star of zereiStars(); track $index) {
                    @if (star === 'full') {
                      <i class="ph-fill ph-star"></i>
                    } @else if (star === 'half') {
                      <i class="ph-fill ph-star-half"></i>
                    } @else {
                      <i class="ph ph-star text-gray-12"></i>
                    }
                  }
                </div>
                <span class="text-lg tabular-nums text-gray-12">{{
                  zerei().rating
                }}</span>
              </div>
            }
          </div>

          @if (zerei().completedCount) {
            <div
              class="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-gray-11"
            >
              <span class="h-px w-8" [style.background]="bg().accent"></span>
              Meu {{ zerei().completedCount }}º jogo zerado
              <span class="h-px w-8" [style.background]="bg().accent"></span>
            </div>
          }
        </div>
      }

      <!-- ========================= REVIEW ========================= -->
      @if (data().kind === 'review') {
        <div class="flex flex-1 flex-col justify-center gap-7 px-10">
          <div class="flex items-start gap-5">
            @if (coverUrl()) {
              <img
                [src]="coverUrl()"
                alt=""
                class="w-28 shrink-0 rounded-lg ring-1 ring-gray-6"
                style="box-shadow: 0 18px 44px rgba(0,0,0,.5)"
              />
            }
            <div class="flex flex-col gap-2 pt-1">
              <p class="text-2xl leading-tight">{{ review().game.name }}</p>
              @if (review().game.releaseYear) {
                <p class="text-sm text-gray-11">
                  {{ review().game.releaseYear }}
                </p>
              }
              <div class="mt-1 flex gap-1 text-2xl text-gray-12">
                @for (star of stars(); track $index) {
                  @if (star === 'full') {
                    <i class="ph-fill ph-star"></i>
                  } @else if (star === 'half') {
                    <i class="ph-fill ph-star-half"></i>
                  } @else {
                    <i class="ph ph-star text-gray-12"></i>
                  }
                }
              </div>
            </div>
          </div>

          @if (reviewSnippet()) {
            <p
              class="border-l-2 pl-5 text-lg leading-relaxed text-gray-12"
              [style.borderColor]="bg().accent"
            >
              {{ reviewSnippet() }}
            </p>
          }
        </div>
      }

      <!-- ========================= LIBRARY ========================= -->
      @if (data().kind === 'library') {
        <div class="flex flex-1 flex-col justify-center gap-8 px-10">
          <div class="grid grid-cols-4 gap-2">
            @for (cover of libraryCovers(); track $index) {
              <img
                [src]="cover"
                alt=""
                class="w-full rounded-md ring-1 ring-gray-6"
              />
            }
          </div>

          <div class="grid grid-cols-4 gap-3 text-center">
            @for (stat of libraryStats(); track stat.label) {
              <div class="flex flex-col gap-1">
                <span class="text-3xl leading-none tabular-nums text-gray-12">{{
                  stat.value
                }}</span>
                <span class="text-xs uppercase tracking-wide text-gray-11">{{
                  stat.label
                }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ========================= LIST ========================= -->
      @if (data().kind === 'list') {
        <div class="flex flex-1 flex-col justify-center gap-7 px-10">
          <p class="text-3xl leading-tight">{{ list().title }}</p>

          <div class="grid gap-2.5" [style.gridTemplateColumns]="listCols()">
            @for (cover of listCovers(); track $index) {
              <img
                [src]="cover"
                alt=""
                class="w-full rounded-lg ring-1 ring-gray-6"
                style="box-shadow: 0 10px 24px rgba(0,0,0,.4)"
              />
            }
          </div>

          <p class="text-sm text-gray-11">
            {{ listCovers().length }} de {{ list().itemCount }} jogos
          </p>
        </div>
      }

      <!-- ========================= WATERMARK ========================= -->
      @if (data().kind === 'founder') {
        <p class="px-10 pb-8 pt-4 text-center text-xs text-gray-11">zetho.app</p>
      } @else {
      <div class="flex items-center gap-3 px-10 pb-10 pt-6">
        <img
          [src]="avatarUrl()"
          alt=""
          class="h-9 w-9 rounded-full ring-1 ring-gray-6"
        />
        <div class="flex flex-col leading-tight">
          <span class="text-sm text-gray-12">{{
            '@' + data().author.gamertag
          }} <ui-founder-badge [gamertag]="data().author.gamertag" /></span>
          <span class="text-xs text-gray-11">zetho.app</span>
        </div>
      </div>
      }
    </div>
  `,
})
export class UiShareCard {
  readonly exportForeground = computed(() => this.bg().foreground ?? '#edeef0');
  private share = inject(ShareService);

  data = input.required<ShareCardData>();
  format = input.required<ShareFormat>();
  background = input<ShareBackground | null>(null);
  showRating = input<boolean>(false);

  dims = computed(() => SHARE_DIMENSIONS[this.format()]);
  bg = computed(() => this.background() ?? SHARE_BACKGROUNDS[0]);

  founder = computed(() => this.data() as ShareFounderData);

  zerei = computed(() => this.data() as ShareZereiData);
  review = computed(() => this.data() as ShareReviewData);
  library = computed(() => this.data() as ShareLibraryData);
  list = computed(() => this.data() as ShareListData);

  eyebrow = computed(() => {
    switch (this.data().kind) {
      case 'founder':
        return 'Edição Fundador';
      case 'zerei':
        return 'Zerei';
      case 'review':
        return 'Review';
      case 'library':
        return 'Biblioteca';
      case 'list':
        return 'Lista';
    }
  });

  coverUrl = computed(() => {
    const d = this.data();
    if (d.kind !== 'zerei' && d.kind !== 'review') return null;
    return this.share.proxyImage(d.game.coverUrl, 400, 533);
  });

  avatarUrl = computed(() => {
    const author = this.data().author;
    const size = this.data().kind === 'founder' ? 400 : 96;
    if (author.avatarUrl) return this.share.proxyImage(author.avatarUrl, size, size);
    return this.share.initialsAvatar(author.gamertag, size);
  });

  libraryCovers = computed(() => {
    const d = this.data();
    if (d.kind !== 'library') return [];
    return d.covers
      .slice(0, 8)
      .map((url) => this.share.proxyImage(url, 200, 267))
      .filter((url): url is string => Boolean(url));
  });

  libraryStats = computed(() => {
    const d = this.data();
    if (d.kind !== 'library') return [];
    return [
      { label: 'Zerados', value: d.counts.completed },
      { label: 'Jogando', value: d.counts.playing },
      { label: 'Dropados', value: d.counts.dropped },
      { label: 'Wishlist', value: d.counts.wishlist },
    ];
  });

  listCovers = computed(() => {
    const d = this.data();
    if (d.kind !== 'list') return [];
    return d.covers
      .map((url) => this.share.proxyImage(url, 240, 320))
      .filter((url): url is string => Boolean(url));
  });

  listCols = computed(() => {
    const count = this.listCovers().length;
    const cols = count <= 3 ? Math.max(count, 1) : 5;
    return `repeat(${cols}, minmax(0, 1fr))`;
  });

  reviewSnippet = computed(() => {
    const d = this.data();
    if (d.kind !== 'review') return '';
    const text = (d.content ?? '').replace(/<[^>]*>/g, '').trim();
    return text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text;
  });

  stars = computed<StarKind[]>(() =>
    this.toStars(this.data().kind === 'review' ? this.review().rating : 0),
  );

  zereiStars = computed<StarKind[]>(() => this.toStars(this.zerei().rating ?? 0));

  private toStars(rating: number): StarKind[] {
    return Array.from({ length: 5 }, (_, index) => {
      const value = rating - index;
      if (value >= 1) return 'full';
      if (value >= 0.5) return 'half';
      return 'empty';
    });
  }
}
