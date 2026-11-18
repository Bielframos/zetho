import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorModeStore } from '../../core/system/color-mode/color-mode.store';
import { SpecialThemesStore } from '../../core/themes/special-themes.store';

const controlClasses =
  'flex size-11 cursor-pointer items-center justify-center rounded-md p-0 text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:size-9';

@Component({
  selector: 'ui-color-mode-selector',
  imports: [RouterLink],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <fieldset class="flex items-center text-content">
      <legend class="sr-only">Aparência</legend>
      <div class="inline-flex items-center gap-0.5">
        @for (option of options; track option.value) {
          <button
            type="button"
            [class]="controlClasses"
            [attr.aria-label]="option.label"
            [title]="option.label"
            [attr.aria-pressed]="
              !modes.special() && modes.preference() === option.value
            "
            (click)="themes.selectStandard(option.value)"
          >
            <span
              class="flex size-6 items-center justify-center rounded-md"
              [class.bg-surface-raised]="
                !modes.special() && modes.preference() === option.value
              "
              [class.text-link]="
                !modes.special() && modes.preference() === option.value
              "
            >
              <i aria-hidden="true" [class]="option.icon + ' text-[16px]'"></i>
            </span>
          </button>
        }
        <details
          #special
          class="group relative"
          (focusout)="closeOnBlur($event, special)"
          (keydown.escape)="closeOnEscape($event, special, trigger)"
        >
          <summary
            #trigger
            [class]="
              controlClasses + ' list-none [&::-webkit-details-marker]:hidden'
            "
            aria-label="Temas especiais"
            [title]="activeTheme()?.name || 'Temas especiais'"
          >
            <span
              class="flex size-6 items-center justify-center rounded-md group-open:bg-surface-raised"
              [class.bg-surface-raised]="!!modes.special()"
              [class.text-link]="!!modes.special()"
            >
              <i
                aria-hidden="true"
                [class]="themeIcon(activeTheme()?.appearance) + ' text-[16px]'"
              ></i>
            </span>
          </summary>
          <div
            class="absolute inset-x-0 bottom-full z-40 mb-1 flex max-h-48 flex-col overflow-y-auto rounded-lg bg-surface shadow-lg ring-1 ring-line-strong"
          >
            @if (themes.loading()) {
              <span class="sr-only" role="status">Carregando temas…</span>
            }
            @for (theme of themeOptions(); track theme.id) {
              <button
                type="button"
                [class]="
                  controlClasses + ' shrink-0 focus-visible:-outline-offset-2'
                "
                [attr.aria-label]="theme.name"
                [title]="theme.name"
                (click)="
                  themes.select(theme.id); special.open = false; trigger.focus()
                "
              >
                <i
                  aria-hidden="true"
                  [class]="themeIcon(theme.appearance) + ' text-[16px]'"
                ></i>
              </button>
            }
            @if (themes.failed()) {
              <button
                type="button"
                [class]="
                  controlClasses + ' shrink-0 focus-visible:-outline-offset-2'
                "
                aria-label="Tentar carregar temas"
                title="Tentar carregar temas"
                (click)="themes.retry()"
              >
                <i
                  class="ph ph-arrow-clockwise text-[16px]"
                  aria-hidden="true"
                ></i>
              </button>
            }
            @if (showTropicalCampaign()) {
              <a
                routerLink="/temas/tropical-6"
                [class]="
                  controlClasses + ' shrink-0 focus-visible:-outline-offset-2'
                "
                aria-label="Campanha Tropical 6"
                title="Campanha Tropical 6"
                (click)="special.open = false"
              >
                <i
                  aria-hidden="true"
                  [class]="
                    (activeTheme()?.id === 'tropical-6'
                      ? 'ph ph-arrow-square-out'
                      : themeIcon('tropical-6')) + ' text-[16px]'
                  "
                ></i>
              </a>
            }
          </div>
        </details>
      </div>
    </fieldset>
  `,
})
export class ColorModeSelector {
  readonly modes = inject(ColorModeStore);
  readonly themes = inject(SpecialThemesStore);
  readonly activeTheme = computed(() =>
    this.themes
      .available()
      .find((theme) => theme.id === this.themes.selectedId()),
  );
  readonly themeOptions = computed(() =>
    this.themes
      .available()
      .filter((theme) => theme.id !== this.themes.selectedId()),
  );
  readonly showTropicalCampaign = computed(
    () => !this.themeOptions().some((theme) => theme.id === 'tropical-6'),
  );
  readonly controlClasses = controlClasses;
  readonly options = [
    { value: 'light', label: 'Claro', icon: 'ph ph-sun' },
    { value: 'dark', label: 'Escuro', icon: 'ph ph-moon' },
    { value: 'system', label: 'Sistema', icon: 'ph ph-monitor' },
  ] as const;

  themeIcon(appearance?: string) {
    return appearance === 'tropical-6' ? 'ph ph-tree-palm' : 'ph ph-sparkle';
  }

  closeOnBlur(event: FocusEvent, menu: HTMLDetailsElement) {
    if (
      event.relatedTarget instanceof Node &&
      !menu.contains(event.relatedTarget)
    ) {
      menu.open = false;
    }
  }

  closeOnEscape(event: Event, menu: HTMLDetailsElement, trigger: HTMLElement) {
    if (!menu.open) return;
    event.stopPropagation();
    menu.open = false;
    trigger.focus();
  }
}
