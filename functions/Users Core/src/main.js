import { Client, TablesDB, Users } from 'node-appwrite';
import registerHandler from './handlers/register.handler.js';

const routes = {
  'POST /register': registerHandler,
};

export default async (context) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(context.req.headers['x-appwrite-key'] ?? '');

  const users = new Users(client);
  const databases = new TablesDB(client);

  const ctx = { ...context, users, databases };

  const key = `${ctx.req.method} ${ctx.req.path}`;
  const handler = routes[key];

  if (!handler) return ctx.res.send('Not Found', 404);

  try {
    return await handler(ctx);
  } catch (err) {
    ctx.error(err.message);
    return ctx.res.send('Internal Error', 500);
  }
};
