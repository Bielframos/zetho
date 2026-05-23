import { StoredList, StoredRow } from '../appwrite/appwrite.types';

type ZEntry = {
  gameId: string;
  liked?: boolean;
  hyped?: boolean;
  status?: 'completed' | 'backlog' | 'dropped' | 'playing' | 'wishlist' | null;
  startedAt?: string;
  finishedAt?: string;
  replays?: number;
  prevState?: string;
  ownerFingerprint: string;
  likedEver?: boolean;
  likeEver?: boolean;
  maxStatusReached?: ZEntry['status'];
};

type ZEntryRow = StoredRow<ZEntry>;
type ZEntryList = StoredList<ZEntryRow>;

export type { ZEntry, ZEntryList, ZEntryRow };
