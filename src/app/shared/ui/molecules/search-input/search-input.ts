import { Component, input, output } from "@angular/core";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UiInput } from "../../atoms/input/input";

@Component({
    selector: 'ui-search-input',
    standalone: true,
    templateUrl: './search-input.html',
    imports: [UiInput, ReactiveFormsModule]
})
export class UiSerchInput {
    placeholder = input<string>('')
    readonly search = output<string>()
    searchControl = new FormControl('')

    constructor() {
        this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => this.search.emit(value ?? ''))
    }
}   