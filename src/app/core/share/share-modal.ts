import { UiSegmentedControl } from '../../shared/ui/segmented-control';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { NotificationStore } from '../system/notifications/notification.store';
import { UiShareCard } from './share-card';
import { ShareService } from './share.service';
import {
  SHARE_BACKGROUNDS,
  SHARE_DIMENSIONS,
  SHARE_LIST_COUNTS,
  ShareCardData,
  ShareFormat,
  themeToBackground,
} from './share.types';

// Área de preview: altura fixa para o modal não "pular" ao trocar de formato;
// o card escala para caber pelas duas dimensões.
const PREVIEW_MAX_H = 360;
const PREVIEW_MAX_W = 300;

/**
 * Modal de compartilhamento: preview ao vivo do card (o mesmo nó exportado),
 * escolha de formato (Story/Quadrado) e de fundo (presets + tema do perfil), e
 * entrega via share nativo ou download.
 *
 * Uso: `<ui-share-modal #share [data]="data()"></ui-share-modal>` + um gatilho
 * chamando `share.open()`.
 */
@Component({
  selector: 'ui-share-modal',
  standalone: true,
  imports: [UiShareCard, UiSegmentedControl],
  template: `
    <dialog
      #dialog
      class="m-0 max-h-none max-w-none border-none bg-transparent p-0 backdrop:bg-black/80 lg:m-auto"
      (click)="onBackdrop($event)"
    >
      <div
        class="flex h-dvh w-screen flex-col gap-5 overflow-y-auto bg-gray-1 p-5 text-gray-12 lg:h-auto lg:max-h-[90dvh] lg:w-[26rem] lg:border lg:border-gray-6"
      >
        <header
          class="flex items-center justify-between border-b border-gray-6 pb-4"
        >
          <h2 class="text-xl">Compartilhar</h2>
          <button
            type="button"
            class="ui-ghost-btn"
            data-size="icon"
            (click)="close()"
            aria-label="Fechar"
          >
            <i class="ph ph-x"></i>
          </button>
        </header>

        <!-- Preview: área de altura fixa, card centralizado e escalado -->
        <div class="flex items-center justify-center" [style.height.px]="areaH">
          <div
            class="overflow-hidden border border-gray-6"
            style="box-shadow: 0 20px 50px rgba(0,0,0,.45)"
            [style.width.px]="scaledW()"
            [style.height.px]="scaledH()"
          >
            <div
              #captureRoot
              [style.width.px]="dims().width"
              [style.height.px]="dims().height"
              [style.transform]="'scale(' + scale() + ')'"
              style="transform-origin: top left"
            >
              @if (displayData()) {
                <ui-share-card
                  [data]="displayData()!"
                  [format]="format()"
                  [background]="selectedBg()"
                  [showRating]="includeRating()"
                ></ui-share-card>
              }
            </div>
          </div>
        </div>

        <!-- Formato -->
        <div class="flex flex-col gap-2">
          <span class="text-xs uppercase tracking-wide text-gray-11"
            >Formato</span
          >
          <ui-segmented-control
            label="Formato"
            [options]="formats"
            [value]="format()"
            (valueChange)="format.set($event)"
          />
        </div>

        <!-- Jogos + Layout (apenas para listas) -->
        @if (data()?.kind === 'list') {
          <div class="flex flex-col gap-2">
            <span class="text-xs uppercase tracking-wide text-gray-11"
              >Jogos</span
            >
            <ui-segmented-control
              label="Quantidade de jogos"
              [options]="listCountOptions"
              [value]="listCount()"
              (valueChange)="listCount.set($event)"
            />
          </div>
        }

        <!-- Incluir nota (apenas no card de jogo, se houver review) -->
        @if (data()?.kind === 'zerei' && zereiHasRating()) {
          <label
            class="flex cursor-pointer items-center gap-2 text-sm text-gray-11"
          >
            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer accent-blue-9"
              [checked]="includeRating()"
              (change)="includeRating.set($any($event.target).checked)"
            />
            Incluir minha nota
          </label>
        }

        <!-- Fundo -->
        <div class="flex flex-col gap-2">
          <div class="flex items-baseline justify-between">
            <span class="text-xs uppercase tracking-wide text-gray-11"
              >Fundo</span
            >
            <span class="text-xs text-gray-11">{{ selectedBg().label }}</span>
          </div>
          <div class="flex gap-3">
            @for (bg of backgrounds(); track bg.id) {
              <button
                type="button"
                class="h-9 w-9 cursor-pointer transition-transform hover:scale-105"
                [class]="
                  selectedBgId() === bg.id
                    ? 'ring-2 ring-blue-9 ring-offset-2 ring-offset-gray-1'
                    : 'ring-1 ring-gray-6 hover:ring-gray-8'
                "
                [style.background]="bg.css"
                [title]="bg.label"
                [attr.aria-label]="'Fundo ' + bg.label"
                [attr.aria-pressed]="selectedBgId() === bg.id"
                (click)="selectedBgId.set(bg.id)"
              ></button>
            }
          </div>
        </div>

        <!-- Ação -->
        <button
          type="button"
          class="ui-primary-btn mt-1 w-full"
          [disabled]="generating()"
          (click)="generate()"
        >
          <i class="ph ph-share-network"></i>
          {{ generating() ? 'Gerando…' : 'Baixar / Compartilhar' }}
        </button>
      </div>
    </dialog>
  `,
})
export class UiShareModal {
  private shareService = inject(ShareService);
  private notification = inject(NotificationStore);
  private authStore = inject(AuthStore);

