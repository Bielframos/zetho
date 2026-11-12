import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: true,
  appVersion: '1.37.0',
  features: { raffles: false },
};
