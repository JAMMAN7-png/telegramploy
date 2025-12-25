import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/telegramploy.db';
    db = new Database(dbPath, { create: true });

    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');

    // Run migrations
    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: Database) {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema
  database.run(schema);

  console.log('✅ Database initialized');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
