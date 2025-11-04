import { Account, Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.adstrito.com/v1')
  .setProject('690a16460002c718253a');

export const appwrite = {
  client,
  account: new Account(client),
  datababases: new Databases(client),
};
