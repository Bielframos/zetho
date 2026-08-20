import {
  Account,
  Avatars,
  Client,
  Functions,
  TablesDB,
  Teams,
  Storage,
} from 'appwrite';
import { environment } from '../../../../environments/environment';

const client = new Client()
  .setEndpoint(environment.appwriteEndpoint)
  .setProject(environment.appwriteProject);

export const appwrite = {
  client,
  account: new Account(client),
  teams: new Teams(client),
  databases: new TablesDB(client),
  functions: new Functions(client),
  avatars: new Avatars(client),
  storage: new Storage(client),
};

export { ExecutionMethod, ID, Query } from 'appwrite';
export type { AppwriteException } from 'appwrite';
