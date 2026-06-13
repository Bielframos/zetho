import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html',
  styles: `
    .star-rating i {
      cursor: pointer;
      font-size: 28px;
    }
    .star-rating.readonly i {
      cursor: default;
    }
  `,
})
export class AppStartingRating {
  @Input() value: number = 0;
  @Input() readonly: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();

  hoverValue: number | null = null;

  onMouseMove(event: MouseEvent, index: number) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const half = rect.width / 2;
    this.hoverValue = x < half ? index + 0.5 : index + 1;
  }

  onMouseLeave() {
    this.hoverValue = null;
  }

  onClick() {
    if (this.hoverValue !== null) {
      this.value = this.hoverValue;
      this.ratingChange.emit(this.value);
      this.hoverValue = null;
    }
  }

  getStarClass(index: number): string {
    const currentValue =
      this.hoverValue !== null ? this.hoverValue : this.value;

    if (currentValue >= index + 1) {
      return 'ph-fill ph-star text-amber-300';
    } else if (currentValue >= index + 0.5) {
      return 'ph-fill ph-star-half text-amber-300';
    } else {
      return 'ph ph-star text-gray-8';
    }
  }
}
