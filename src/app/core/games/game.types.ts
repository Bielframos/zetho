import { StoredList, StoredRow } from '../appwrite/appwrite.types';
import { ZStatsRow } from '../../types';

type Game = {
  name: string;
  slug: string;
  coverUrl: string;
  releaseYear: string;
  releaseDate: string;
  summary: string;
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
};

type GameRow = StoredRow<Game>;
type GameList = StoredList<GameRow>;

export type { Game, GameList, GameRow };
