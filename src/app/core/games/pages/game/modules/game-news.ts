import {
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { UiLoading } from '../../../../../shared/ui/loading';
import { NewsItemComponent } from '../../../../news/news-item';
import { NewsService } from '../../../../news/news.service';
import type { NewsSummary } from '../../../../news/news.types';

@Component({
  selector: 'ui-game-news',
  standalone: true,
  imports: [NewsItemComponent, UiLoading],
  template: `
    @if (loading()) {
      <ui-loading fallback="Carregando notícias do jogo..." variant="subtle" />
    } @else if (items().length) {
      <div class="divide-y divide-gray-6">
        @for (item of items(); track item.$id; let i = $index) {
          <app-news-item [news]="item" [index]="i + 1" />
        }
      </div>
    } @else if (error()) {
      <div class="p-8 text-center text-gray-11">
        <p>Não foi possível carregar as notícias deste jogo.</p>
        <button type="button" class="ui-secondary-btn mt-4" (click)="reload()">
          Tentar novamente
        </button>
      </div>
    } @else {
      <div class="p-8 text-center text-gray-11">
        <i class="ph ph-newspaper mb-2 text-3xl"></i>
        <p>Nenhuma notícia relacionada a este jogo ainda.</p>
      </div>
    }
  `,
})
export class UiGameNews {
  gameId = input.required<string>();
  private service = inject(NewsService);
  items = signal<NewsSummary[]>([]);
  loading = signal(true);
  error = signal(false);
  constructor() {
    effect(() => {
      const gameId = this.gameId();
      untracked(() => void this.load(gameId));
    });
  }
  private async load(gameId: string) {
    this.loading.set(true);
    this.error.set(false);
    try {
      const response = await this.service.list({ gameId, pageSize: 20 });
      this.items.set(response.items);
    } catch {
      this.items.set([]);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  reload() {
    void this.load(this.gameId());
  }
}
