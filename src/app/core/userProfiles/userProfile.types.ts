import { StoredList, StoredRow } from '../appwrite/appwrite.types';

type UserProfile = {
  userId: string;
  gamertag: string;
  avatarUrl?: string;
  bio?: string;
  status: 'active' | 'pending_deletion';
  deletedAt?: string;
  totalsCompleted: number;
  totalsBacklog: number;
  totalsDropped: number;
  totalsPlaying: number;
  totalsWishlist: number;
  fingerprint: string;
  socialXbox?: string;
  socialSteam?: string;
  socialPsn?: string;
};

type UserProfileRow = StoredRow<UserProfile>;
type UserProfileList = StoredList<UserProfileRow>;

export type { UserProfile, UserProfileRow, UserProfileList };
