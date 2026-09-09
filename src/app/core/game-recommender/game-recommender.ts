import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { SeoService } from '../system/seo/seo.service';
import { UiLoading } from '../../shared/ui/loading';
import {
  GameRecommendation,
  GameRecommenderService,
  RecommendationError,
  RecommendationScope,
} from './game-recommender.service';
import { RecommendationBackground } from './shader-background';

interface PendingAttempt {
  key: string;
  scope: RecommendationScope;
}

@Component({
  selector: 'app-game-recommender',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    UiLoading,
    RecommendationBackground,
  ],
  templateUrl: './game-recommender.html',
})
export class GameRecommenderPage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly api = inject(GameRecommenderService);
  private readonly seo = inject(SeoService);
  readonly scope = signal<RecommendationScope>('any');
  readonly generating = signal(false);
  readonly loadingHistory = signal(false);
  readonly error = signal('');
  readonly historyError = signal('');
  readonly latest = signal<GameRecommendation | null>(null);
  readonly history = signal<GameRecommendation[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly pending = signal<PendingAttempt | null>(null);
  readonly dailyLimitAvailableAt = signal<string | null>(null);
  readonly balance = computed(() =>
    Number(this.auth.profile()?.zcoinBalance ?? 0),
  );
  readonly previousResults = computed(() =>
    this.history().filter((item) => item.id !== this.latest()?.id),
  );
  readonly scopes: {
    value: RecommendationScope;
    label: string;
    description: string;
  }[] = [
    {
      value: 'any',
      label: 'Surpreenda-me',
      description: 'Seu backlog e novidades do catálogo.',
    },
    {
      value: 'library',
      label: 'Meu backlog',
      description: 'Um jogo que já está esperando por você.',
    },
    {
      value: 'new',
      label: 'Algo novo',
      description: 'Um jogo do catálogo fora da sua biblioteca.',
    },
  ];
  readonly scopeDescription = computed(
    () =>
      this.scopes.find((option) => option.value === this.scope())!.description,
  );

  ngOnInit() {
    this.seo.apply({
      title: 'Descubra seu próximo jogo com a Zetho',
      description:
        'Receba uma recomendação personalizada a partir dos jogos que você joga, concluiu, curtiu ou guardou no backlog.',
      canonical: '/recomendacoes',
      robots: 'index, follow',
      ogTitle: 'Seu próximo jogo começa aqui | Zetho',
      ogDescription:
        'A Zetho analisa seu perfil e escolhe uma nova aventura para você descobrir.',
      ogImage: '/your-next-game.webp',
      twitterCard: 'summary_large_image',
    });
    this.restoreAttempt();
    void this.loadHistory();
  }

  async generate() {
    if (
      this.generating() ||
      (!this.pending() && (this.balance() < 10 || this.dailyLimitReached()))
    )
      return;
    const owner = this.auth.user()?.$id;
    if (!owner) return;
    this.generating.set(true);
    this.error.set('');
    const attempt = this.pending() ?? {
      key: crypto.randomUUID(),
      scope: this.scope(),
    };
    this.pending.set(attempt);
    this.saveAttempt(owner, attempt);
    try {
      const result = await this.api.suggest(attempt.scope, attempt.key);
      this.saveAttempt(owner, null);
      if (this.auth.user()?.$id !== owner) return;
      this.pending.set(null);
      this.latest.set(result);
      this.mergeHistory([result]);
      this.auth.setZcoinBalance(result.balance);
    } catch (error) {
      if (this.auth.user()?.$id !== owner) return;
      const status = error instanceof RecommendationError ? error.status : 0;
      if ([400, 401, 403, 422, 429, 502].includes(status)) {
        this.pending.set(null);
        this.saveAttempt(owner, null);
      }
      if (
        error instanceof RecommendationError &&
        error.code === 'GAME_RECOMMENDATION_DAILY_LIMIT'
      ) {
        this.dailyLimitAvailableAt.set(error.nextAvailableAt ?? null);
      }
      this.error.set(this.errorMessage(status));
    } finally {
      this.generating.set(false);
    }
  }

  async loadHistory() {
    if (this.loadingHistory()) return;
    const owner = this.auth.user()?.$id;
    if (!owner) return;
    this.loadingHistory.set(true);
    this.historyError.set('');
    try {
      const result = await this.api.history(this.nextCursor());
      if (this.auth.user()?.$id !== owner) return;
      this.mergeHistory(result.items);
      this.nextCursor.set(result.nextCursor);
    } catch {
      this.historyError.set('Não foi possível carregar seu histórico.');
    } finally {
      this.loadingHistory.set(false);
    }
  }

  private mergeHistory(items: GameRecommendation[]) {
    this.history.update((current) =>
      [
        ...new Map(
          [...current, ...items].map((item) => [item.id, item]),
        ).values(),
      ].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
    );
  }

  dailyLimitReached() {
    const availableAt = this.dailyLimitAvailableAt();
    if (availableAt) {
      const availableTime = Date.parse(availableAt);
      if (Number.isFinite(availableTime) && Date.now() < availableTime) {
        return true;
      }
    }
    const today = this.dateInSaoPaulo(new Date());
    return [this.latest(), ...this.history()].some(
      (item) =>
        item !== null &&
        this.dateInSaoPaulo(new Date(item.generatedAt)) === today,
    );
  }

  private dateInSaoPaulo(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private restoreAttempt() {
    const owner = this.auth.user()?.$id;
    if (!owner) return;
    try {
      const attempt = JSON.parse(
        sessionStorage.getItem(`zetho:recommendation:${owner}`) ?? 'null',
      ) as PendingAttempt | null;
      if (
        attempt &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          attempt.key,
        ) &&
        this.scopes.some((option) => option.value === attempt.scope)
      ) {
        this.pending.set(attempt);
        this.scope.set(attempt.scope);
      }
    } catch {
      /* Storage may be unavailable in private browsers. */
    }
  }

  private saveAttempt(owner: string, attempt: PendingAttempt | null) {
    try {
      const key = `zetho:recommendation:${owner}`;
      if (attempt) sessionStorage.setItem(key, JSON.stringify(attempt));
      else sessionStorage.removeItem(key);
    } catch {
      /* In-memory idempotency still protects retries in this page. */
    }
  }

  private errorMessage(status: number) {
    switch (status) {
      case 400:
        return 'Saldo insuficiente ou solicitação inválida. Confira seu saldo antes de tentar novamente.';
      case 401:
      case 403:
        return 'Sua sessão expirou ou não tem acesso. Entre novamente para continuar.';
      case 409:
        return 'Sua recomendação ainda está sendo preparada. Aguarde um pouco e consulte o resultado novamente.';
      case 422:
        return this.scope() === 'library'
          ? 'Seu backlog está vazio. Adicione jogos à biblioteca ou escolha outra opção.'
          : 'Não encontramos jogos disponíveis para esta seleção. Experimente outra opção.';
      case 429:
        return 'Você já gerou sua recomendação de hoje. Uma nova descoberta estará disponível amanhã.';
      case 502:
        return 'Não foi possível concluir a recomendação. Se houve uma reserva de zCoins, ela será estornada automaticamente.';
      default:
        return 'Não foi possível confirmar o resultado. Consulte a mesma solicitação novamente para evitar uma cobrança duplicada.';
    }
  }
}
