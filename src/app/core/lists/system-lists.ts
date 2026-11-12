import { Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { UiLoading } from '../../shared/ui/loading';
import { UiListCard } from '../../shared/ui/list-card';
import { AuthStore } from '../auth/auth.store';
import { SocialApi } from '../../shared/infra/social-api';
import { AppNewListDialog } from '../../shared/app/new-list-dialog/new-list-dialog';
import { ZereiListRow } from './lists.type';
@Component({
  selector: 'app-system-lists',
  imports: [UiListCard, AppNewListDialog, UiLoading],
  template: `@if (auth.isAdmin()) {
    <section>
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-6 p-4"
      >
        <h2 class="text-xl">Listas oficiais</h2>
        <app-new-list-dialog [official]="true" />
      </header>
      @if (message()) {
        <p role="alert" class="p-4 text-sm text-danger">{{ message() }}</p>
      }
      @if (loading()) {
        <ui-loading fallback="Carregando listas oficiais" />
      } @else if (!lists().length && !message()) {
        <p class="p-4 text-sm text-gray-11">
          Nenhuma lista oficial criada. Comece em “Nova lista oficial”.
        </p>
      } @else {
        <ul class="divide-y divide-gray-6">
          @for (list of lists(); track list.$id) {
            <ui-list-card
              ownerGamertag="Zetho"
              [list]="list"
              [link]="['/admin/listas', list.slug]"
              [showStatus]="true"
            />
          }
        </ul>
      }
    </section>
  }`,
})
export class SystemLists implements OnDestroy {
  ngOnDestroy() {
    this.generation++;
  }
  auth = inject(AuthStore);
  private api = inject(SocialApi);
  private generation = 0;
  lists = signal<ZereiListRow[]>([]);
  message = signal('');
  loading = signal(false);
  constructor() {
    effect(() => {
      const admin = this.auth.isAdmin();
      const user = this.auth.user()?.$id;
      const generation = ++this.generation;
      this.lists.set([]);
      this.message.set('');
      this.loading.set(admin && !!user);
      if (admin && user)
        void this.api
          .request<{ rows: ZereiListRow[] }>('lists/system', 'GET')
          .then((result) => {
            if (generation === this.generation) this.lists.set(result.rows);
          })
          .catch(() => {
            if (generation === this.generation)
              this.message.set('Não foi possível carregar as listas oficiais.');
          })
          .finally(() => {
            if (generation === this.generation) this.loading.set(false);
          });
    });
  }
}
