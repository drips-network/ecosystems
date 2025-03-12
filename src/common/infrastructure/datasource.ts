import {DataSource} from 'typeorm';
import {Ecosystem} from '../domain/entities.ts/Ecosystem';
import {Node} from '../domain/entities.ts/Node';
import {Edge} from '../domain/entities.ts/Edge';
import {config} from '../../config/configLoader';

export const dataSource = new DataSource({
  type: 'postgres',
  url: config.databaseConnectionString,
  entities: [Ecosystem, Node, Edge],
  migrationsTableName: '_Migrations',
  migrations: ['build/src/common/infrastructure/migrations/*.js'],
});
