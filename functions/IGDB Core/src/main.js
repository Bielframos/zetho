import { Client, Query, TablesDB } from 'node-appwrite';
import IGDBService from './igdb.js';
import { normalizeGame, registerGame } from './utils.js';

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

      ctx.log('New IGDB token created');
    }

    // Lida com requisições para sincronizar jogos por IDs
    if (ctx.req.path === '/register' && ctx.req.method === 'POST') {
      const payload = ctx.req.bodyJson;
      const rawId = payload?.externalId ?? payload?.id;
      const externalId = String(rawId);

      if (!/^\d+$/.test(externalId)) {
        throw { message: 'externalId must be numeric', code: 400 };
      }

      const response = await registerGame({ externalId }, IGDB, databases);
      return ctx.res.json(response.data, response.status);
    }

    // Lida com sincronização de 1 jogo (update)
    if (ctx.req.path === '/sync' && ctx.req.method === 'POST') {
      const payload = ctx.req.bodyJson;
      const rawId = payload?.externalId ?? payload?.id;
      const externalId = String(rawId);

      if (!/^\d+$/.test(externalId)) {
        throw { message: 'externalId must be numeric', code: 400 };
      }

      ctx.log(`🔄 Sync requested for IGDB ID: ${externalId}`);

      // 1. Verifica se o jogo existe no banco
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

      if (!existing) {
        ctx.log(
          `🆕 Game ${externalId} not found in database → delegating to /register`
        );

        const response = await registerGame(
          { externalId, calledBySync: true },
          IGDB,
          databases
        );
        return ctx.res.json(response.data, response.status);
      }

      const appwriteGameId = existing.$id;

      const igdbGames = await IGDB.getGamesByIds([externalId]);
      const igdbGame = igdbGames?.[0] ?? null;

      // Caso o game tenha sido removido do IGDB
      if (!igdbGame) {
        await databases.updateRow({
          databaseId: 'app',
          tableId: 'games',
          rowId: appwriteGameId,
          data: {
            syncedAt: new Date().toISOString(),
            syncStatus: 'missingOnIGDB',
          },
        });

        ctx.log(
          `⚠️ IGDB ID ${externalId} não encontrado → marcado como missing`
        );
        return ctx.res.json({
          message: 'Game marked as missingOnIGDB',
          externalId,
        });
      }

      // Buscar developers
      const developers = (await IGDB.getGameDevelopers([igdbGame.id])) ?? [];
      const developersIds = developers.map((dev) => `igdb_${dev.company.id}`);

      // Upsert developers
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

      // Normalizar jogo
      const normalized = normalizeGame(igdbGame, developersIds);

      // Atualizar jogo
      await databases.updateRow({
        databaseId: 'app',
        tableId: 'games',
        rowId: appwriteGameId,
        data: normalized,
      });

      return ctx.res.json(
        {
          message: 'Game synced successfully',
          gameId: appwriteGameId,
        },
        200
      );
    }
  } catch (e) {
    ctx.error('IGDB core function failed', e);

    const status = e.code && Number.isInteger(e.code) ? e.code : 500;

    return ctx.res.json(
      {
        message: e.message ?? 'Internal error',
        error: e,
      },
      status
    );
  }

  return ctx.res.json({
    message: 'IGDB Core Function is running',
  });
};
