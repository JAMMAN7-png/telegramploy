import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/telegramploy.db';
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run migrations
    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: Database.Database) {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema
  database.exec(schema);

  console.log('✅ Database initialized');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
