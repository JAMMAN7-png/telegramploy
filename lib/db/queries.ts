import { Database } from 'bun:sqlite';

// Sent Files
export function isFileSent(db: Database, bucket: string, objectKey: string, etag: string): boolean {
  const query = db.query('SELECT id FROM sent_files WHERE bucket = ? AND object_key = ? AND etag = ?');
  const result = query.get(bucket, objectKey, etag);
  return !!result;
}

export function markFileSent(
  db: Database,
  data: {
    bucket: string;
    objectKey: string;
    etag: string;
    fileSize: number;
    chunkCount?: number;
    messageIds: string[];
  }
) {
  const query = db.query(`
    INSERT INTO sent_files (bucket, object_key, etag, file_size, chunk_count, telegram_message_ids)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  return query.run(
    data.bucket,
    data.objectKey,
    data.etag,
    data.fileSize,
    data.chunkCount || 1,
    JSON.stringify(data.messageIds)
  );
}

export function getSentFiles(db: Database, limit = 100) {
  const query = db.query('SELECT * FROM sent_files ORDER BY sent_at DESC LIMIT ?');
  return query.all(limit);
}

// Bucket Settings
export function addBucket(db: Database, bucketName: string, enabled = true) {
  const query = db.query('INSERT OR IGNORE INTO bucket_settings (bucket, enabled) VALUES (?, ?)');
  return query.run(bucketName, enabled ? 1 : 0);
}

export function getAllBuckets(db: Database) {
  const query = db.query('SELECT * FROM bucket_settings');
  return query.all();
}

export function getEnabledBuckets(db: Database) {
  const query = db.query('SELECT * FROM bucket_settings WHERE enabled = 1');
  return query.all();
}

export function updateBucketEnabled(db: Database, bucketName: string, enabled: boolean) {
  const query = db.query('UPDATE bucket_settings SET enabled = ? WHERE bucket = ?');
  return query.run(enabled ? 1 : 0, bucketName);
}

export function updateBucketLastChecked(db: Database, bucketName: string) {
  const query = db.query('UPDATE bucket_settings SET last_checked = CURRENT_TIMESTAMP WHERE bucket = ?');
  return query.run(bucketName);
}

// Retry Queue
export function addToRetryQueue(
  db: Database,
  data: {
    bucket: string;
    objectKey: string;
    fileSize: number;
    errorMessage: string;
  }
) {
  const nextRetry = new Date(Date.now() + 60000).toISOString(); // 1 minute
  const query = db.query(`
    INSERT INTO retry_queue (bucket, object_key, file_size, attempts, next_retry, error_message)
    VALUES (?, ?, ?, 0, ?, ?)
  `);
  return query.run(data.bucket, data.objectKey, data.fileSize, nextRetry, data.errorMessage);
}

export function getRetryQueueReady(db: Database) {
  const now = new Date().toISOString();
  const query = db.query('SELECT * FROM retry_queue WHERE next_retry <= ? ORDER BY next_retry ASC');
  return query.all(now);
}

export function updateRetryAttempt(db: Database, id: number, attempts: number, errorMessage: string) {
  const delays = [60000, 300000, 900000, 3600000, 21600000, 86400000];
  const delay = delays[Math.min(attempts, delays.length - 1)] || 60000;
  const nextRetry = new Date(Date.now() + delay).toISOString();

  const query = db.query(`
    UPDATE retry_queue
    SET attempts = ?, last_attempt = CURRENT_TIMESTAMP, next_retry = ?, error_message = ?
    WHERE id = ?
  `);
  return query.run(attempts, nextRetry, errorMessage, id);
}

export function removeFromRetryQueue(db: Database, id: number) {
  const query = db.query('DELETE FROM retry_queue WHERE id = ?');
  return query.run(id);
}

// Users
export function getUser(db: Database) {
  const query = db.query('SELECT * FROM users WHERE id = 1');
  return query.get();
}

export function createUser(
  db: Database,
  data: {
    username: string;
    passwordHash: string;
    totpSecret: string;
    backupCodes: string[];
  }
) {
  const query = db.query(`
    INSERT INTO users (id, username, password_hash, totp_secret, backup_codes)
    VALUES (1, ?, ?, ?, ?)
  `);
  return query.run(data.username, data.passwordHash, data.totpSecret, JSON.stringify(data.backupCodes));
}

// Logs
export function addLog(db: Database, data: { level: string; message: string; metadata?: any }) {
  const query = db.query('INSERT INTO logs (level, message, metadata) VALUES (?, ?, ?)');
  return query.run(data.level, data.message, data.metadata ? JSON.stringify(data.metadata) : null);
}

export function getLogs(db: Database, limit = 100) {
  const query = db.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT ?');
  return query.all(limit);
}
