import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GameplaySessionsService } from '../../gameplay-sessions.service';
import { SessionCardComponent } from '../../components/session-card/session-card';
import { CreateSessionModalComponent } from '../../components/create-session-modal/create-session-modal';
import { SessionDetailModalComponent } from '../../components/session-detail-modal/session-detail-modal';
import { GameplaySession, SessionFilter } from '../../gameplay-sessions.types';
import { UiEmptyState } from '../../../../shared/ui/empty-state';

@Component({
  selector: 'app-sessions-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SessionCardComponent,
    CreateSessionModalComponent,
    SessionDetailModalComponent,
    UiEmptyState,
  ],
  templateUrl: './sessions-list.html',
})
export class SessionsListPage implements OnInit {
  sessionsService = inject(GameplaySessionsService);
  private route = inject(ActivatedRoute);

  isCreateModalOpen = signal(false);
  isDetailModalOpen = signal(false);

  filterTabs: { key: SessionFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'Todas', icon: 'ph-squares-four' },
    { key: 'public', label: 'Públicas', icon: 'ph-globe' },
    { key: 'private', label: 'Privadas', icon: 'ph-lock-key' },
    { key: 'my_sessions', label: 'Minhas Jogatinas', icon: 'ph-user-gear' },
    { key: 'joined', label: 'Participando', icon: 'ph-users-three' },
    { key: 'invites', label: 'Convites', icon: 'ph-envelope-simple' },
  ];

  ngOnInit() {
    void this.sessionsService.loadSessions();
    this.route.queryParamMap.subscribe((params) => {
      const targetId = params.get('id');
      if (targetId) void this.openDetailById(targetId);
    });
  }

  setFilter(key: SessionFilter) {
    this.sessionsService.filter.set(key);
    void this.sessionsService.loadSessions();
  }

  onSearchChange(value: string) {
    this.sessionsService.searchQuery.set(value);
  }

  openCreateModal() {
    this.isCreateModalOpen.set(true);
  }

  openDetail(session: GameplaySession) {
    void this.openDetailById(session.$id);
  }

  private async openDetailById(sessionId: string) {
    this.isDetailModalOpen.set(true);
    await this.sessionsService.loadSessionDetail(sessionId);
  }

  onRequestJoin(session: GameplaySession) {
    void this.sessionsService.requestToJoin(session.$id);
  }

  onLeaveSession(session: GameplaySession) {
    void this.sessionsService.leaveSession(session.$id);
  }

  onRespond(session: GameplaySession, action: 'accept' | 'decline') {
    void this.sessionsService.respondToInvitation(session.$id, action);
  }
}
