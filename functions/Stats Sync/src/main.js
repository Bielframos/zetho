import { Client, Query, TablesDB } from 'node-appwrite';
import crypto from 'crypto';

const ADMIN_KEY = process.env.APPWRITE_ADMIN_KEY;

// Helper: validar se requisição é de admin
const isAdminRequest = (req) => {
  const authHeader = req.headers['authorization'];
  return authHeader === `Bearer ${ADMIN_KEY}`;
};

// Helper: gerar ID determinístico
const generateDeterministicId = (ownerFingerprint, gameId) => {
  return crypto
    .createHash('sha256')
    .update(`${ownerFingerprint}_${gameId}`)
    .digest('hex')
    .substring(0, 32);
};

export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new TablesDB(client);
  const path = req.path;
  const method = req.method;

  // -------------------------------------------------
  // ENDPOINTS
  // -------------------------------------------------

  // 1. Clone z_entries para z_entries_read
  if (path === '/sync-to-read' && method === 'POST') {
    if (!isAdminRequest(req)) {
      return res.json({ error: true, message: 'Unauthorized' }, 401);
    }

    try {
      let offset = 0;
      const limit = 100;
      let totalProcessed = 0;

      while (true) {
        const entries = await databases.listRows({
          databaseId: 'app',
          tableId: 'z_entries',
          queries: [
            Query.select([
              'status',
              'startedAt',
              'finishedAt',
              'replays',
              'liked',
              'gameId',
              'ownerFingerprint',
            ]),
            Query.offset(offset),
            Query.limit(limit),
          ],
        });

        if (entries.rows.length === 0) break;

        for (const entry of entries.rows) {
          const readId = generateDeterministicId(
            entry.ownerFingerprint,
            entry.gameId
          );

          try {
            await databases.createRow({
              databaseId: 'app',
              tableId: 'z_entries_read',
              rowId: readId,
              data: {
                ...entry,
              },
            });
          } catch (e) {
            log(e);
          }
          totalProcessed++;
        }

        offset += limit;
      }

      return res.json({
        message: `Sync completed: ${totalProcessed} entries synced to z_entries_read`,
        totalProcessed,
      });
    } catch (err) {
      return res.json({
        error: true,
        message: 'Sync failed',
        details: err.message,
      });
    }
  }

  // 2. Recalcular stats de todos os usuários
  if (path === '/recalculate-stats' && method === 'POST') {
    if (!isAdminRequest(req)) {
      return res.json({ error: true, message: 'Unauthorized' }, 401);
    }

    try {
      let offset = 0;
      const limit = 50;
      let totalUpdated = 0;

      const profiles = await databases.listRows({
        databaseId: 'app',
        tableId: 'user_profiles',
        queries: [Query.limit(1000)],
      });

      for (const profile of profiles.rows) {
        const userEntries = await databases.listRows({
          databaseId: 'app',
          tableId: 'z_entries_read',
          queries: [
            Query.equal('ownerFingerprint', profile.fingerprint),
            Query.limit(1000),
          ],
        });

        const counts = {
          completed: 0,
          backlog: 0,
          dropped: 0,
          playing: 0,
          wishlist: 0,
        };

        for (const entry of userEntries.rows) {
          if (entry.status && counts.hasOwnProperty(entry.status)) {
            counts[entry.status]++;
          }
        }

        // Atualiza perfil do usuário
        const updates = {
          totalsCompleted: counts.completed,
          totalsBacklog: counts.backlog,
          totalsDropped: counts.dropped,
          totalsPlaying: counts.playing,
          totalsWishlist: counts.wishlist,
        };

        await databases.updateRow({
          databaseId: 'app',
          tableId: 'user_profiles',
          rowId: profile.$id,
          data: updates,
        });

        totalUpdated++;
      }

      return res.json({
        message: `Recalculation completed for ${totalUpdated} profiles`,
        totalUpdated,
      });
    } catch (err) {
      return res.json({
        error: true,
        message: 'Recalculation failed',
        details: err.message,
      });
    }
  }

  // -------------------------------------------------
  // WEBHOOK PADRÃO: Processa CREATE de z_entries
  // -------------------------------------------------
  const event = req.headers['x-appwrite-event'];

  // -------------------------------------------------
  // 1. Só processa CREATE
  // -------------------------------------------------
  if (!event?.endsWith('.create')) {
    return res.json({ message: 'Stats sync idle' });
  }

  const entry = req.bodyJson;

  // -------------------------------------------------
  // 2. Idempotência: já processado?
  // -------------------------------------------------
  if (entry.processedAt) {
    return res.json({ message: 'Entry already processed' });
  }

  const currentStatus = entry.status;
  const currentLiked = entry.liked;

  // -------------------------------------------------
  // 3. Buscar registro anterior (penúltimo)
  // -------------------------------------------------
  const previousEntries = await databases.listRows({
    databaseId: 'app',
    tableId: 'z_entries',
    queries: [
      Query.equal('ownerFingerprint', entry.ownerFingerprint),
      Query.equal('gameId', entry.gameId),
      Query.orderDesc('$createdAt'),
      Query.limit(2),
    ],
  });

  const previousEntry =
    previousEntries.rows.length > 1 ? previousEntries.rows[1] : null;

  const prevStatus = previousEntry?.status ?? null;
  const prevLiked = previousEntry?.liked ?? null;

  // -------------------------------------------------
  // 4. Helper de status
  // -------------------------------------------------
  const statuses = ['completed', 'backlog', 'dropped', 'playing', 'wishlist'];

  const getStatusOp = (status) => {
    if (prevStatus !== status && currentStatus === status) return 'increment';
    if (prevStatus === status && currentStatus !== status) return 'decrement';
    return null;
  };

  const makeOp = (action, databaseId, tableId, rowId, column) => ({
    action,
    databaseId,
    tableId,
    rowId,
    data: { value: 1, column },
  });

  // -------------------------------------------------
  // 5. Buscar perfil do usuário
  // -------------------------------------------------
  const profiles = await databases.listRows({
    databaseId: 'app',
    tableId: 'user_profiles',
    queries: [Query.equal('fingerprint', entry.ownerFingerprint)],
  });

  const userProfile = profiles.rows[0];

  if (!userProfile) {
    return res.json({ error: true, message: 'User profile not found' });
  }

  // -------------------------------------------------
  // 6. Gerar operações de stats
  // -------------------------------------------------
  const statsOps = statuses
    .map((status) => {
      const action = getStatusOp(status);
      if (!action) return null;

      return makeOp(
        action,
        'app',
        'z_entry_count',
        `zstats_${entry.gameId}`,
        `${status}Count`
      );
    })
    .filter(Boolean);

  const profileOps = statuses
    .map((status) => {
      const action = getStatusOp(status);
      if (!action) return null;

      const key = `totals${status.charAt(0).toUpperCase() + status.slice(1)}`;

      return makeOp(action, 'app', 'user_profiles', userProfile.$id, key);
    })
    .filter(Boolean);

  // -------------------------------------------------
  // 7. Likes — DERIVADO (null-safe)
  // -------------------------------------------------
  let likeOp = null;

  if (prevLiked !== currentLiked) {
    const zStats = await databases.getRow({
      databaseId: 'app',
      tableId: 'z_entry_count',
      rowId: `zstats_${entry.gameId}`,
    });

    const currentLikes = zStats.likes ?? 0;

    let delta = 0;

    if (prevLiked !== true && currentLiked === true) delta = 1;
    if (prevLiked === true && currentLiked !== true) delta = -1;

    if (delta !== 0) {
      likeOp = {
        action: 'update',
        databaseId: 'app',
        tableId: 'z_entry_count',
        rowId: `zstats_${entry.gameId}`,
        data: {
          likes: Math.max(0, currentLikes + delta),
        },
      };
    }
  }

  // -------------------------------------------------
  // 8. Upsert em z_entries_read (registro único por jogo)
  // -------------------------------------------------
  const readId = generateDeterministicId(entry.ownerFingerprint, entry.gameId);

  const {
    $id,
    $sequence,
    $tableId,
    $databaseId,
    $createdAt,
    $updatedAt,
    $permissions,
    ...cleanEntry
  } = entry;

  try {
    // Tenta atualizar se existir
    await databases.upsertRow({
      databaseId: 'app',
      tableId: 'z_entries_read',
      rowId: readId,
      data: {
        ...cleanEntry,
      },
    });
  } catch (err) {
    console.error('Erro ao fazer o upsert z_entries_read:', err.message);
  }

  // -------------------------------------------------
  // 9. Transaction
  // -------------------------------------------------
  let tx = null;

  try {
    tx = await databases.createTransaction();

    const operations = [...statsOps, ...profileOps, likeOp].filter(Boolean);

    if (operations.length > 0) {
      await databases.createOperations({
        transactionId: tx.$id,
        operations,
      });
    }

    // Marca o entry como processado
    await databases.createOperations({
      transactionId: tx.$id,
      operations: [
        {
          action: 'update',
          databaseId: 'app',
          tableId: 'z_entries',
          rowId: entry.$id,
          data: { processedAt: new Date().toISOString() },
        },
      ],
    });

    await databases.updateTransaction({
      transactionId: tx.$id,
      commit: true,
    });

    return res.json({ message: `Stats synced for game ${entry.gameId}` });
  } catch (err) {
    if (tx?.$id) {
      await databases.updateTransaction({
        transactionId: tx.$id,
        rollback: true,
      });
    }

    return res.json({ error: true, message: 'Stats sync failed' });
  }
};