  data = input<ShareCardData | null>(null);

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private captureRoot =
    viewChild.required<ElementRef<HTMLElement>>('captureRoot');

  formats: { id: ShareFormat; label: string }[] = [
    { id: 'story', label: 'Story 9:16' },
    { id: 'square', label: 'Quadrado 1:1' },
  ];

  format = signal<ShareFormat>('story');
  selectedBgId = signal<string>(SHARE_BACKGROUNDS[0].id);
  listCount = signal<number>(5);
  includeRating = signal(false);
  generating = signal(false);

  readonly listCountOptions = SHARE_LIST_COUNTS.map((id) => ({ id, label: `${id} primeiros` }));
  areaH = PREVIEW_MAX_H;

  zereiHasRating = computed(() => {
    const d = this.data();
    return d?.kind === 'zerei' && d.rating != null;
  });

  // Aplica o corte de N itens quando o conteúdo é uma lista.
  displayData = computed<ShareCardData | null>(() => {
    const d = this.data();
    if (!d) return null;
    if (d.kind === 'list') {
      return { ...d, covers: d.covers.slice(0, this.listCount()) };
    }
    return d;
  });

  backgrounds = computed(() => {
    const theme = themeToBackground(this.authStore.activeTheme());
    return theme ? [...SHARE_BACKGROUNDS, theme] : SHARE_BACKGROUNDS;
  });

  selectedBg = computed(() => {
    const id = this.selectedBgId();
    return this.backgrounds().find((bg) => bg.id === id) ?? this.backgrounds()[0];
  });

  dims = computed(() => SHARE_DIMENSIONS[this.format()]);
  scale = computed(() =>
    Math.min(
      PREVIEW_MAX_H / this.dims().height,
      PREVIEW_MAX_W / this.dims().width,
    ),
  );
  scaledW = computed(() => Math.round(this.dims().width * this.scale()));
  scaledH = computed(() => Math.round(this.dims().height * this.scale()));

  open() {
    this.dialog().nativeElement.showModal();
  }

  close() {
    this.dialog().nativeElement.close();
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  async generate() {
    if (this.generating() || !this.data()) return;

    this.generating.set(true);
    try {
      const blob = await this.shareService.exportNode(
        this.captureRoot().nativeElement,
        this.dims().width,
        this.dims().height,
      );
      const filename = `zetho-${this.data()!.kind}-${this.format()}.png`;
      const result = await this.shareService.deliver(blob, filename);
      if (result === 'downloaded') {
        this.notification.show({
          message: 'Imagem baixada!',
          type: 'success',
        });
      }
    } catch (error) {
      console.error(error);
      this.notification.show({
        message: 'Não foi possível gerar a imagem.',
        type: 'error',
      });
    } finally {
      this.generating.set(false);
    }
  }
}
