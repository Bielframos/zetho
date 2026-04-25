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
    <article class="max-md:px-4">
      <header class="flex gap-4 items-center mb-6">
        <div
          class="h-10 w-10 flex items-center justify-center rounded-full bg-blue-3"
        >
          <i class="ph ph-film-strip text-blue-9 text-[24px]"></i>
        </div>
        <div>
          <h3 class="text-blue-12 text-2xl">Mídias</h3>
          <small class="text-gray-11">Trailers e screenshots do jogo</small>
        </div>
      </header>

      <!-- Grid: vídeo + coluna lateral -->
      <div class="grid grid-cols-[70%_1fr] gap-2 max-md:grid-cols-1">
        <!-- Coluna esquerda: trailer -->
        <div class="aspect-video overflow-hidden rounded-xl bg-blue-2">
          @if (primaryVideo()) {
            <iframe
              class="w-full h-full"
              [src]="getEmbedUrl(primaryVideo()!.url)"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              [title]="primaryVideo()!.name || 'Trailer'"
            ></iframe>
          } @else if (screenshots()[0]) {
            <img
              class="w-full h-full object-cover cursor-pointer"
              [src]="screenshots()[0].url"
              alt="Screenshot"
              (click)="openGallery(0)"
            />
          }
        </div>

        <!-- Coluna direita: 2 screenshots + botão galeria -->
        <div class="flex flex-col gap-2 max-md:hidden relative">
          @for (screenshot of sideScreenshots(); track screenshot.$id) {
            <div
              class="flex-1 overflow-hidden rounded-xl bg-blue-2 cursor-pointer group"
              (click)="openGallery(screenshots().indexOf(screenshot))"
            >
              <img
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                [src]="screenshot.url"
                [alt]="screenshot.name || 'Screenshot'"
              />
            </div>
          }

          <!-- Botão abrir galeria -->
          <button
            class="absolute bottom-1 right-1 rounded-xl bg-blue-3 hover:bg-blue-4 items-center transition-colors flex w-fit px-4 py-2 gap-2 text-gray-11 hover:text-gray-12 cursor-pointer"
            (click)="openGallery(0)"
            aria-label="Abrir galeria de imagens"
          >
            <i class="ph ph-images text-[32px]"></i>

            <div class="flex flex-col items-start">
              <span class="text-sm font-medium">Ver galeria</span>
              <span class="text-xs text-gray-10"
                >{{ screenshots().length }} imagens</span
              >
            </div>
          </button>
        </div>
      </div>

      <!-- Botão galeria no mobile (fora do grid) -->
      <button
        class="md:hidden mt-2 w-full rounded-xl bg-blue-3 hover:bg-blue-4 transition-colors flex items-center justify-center gap-3 py-4 text-gray-11 hover:text-gray-12"
        (click)="openGallery(0)"
        aria-label="Abrir galeria de imagens"
      >
        <i class="ph ph-images text-[24px]"></i>
        <span class="text-sm font-medium">Ver galeria</span>
        <span class="text-xs text-gray-10"
          >({{ screenshots().length }} imagens)</span
        >
      </button>
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
            class="max-h-[80vh] max-w-full object-contain rounded-lg"
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
  sideScreenshots = computed(() => this.screenshots().slice(0, 2));
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
