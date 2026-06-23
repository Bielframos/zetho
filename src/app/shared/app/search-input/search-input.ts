import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.html',
  imports: [NgClass, ReactiveFormsModule],
})
export class AppSearchInput {
  variant = input<'appShell' | 'basic'>('basic');
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
