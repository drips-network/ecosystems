# Database Migrations

## Running Migrations

Migrations do not run automatically. To run the migrations:

1. Compile the TypeScript code: `npm run compile`

2. Run the migrations: `dev:db:run-migrations` (or `db:run-migrations` to run from the build).

## Creating a New Migration

To generate a new migration: `npm run dev:db:create-migration --name=YourMigrationName`

This will create a new migration file in src/common/infrastructure/migrations/ based on entity changes.
