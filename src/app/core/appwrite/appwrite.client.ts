import { Account, Client, Databases, Functions, Teams } from 'appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.adstrito.com/v1')
  .setProject('690a16460002c718253a');

export const appwrite = {
  client,
  account: new Account(client),
  teams: new Teams(client),
  datababases: new Databases(client),
  functions: new Functions(client)
};

export { ID } from 'appwrite';
