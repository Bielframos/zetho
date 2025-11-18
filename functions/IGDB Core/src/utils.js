// Função para normalizar o jogo
export function normalizeGame(game, developers = []) {
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
    genres: game.genres ? game.genres.map((genreId) => `igdb_${genreId}`) : [],
    involvedCompanies: developers,
    externalReference: game.id,
    gameType: `igdb_${game.game_type}`,
    similarGames: game.similar_games
      ? game.similar_games.map((g) => `igdb_${g}`)
      : [],
    checksum: game.checksum || null,
    syncedAt,
  };
}

// Função auxiliar para registro de jogos
export async function registerGame(
  { externalId, calledBySync },
  IGDB,
  databases
) {
  if (Number.isNaN(externalId) || externalId <= 0) {
    throw { message: 'externalId must be a valid number', code: 400 };
  }

  if (!calledBySync) {
    // Verifica se o game já existe
    const existing = await databases
      .getRow({
        databaseId: 'app',
        tableId: 'games',
        rowId: `igdb_${externalId}`,
      })
      .catch((e) => {
        if (e.code === 404) return null;
        throw { message: e.message, code: e.code };
      });

    if (existing) {
      return {
        data: { message: 'Game already registered', gameId: existing.$id },
        status: 200,
      };
    }
  }

  // Busca no IGDB
  const games = await IGDB.getGamesByIds([externalId]);

  if (!games || games.length === 0) {
    throw { message: 'Game not found on IGDB', code: 404 };
  }

  const igdbGame = games[0];

  // --- Devs ---
  const developers = (await IGDB.getGameDevelopers([igdbGame.id])) ?? [];
  const developersIds = developers.map((dev) => `igdb_${dev.company.id}`);

  const normalizedGame = normalizeGame(igdbGame, developersIds);
  const gameRowId = `igdb_${normalizedGame.externalReference}`;
  const zstatsRowId = `zstats_${gameRowId}`;

  // Upsert developers (se houver)
  if (developers.length > 0) {
    await databases.upsertRows({
      databaseId: 'app',
      tableId: 'companies',
      rows: developers.map((dev) => ({
        $id: `igdb_${dev.company.id}`,
        name: dev.company.name,
        slug: dev.company.slug,
        checksum: dev.company.checksum,
      })),
    });
  }

  // Criar game e zstats em paralelo

  await databases.createRow({
    databaseId: 'app',
    tableId: 'games',
    rowId: gameRowId,
    data: normalizedGame,
  });

  await databases.createRow({
    databaseId: 'app',
    tableId: 'z_entry_count',
    rowId: zstatsRowId,
    data: { game: gameRowId },
  });

  return {
    data: {
      message: 'Game registered successfully',
      gameId: gameRowId,
    },
    status: 201,
  };
}
