import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthStore } from '../../../auth/auth.store';
import { SeoService } from '../../../system/seo/seo.service';
import { UiLoading } from '../../../../shared/ui/loading';
import { GameplaySessionsService } from '../../gameplay-sessions.service';

@Component({
  selector: 'app-session-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UiLoading],
  templateUrl: './session-detail.html',
})
export class SessionDetailPage {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  authStore = inject(AuthStore);
  sessionsService = inject(GameplaySessionsService);

  readonly sessionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );
  readonly session = this.sessionsService.publicSession;
  readonly isFull = computed(() => {
    const session = this.session();
    return !!session && session.confirmedCount >= session.maxPlayers;
  });

  constructor() {
    effect(() => {
      const id = this.sessionId();
      // No servidor nunca há sessão. Após a hidratação, recarrega uma vez se
      // houver login para obter o status pessoal sem degradar o HTML público.
      this.authStore.isAuthenticated();
      if (!id) return;
      untracked(() => void this.sessionsService.loadPublicSessionDetail(id));
    });

    effect(() => {
      const session = this.session();
      if (!session) return;

      const canonical = `/jogatina/${encodeURIComponent(session.$id)}`;
      const description =
        session.description?.trim() ||
        `${session.title} — jogatina de ${session.gameName} no Zetho.`;
      this.seo.apply({
        title: `${session.title} — Jogatina | Zetho`,
        description,
        canonical,
        robots: 'index,follow',
        ogType: 'website',
        ogImage: session.gameCoverUrl,
      });
      this.seo.setJsonLd('gameplay-session', {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: session.title,
        description,
        startDate: session.scheduledAt,
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus:
          session.status === 'cancelled'
            ? 'https://schema.org/EventCancelled'
            : 'https://schema.org/EventScheduled',
        image: session.gameCoverUrl,
        url: this.seo.toAbsoluteUrl(canonical),
        organizer: session.host
          ? { '@type': 'Person', name: session.host.gamertag }
          : undefined,
      });
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd('gameplay-session');
  }

  requestToJoin() {
    const id = this.session()?.$id;
    if (id) void this.sessionsService.requestToJoin(id);
  }

  formattedDate() {
    return new Date(this.session()?.scheduledAt ?? '').toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' },
    );
  }

  formattedTime() {
    return new Date(this.session()?.scheduledAt ?? '').toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' },
    );
  }
}
