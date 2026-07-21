import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse bg-gray-3"
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
