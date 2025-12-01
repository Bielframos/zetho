import { Client, ExecutionMethod, Functions, TablesDB } from 'node-appwrite';
import { shouldIgnore } from './utils.js';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new TablesDB(client);
  const functions = new Functions(client);

  const secret = req.headers['x-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const payload = req.bodyJson ?? {};

    //
    // ──────────────────────────────────────────
    //   GAMES → CREATE
    // ──────────────────────────────────────────
    //
    if (req.path === '/games/create') {
      log(`🎮 Game created → ID: ${payload.id}`);

      if (shouldIgnore(payload)) {
        return res.json({ message: 'Game ignored' });
      }

      await functions.createExecution({
        functionId: 'igdb-core',
        xpath: '/register',
        method: ExecutionMethod.POST,
        async: true,
        body: JSON.stringify({ externalId: payload.id }),
      });

      return res.json({ message: 'Game create dispatched' });
    }

    //
    // ──────────────────────────────────────────
    //   GAMES → UPDATE
    // ──────────────────────────────────────────
    //
    if (req.path === '/games/update') {
      log(`♻️ Game updated → ID: ${payload.id}`);

      await functions.createExecution({
        functionId: 'igdb-core',
        xpath: '/sync',
        method: ExecutionMethod.POST,
        async: true,
        body: JSON.stringify({ externalId: payload.id }),
      });

      return res.json({ message: 'Game update dispatched' });
    }

    //
    // ──────────────────────────────────────────
    //   GENRES → CREATE / UPDATE
    // ──────────────────────────────────────────
    //
    if (req.path === '/genres/upsert') {
      log(`🏷 Genre upsert → ID: ${payload.id}`);

      await databases.upsertRow({
        databaseId: 'app',
        tableId: 'genres',
        rowId: `igdb_${payload.id}`,
        data: {
          name: payload.name,
          slug: payload.slug,
          checksum: payload.checksum,
        },
      });

      return res.json({ message: 'Genre upsert dispatched' });
    }

    //
    // ──────────────────────────────────────────
    //   GENRES → DELETE
    // ──────────────────────────────────────────
    //
    if (req.path === '/genres/delete') {
      if (!payload.id) {
        return res.json({ message: 'Missing ID for deletion' }, 400);
      }

      log(`🏷 Genre deleted → ID: ${payload.id}`);

      await databases.deleteRow({
        databaseId: 'app',
        tableId: 'genres',
        rowId: `igdb_${payload.id}`,
      });

      return res.json({ message: 'Genre deletion dispatched' });
    }

    return res.json({ message: 'No handler for this path' });
  } catch (e) {
    error(e);
    return res.json({ message: 'Internal Server Error', error: e }, 500);
  }
};
