import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  model,
  signal,
} from '@angular/core';

export interface UiComboboxOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  imageShape?: 'avatar' | 'cover';
  icon?: string;
  disabled?: boolean;
}

export type UiComboboxSearch = (
  query: string,
) => Promise<UiComboboxOption[]> | UiComboboxOption[];

@Component({
  selector: 'ui-combobox',
  standalone: true,
  imports: [],
  templateUrl: './combobox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class UiCombobox {
  private static nextId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;

  readonly inputId = `ui-combobox-${UiCombobox.nextId++}`;
  readonly listboxId = `${this.inputId}-listbox`;

  label = input('');
  placeholder = input('Buscar');
  emptyText = input('Nenhum resultado encontrado.');
  hint = input('');
  required = input(false);
  multiple = input(false);
  minQueryLength = input(0);
  debounceMs = input(300);
  search = input.required<UiComboboxSearch>();
  selectedOptions = model<UiComboboxOption[]>([]);

  query = signal('');
  results = signal<UiComboboxOption[]>([]);
  loading = signal(false);
  isOpen = signal(false);
  activeIndex = signal(-1);

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  onFocus(): void {
    this.isOpen.set(true);
    void this.loadResults(this.query());
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.isOpen.set(true);
    this.activeIndex.set(-1);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(
      () => void this.loadResults(value),
      this.debounceMs(),
    );
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.isOpen()) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.isOpen.set(false);
      return;
    }

    const navigableIndexes = this.results()
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);
    if (navigableIndexes.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen.set(true);
      const currentPosition = navigableIndexes.indexOf(this.activeIndex());
      const nextPosition = (currentPosition + 1) % navigableIndexes.length;
      this.activeIndex.set(navigableIndexes[nextPosition]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.isOpen.set(true);
      const currentPosition = navigableIndexes.indexOf(this.activeIndex());
      const previousPosition =
        currentPosition <= 0
          ? navigableIndexes.length - 1
          : currentPosition - 1;
      this.activeIndex.set(navigableIndexes[previousPosition]);
    } else if (event.key === 'Enter' && this.activeIndex() >= 0) {
      const activeOption = this.results()[this.activeIndex()];
      if (!activeOption) return;
      event.preventDefault();
      this.selectOption(activeOption);
    }
  }

  selectOption(option: UiComboboxOption): void {
    if (option.disabled) return;

    if (this.multiple()) {
      if (this.isSelected(option)) {
        this.removeOption(option);
      } else {
        this.selectedOptions.update((selected) => [...selected, option]);
      }
      this.query.set('');
      this.activeIndex.set(-1);
      void this.loadResults('');
      return;
    }

    this.selectedOptions.set([option]);
    this.query.set('');
    this.results.set([]);
    this.activeIndex.set(-1);
    this.isOpen.set(false);
  }

  removeOption(option: UiComboboxOption): void {
    this.selectedOptions.update((selected) =>
      selected.filter((item) => item.id !== option.id),
    );
  }

  isSelected(option: UiComboboxOption): boolean {
    return this.selectedOptions().some((item) => item.id === option.id);
  }

  private async loadResults(query: string): Promise<void> {
    const currentRequest = ++this.requestId;
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < this.minQueryLength()) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    try {
      const options = await this.search()(normalizedQuery);
      if (currentRequest === this.requestId) {
        this.results.set(options);
        this.activeIndex.set(-1);
      }
    } catch {
      if (currentRequest === this.requestId) {
        this.results.set([]);
        this.activeIndex.set(-1);
      }
    } finally {
      if (currentRequest === this.requestId) {
        this.loading.set(false);
      }
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
