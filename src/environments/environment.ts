import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: true,
  appVersion: '1.35.1',
  features: { raffles: false },
};
