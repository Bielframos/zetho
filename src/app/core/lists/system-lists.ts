import { Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { UiLoading } from '../../shared/ui/loading';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SocialApi } from '../../shared/infra/social-api';
import { AppNewListDialog } from '../../shared/app/new-list-dialog/new-list-dialog';
import { ZereiListRow } from './lists.type';
@Component({
  selector: 'app-system-lists',
  imports: [RouterLink, AppNewListDialog, UiLoading],
  template: ` @if (auth.isAdmin()) {
    <section class="border-b border-gray-6 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl">Listas do Zetho</h2>
        <app-new-list-dialog [official]="true" />
      </div>
      <p role="status" class="mt-2 text-sm text-gray-11">{{ message() }}</p>
      @if (loading()) {
        <ui-loading fallback="Carregando listas oficiais" />
      }
      @if (!loading() && !lists().length && !message()) {
        <p class="py-4 text-sm text-gray-11">
          Nenhuma lista oficial encontrada.
        </p>
      }
      <ul class="mt-3 divide-y divide-gray-6">
        @for (list of lists(); track list.$id) {
          <li class="py-3">
            <a
              [routerLink]="['/admin/listas', list.slug]"
              class="text-blue-11 hover:underline"
              >{{ list.title }}</a
            ><span class="ml-3 text-sm text-gray-11">{{
              list.status === 'draft'
                ? 'Rascunho'
                : list.status === 'archived'
                  ? 'Arquivada'
                  : 'Publicada'
            }}</span>
          </li>
        }
      </ul>
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
              this.message.set(
                'Não foi possível carregar suas listas do sistema.',
              );
          })
          .finally(() => {
            if (generation === this.generation) this.loading.set(false);
          });
    });
  }
}
