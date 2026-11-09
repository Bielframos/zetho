import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: false,
  appVersion: '1.36.5',
  features: { raffles: false },
};
