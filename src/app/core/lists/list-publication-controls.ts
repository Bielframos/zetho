import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialApi } from '../../shared/infra/social-api';
import { GameService } from '../games/games.service';
import { SeoService } from '../system/seo/seo.service';
import { UiLoading } from '../../shared/ui/loading';
import { GameRow } from '../../types';
import { ListService } from './list.service';
import { ZereiListRow } from './lists.type';
import { ZereiListItemRowExpanded } from './list.controller';
import {
  UiCombobox,
  UiComboboxOption,
  UiComboboxSearch,
} from '../../shared/ui/combobox/combobox';

type Content = {
  title: string;
  description: string;
  criteria: string;
  kind: 'thematic' | 'monthly';
  month?: string;
  items: {
    gameId: string;
    name: string;
    reason: string;
    sources: string[];
    releaseDate?: string;
  }[];
};
@Component({
  selector: 'app-list-publication-controls',
  imports: [FormsModule, UiCombobox, UiLoading],
  templateUrl: './list-publication-controls.html',
  styleUrl: './list-publication-controls.css',
})
export class ListPublicationControls implements OnDestroy {
  list = input.required<ZereiListRow>();
  items = input.required<ZereiListItemRowExpanded[]>();
  changed = output<void>();
  removed = output<ZereiListItemRowExpanded>();
  tab = signal<'edit' | 'preview'>('edit');
  private seo = inject(SeoService);
  private api = inject(SocialApi);
  private games = inject(GameService);
  private lists = inject(ListService);
  private generation = 0;
  private original = '';
  private preview: { id: string; revision: string } | null = null;
  private catalog = new Map<string, GameRow>();
  content: Content = {
    title: '',
    description: '',
    criteria: '',
    kind: 'thematic',
    items: [],
  };
  selectedGames = signal<UiComboboxOption[]>([]);
  busy = signal(false);
  message = signal('');
  postBody = signal('');
  verified = false;
  constructor() {
    effect(() => this.select(this.list(), this.items()));
  }
  ngOnDestroy() {
    this.generation++;
  }
  select(list: ZereiListRow, items: ZereiListItemRowExpanded[]) {
    this.generation++;
    this.preview = null;
    this.postBody.set('');
    this.verified = false;
    this.message.set('');
    this.selectedGames.set([]);
    this.content = {
      title: list.title,
      description: list.description ?? '',
      criteria: list.criteria ?? '',
      kind: list.kind ?? 'thematic',
      ...(list.month ? { month: list.month } : {}),
      items: items.map((item) => ({
        gameId: item.game.$id,
        name: item.game.name,
        reason: item.reason ?? '',
        sources: item.sources?.length
          ? [...item.sources]
          : [this.seo.toAbsoluteUrl(`/jogo/${item.game.slug}`)],
        ...(item.releaseDate ? { releaseDate: item.releaseDate } : {}),
      })),
    };
    this.original = JSON.stringify(this.payload());
  }
  private payload() {
    return {
      ...this.content,
      month: this.content.kind === 'monthly' ? this.content.month : undefined,
      items: this.content.items.map(({ name, ...item }) => ({
        ...item,
        releaseDate:
          this.content.kind === 'monthly' ? item.releaseDate : undefined,
      })),
    };
  }
  get dirty() {
    return this.original !== JSON.stringify(this.payload());
  }
  openPreview() {
    if (this.dirty && this.list().status === 'draft') {
      this.message.set('Salve as alterações para atualizar a prévia.');
      return;
    }
    this.message.set('');
    this.tab.set('preview');
  }
  moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (this.busy() || target < 0 || target >= this.content.items.length)
      return;
    const [item] = this.content.items.splice(index, 1);
    this.content.items.splice(target, 0, item);
    this.verified = false;
  }
  removeGame(gameId: string) {
    if (this.busy() || this.dirty) return;
    const item = this.items().find((item) => item.game.$id === gameId);
    if (item) this.removed.emit(item);
  }
  searchGames: UiComboboxSearch = async (query) => {
    const result = await this.games.searchGame(query, { pageSize: 6 });
    return result.rows.map((game) => {
      this.catalog.set(game.$id, game);
      return {
        id: game.$id,
        label: game.name,
        imageUrl: game.coverUrl,
        imageShape: 'cover' as const,
      };
    });
  };
  private async run(work: (row: ZereiListRow) => Promise<void>) {
    if (this.busy()) return;
    const generation = this.generation;
    const row = this.list();
    this.busy.set(true);
    this.message.set('');
    try {
      await work(row);
    } catch {
      if (generation === this.generation)
        this.message.set(
          'Não foi possível concluir. Recarregue a lista e confira os dados.',
        );
    } finally {
      this.busy.set(false);
    }
  }
  async save() {
    const generation = this.generation;
    await this.run(async (row) => {
      await this.api.request(`lists/${row.$id}/editorial`, 'PATCH', {
        revision: row.revision,
        content: this.payload(),
      });
      if (generation === this.generation) this.changed.emit();
    });
  }
  async addGame() {
    const game = this.catalog.get(this.selectedGames()[0]?.id);
    if (!game) return;
    const generation = this.generation;
    if (this.dirty) {
      this.message.set('Salve as alterações antes de adicionar um jogo.');
      return;
    }
    await this.run(async (row) => {
      await this.lists.addToList({ list: row, game });
      if (generation === this.generation) this.changed.emit();
    });
  }
  async changeStatus(status: 'draft' | 'published' | 'archived') {
    if (
      status === 'published' &&
      (!this.verified || this.original !== JSON.stringify(this.payload()))
    ) {
      this.message.set(
        'Salve as alterações e confira esta versão antes de publicar.',
      );
      return;
    }
    const generation = this.generation;
    await this.run(async (row) => {
      await this.api.request(`lists/${row.$id}/status`, 'POST', {
        status,
        revision: row.revision,
        sourcesVerified: this.verified,
      });
      if (generation === this.generation) this.changed.emit();
    });
  }
  async generatePost() {
    const generation = this.generation;
    await this.run(async (row) => {
      const result = await this.api.request<{ body: string }>(
        `lists/${row.$id}/post`,
        'POST',
      );
      if (generation !== this.generation) return;
      this.preview = { id: row.$id, revision: row.revision ?? '' };
      this.postBody.set(result.body);
    });
  }
  async publishPost() {
    const row = this.list();
    if (
      !this.postBody() ||
      this.preview?.id !== row.$id ||
      this.preview?.revision !== row.revision
    )
      return;
    const generation = this.generation;
    await this.run(async (current) => {
      await this.api.request(`lists/${current.$id}/publish-post`, 'POST', {
        revision: current.revision,
      });
      if (generation === this.generation) this.message.set('Post publicado.');
    });
  }
}
