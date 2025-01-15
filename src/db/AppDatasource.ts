import {DataSource} from 'typeorm';
import {config} from '../config/configLoader';
import {Ecosystem} from './entities.ts/Ecosystem';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.connectionString,
  synchronize: true, // Auto-create tables for simplicity (disable in production).
  logging: config.nodeEnv === 'development',
  entities: [Ecosystem],
});
