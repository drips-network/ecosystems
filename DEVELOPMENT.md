# Database Migrations

## Running Migrations

Migrations run from the compiled JavaScript code, not directly from TypeScript files. Migrations do not run automatically.

To run the migrations:

1. Compile the TypeScript code: `npm run compile`

2. Run the migrations: `npm run typeorm:run`

## Creating a New Migration

To generate a new migration: `npm run typeorm:generate --name=YourMigrationName`

This will create a new migration file in src/common/infrastructure/migrations/ based on entity changes.
