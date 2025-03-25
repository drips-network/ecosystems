import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import {ZodError} from 'zod';
import {Config, configSchema, rpcConfigSchema} from './configSchema';

dotenvExpand.expand(dotenv.config());

function loadConfig(): Config {
  const config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    databaseConnectionString: process.env.DB_CONNECTION_STRING,
    logger: {
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
    shouldLoadQueueUI: process.env.SHOULD_LOAD_QUEUE_UI === 'true',
  };

  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors
        .map(err => {
          const path = err.path.join('.');
          const message = err.message;
          return `- ${path ? `'${path}': ` : ''}${message}`;
        })
        .join('\n');

      throw new Error(`Invalid configuration:\n\n${details}\n`);
    }

    throw error;
  }
}

// Singleton config instance
export const config = loadConfig();
