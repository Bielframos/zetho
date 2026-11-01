import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: true,
  appVersion: '1.36.1',
  features: { raffles: false },
};
