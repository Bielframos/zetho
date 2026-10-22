import { publicEnvironment } from './environment.generated';

export const environment = {
  ...publicEnvironment,
  production: true,
  appVersion: '1.35.2',
  features: { raffles: false },
};
