import {z} from 'zod';

export const ALLOWED_DB_SCHEMAS = ['sepolia', 'mainnet', 'filecoin'] as const;

const databaseConfigSchema = z.object({
  connectionString: z.string(),
  changeDetection: z.object({
    schemas: z.array(z.enum(ALLOWED_DB_SCHEMAS)),
    pollingInterval: z.number().int().positive().default(30000), // 5 minutes. Specific to current - polling - strategy.
  }),
});

const loggingConfigSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  destination: z.enum(['console', 'file']).default('console'),
  filename: z.string().optional(),
});

export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.number().int().positive().default(3000),
  database: databaseConfigSchema,
  logging: loggingConfigSchema,
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
export type Config = z.infer<typeof configSchema>;
