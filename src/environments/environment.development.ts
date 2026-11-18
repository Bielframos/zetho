import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: false,
  appVersion: '1.39.0',
  features: { raffles: false },
};
