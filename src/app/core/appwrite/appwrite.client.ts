import { Account, Client, TablesDB, Functions, Teams, Query, Avatars } from 'appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.adstrito.com/v1')
  .setProject('690a16460002c718253a');

export const appwrite = {
  client,
  account: new Account(client),
  teams: new Teams(client),
  datababases: new TablesDB(client),
  functions: new Functions(client),
  avatars: new Avatars(client)
};

export { ID, Query, ExecutionMethod } from 'appwrite';
export type { AppwriteException } from 'appwrite'
