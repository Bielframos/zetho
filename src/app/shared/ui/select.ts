import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export interface UiSelectOption {
  value: string;
  label: string;
  icon?: string;
  logo?: string;
  searchText?: string;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div class="relative" (focusout)="onFocusOut($event)">
      <label
        [id]="id + '-label'"
        [for]="id"
        [class]="hideLabel() ? 'sr-only' : 'mb-2 block text-sm text-gray-11'"
        >{{ label() }}</label
      >
      <button
        type="button"
        [id]="id"
        [attr.role]="searchable() ? null : 'combobox'"
        aria-haspopup="listbox"
        [attr.aria-labelledby]="id + '-label'"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? id + '-options' : null"
        [attr.aria-activedescendant]="
          open() ? id + '-option-' + active() : null
        "
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
        class="flex min-h-12 w-full items-center gap-3 rounded-lg border border-gray-6 bg-gray-2 px-3 py-2 text-left text-sm text-gray-12 transition-colors hover:border-gray-8 focus:outline-none focus:ring-2 focus:ring-blue-6 disabled:cursor-not-allowed disabled:opacity-50"
      >
        @if (selected()?.logo; as logo) {
          <span
            class="h-5 w-8 shrink-0 bg-current"
            [style.mask-image]="'url(' + logo + ')'"
            style="mask-size:contain;mask-position:center;mask-repeat:no-repeat"
            aria-hidden="true"
          ></span>
        } @else if (selected()?.icon; as icon) {
          <i class="ph {{ icon }} text-blue-11" aria-hidden="true"></i>
        }
        <span class="min-w-0 flex-1 truncate">{{
          selected()?.label ?? placeholder()
        }}</span>
        <i
          class="ph ph-caret-down text-gray-11 transition-transform"
          [class.rotate-180]="open()"
          aria-hidden="true"
        ></i>
      </button>
      @if (open() && !disabled()) {
        <div
          class="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-gray-6 bg-gray-2 shadow-xl"
        >
          @if (searchable()) {
            <input
              [id]="id + '-search'"
              type="search"
              role="combobox"
              aria-expanded="true"
              [attr.aria-label]="'Buscar ' + label()"
              [attr.aria-controls]="id + '-options'"
              [attr.aria-activedescendant]="
                visibleOptions().length ? id + '-option-' + active() : null
              "
              [value]="query()"
              (input)="filter($event)"
              (keydown)="onKeydown($event)"
              placeholder="Buscar plataforma…"
              autocomplete="off"
              class="w-full border-b border-gray-6 bg-transparent px-3 py-3 text-sm text-gray-12 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-6"
            />
          }
          <div
            [id]="id + '-options'"
            role="listbox"
            [attr.aria-labelledby]="id + '-label'"
            class="max-h-64 overflow-auto p-1"
          >
            @if (!visibleOptions().length) {
              <p class="px-3 py-3 text-sm text-gray-11">
                Nenhuma plataforma encontrada.
              </p>
            }
            @for (
              option of visibleOptions();
              track option.value;
              let index = $index
            ) {
              <div
                role="option"
                [id]="id + '-option-' + index"
                [attr.aria-selected]="value() === option.value"
                (mousedown)="$event.preventDefault()"
                (click)="choose(index)"
                class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm text-gray-12 hover:bg-gray-4"
                [class.bg-gray-4]="active() === index"
              >
                @if (option.logo) {
                  <span
                    class="h-5 w-8 shrink-0 bg-current"
                    [style.mask-image]="'url(' + option.logo + ')'"
                    style="mask-size:contain;mask-position:center;mask-repeat:no-repeat"
                    aria-hidden="true"
                  ></span>
                } @else if (option.icon) {
                  <i
                    class="ph {{ option.icon }} text-blue-11"
                    aria-hidden="true"
                  ></i>
                }
                <span class="flex-1">{{ option.label }}</span>
                @if (value() === option.value) {
                  <i class="ph ph-check text-blue-11" aria-hidden="true"></i>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class UiSelect {
  private static nextId = 0;
  readonly id = `ui-select-${UiSelect.nextId++}`;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly label = input.required<string>();
  readonly hideLabel = input(false);
  readonly options = input.required<readonly UiSelectOption[]>();
  readonly placeholder = input('Selecione');
  readonly searchable = input(false);
  readonly query = signal('');
  readonly visibleOptions = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.options().filter(
      (option) =>
        !query ||
        `${option.label} ${option.searchText ?? ''}`
          .toLocaleLowerCase()
          .includes(query),
    );
  });
  filter(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }
  onFocusOut(event: FocusEvent) {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node))
      this.open.set(false);
  }
  readonly disabled = input(false);
  readonly value = model('');
  readonly open = signal(false);
  readonly active = signal(0);
  readonly selected = computed(() =>
    this.options().find((option) => option.value === this.value()),
  );
  toggle() {
    if (this.disabled()) return;
    this.query.set('');
    this.active.set(
      Math.max(
        0,
        this.options().findIndex((option) => option.value === this.value()),
      ),
    );
    this.open.update((value) => !value);
    if (this.open() && this.searchable())
      setTimeout(() =>
        this.element.nativeElement
          .querySelector<HTMLInputElement>(`#${this.id}-search`)
          ?.focus(),
      );
  }
  choose(index: number) {
    if (this.disabled()) return;
    const option = this.visibleOptions()[index];
    if (option) this.value.set(option.value);
    this.open.set(false);
    this.element.nativeElement
      .querySelector<HTMLButtonElement>(`#${this.id}`)
      ?.focus();
  }
  onKeydown(event: KeyboardEvent) {
    if (this.disabled()) return;
    const count = this.visibleOptions().length;
    const isSearch = (event.target as HTMLElement)?.tagName === 'INPUT';
    if (isSearch && event.key.length === 1) return;
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape' && this.open()) {
        event.preventDefault();
        event.stopPropagation();
        this.element.nativeElement
          .querySelector<HTMLButtonElement>(`#${this.id}`)
          ?.focus();
      }
      this.open.set(false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && count) {
      event.preventDefault();
      if (!this.open()) this.toggle();
      else if (event.key === 'ArrowDown')
        this.active.update((i) => (i + 1) % count);
      else if (event.key === 'ArrowUp')
        this.active.update((i) => (i + count - 1) % count);
      if (event.key === 'Home') this.active.set(0);
      if (event.key === 'End') this.active.set(count - 1);
      setTimeout(() =>
        this.element.nativeElement
          .querySelector(`#${this.id}-option-${this.active()}`)
          ?.scrollIntoView({ block: 'nearest' }),
      );
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.open()) this.choose(this.active());
      else this.toggle();
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const index = this.options().findIndex((option) =>
        option.label
          .toLocaleLowerCase()
          .startsWith(event.key.toLocaleLowerCase()),
      );
      if (index >= 0) {
        event.preventDefault();
        if (!this.open()) this.toggle();
        this.active.set(index);
      }
    }
  }
  @HostListener('document:click', ['$event'])
  closeOutside(event: MouseEvent) {
    if (!this.element.nativeElement.contains(event.target as Node))
      this.open.set(false);
  }
}
