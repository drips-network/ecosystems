import {z} from 'zod';
import {SUPPORTED_CHAIN_IDS} from '../../domain/types';

const loggingConfigSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  destination: z.enum(['console', 'file']).default('console'),
  filename: z.string().optional(),
});

export const rpcConfigSchema = z.record(
  z.enum(SUPPORTED_CHAIN_IDS),
  z
    .object({
      url: z.string().url(),
      accessToken: z.string().optional(),
      fallbackUrl: z.string().optional(),
      fallbackAccessToken: z.string().optional(),
    })
    .optional(),
);

export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.number().int().positive().default(3000),
  databaseConnectionString: z.string(),
  logging: loggingConfigSchema,
  redisConnectionString: z.string(),
  gitHubToken: z.string(),
  rpc: rpcConfigSchema,
});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
export type Config = z.infer<typeof configSchema>;
