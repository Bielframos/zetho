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
    if (ctx.req.path === '/register' && ctx.req.method === 'POST') {
      try {
        const payload = ctx.req.bodyJson;
        const externalId = payload?.externalId;

        if (!externalId) {
          return ctx.res.json({ message: 'externalId is required' }, 400);
        }

        // Verifica se o game já existe
        const existing = await databases.listRows({
          databaseId: 'app',
          tableId: 'games',
          queries: [
            Query.select(['$id']),
            Query.equal('externalReference', externalId),
            Query.limit(1),
          ],
        });

        if (existing.total > 0) {
          const gameRow = existing.rows[0];
          return ctx.res.json(
            {
              message: 'Game already registered',
              gameId: gameRow.$id,
            },
            200
          );
        }

        // Busca do IGDB
        const games = await IGDB.getGamesByIds([externalId]);

        if (!games || games.length === 0) {
          return ctx.res.json({ message: 'Game not found on IGDB' }, 404);
        }

        const igdbGame = games[0];

        // --- Developers ---
        const developerCompanyIds = [
          ...new Set(
            (igdbGame.involved_companies ?? [])
              .filter((ic) => ic.developer && ic.company)
              .map((ic) => ic.company)
          ),
        ];

        let developers = [];
        if (developerCompanyIds.length > 0) {
          developers = await IGDB.getCompaniesByIds(developerCompanyIds);
        }

        // --- Genres ---
        const genres = [
          ...new Map((igdbGame.genres ?? []).map((g) => [g.id, g])).values(),
        ];

        const normalizedGame = normalizeGame(igdbGame);
        const gameRowId = `igdb_${normalizedGame.externalReference}`;
        const zstatsRowId = `zstats_${gameRowId}`;

        const operations = [];

        // Upsert developers
        for (const company of developers) {
          operations.push(
            databases.upsertRow({
              databaseId: 'app',
              tableId: 'companies',
              rowId: `igdb_${company.id}`,
              data: {
                slug: company.slug,
                name: company.name,
              },
            })
          );
        }

        // Upsert genres
        for (const genre of genres) {
          operations.push(
            databases.upsertRow({
              databaseId: 'app',
              tableId: 'genres',
              rowId: `igdb_${genre.id}`,
              data: {
                name: genre.name,
                slug: genre.slug,
                checksum: genre.checksum ?? null,
              },
            })
          );
        }

        // Create game
        operations.push(
          databases.createRow({
            databaseId: 'app',
            tableId: 'games',
            rowId: gameRowId,
            data: normalizedGame,
          })
        );

        // Create zstats
        operations.push(
          databases.createRow({
            databaseId: 'app',
            tableId: 'z_entry_count',
            rowId: zstatsRowId,
            data: { game: gameRowId },
          })
        );

        // Executa tudo paralelamente
        await Promise.all(operations);

        return ctx.res.json(
          {
            message: 'Game registered successfully',
            gameId: gameRowId,
          },
          201
        );
      } catch (e) {
        ctx.error('register-game failed', e);

        return ctx.res.json(
          {
            message: e.message ?? 'Internal error',
            error: e,
          },
          e.code ?? 500
        );
      }
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
  } catch (e) {
    ctx.error(e);
    return ctx.res.json(e, e.code);
  }

  return ctx.res.json({
    message: 'IGDB Core Function is running',
  });
};
