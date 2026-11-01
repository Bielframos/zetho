import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCheckbox } from '../../../../shared/ui/checkbox';
import { SocialApi } from '../../../../shared/infra/social-api';
import { AuthStore } from '../../auth.store';

@Component({
  selector: 'app-profile-sharing',
  standalone: true,
  imports: [UiCheckbox, FormsModule],
  template: `<section class="border-b border-gray-6 p-4">
    <h2 class="mb-4 text-lg">Divulgação do perfil</h2>
    @if (loaded()) {
      <ui-checkbox
        name="profile-sharing"
        [ngModel]="allowed()"
        (ngModelChange)="allowed.set($event)"
        label="Autorizo a divulgação do meu perfil nas redes do Zetho"
        description="Podemos compartilhar sua gamertag, foto e link do perfil. A autorização é opcional e pode ser retirada aqui. Sua insígnia de fundador permanece com você."
      />
      <button
        type="button"
        class="ui-secondary-btn mt-4"
        [disabled]="saving()"
        (click)="save()"
      >
        {{ saving() ? 'Salvando…' : 'Salvar autorização' }}
      </button>
    } @else if (!error()) {
      <p class="text-sm text-gray-11" role="status">Carregando autorização…</p>
    }
    @if (error()) {
      <p class="mt-2 text-sm text-danger" role="alert">{{ error() }}</p>
    }
    @if (error() && !loaded()) {
      <button type="button" class="ui-secondary-btn mt-2" (click)="load()">
        Tentar novamente
      </button>
    }
    @if (saved()) {
      <p class="mt-2 text-sm text-success" role="status">
        Autorização atualizada.
      </p>
    }
  </section>`,
})
export class ProfileSharing {
  private readonly api = inject(SocialApi);
  private readonly auth = inject(AuthStore);
  allowed = signal(false);
  loaded = signal(false);
  saving = signal(false);
  saved = signal(false);
  error = signal('');
  private generation = 0;
  constructor() {
    effect(() => {
      const userId = this.auth.user()?.$id;
      this.generation++;
      this.loaded.set(false);
      this.error.set('');
      this.saved.set(false);
      if (userId) void this.load();
    });
  }
  async load() {
    const generation = ++this.generation;
    this.error.set('');
    try {
      const result = await this.api.request<{ allowed: boolean }>(
        'profile/me/profile-sharing',
        'GET',
        undefined,
        () => generation === this.generation,
      );
      if (generation !== this.generation) return;
      this.allowed.set(result.allowed);
      this.loaded.set(true);
    } catch {
      if (generation === this.generation)
        this.error.set('Não foi possível carregar sua autorização.');
    }
  }
  async save() {
    if (this.saving()) return;
    const generation = this.generation;
    const allowed = this.allowed();
    this.saving.set(true);
    this.error.set('');
    this.saved.set(false);
    try {
      await this.api.request(
        'profile/me/profile-sharing',
        'PATCH',
        { allowed },
        () => generation === this.generation,
      );
      if (generation === this.generation) this.saved.set(true);
    } catch {
      if (generation === this.generation)
        this.error.set('Não foi possível salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
