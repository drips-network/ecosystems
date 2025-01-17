import {DataSource} from 'typeorm';
import {Ecosystem} from '../domain/entities.ts/Ecosystem';
import {Node} from '../domain/entities.ts/Node';
import {Edge} from '../domain/entities.ts/Edge';
import {config} from './config/configLoader';

export const dataSource = new DataSource({
  type: 'postgres',
  url: config.databaseConnectionString,
  synchronize: true, // TODO: Auto-create tables for simplicity (disable in production).
  entities: [Ecosystem, Node, Edge],
});
