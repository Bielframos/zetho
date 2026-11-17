import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: true,
  appVersion: '1.38.1',
  features: { raffles: false },
};
