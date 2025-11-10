import { Client, Query, TablesDB } from 'node-appwrite';
import IGDBService from './igdb.js';
import { normalizeGame } from './utils.js';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

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
    if (req.path === '/search' && req.method === 'POST') {
      const payload = req.bodyJson;
      const query = payload.query;

      if (!query) {
        return res.json({ message: 'Query parameter is required' }, 400);
      }

      const games = await IGDB.searchGames(query, 12, 0);
      const normalizedGames = games.map(normalizeGame);
      return res.json({ games: normalizedGames });
    }

    // Lida com requisições para sincronizar jogos por IDs
    if (req.path === '/sync' && req.method === 'POST') {
      const payload = req.bodyJson;
      const ids = payload.ids;

      if (!ids || !Array.isArray(ids)) {
        return res.json(
          { message: 'Ids parameter is required and must be an array' },
          400
        );
      }

      const games = await IGDB.getGamesByIds(ids);
      const normalizedGames = games.map(normalizeGame);

      await Promise.all(
        normalizedGames.map(async (game) => {
          databases.createRow({
            databaseId: 'app',
            tableId: 'games',
            rowId: `igdb_${game.externalReference}`,
            data: game,
          });
        })
      );

      return res.json({
        message: 'Games synchronized successfully',
        games: normalizedGames,
      });
    }

    // Lida com requisições para obter jogos por IDs
    if (req.path === '/get' && req.method === 'POST') {
      const payload = req.bodyJson;
      const ids = payload.ids;

      if (!ids || !Array.isArray(ids)) {
        return res.json(
          { message: 'Ids parameter is required and must be an array' },
          400
        );
      }

      const games = await IGDB.getGamesByIds(ids);
      return res.json({ games });
    }

    // Lida com requisições para popular tipos de jogos
    if (req.path === '/seed/game-types' && req.method === 'POST') {
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

      return res.json({ message: 'Game types seeded successfully' });
    }
  } catch (e) {
    error(e);
    return res.json({ message: e.message, error: e.type }, e.code);
  }

  return res.json({
    message: 'IGDB Core Function is running',
  });
};
