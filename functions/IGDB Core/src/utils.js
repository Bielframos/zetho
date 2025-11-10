export function normalizeGame(game) {
  let summary = game.summary;
  const summaryLength = summary ? summary.length : 0;

  if (summaryLength > 750) {
    const truncatedSummary = summary.substring(0, 747) + '...';
    summary = truncatedSummary;
  }

  {
    return {
      name: game.name,
      slug: game.slug,
      coverUrl: game.cover
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : null,
      summary: summary || '',
      releaseYear: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear().toString()
        : null,
      externalReference: game.id,
      gameType: `igdb_${game.game_type}`,
      similarGames: game.similar_games
        ? game.similar_games.map((g) => `igdb_${g}`)
        : [],
      checksum: game.checksum || null,
    };
  }
}
