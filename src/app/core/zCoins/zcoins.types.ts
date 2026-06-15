export type ZCoinReason =
  | 'daily_login'
  | 'engaged'
  | 'finished_game'
  | 'playing_game'
  | 'add_game_to_library'
  | 'create_list'
  | 'add_game_to_list';

export interface ZCoinTransactionResponse {
  userId: string;
  type: 'input' | 'output';
  reason: string;
  amount: number;
  balance: number;
}

export interface WeeklyZCoinLeaderboardResponse {
  period: 'weekly';
  since: string | null;
  limit: number;
  totalPlayers: number;
  leaders: Array<{
    position: number;
    userId: string;
    gamertag: string | null;
    avatarUrl: string | null;
    zcoins: number;
  }>;
  lastSyncAt: string;
  nextSyncAt: string;
  resetsIn: string;
}

export interface ZCoinRewardPreview {
  amount: number;
  reason: ZCoinReason;
  label: string;
}
