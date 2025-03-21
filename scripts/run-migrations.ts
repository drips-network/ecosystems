import path from 'path';
import {logger} from '../src/common/infrastructure/logger';
import fs from 'fs';
import {DataSource} from 'typeorm';

export default async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DB_CONNECTION_STRING,
    migrationsTableName: '_Migrations',
    migrations: ['build/src/common/infrastructure/migrations/*.js'],
  });

  await dataSource.initialize();

  try {
    const migrations = await dataSource.runMigrations();

    if (migrations.length > 0) {
      console.log(`Updated database with ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    } else if (!checkMigrationsExist()) {
      logger.warn(
        'No migrations were applied. Did you forget to run "npm run compile"?',
      );
    } else {
      console.log('The database is up to date. No migrations were applied.');
    }
  } finally {
    await dataSource.destroy();
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

  console.log(`Checking if migrations exist in '${migrationPath}'...`);

  if (!fs.existsSync(migrationPath)) {
    return false;
  }

  return true;
}

runMigrations().catch(error => {
  console.error('Error running migrations:', error);

  throw error;
});
