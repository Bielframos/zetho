import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse bg-linear-to-r from-blue-3 to-blue-4 rounded-lg"
      [style.height.px]="height()"
      [style.width.%]="width() || 100"
    ></div>
  `,
  host: {
    class: 'contents'
  }
})
export class UiSkeleton {
  height = input<number>(1);
  width = input<number | null>(null);
}
