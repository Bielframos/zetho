import {
  Client,
  TablesDB,
  Functions,
  ExecutionMethod,
  Query,
} from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new TablesDB(client);
  const functions = new Functions(client);

  const match = req.path.match(/^\/games\/([^\/]+)$/);

  if (match) {
    switch (req.method) {
      case 'GET':
        try {
          const slug = match[1];

          const result = await databases.listRows({
            databaseId: 'app',
            tableId: 'games',
            queries: [
              Query.select([
                '*',
                'genres.name',
                'genres.slug',
                'involvedCompanies.name',
                'involvedCompanies.slug',
                'zStats.*',
              ]),
              Query.equal('slug', slug),
              Query.limit(1),
            ],
          });

          if (result.total === 0) {
            return res.json({ message: 'Game not found' }, 404);
          }

          let game = result.rows[0];

          // Garantir zStats
          if (!game.zStats) {
            const zStats = await databases.createRow({
              databaseId: 'app',
              tableId: 'z_entry_count',
              rowId: 'unique()',
              data: {},
            });

            game.zStats = zStats;
          }

          if (game.syncedAt === null) {
            try {
              const execution = await functions.createExecution({
                functionId: 'igdb-core',
                xpath: '/sync',
                body: JSON.stringify({ ids: [game.externalReference] }),
                method: ExecutionMethod.POST,
              });

              if (execution.responseStatusCode === 200) {
                const syncData = JSON.parse(execution.responseBody);
                if (syncData.games?.length > 0) game = syncData.games[0];
              }
            } catch (e) {
              error('IGDB sync failed', e);
            }
          }

          return res.json(game);
        } catch (e) {
          return res.json({ message: e.message }, e.code);
        }

      default:
        return res.json({ message: 'Method not allowed' }, 405);
    }
  }

  return res.json({ message: 'Zerei Core Function is running' });
};
