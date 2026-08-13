import { Component, input } from '@angular/core';

@Component({
  selector: 'app-legal-shell',
  standalone: true,
  template: `
    <main class="mx-auto w-full max-w-3xl">
      <header class="border-b border-gray-6 p-4">
        <h1 class="text-3xl md:text-4xl">{{ heading() }}</h1>
        @if (subtitle()) {
          <p class="mt-2 text-gray-11">{{ subtitle() }}</p>
        }
        <p class="mt-2 text-sm text-gray-11">
          Última atualização: {{ updatedAt() }}
        </p>
      </header>

      <article
        class="prose prose-invert prose-sm max-w-none px-4 py-6 text-gray-11 prose-headings:text-gray-12 prose-a:text-blue-11 prose-a:no-underline hover:prose-a:underline"
      >
        <ng-content />
      </article>
    </main>
  `,
})
export class LegalShell {
  heading = input.required<string>();
  subtitle = input<string>('');
  updatedAt = input.required<string>();
}
