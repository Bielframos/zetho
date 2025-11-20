import { Client, TablesDB } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
 const databases = new TablesDB(client)

log(req.headers['x-appwrite.event'])
log(req.bodyJson)

 return res.empty()
};
