import { normalize } from '../search/search.helpers';
import { GameList, GameRow } from './game.types';

export function scoreResult(game: GameRow, query: string, keywords: string[]) {
  const name = normalize(game.name);
  const slug = normalize(game.slug);
  const q = normalize(query);

  let score = 0;

  if (name === q) score += 100;
  if (keywords.every((k) => slug.includes(k))) score += 60;
  if (name.startsWith(q)) score += 50;
  if (keywords.every((k) => name.includes(k))) score += 40;
  if (name.includes(q)) score += 30;
  keywords.forEach((k) => {
    if (name.includes(k)) score += 10;
  });

  score += Math.max(0, 10 - name.length / 20);
  return score;
}

export function rankAndMerge(
  exact: GameList | null,
  matches: GameList,
  query: string,
  keywords: string[],
) {
  const results: GameRow[] = [];

  if (exact?.total) results.push(...exact.rows);
  if (matches.total) results.push(...matches.rows);

  const ranked = results
    .map((game) => ({
      ...game,
      _score: scoreResult(game, query, keywords),
    }))
    .sort((a, b) => b._score - a._score);

  return {
    total: matches.total || ranked.length,
    rows: ranked,
  };
}
