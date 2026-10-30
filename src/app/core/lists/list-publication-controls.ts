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
  imports: [FormsModule, UiCombobox],
  template: ` <section class="border-b border-gray-6 p-4">
    <h2 class="text-xl">Publicação da lista</h2>
    <p class="my-2 text-sm text-gray-11">
      {{
        list().status === 'draft'
          ? 'Rascunho'
          : list().status === 'archived'
            ? 'Arquivada'
            : 'Publicada'
      }}
    </p>
    <p role="status" class="text-sm text-gray-11">{{ message() }}</p>
    @if (list().status === 'draft') {
      <form class="mt-4 flex flex-col gap-4" (ngSubmit)="save()">
        <label
          >Critérios da seleção<textarea
            name="criteria"
            [(ngModel)]="content.criteria"
            maxlength="800"
            class="block w-full rounded-lg border border-gray-6 bg-transparent p-2 focus:ring-2 focus:ring-focus-ring"
          ></textarea>
        </label>
        <label
          >Tipo<select
            name="kind"
            [(ngModel)]="content.kind"
            class="ml-2 rounded-lg border border-gray-6 bg-gray-1 p-2"
          >
            <option value="thematic">Temática</option>
            <option value="monthly">Lançamentos do mês</option>
          </select></label
        >
        @if (content.kind === 'monthly') {
          <label
            >Período<input
              type="month"
              name="month"
              [(ngModel)]="content.month"
              class="ml-2 border border-gray-6 bg-transparent p-2"
          /></label>
        }
        @for (item of content.items; track item.gameId; let index = $index) {
          <fieldset class="border-t border-gray-6 pt-3">
            <legend>{{ item.name }}</legend>
            <label
              >Justificativa<textarea
                [name]="'reason-' + index"
                [(ngModel)]="item.reason"
                maxlength="400"
                class="block w-full rounded-lg border border-gray-6 bg-transparent p-2"
              ></textarea>
            </label>
            <label
              >Fontes (uma URL por linha)<textarea
                [name]="'sources-' + index"
                [ngModel]="sourcesText(item.sources)"
                (ngModelChange)="setSources(index, $event)"
                class="block w-full rounded-lg border border-gray-6 bg-transparent p-2"
              ></textarea>
            </label>
            @if (content.kind === 'monthly') {
              <label
                >Data de lançamento<input
                  type="date"
                  [name]="'date-' + index"
                  [(ngModel)]="item.releaseDate"
                  class="ml-2 border border-gray-6 bg-transparent p-2"
              /></label>
            }
          </fieldset>
        }
        <button type="submit" class="ui-secondary-btn" [disabled]="busy()">
          Salvar revisão
        </button>
        <label class="flex gap-2"
          ><input
            type="checkbox"
            name="verified"
            [(ngModel)]="verified"
          />Conferi os jogos, as fontes e as datas desta versão.</label
        >
        <button
          type="button"
          class="ui-primary-btn"
          [disabled]="busy() || !verified"
          (click)="changeStatus('published')"
        >
          Publicar lista
        </button>
      </form>
      <div class="mt-5 flex flex-col gap-3">
        <ui-combobox
          label="Adicionar jogo"
          placeholder="Busque pelo nome do jogo"
          [minQueryLength]="2"
          [search]="searchGames"
          [(selectedOptions)]="selectedGames"
        />
        <button
          type="button"
          class="ui-secondary-btn"
          [disabled]="busy() || !selectedGames().length || items().length >= 10"
          (click)="addGame()"
        >
          Adicionar à lista
        </button>
      </div>
    } @else {
      <button
        type="button"
        class="ui-secondary-btn my-3"
        [disabled]="busy()"
        (click)="changeStatus('draft')"
      >
        Voltar para rascunho
      </button>
    }
    @if (list().status !== 'archived') {
      <button
        type="button"
        class="ui-ghost-btn my-3"
        [disabled]="busy()"
        (click)="changeStatus('archived')"
      >
        Arquivar lista
      </button>
    }
    @if (list().status === 'published') {
      <button
        type="button"
        class="ui-secondary-btn"
        [disabled]="busy()"
        (click)="generatePost()"
      >
        Gerar rascunho do post
      </button>
      @if (postBody()) {
        <h3 class="mt-4 text-xl">Prévia do post</h3>
        <div class="prose max-w-none" [innerHTML]="postBody()"></div>
        <button
          type="button"
          class="ui-primary-btn"
          [disabled]="busy()"
          (click)="publishPost()"
        >
          Publicar este post
        </button>
      }
    }
  </section>`,
})
export class ListPublicationControls implements OnDestroy {
  list = input.required<ZereiListRow>();
  items = input.required<ZereiListItemRowExpanded[]>();
  changed = output<void>();
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
        sources: item.sources ?? [],
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
  sourcesText(sources: string[]) {
    return sources.join('\n');
  }
  setSources(index: number, value: string) {
    this.content.items[index].sources = value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    this.verified = false;
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
