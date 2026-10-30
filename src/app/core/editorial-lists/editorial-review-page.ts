import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialApi } from '../../shared/infra/social-api';

interface Draft {
  games?: { id: string; name: string; slug: string }[];
  validationError?: string;
  $id: string;
  status: string;
  revision: string;
  payload: string;
}
interface Selection {
  title: string;
  description: string;
  criteria: string;
  kind: string;
  month?: string;
  items: {
    gameId: string;
    reason: string;
    sources: string[];
    releaseDate?: string;
  }[];
}
@Component({
  selector: 'app-editorial-review',
  imports: [FormsModule, RouterLink],
  template: `<section class="p-4">
    <h2 class="text-2xl">Revisão de listas editoriais</h2>
    <button class="ui-secondary-btn my-4" [disabled]="busy()" (click)="load()">
      Atualizar rascunhos
    </button>
    <p role="status" class="text-sm text-gray-11">{{ message() }}</p>
    <ul class="divide-y divide-gray-6">
      @for (row of queue(); track row.$id) {
        <li>
          <button class="ui-ghost-btn py-3" (click)="select(row)">
            {{ title(row) }}
          </button>
        </li>
      }
    </ul>
    @if (selection(); as draft) {
      @if (selected()?.validationError) {
        <p role="alert" class="my-3 text-danger">
          {{ selected()?.validationError }}
        </p>
      }
      <form class="mt-6 flex flex-col gap-4" (ngSubmit)="save()">
        <label
          >Título<input
            class="block w-full border border-gray-6 p-2"
            name="title"
            [(ngModel)]="draft.title"
            [disabled]="published()"
            maxlength="64"
        /></label>
        <label
          >Descrição<textarea
            class="block w-full border border-gray-6 p-2"
            name="description"
            [(ngModel)]="draft.description"
            [disabled]="published()"
            maxlength="128"
          ></textarea>
        </label>
        <label
          >Critérios da seleção<textarea
            class="block w-full border border-gray-6 p-2"
            name="criteria"
            [(ngModel)]="draft.criteria"
            [disabled]="published()"
            maxlength="800"
          ></textarea>
        </label>
        @if (draft.month) {
          <p>Período: {{ draft.month }}</p>
        }
        @for (item of draft.items; track item.gameId; let index = $index) {
          <fieldset class="border-t border-gray-6 pt-4">
            <legend>
              {{ index + 1 }}.
              {{ selected()?.games?.[index]?.name || 'Jogo a conferir' }}
            </legend>
            @if (selected()?.games?.[index]; as game) {
              <a
                [routerLink]="['/jogo', game.slug]"
                target="_blank"
                class="text-blue-11 hover:underline"
                >Conferir jogo no catálogo</a
              >
            }
            <label
              >Justificativa<textarea
                class="block w-full border border-gray-6 p-2"
                [name]="'reason-' + index"
                [(ngModel)]="item.reason"
                [disabled]="published()"
                maxlength="400"
              ></textarea>
            </label>
            @if (item.releaseDate) {
              <p>Lançamento: {{ item.releaseDate }}</p>
            }
            <div class="my-2 flex flex-wrap gap-3">
              @for (source of item.sources; track source) {
                <a
                  [href]="source"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-blue-11 hover:underline"
                  >Verificar fonte</a
                >
              }
            </div>
          </fieldset>
        }
        @if (!published()) {
          <button class="ui-secondary-btn" type="submit" [disabled]="busy()">
            Salvar revisão
          </button>
          <label class="flex gap-2"
            ><input
              type="checkbox"
              name="verified"
              [(ngModel)]="verified"
            />Conferi fontes, datas, plataformas, critérios e justificativas
            desta versão.</label
          >
          <button
            class="ui-primary-btn"
            type="button"
            [disabled]="busy() || !verified"
            (click)="approve()"
          >
            Aprovar e publicar lista
          </button>
        } @else {
          <a
            [routerLink]="['/listas-editoriais', 'zetho-' + selected()!.$id]"
            class="text-blue-11 hover:underline"
            >Ver lista publicada</a
          >
          <button
            class="ui-secondary-btn"
            type="button"
            [disabled]="busy()"
            (click)="action('post')"
          >
            Gerar rascunho do post
          </button>
          @if (postBody()) {
            <h3 class="text-xl">Prévia do post</h3>
            <div class="prose max-w-none" [innerHTML]="postBody()"></div>
            <button
              class="ui-primary-btn"
              type="button"
              [disabled]="busy()"
              (click)="action('publish-post')"
            >
              Publicar este post
            </button>
          }
          <button
            class="ui-destructive-btn"
            type="button"
            [disabled]="busy()"
            (click)="action('withdraw')"
          >
            Retirar lista e post de publicação
          </button>
        }
      </form>
    }
  </section>`,
})
export class EditorialReviewPage {
  private api = inject(SocialApi);
  queue = signal<Draft[]>([]);
  selected = signal<Draft | null>(null);
  selection = signal<Selection | null>(null);
  published = signal(false);
  busy = signal(false);
  message = signal('');
  postBody = signal('');
  verified = false;
  constructor() {
    void this.load();
  }
  title(row: Draft) {
    try {
      return JSON.parse(row.payload).title;
    } catch {
      return 'Rascunho indisponível';
    }
  }
  select(row: Draft) {
    this.selected.set({ ...row, games: row.games ?? this.selected()?.games });
    this.selection.set(JSON.parse(row.payload));
    this.published.set(row.status === 'published');
    this.verified = false;
    this.postBody.set('');
  }
  async load() {
    await this.run(async () => {
      const result = await this.api.request<{ rows: Draft[] }>(
        'editorial-lists/review',
        'GET',
      );
      this.queue.set(result.rows);
    });
  }
  async save() {
    await this.run(async () => {
      const row = await this.api.request<Draft>(
        `editorial-lists/review/${this.selected()!.$id}`,
        'PATCH',
        this.selection(),
      );
      this.select(row);
    });
  }
  async approve() {
    if (JSON.stringify(this.selection()) !== this.selected()?.payload) {
      this.message.set(
        'Salve as alterações e confira novamente antes de aprovar.',
      );
      return;
    }
    await this.action('approve');
  }
  async action(name: 'approve' | 'post' | 'publish-post' | 'withdraw') {
    await this.run(async () => {
      const row = this.selected()!;
      const result = await this.api.request<{ body?: string }>(
        `editorial-lists/review/${row.$id}/${name}`,
        'POST',
        { revision: row.revision, sourcesVerified: this.verified },
      );
      if (name === 'approve') this.published.set(true);
      if (name === 'post') this.postBody.set(result.body ?? '');
      if (name === 'withdraw') {
        this.selected.set(null);
        this.selection.set(null);
      }
    });
  }
  private async run(work: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      await work();
      this.message.set('Operação concluída.');
    } catch {
      this.message.set(
        'Não foi possível concluir. Confira a revisão e as fontes antes de tentar novamente.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
