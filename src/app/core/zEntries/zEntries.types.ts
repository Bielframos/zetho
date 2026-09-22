import { StoredList, StoredRow } from '../../shared/infra/appwrite/appwrite.types';

type ZEntry = {
  gameId: string;
  liked?: boolean;
  hyped?: boolean;
  status?: 'completed' | 'backlog' | 'dropped' | 'playing' | 'wishlist' | null;
  startedAt?: string;
  finishedAt?: string;
  replays?: number;
  playedPlatform?: string | null;
  completionType?: string | null;
  playtimeMinutes?: number | null;
  prevState?: string;
  ownerFingerprint: string;
  likedEver?: boolean;
  likeEver?: boolean;
  maxStatusReached?: ZEntry['status'];
  likeCount?: number;
  commentCount?: number;
};

type ZEntryRow = StoredRow<ZEntry>;
type ZEntryList = StoredList<ZEntryRow>;

export type { ZEntry, ZEntryList, ZEntryRow };
