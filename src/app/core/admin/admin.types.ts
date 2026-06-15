export type AdminApiError = {
  message: string;
  status: number;
};

export type AdminAddGameResponse = {
  message: string;
  success: boolean;
  gameId: string;
};

export type AdminProfileItem = {
  $id: string;
  userId: string;
  gamertag: string;
  fingerprint: string;
  totalsCompleted: number;
  totalsBacklog: number;
  totalsDropped: number;
  totalsPlaying: number;
  totalsWishlist: number;
};

export type AdminProfilesResponse = {
  items: AdminProfileItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TotalsSnapshot = {
  totalsCompleted: number;
  totalsBacklog: number;
  totalsDropped: number;
  totalsPlaying: number;
  totalsWishlist: number;
};

export type AdminAuditReport = {
  profileId: string;
  userId: string;
  gamertag: string;
  fingerprint: string;
  storedTotals: TotalsSnapshot;
  actualTotals: TotalsSnapshot;
  mismatchFields: Array<keyof TotalsSnapshot>;
  shouldFix: boolean;
  fixed: boolean;
};

// --- Sorteios ---

export type AdminRaffleKey = {
  key: string;
  platform: string;
};

export type AdminCreateRaffleBody = {
  gameId: string;
  rewardPolicy: 'one_key' | 'all_keys';
  basicProbability?: number;
  ticketPrice?: number;
};

export type AdminCreateRaffleWithKeysBody = AdminCreateRaffleBody & {
  keys: AdminRaffleKey[];
};

export type AdminRaffleResponse = {
  $id: string;
  game: {
    $id: string;
    name: string;
  };
  name: string;
  rewardPolicy: string;
  basicProbability?: number;
  ticketPrice?: number;
  active: boolean;
  keysCount: number;
  $createdAt: string;
  $updatedAt: string;
  message?: string;
};

export type AdminRaffleListResponse = {
  raffles: AdminRaffleResponse[];
  cursor: string | null;
  hasMore: boolean;
};

export type AdminActivateRaffleResponse = {
  $id: string;
  active: boolean;
  message?: string;
};

export type AdminAddKeysResponse = {
  message: string;
  added: number;
};

export type AdminAuditAllResponse = {
  totalProfiles: number;
  auditedProfiles: number;
  mismatchedProfiles: number;
  fixedProfiles: number;
  fixApplied: boolean;
  reports: AdminAuditReport[];
};

export type AdminAuditOneResponse = AdminAuditReport;
