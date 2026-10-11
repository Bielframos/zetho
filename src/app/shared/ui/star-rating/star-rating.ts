import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.html',
})
export class AppStartingRating {
  @Input() value = 0;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() label = 'Sua nota';
  @Output() ratingChange = new EventEmitter<number>();
  hoverValue: number | null = null;

  private pointerValue(event: MouseEvent, index: number) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1;
  }

  onMouseMove(event: MouseEvent, index: number) {
    if (!this.readonly && !this.disabled)
      this.hoverValue = this.pointerValue(event, index);
  }

  onMouseLeave() {
    this.hoverValue = null;
  }

  onClick(event: MouseEvent, index: number) {
    if (this.readonly || this.disabled) return;
    this.ratingChange.emit(this.pointerValue(event, index));
    this.hoverValue = null;
  }

  onKeydown(event: KeyboardEvent) {
    if (this.readonly || this.disabled) return;
    let value: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        value = Math.min(5, this.value + 0.5);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        value = Math.max(0, this.value - 0.5);
        break;
      case 'Home':
      case 'Delete':
      case 'Backspace':
        value = 0;
        break;
      case 'End':
        value = 5;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.hoverValue = null;
    this.ratingChange.emit(value);
  }

  getStarClass(index: number): string {
    const value =
      this.disabled || this.readonly
        ? this.value
        : (this.hoverValue ?? this.value);
    return value >= index + 1
      ? 'ph-fill ph-star text-warning'
      : value >= index + 0.5
        ? 'ph-fill ph-star-half text-warning'
        : 'ph ph-star text-gray-8';
  }
}
