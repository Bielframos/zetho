import { StoredList, StoredRow } from '../appwrite/appwrite.types';
import { ZEntryRow, ZStatsRow } from '../../types';

type Game = {
  name: string;
  slug: string;
  coverUrl: string;
  releaseYear: string;
  releaseDate: string;
  rawReleaseDate?: string;
  summary: string;
  summaryPt?: string;
  hypes: number;
  externalReference: number;
  gameType: string | any;
  genres: string | any;
  involvedCompanies: string | any;
  syncedAt: string;
  zStats: ZStatsRow;
  similarGames: string[];
  ratingAvg: number;
  ratingCount: number;
  ratingSum: number;
  /**
   * Calculado pela API (`GET /games/:slug`), nunca persistido.
   *
   * É o predicado único de indexabilidade: a meta `robots` da página e o
   * sitemap precisam derivar da mesma fonte. Se divergirem, o Google recebe
   * sinais contraditórios.
   */
  seo?: {
    indexable: boolean;
    textReviewCount: number;
  };
};

type GameRow = StoredRow<Game>;
type GameList = StoredList<GameRow>;

type GameWithEntry = GameRow & {
  zEntry?: ZEntryRow | null;
};

type GameMediaType = 'screenshot' | 'video' | 'art_work';

type GameMedia = {
  type: GameMediaType;
  mediaId: string;
  name: string | null;
  $id: string;
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  game: string;
  $databaseId: string;
  $tableId: string;
  url: string;
};

type GameHero = {
  url: string;
  type: 'screenshot' | 'art_work';
};

export type { Game, GameList, GameRow, GameWithEntry, GameMedia, GameHero };
