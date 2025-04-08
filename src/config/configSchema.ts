import {z} from 'zod';
import {SUPPORTED_CHAIN_IDS} from '../common/domain/types';

const loggingConfigSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  destination: z.enum(['console', 'file']).default('console'),
  filename: z.string().optional(),
});

export const rpcConfigSchema = z.record(
  z.enum(SUPPORTED_CHAIN_IDS),
  z.object({
    url: z.string().url(),
    accessToken: z.string().optional(),
    fallbackUrl: z.string().optional(),
    fallbackAccessToken: z.string().optional(),
  }),
);

export const pinataConfigSchema = z.object({
  apiKey: z.string(),
  secretApiKey: z.string(),
});

export const configSchema = z.object({
  port: z.number().int().positive().default(3000),
  databaseConnectionString: z.string(),
  logger: loggingConfigSchema,
  redisConnectionString: z.string(),
  gitHubToken: z.string(),
  rpc: rpcConfigSchema,
  walletPrivateKey: z.string(),
  shouldSponsorTxs: z.boolean().default(false),
  txConfirmationInterval: z.number().int().positive().default(15000), // 30 seconds
  pinata: pinataConfigSchema,
  shouldLoadQueueUI: z.boolean().default(false),
  confirmations: z.number().int().default(3),
  fakePinataUrl: z.string().url().optional(),
});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
export type Config = z.infer<typeof configSchema>;
