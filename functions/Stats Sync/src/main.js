import { Client, Query, TablesDB } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new TablesDB(client);
  const event = req.headers['x-appwrite-event'];

  if (!event.endsWith('.upsert')) {
    return res.json({ message: 'Function Stats Sync is running' });
  }

  const payload = req.bodyJson;

  // ---------------------------
  // PARSE prevState
  // ---------------------------
  let prevState = {};
  try {
    prevState = JSON.parse(payload.prevState || '{}');
  } catch {}

  const prevStatus = prevState.status;
  const currentStatus = payload.status;

  const prevLiked = prevState.liked;
  const currentLiked = payload.liked;

  // ---------------------------
  // HELPER: Detectar operação de status
  // ---------------------------
  const setStatusOperation = (status) => {
    return prevStatus !== status && currentStatus === status
      ? 'increment'
      : prevStatus === status && currentStatus !== status
        ? 'decrement'
        : null;
  };

  // ---------------------------
  // HELPER: Gerar op para Appwrite (genérica)
  // ---------------------------
  const makeOp = (action, databaseId, tableId, rowId, column) => ({
    action,
    databaseId,
    tableId,
    rowId,
    data: { value: 1, column },
  });

  // ---------------------------
  // BUSCA user_profile
  // ---------------------------
  const userProfiles = await databases.listRows({
    databaseId: 'app',
    tableId: 'user_profiles',
    queries: [Query.equal('fingerprint', payload.ownerFingerprint)],
  });

  const userProfile = userProfiles.rows[0];

  if (!userProfile) {
    return res.json({ error: true, message: 'User profile not found' });
  }

  // ---------------------------
  // GERAR: Op estatísticas do jogo
  // ---------------------------
  const statuses = ['completed', 'backlog', 'dropped', 'playing', 'wishlist'];

  const statsOps = statuses
    .map((status) => {
      const action = setStatusOperation(status);
      if (!action) return null;

      return makeOp(
        action,
        'app',
        'z_entry_count',
        `zstats_${payload.gameId}`,
        `${status}Count`
      );
    })
    .filter(Boolean);

  // ---------------------------
  // GERAR: Op no perfil do usuário
  // ---------------------------
  const profileOps = statuses
    .map((status) => {
      const key = `totals${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const action = setStatusOperation(status);
      if (!action) return null;

      return makeOp(action, 'app', 'user_profiles', userProfile.$id, key);
    })
    .filter(Boolean);

  // ---------------------------
  // GERAR: Like Operation (não atômico)
  // ---------------------------
  let likeOp = null;

  if (prevLiked !== currentLiked) {
    const zStats = await databases.getRow({
      databaseId: 'app',
      tableId: 'z_entry_count',
      rowId: `zstats_${payload.gameId}`,
      queries: [Query.select('likes')],
    });

    const newLikes = Math.max(0, (zStats.likes ?? 0) + (currentLiked ? 1 : -1));

    likeOp = {
      action: 'update',
      databaseId: 'app',
      tableId: 'z_entry_count',
      rowId: `zstats_${payload.gameId}`,
      data: { likes: newLikes },
    };
  }

  // Agrupa tudo
  const allOperations = [...statsOps, ...profileOps];
  if (likeOp) allOperations.push(likeOp);

  // ---------------------------
  // TRANSAÇÃO COM RETRY
  // ---------------------------
  for (let retries = 1; retries <= 3; retries++) {
    let tx = null;

    try {
      tx = await databases.createTransaction();

      await databases.createOperations({
        transactionId: tx.$id,
        operations: allOperations,
      });

      await databases.updateTransaction({
        transactionId: tx.$id,
        commit: true,
      });

      return res.json({ message: `ZStats from ${payload.gameId} synced` });
    } catch (e) {
      if (tx?.$id) {
        await databases.updateTransaction({
          transactionId: tx.$id,
          rollback: true,
        });
      }

      if (retries === 3) {
        return res.json({ error: true, message: 'Max retries exceeded' });
      }

      await new Promise((resolve) => setTimeout(resolve, retries * 50));
    }
  }
};
