import {parse} from 'pg-connection-string';
import pgtools from 'pgtools';
import {config as dbConfig} from '../../config/configLoader';
import {exit} from 'process';

// Parse the connection string into its components.
const config = parse(dbConfig.databaseConnectionString);

// Extract the database name.
const dbName = config.database;
if (!dbName) {
  throw new Error('Database name not found in connection string.');
}

// Remove the database name from the configuration so that pgtools connects to the server.
delete config.database;

// Use the pgtools createdb method.
pgtools
  .createdb(config, dbName)
  .then(() => {
    console.log(
      `Database "${dbName}" created successfully (or already exists).`,
    );
  })
  .catch(err => {
    // If the error is 'duplicate_database', it means the database already exists.
    if (err.name === 'duplicate_database') {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      console.error('Error creating database:', err);
      exit(-1);
    }
  });
