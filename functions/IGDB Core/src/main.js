import { Client, Query, TablesDB } from 'node-appwrite';
import IGDBService from './igdb.js';
import { normalizeGame, upsertGame } from './utils.js';

export default async (ctx) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(ctx.req.headers['x-appwrite-key'] ?? '');

  const databases = new TablesDB(client);

  try {
    // Busca tokens existentes
    const tokens = await databases.listRows({
      databaseId: 'app',
      tableId: 'igdb_tokens',
      queries: [Query.orderDesc('$createdAt'), Query.limit(1)],
    });

    let token = tokens.rows[0];
    const IGDB = new IGDBService(token ? token.secret : '');

    // Verifica se o token existe e se está expirado
    if (!token || new Date(token.expiresAt) <= new Date()) {
      const data = await IGDB.authenticate(
        process.env.IGDB_CLIENT_ID,
        process.env.IGDB_CLIENT_SECRET
      );

      const expiresAt = new Date(
        Date.now() + data.expires_in * 1000
      ).toISOString();

      await databases.createRow({
        databaseId: 'app',
        tableId: 'igdb_tokens',
        rowId: 'unique()',
        data: {
          secret: data.access_token,
          expiresAt,
        },
      });

      log('New IGDB token created');
    }

    // Lida com requisições de busca
    if (ctx.req.path === '/search' && ctx.req.method === 'POST') {
      const payload = ctx.req.bodyJson;
      const query = payload.query;

      if (!query) {
        return ctx.res.json({ message: 'Query parameter is required' }, 400);
      }

      const games = await IGDB.searchGames(query, 12, 0);
      const normalizedGames = games.map(normalizeGame);
      return ctx.res.json({ games: normalizedGames });
    }

    // Lida com requisições para sincronizar jogos por IDs
    if (ctx.req.path === '/sync' && ctx.req.method === 'POST') {
      const payload = ctx.req.bodyJson;
      const ids = payload.ids;

      if (!ids || !Array.isArray(ids)) {
        return ctx.res.json(
          { message: 'Ids parameter is required and must be an array' },
          400
        );
      }

      const games = await IGDB.getGamesByIds(ids);

      const developerCompanyIds = [
        ...new Set(
          games
            .flatMap((game) => game.involved_companies ?? [])
            .filter((ic) => ic.developer && ic.company)
            .map((ic) => ic.company)
        ),
      ];

      const genres = [
        ...new Map(
          games
            .flatMap((game) => (game.genres ? game.genres : []))
            .map((g) => [g.id, g])
        ).values(),
      ];

      let developers;

      if (developerCompanyIds.length > 0) {
        developers = await IGDB.getCompaniesByIds(developerCompanyIds);
      }

      const upserts = [];

      if (developers?.length > 0) {
        upserts.push(
          databases.upsertRows({
            databaseId: 'app',
            tableId: 'companies',
            rows: developers.map((company) => ({
              $id: `igdb_${company.id}`,
              slug: company.slug,
              name: company.name,
            })),
          })
        );
      }

      if (genres?.length > 0) {
        upserts.push(
          databases.upsertRows({
            databaseId: 'app',
            tableId: 'genres',
            rows: genres.map((genre) => ({
              $id: `igdb_${genre.id}`,
              name: genre.name,
              slug: genre.slug,
              checksum: genre.checksum || null,
            })),
          })
        );
      }

      await Promise.all(upserts);

      const normalizedGames = games.map(normalizeGame);

      const upsertedGames = await Promise.all(
        normalizedGames.map((game) => upsertGame(databases, game))
      );

      return ctx.res.json({
        message: 'Games synchronized successfully',
        games: upsertedGames,
      });
    }

    // Lida com requisições para obter jogos por IDs
    if (ctx.req.path === '/get' && ctx.req.method === 'POST') {
      const payload = ctx.req.bodyJson;
      const ids = payload.ids;

      if (!ids || !Array.isArray(ids)) {
        return ctx.res.json(
          { message: 'Ids parameter is required and must be an array' },
          400
        );
      }

      const games = await IGDB.getGamesByIds(ids);
      return ctx.res.json({ games });
    }

    // Lida com requisições para popular jogos
    if (ctx.req.path === '/seed/games' && ctx.req.method === 'POST') {
      let currentIteration = 0;
      let totalFetchedGames = -1;

      const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      while (totalFetchedGames !== 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));

        const data = await IGDB.getGames(500, currentIteration * 500);
        totalFetchedGames = data.length;

        if (totalFetchedGames === 0) break;

        const normalizedGames = data.map(normalizeGame);
        const chunks = chunkArray(normalizedGames, 100);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          await Promise.all(
            chunk.map(async (game, index) => {
              try {
                await databases.createRow({
                  databaseId: 'app',
                  tableId: 'games',
                  rowId: `igdb_${game.externalReference}`,
                  data: game,
                });

                ctx.log(
                  `  → [${currentIteration + 1}] (${index + 1 + i * 100}/${
                    normalizedGames.length
                  }) ${game.name} importado`
                );
              } catch (err) {
                ctx.error(`❌ Erro ao criar ${game.name}:`, err.message);
              }
            })
          );

          ctx.log(`💾 Bloco ${i + 1}/${chunks.length} gravado com sucesso`);
        }

        ctx.log(
          `✅ Iteração ${currentIteration} concluída — ${totalFetchedGames} jogos importados`
        );

        currentIteration++;
      }

      ctx.log('🎮 Importação concluída!');
    }

    // Lida com requisições para popular tipos de jogos
    if (ctx.req.path === '/seed/game-types' && ctx.req.method === 'POST') {
      const data = await IGDB.getGameTypes(50, 0);

      await databases.createRows({
        databaseId: 'app',
        tableId: 'game_types',
        rows: data.map((item) => ({
          $id: `igdb_${item.id}`,
          type: item.type,
          checksum: item.checksum,
        })),
      });

      return ctx.res.json({ message: 'Game types seeded successfully' });
    }
  } catch (e) {
    ctx.error(e);
    return ctx.res.json(e, e.code);
  }

  return ctx.res.json({
    message: 'IGDB Core Function is running',
  });
};
