export type RaffleRewardPolicy = 'random' | 'first-come';

export type RafflePlatform =
  | 'steam'
  | 'playstation'
  | 'xbox'
  | 'nintendo'
  | 'pc'
  | 'other';

export interface RaffleKey {
  key: string;
  platform: RafflePlatform;
}

export interface RaffleGameData {
  $id: string;
  name: string;
  slug: string;
  coverUrl: string;
}

export interface RaffleItem {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  game: string | RaffleGameData;
  rewardPolicy: RaffleRewardPolicy;
  basicProbability?: number;
  ticketPrice?: number;
  active: boolean;
  availableKeysCount: number;
  availableKeyPlatforms?: RafflePlatform[];
  ticketsCount?: number;
}

export interface RaffleListResponse {
  raffles: RaffleItem[];
  cursor: string | null;
  hasMore: boolean;
}

export interface RaffleEntry {
  $id: string;
  $createdAt: string;
  raffleId: string;
  userId: string;
  ticketCount: number;
  won: boolean;
  key?: string;
  platform?: string;
  luckyNumbers?: number[];
  drawNumber?: number;
}

export interface RaffleEntriesResponse {
  entries: RaffleEntry[];
}

export interface RaffleMyKey {
  $id: string;
  gameId: string;
  raffleId: string;
  key: string;
  platform?: string;
  wonAt: string;
}

export interface RaffleMyKeysResponse {
  total: number;
  keys: RaffleMyKey[];
}

export interface RaffleListParams {
  active?: boolean;
  limit?: number;
  cursor?: string;
  gameId?: string;
}

export interface BuyTicketsResponse {
  entryId: string;
  raffleId: string;
  userId: string;
  ticketCount: number;
  totalCost: number;
  luckyNumbers: number[];
  drawNumber: number;
  won: boolean;
  wonKey: { platform: string; key: string } | null;
  newBalance: number;
}
