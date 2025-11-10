import { Client, ExecutionMethod, Functions } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const functions = new Functions(client);

  if (req.path === '/ping') {
    return res.text('Pong');
  }

  const secret = req.headers['x-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const game = req.bodyJson;

    await functions.createExecution({
      functionId: 'igdb-core',
      xpath: '/sync',
      body: JSON.stringify({ ids: [game.id] }),
      async: true,
      method: ExecutionMethod.POST,
    });

    return res.json({ message: `Sync of ${game.name} was requested` });
  } catch (e) {
    error(e);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  return res.json({
    message: 'IGDB Webhook is running',
  });
};
