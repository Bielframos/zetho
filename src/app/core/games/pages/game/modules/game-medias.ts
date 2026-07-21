import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import type { GameMedia } from '../../../game.types';

@Component({
  selector: 'ui-game-medias',
  standalone: true,
  template: `
    <article>
      <!-- Trailer: elemento principal da aba -->
      @if (primaryVideo()) {
        <div class="aspect-video overflow-hidden border-b border-gray-6 bg-gray-1">
          <iframe
            class="h-full w-full"
            [src]="getEmbedUrl(primaryVideo()!.url)"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            [title]="primaryVideo()!.name || 'Trailer'"
          ></iframe>
        </div>
      } @else if (heroScreenshot(); as hero) {
        <button
          type="button"
          class="group block aspect-video w-full cursor-pointer overflow-hidden border-b border-gray-6 bg-gray-1"
          (click)="openGallery(screenshots().indexOf(hero))"
          aria-label="Ampliar screenshot"
        >
          <img
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            [src]="hero.url"
            [alt]="hero.name || 'Screenshot'"
          />
        </button>
      }

      <!-- Galeria: todas as screenshots, sempre visíveis -->
      @if (gridScreenshots().length > 0) {
        <div class="flex items-baseline justify-between px-4 py-3">
          <span class="text-xs uppercase tracking-wide text-gray-11"
            >Imagens</span
          >
          <span class="text-xs text-gray-10"
            >{{ gridScreenshots().length }}</span
          >
        </div>

        <ul class="grid grid-cols-2 gap-px bg-gray-6 sm:grid-cols-3 lg:grid-cols-4">
          @for (screenshot of gridScreenshots(); track screenshot.$id) {
            <li>
              <button
                type="button"
                class="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-gray-1"
                (click)="openGallery(screenshots().indexOf(screenshot))"
                aria-label="Ampliar screenshot"
              >
                <img
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  [src]="screenshot.url"
                  [alt]="screenshot.name || 'Screenshot'"
                />
                <span
                  class="absolute inset-0 flex items-center justify-center bg-gray-1/0 opacity-0 transition-all duration-200 group-hover:bg-gray-1/40 group-hover:opacity-100"
                >
                  <i class="ph ph-arrows-out text-2xl text-gray-12"></i>
                </span>
              </button>
            </li>
          }
        </ul>
      }
    </article>

    <!-- Lightbox -->
    <dialog
      #galleryModal
      class="fixed inset-0 m-0 p-0 w-screen h-screen max-w-none max-h-none border-none bg-transparent backdrop:bg-black/90"
      aria-label="Galeria de imagens"
      (click)="closeGallery()"
    >
      <!-- Fechar -->
      <button
        class="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 cursor-pointer"
        (click)="closeGallery()"
        aria-label="Fechar galeria"
      >
        <i class="ph ph-x text-[28px]"></i>
      </button>

      <!-- Anterior -->
      <button
        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2 z-10 cursor-pointer"
        (click)="$event.stopPropagation(); prevImage()"
        aria-label="Imagem anterior"
      >
        <i class="ph ph-caret-left text-[40px]"></i>
      </button>

      <!-- Imagem atual -->
      <div
        class="max-w-5xl mx-auto h-full px-16 flex flex-col justify-center"
        (click)="$event.stopPropagation()"
      >
        @if (currentScreenshot()) {
          <img
            class="max-h-[80vh] max-w-full object-contain"
            [src]="currentScreenshot()!.url"
            [alt]="currentScreenshot()!.name || 'Screenshot'"
          />
          <p class="text-center text-gray-400 text-sm mt-3">
            {{ lightboxIndex() + 1 }} / {{ screenshots().length }}
          </p>
        }
      </div>

      <!-- Próxima -->
      <button
        class="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2 z-10 cursor-pointer"
        (click)="$event.stopPropagation(); nextImage()"
        aria-label="Próxima imagem"
      >
        <i class="ph ph-caret-right text-[40px]"></i>
      </button>
    </dialog>
  `,
})
export class UiGameMedias {
  private galleryModal =
    viewChild<ElementRef<HTMLDialogElement>>('galleryModal');
  medias = input<GameMedia[]>([]);

  private sanitizer = inject(DomSanitizer);

  lightboxIndex = signal(0);

  videos = computed(() => this.medias().filter((m) => m.type === 'video'));
  screenshots = computed(() =>
    this.medias().filter(
      (m) => m.type === 'screenshot' || m.type === 'art_work',
    ),
  );

  primaryVideo = computed(() => this.videos()[0] ?? null);

  // Sem trailer, a primeira screenshot vira o destaque principal da aba.
  heroScreenshot = computed(() =>
    this.primaryVideo() ? null : (this.screenshots()[0] ?? null),
  );

  // Galeria completa: exclui a screenshot já exibida como destaque (quando não há trailer).
  gridScreenshots = computed(() =>
    this.primaryVideo() ? this.screenshots() : this.screenshots().slice(1),
  );

  currentScreenshot = computed(
    () => this.screenshots()[this.lightboxIndex()] ?? null,
  );

  getEmbedUrl(url: string): SafeResourceUrl {
    const match = url.match(/[?&]v=([^&]+)/);
    const videoId = match?.[1] ?? '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`,
    );
  }

  openGallery(index = 0) {
    this.lightboxIndex.set(index);
    this.galleryModal()?.nativeElement.showModal();
  }

  closeGallery() {
    this.galleryModal()?.nativeElement.close();
  }

  prevImage() {
    const count = this.screenshots().length;
    this.lightboxIndex.update((i) => (i - 1 + count) % count);
  }

  nextImage() {
    const count = this.screenshots().length;
    this.lightboxIndex.update((i) => (i + 1) % count);
  }
}
