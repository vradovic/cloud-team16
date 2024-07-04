import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export type ConfigProps = {
  POOL_NAME: string;
  DOMAIN_NAME: string;
  DOMAIN_PREFIX: string;
};

export const getConfig = (): ConfigProps => {
  return {
    POOL_NAME: process.env.POOL_NAME || 'srbflixUserPool',
    DOMAIN_NAME: process.env.DOMAIN_NAME || 'srbflixDomain',
    DOMAIN_PREFIX: process.env.DOMAIN_PREFIX || 'srbflix-auth',
  };
};
