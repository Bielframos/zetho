import {
  afterNextRender,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { safeLocalStorage } from '../../utils/platform-storage';

@Component({
  selector: 'app-onboarding-resume',
  imports: [RouterLink],
  template: `
    @if (hasProgress()) {
      <aside
        class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-6 px-4 py-4"
        aria-label="Primeiros passos"
      >
        <div>
          <p class="text-sm text-gray-12">Continue montando sua estante</p>
          <p class="mt-1 text-xs text-gray-11">
            Retome os primeiros passos de onde parou.
          </p>
        </div>
        <a routerLink="/comecar" class="ui-secondary-btn"
          >Continuar configuração</a
        >
      </aside>
    }
  `,
})
export class OnboardingResume {
  private auth = inject(AuthStore);
  private rendered = signal(false);
  readonly hasProgress = computed(() => {
    const owner = this.auth.profile()?.fingerprint;
    if (!this.rendered() || !owner) return false;
    try {
      const draft = JSON.parse(
        safeLocalStorage.getItem(`zetho:onboarding:v2:${owner}`) ?? 'null',
      );
      return Array.isArray(draft?.games) && [1, 2, 3, 4].includes(draft?.step);
    } catch {
      return false;
    }
  });

  constructor() {
    afterNextRender(() => this.rendered.set(true));
  }
}
