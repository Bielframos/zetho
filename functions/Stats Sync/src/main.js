import { Client, TablesDB } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const databases = new TablesDB(client);

  const event = req.headers['x-appwrite-event'];

  if (event.endsWith('.upsert')) {
    const payload = req.bodyJson;

    let prevState = {};
    try {
      prevState = JSON.parse(payload.prevState || '{}');
    } catch {}

    const prevStatus = prevState.status;
    const currentStatus = payload.status;

    function setStatusOperation(status, prev, current) {
      return prev !== status && current === status
        ? 'increment'
        : prev === status && current !== status
          ? 'decrement'
          : null;
    }

    const statsOperations = {
      completed: setStatusOperation('completed', prevStatus, currentStatus),
      backlog: setStatusOperation('backlog', prevStatus, currentStatus),
      dropped: setStatusOperation('dropped', prevStatus, currentStatus),
      playing: setStatusOperation('playing', prevStatus, currentStatus),
      wishlist: setStatusOperation('wishlist', prevStatus, currentStatus),
      likes:
        prevState.liked === payload.liked
          ? null
          : payload.liked
            ? 'increment'
            : 'decrement',
    };

    const operations = Object.entries(statsOperations)
      .filter(([_, action]) => action !== null)
      .map(([key, action]) => ({
        action,
        databaseId: 'app',
        tableId: 'z_entry_count',
        rowId: `zstats_${payload.gameId}`,
        data: { value: 1, column: key !== 'likes' ? `${key}Count` : 'likes' },
      }));

    let retries = 0;

    do {
      let retry = false;

      try {
        const tx = await databases.createTransaction();

        await databases.createOperations({
          transactionId: tx.$id,
          operations,
        });

        await databases.updateTransaction({
          transactionId: tx.$id,
          commit: true,
        });

        return res.json({ message: `ZStats from ${payload.gameId} is synced` });
      } catch (e) {
        retries++;

        await databases.updateTransaction({
          transactionId: tx.$id,
          rollback: true,
        });

        if (retries <= 3) {
          retry = true;
          await new Promise((r) => setTimeout(r, retries * 50));
        } else {
          return res.json({ error: true, message: 'Max retries exceeded' });
        }
      }
    } while (true);
  }

  return res.json({ message: 'Function Stats Sync is running' });
};
