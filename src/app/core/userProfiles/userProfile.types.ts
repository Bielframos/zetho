import { StoredList, StoredRow } from '../appwrite/appwrite.types';
import { ConnectionRow } from '../connections/connections.types';

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
  zcoinBalance?: number;
  inviteCode?: string;
  activeThemeId?: string;
  unlockedThemes?: string[];
};

type UserProfileRow = StoredRow<UserProfile>;
type UserProfileList = StoredList<UserProfileRow>;

type ProfileWithConnection = UserProfileRow & {
  connection: ConnectionRow | null;
};

type InviteBonusResponse = {
  period: {
    start: string;
    endExclusive: string;
  };
  invitedUsersCount: number;
  eligibleInvites: number;
  bonusPercent: number;
  maxBonusPercent: number;
};

type InviteCodeResponse = {
  profileId: string;
  inviteCode: string;
};

export type {
  UserProfile,
  UserProfileRow,
  UserProfileList,
  ProfileWithConnection,
  InviteBonusResponse,
  InviteCodeResponse,
};
