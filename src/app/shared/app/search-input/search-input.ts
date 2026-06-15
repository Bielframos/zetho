import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { UiInput } from '../../ui/input/input';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.html',
  imports: [UiInput, ReactiveFormsModule],
})
export class AppSearchInput {
  placeholder = input<string>('');
  readonly search = output<string>();
  readonly focusSearch = output<void>();
  searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(600),
        filter((value) => value !== ''),
        distinctUntilChanged(),
      )
      .subscribe((value) => this.search.emit(value ?? ''));
  }

  onFocusSearch() {
    this.focusSearch.emit();
  }
}
