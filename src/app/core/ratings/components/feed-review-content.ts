import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, SecurityContext, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const PREVIEW_LENGTH = 400;

@Component({
  selector: 'ui-feed-review-content',
  standalone: true,
  template: `
    <div class="text-sm leading-7">
      <span [id]="'feed-review-' + reviewId()">
        @if (isLong() && !expanded()) {
          <span class="break-words font-light text-gray-11">{{ preview() }}…</span>
        } @else {
          <span
            class="prose prose-invert prose-sm prose-gray max-w-none break-words text-gray-11 leading-7 prose-p:font-light [&>p:last-child]:inline [&>p:last-child]:mb-0"
            [innerHTML]="content()"
          ></span>
        }
      </span>
      @if (isLong()) {
        <button
          type="button"
          class="ml-1 cursor-pointer rounded-sm text-sm leading-7 text-blue-11 hover:text-blue-9 hover:underline focus:ring-2 focus:ring-blue-6"
          [attr.aria-expanded]="expanded()"
          [attr.aria-controls]="'feed-review-' + reviewId()"
          (click)="expanded.set(!expanded())"
        >{{ expanded() ? 'Ver menos' : 'Ver mais' }}</button>
      }
    </div>
  `,
})
export class FeedReviewContent {
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  readonly reviewId = input.required<string>();
  readonly content = input.required<string>();
  readonly expanded = signal(false);

  private readonly characters = computed(() => {
    const element = this.document.createElement('div');
    const html = this.sanitizer.sanitize(SecurityContext.HTML, this.content()) ?? '';
    // Preserve word boundaries between rich-text paragraphs and line breaks.
    element.innerHTML = html.replace(/<br\b[^>]*>|<\/(?:p|div|li|h[1-6]|blockquote|pre)>/gi, '$& ');
    return Array.from((element.textContent ?? '').replace(/\s+/g, ' ').trim());
  });
  readonly isLong = computed(() => this.characters().length > PREVIEW_LENGTH);
  readonly preview = computed(() => this.characters().slice(0, PREVIEW_LENGTH).join('').trimEnd());
}
