import { getDatabase, closeDatabase } from './lib/db';

const db = getDatabase();
console.log('Database initialized successfully!');

// Test a query
const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

closeDatabase();
