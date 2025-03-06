import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import {z} from 'zod';
import {Config, configSchema, rpcConfigSchema} from './configSchema';

dotenvExpand.expand(dotenv.config());

function loadConfig(): Config {
  const config = {
    env: process.env.NODE_ENV,
    databaseConnectionString: process.env.DB_CONNECTION_STRING,
    logging: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
      destination: process.env.LOG_DESTINATION,
      filename: process.env.LOG_FILE,
    },
    redisConnectionString: process.env.REDIS_CONNECTION_STRING,
    rpc: process.env.RPC_CONFIG
      ? rpcConfigSchema.parse(JSON.parse(process.env.RPC_CONFIG))
      : undefined,
    gitHubToken: process.env.GITHUB_TOKEN,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    shouldSponsorTxs: process.env.SHOULD_SPONSOR_TXS === 'true',
    txConfirmationInterval: process.env.TX_CONFIRMATION_INTERVAL,
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      secretApiKey: process.env.PINATA_SECRET_API_KEY,
    },
  };

  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(`Invalid configuration:\n${details}`);
    }

    throw error;
  }
}

// Singleton config instance
export const config = loadConfig();
