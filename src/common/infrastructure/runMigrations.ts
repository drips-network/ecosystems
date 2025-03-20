import path from 'path';
import {logger} from './logger';
import {dataSource} from './datasource';
import fs from 'fs';

export default async function runMigrations() {
  const migrations = await dataSource.runMigrations();

  if (migrations.length > 0) {
    logger.info(`Updated database with ${migrations.length} migrations:`);
    migrations.forEach(migration => {
      logger.info(`- ${migration.name}`);
    });
  } else if (!checkMigrationsExist()) {
    logger.warn(
      'No migrations were applied. Did you forget to run "npm run compile"?',
    );
  } else {
    logger.info('The database is up to date. No migrations were applied.');
  }
}

function checkMigrationsExist() {
  const migrationPath = path.resolve(
    'build',
    'src',
    'common',
    'infrastructure',
    'migrations',
  ); // Consistent for both dev and prod

  logger.info(`Checking if migrations exist in '${migrationPath}'...`);

  if (!fs.existsSync(migrationPath)) {
    return false;
  }

  return true;
}
