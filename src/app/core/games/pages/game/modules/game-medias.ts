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
      <header class="flex items-center gap-3 px-4 py-4 border-b border-gray-6">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center border border-gray-6"
        >
          <i class="ph ph-film-strip text-[24px] text-blue-11"></i>
        </div>
        <div>
          <h3 class="text-2xl">Mídias</h3>
        </div>
      </header>

      <!-- Grid: vídeo + coluna lateral -->
      <div class="grid grid-cols-[70%_1fr] gap-1 max-md:grid-cols-1">
        <!-- Coluna esquerda: trailer -->
        <div class="aspect-video overflow-hidden bg-gray-1">
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
        <div class="flex flex-col gap-1 max-md:hidden relative">
          @for (screenshot of sideScreenshots(); track screenshot.$id) {
            <div
              class="group flex-1 cursor-pointer overflow-hidden bg-gray-1"
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
            class="absolute bottom-1 right-1 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-6 bg-gray-1/90 px-4 py-2 text-gray-11 backdrop-blur transition-colors hover:bg-gray-3 hover:text-gray-12"
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
        class="mt-2 flex w-full items-center justify-center gap-3 border-y border-gray-6 py-4 text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 md:hidden"
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
