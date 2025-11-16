// Função para normalizar o jogo
export function normalizeGame(game) {
  const syncedAt = new Date().toISOString();
  let summary = game.summary;
  const summaryLength = summary ? summary.length : 0;

  if (summaryLength > 750) {
    const truncatedSummary = summary.substring(0, 747) + '...';
    summary = truncatedSummary;
  }

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
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString()
      : null,
    genres: game.genres ? game.genres.map((g) => `igdb_${g.id}`) : [],
    involvedCompanies: game.involved_companies
      ? game.involved_companies
          .filter((ic) => ic.developer && ic.company)
          .map((ic) => `igdb_${ic.company}`)
      : [],
    externalReference: game.id,
    gameType: `igdb_${game.game_type}`,
    similarGames: game.similar_games
      ? game.similar_games.map((g) => `igdb_${g}`)
      : [],
    checksum: game.checksum || null,
    syncedAt,
  };
}

// Função para fazer o upsert de um jogo
export async function upsertGame(databases, game) {
  const databaseId = 'app';
  const tableId = 'games';
  const rowId = `igdb_${game.externalReference}`;

  try {
    await databases.getRow({ databaseId, tableId, rowId });

    return databases.updateRow({
      databaseId,
      tableId,
      rowId,
      data: game,
    });
  } catch (error) {
    if (error.code === 404) {
      return databases.createRow({
        databaseId,
        tableId,
        rowId,
        data: game,
      });
    }
  }
}
