export type ParticipantStatus =
  | 'pending'
  | 'invited'
  | 'confirmed'
  | 'declined'
  | 'rejected'
  | 'removed'
  | 'cancelled'
  | 'left';
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type SessionPrivacy = 'closed' | 'public';
export type SessionPlatform =
  | 'Crossplay'
  | 'PC'
  | 'PlayStation'
  | 'Xbox'
  | 'Switch';

export interface SessionParticipant {
  $id: string;
  sessionId?: string;
  profileId: string;
  profile: {
    $id: string;
    gamertag: string;
    avatarUrl?: string;
  } | null;
  status: ParticipantStatus;
  isHost?: boolean;
  invitedAt?: string;
  respondedAt?: string | null;
}

export interface GameplaySession {
  $id: string;
  hostProfileId: string;
  gameId: string;
  gameName: string;
  gameCoverUrl?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  privacy: SessionPrivacy;
  maxPlayers: number;
  confirmedCount: number;
  status: SessionStatus;
  tags?: string[];
  host?: {
    $id: string;
    gamertag: string;
    avatarUrl?: string;
  } | null;
  participants?: SessionParticipant[];
  myParticipantStatus?: ParticipantStatus;
  $createdAt: string;
  $updatedAt?: string;
}

export type ParticipantAction =
  | 'approve'
  | 'reject'
  | 'remove'
  | 'cancel_invite';

export interface CreateSessionDto {
  gameId: string;
  gameName?: string;
  gameCoverUrl?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  privacy: SessionPrivacy;
  maxPlayers: number;
  invitedProfileIds?: string[];
  tags?: string[];
}

export type SessionFilter =
  | 'all'
  | 'my_sessions'
  | 'invites'
  | 'public'
  | 'joined'
  | 'private';
