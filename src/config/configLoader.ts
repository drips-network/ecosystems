import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import {z} from 'zod';
import {Config, configSchema} from './configSchema';

dotenvExpand.expand(dotenv.config());

function loadConfig(): Config {
  const config = {
    env: process.env.NODE_ENV,
    database: {
      connectionString: process.env.DB_CONNECTION_STRING,
      changeDetection: {
        schemas: process.env.DB_SCHEMAS?.split(','),
      },
    },
    logging: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
      destination: process.env.LOG_DESTINATION,
      filename: process.env.LOG_FILE,
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
