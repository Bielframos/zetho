import { Component, inject, signal } from '@angular/core';
import { ContentIntentService } from './content-intent.service';
@Component({
  selector: 'app-content-intent-notice',
  template: `
    @if (pending()) {
      <aside class="border-b border-gray-6 px-4 py-3 text-sm text-gray-11">
        Depois de entrar, você voltará ao conteúdo para confirmar o jogo na sua
        biblioteca.
        <button type="button" class="ui-ghost-btn text-sm" (click)="cancel()">
          Cancelar ação
        </button>
      </aside>
    }
  `,
})
export class ContentIntentNotice {
  private intent = inject(ContentIntentService);
  pending = signal(!!this.intent.read());
  cancel() {
    this.intent.clear();
    this.pending.set(false);
  }
}
