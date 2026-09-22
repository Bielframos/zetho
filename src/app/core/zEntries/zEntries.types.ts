import type { GameWithEntry } from '../games/game.types';
import {
  StoredList,
  StoredRow,
} from '../../shared/infra/appwrite/appwrite.types';

type ZEntry = {
  gameId: string;
  liked?: boolean;
  hyped?: boolean;
  status?: 'completed' | 'backlog' | 'dropped' | 'playing' | 'wishlist' | null;
  statusChangedAt?: string | null;
  startedAt?: string;
  finishedAt?: string;
  replays?: number;
  playedPlatformId?: string | null;
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

export type EntryGrouping =
  | 'release-year'
  | 'alphabetical'
  | 'none';
export type ProfileEntry = ZEntryRow & {
  game: GameWithEntry;
  groupKey: string;
};
export type ProfileEntriesPage = { rows: ProfileEntry[]; total: number };
