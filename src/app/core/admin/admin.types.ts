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

export type AdminAuditAllResponse = {
  totalProfiles: number;
  auditedProfiles: number;
  mismatchedProfiles: number;
  fixedProfiles: number;
  fixApplied: boolean;
  reports: AdminAuditReport[];
};

export type AdminAuditOneResponse = AdminAuditReport;
