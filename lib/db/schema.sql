-- Tracks successfully sent files (prevents duplicates)
CREATE TABLE IF NOT EXISTS sent_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  etag TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  chunk_count INTEGER DEFAULT 1,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  telegram_message_ids TEXT,
  UNIQUE(bucket, object_key, etag)
);

CREATE INDEX IF NOT EXISTS idx_sent_files_bucket ON sent_files(bucket);
CREATE INDEX IF NOT EXISTS idx_sent_files_sent_at ON sent_files(sent_at);

-- Retry queue for failed uploads
CREATE TABLE IF NOT EXISTS retry_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempt DATETIME,
  next_retry DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_retry_queue_next_retry ON retry_queue(next_retry);

-- Single-user authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bucket monitoring settings
CREATE TABLE IF NOT EXISTS bucket_settings (
  bucket TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT 1,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_checked DATETIME
);

-- System logs
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
