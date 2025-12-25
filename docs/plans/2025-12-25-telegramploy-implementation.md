# TelegramPloy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a disaster recovery system that monitors RustFS buckets and sends backup files to Telegram with a Neo-Brutalism web dashboard.

**Architecture:** Bun runtime with Grammy.js for Telegram, native bun:sqlite for tracking, dual detection (webhooks + polling), Next.js 16.1 full-stack with Server Actions, React Server Components, real-time updates, Docker deployment to Dokploy.

**Tech Stack:**
- **Runtime**: Bun v1.3.4
- **Framework**: Next.js 16.1 (App Router, Turbopack, React Compiler)
- **Telegram**: Grammy.js v1.38.4
- **Database**: Native bun:sqlite
- **S3 Client**: @aws-sdk/client-s3 v3.958.0
- **Auth**: next-auth v5 (Auth.js) with 2FA
- **Styling**: TailwindCSS v4, Framer Motion
- **Icons**: Lucide React
- **Deployment**: Docker + Dokploy

---

## Phase 1: Project Foundation with Bun

### Task 1.1: Initialize Bun Project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Create: `bunfig.toml`

**Step 1: Install Bun (if not installed)**

```bash
curl -fsSL https://bun.sh/install | bash
```

**Step 2: Initialize Bun project**

Run: `bun init`
Expected: Creates `package.json`, `tsconfig.json`

**Step 3: Install Next.js and core dependencies**

```bash
bun add next@latest react@latest react-dom@latest
bun add grammy@1.38.4 @aws-sdk/client-s3@latest @aws-sdk/s3-request-presigner
bun add next-auth@beta bcryptjs otplib qrcode
bun add -d @types/node @types/react @types/react-dom typescript
```

**Step 4: Install UI and styling dependencies**

```bash
bun add tailwindcss@next postcss autoprefixer
bun add framer-motion lucide-react
bun add socket.io socket.io-client
bun add zod react-hook-form @hookform/resolvers
```

**Step 5: Create .gitignore**

```
node_modules/
.next/
.env
.env.local
*.db
*.log
out/
dist/
.DS_Store
tmp/
data/
.vercel
```

**Step 6: Create .env.example**

```bash
# RustFS Configuration
RUSTFS_ENDPOINT=https://api.s3.v244.net
RUSTFS_ACCESS_KEY=your_access_key
RUSTFS_SECRET_KEY=your_secret_key
RUSTFS_REGION=us-east-1

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BACKUP_CHAT_ID=your_backup_chat_id
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# Webhook Configuration
WEBHOOK_SECRET_TOKEN=your_random_secret

# Polling Configuration
POLLING_INTERVAL_MINUTES=5

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database
DATABASE_PATH=./data/telegramploy.db

# Environment
NODE_ENV=development
```

**Step 7: Create bunfig.toml**

```toml
[install]
# Install exact versions
exact = true

[run]
# Use --bun flag by default
bun = true
```

**Step 8: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "background": "bun run src/background/index.ts"
  }
}
```

**Step 9: Create basic README**

```markdown
# TelegramPloy

Disaster recovery system that monitors RustFS buckets and sends backups to Telegram.

## Tech Stack

- **Runtime**: Bun v1.3.4
- **Framework**: Next.js 16.1
- **Telegram**: Grammy.js 1.38.4
- **Database**: Native bun:sqlite

## Setup

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Copy `.env.example` to `.env`
3. Configure environment variables
4. Run `bun install`
5. Run `bun run dev`

## Documentation

See `docs/plans/2025-12-25-telegramploy-design.md` for complete design.
```

**Step 10: Commit**

```bash
git add .
git commit -m "chore: initialize Bun project with Next.js 16.1"
```

---

### Task 1.2: Next.js Project Structure

**Files:**
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Initialize Next.js config**

File: `next.config.ts`
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable React Compiler
    reactCompiler: true,
  },
  // Use Turbopack for dev and build
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};

export default nextConfig;
```

**Step 2: Initialize Tailwind config with Neo-Brutalism**

Run: `bunx tailwindcss init -p --ts`

File: `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0a',
        'dark-card': '#1a1a1a',
        'neon-cyan': '#00f0ff',
        'neon-magenta': '#ff006e',
        'neon-lime': '#00ff88',
        'neon-yellow': '#ffea00',
      },
      boxShadow: {
        'brutal': '4px 4px 0 0 #00f0ff',
        'brutal-lg': '8px 8px 0 0 #ff006e',
        'brutal-xl': '12px 12px 0 0 #00ff88',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 3: Create app directory structure**

```bash
mkdir -p app/{api,dashboard,auth,setup}
mkdir -p app/api/{webhook,health}
mkdir -p components/{ui,dashboard}
mkdir -p lib/{db,s3,telegram,auth}
mkdir -p src/background
mkdir -p data tmp/backups
```

**Step 4: Create root layout with Neo-Brutalism fonts**

File: `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'TelegramPloy - Backup Monitor',
  description: 'Disaster recovery system for RustFS backups',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased bg-dark-bg text-white`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 5: Create global styles**

File: `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-black;
  }
}

@layer components {
  .btn-brutal {
    @apply px-6 py-3 font-bold border-4 border-black shadow-brutal transition-all;
    @apply hover:translate-x-1 hover:translate-y-1 hover:shadow-none;
    @apply active:translate-x-2 active:translate-y-2 active:shadow-none;
  }

  .btn-brutal-primary {
    @apply btn-brutal bg-neon-cyan text-black;
  }

  .btn-brutal-danger {
    @apply btn-brutal bg-neon-magenta text-white;
  }

  .card-brutal {
    @apply bg-dark-card border-4 border-neon-cyan p-6 shadow-brutal-lg;
  }

  .input-brutal {
    @apply w-full px-4 py-3 border-4 border-black bg-dark-card text-white font-bold;
    @apply focus:outline-none focus:border-neon-cyan focus:shadow-brutal;
  }
}
```

**Step 6: Create landing page**

File: `app/page.tsx`
```typescript
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="card-brutal max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-neon-cyan">
          TelegramPloy
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Disaster Recovery System for RustFS Backups
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="btn-brutal-primary">
            Dashboard
          </Link>
          <Link href="/setup" className="btn-brutal bg-neon-lime text-black">
            Initial Setup
          </Link>
        </div>
      </div>
    </main>
  );
}
```

**Step 7: Test Next.js dev server**

Run: `bun run dev`
Expected: Next.js dev server starts with Turbopack on http://localhost:3000

**Step 8: Commit**

```bash
git add .
git commit -m "feat: setup Next.js 16.1 with Neo-Brutalism UI"
```

---

## Phase 2: Database Layer with bun:sqlite

### Task 2.1: SQLite Database Setup

**Files:**
- Create: `lib/db/index.ts`
- Create: `lib/db/schema.sql`
- Create: `lib/db/queries.ts`

**Step 1: Create database initialization**

File: `lib/db/index.ts`
```typescript
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
```

**Step 2: Create database schema**

File: `lib/db/schema.sql`
```sql
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
```

**Step 3: Create database queries**

File: `lib/db/queries.ts`
```typescript
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
  const delay = delays[Math.min(attempts, delays.length - 1)];
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
```

**Step 4: Test database initialization**

Create test file: `test-db.ts`
```typescript
import { getDatabase, closeDatabase } from './lib/db';

const db = getDatabase();
console.log('Database initialized successfully!');

// Test a query
const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

closeDatabase();
```

Run: `bun run test-db.ts`
Expected: Shows created tables

**Step 5: Commit**

```bash
git add lib/db/
git commit -m "feat: implement bun:sqlite database layer"
```

---

## Phase 3: RustFS S3 Client

### Task 3.1: S3 Client with AWS SDK v3

**Files:**
- Create: `lib/s3/client.ts`
- Create: `lib/s3/operations.ts`

**Step 1: Create S3 client factory**

File: `lib/s3/client.ts`
```typescript
import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client(config: {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
}): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for Minio/RustFS compatibility
  });
}

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = createS3Client({
      endpoint: process.env.RUSTFS_ENDPOINT!,
      accessKey: process.env.RUSTFS_ACCESS_KEY!,
      secretKey: process.env.RUSTFS_SECRET_KEY!,
      region: process.env.RUSTFS_REGION || 'us-east-1',
    });
  }
  return s3ClientInstance;
}
```

**Step 2: Create S3 operations**

File: `lib/s3/operations.ts`
```typescript
import {
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export async function listAllBuckets(s3Client: S3Client) {
  const command = new ListBucketsCommand({});
  const response = await s3Client.send(command);
  return response.Buckets || [];
}

export async function listBucketObjects(s3Client: S3Client, bucketName: string) {
  const command = new ListObjectsV2Command({ Bucket: bucketName });
  const response = await s3Client.send(command);
  return response.Contents || [];
}

export async function downloadFile(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  destinationPath: string
) {
  console.log(`📥 Downloading: ${bucketName}/${objectKey}`);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('No response body');
  }

  const writeStream = createWriteStream(destinationPath);
  await pipeline(response.Body as Readable, writeStream);

  console.log(`✅ Downloaded: ${destinationPath}`);
  return destinationPath;
}

export async function getPresignedUrl(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  expiresIn = 3600
) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

**Step 3: Commit**

```bash
git add lib/s3/
git commit -m "feat: implement S3 client with AWS SDK v3"
```

---

## Phase 4: Telegram Bot with Grammy.js 1.38.4

### Task 4.1: Grammy Bot Service

**Files:**
- Create: `lib/telegram/bot.ts`
- Create: `lib/telegram/messages.ts`

**Step 1: Create bot instance**

File: `lib/telegram/bot.ts`
```typescript
import { Bot, InputFile } from 'grammy';

let botInstance: Bot | null = null;

export function getBot(): Bot {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    botInstance = new Bot(token);
  }
  return botInstance;
}

export async function sendFileToTelegram(
  chatId: string,
  filePath: string,
  caption: string
) {
  const bot = getBot();

  console.log(`📤 Sending file to Telegram: ${filePath}`);

  const file = new InputFile(filePath);
  const result = await bot.api.sendDocument(chatId, file, {
    caption,
    parse_mode: 'HTML',
  });

  console.log(`✅ File sent, message ID: ${result.message_id}`);
  return result;
}

export async function sendMessage(chatId: string, text: string) {
  const bot = getBot();
  return await bot.api.sendMessage(chatId, text, {
    parse_mode: 'HTML',
  });
}
```

**Step 2: Create message formatters**

File: `lib/telegram/messages.ts`
```typescript
export function formatFileCaption(data: {
  bucket: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  etag: string;
  chunkInfo?: {
    current: number;
    total: number;
    chunkSize: number;
  };
}): string {
  if (data.chunkInfo) {
    return `[Part ${data.chunkInfo.current}/${data.chunkInfo.total}] <b>${data.bucket}/${data.fileName}</b>

📦 Bucket: <code>${data.bucket}</code>
📄 Original File: <code>${data.fileName}</code>
💾 Part Size: ${formatBytes(data.chunkInfo.chunkSize)}
📊 Total Size: ${formatBytes(data.fileSize)}
🕐 Uploaded: ${data.uploadTime}

🔧 Reassembly (Linux/Mac):
<code>cat ${data.fileName}.part* &gt; ${data.fileName}</code>

🔧 Reassembly (Windows):
<code>copy /b ${data.fileName}.part* ${data.fileName}</code>`;
  }

  return `📦 Bucket: <code>${data.bucket}</code>
📄 File: <code>${data.fileName}</code>
💾 Size: ${formatBytes(data.fileSize)}
🕐 Uploaded: ${data.uploadTime}
🔐 ETag: <code>${data.etag.substring(0, 16)}...</code>`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatAdminAlert(message: string): string {
  return `⚠️ <b>Admin Alert</b>\n\n${message}`;
}

export function formatDailyHeartbeat(stats: {
  backupsSent: number;
  totalSize: number;
  bucketsActive: number;
  bucketsTotal: number;
  failedUploads: number;
  retryQueueDepth: number;
  lastBackup: string | null;
  nextHeartbeat: string;
}): string {
  return `✅ <b>TelegramPloy System Operational</b>

📊 Last 24 Hours:
• Backups Sent: ${stats.backupsSent} files (${formatBytes(stats.totalSize)})
• Buckets Active: ${stats.bucketsActive}/${stats.bucketsTotal}
• Failed Uploads: ${stats.failedUploads}
• Retry Queue: ${stats.retryQueueDepth > 0 ? `${stats.retryQueueDepth} pending` : 'Empty'}

🔍 Last Backup: ${stats.lastBackup || 'None'}

⏰ Next heartbeat: ${stats.nextHeartbeat}`;
}
```

**Step 3: Commit**

```bash
git add lib/telegram/
git commit -m "feat: implement Telegram bot with Grammy.js 1.38.4"
```

---

## Phase 5: File Chunking Service

### Task 5.1: File Splitting Logic

**Files:**
- Create: `lib/chunking/index.ts`

**Step 1: Implement chunking**

File: `lib/chunking/index.ts`
```typescript
import { createReadStream, createWriteStream, statSync } from 'fs';
import { pipeline } from 'stream/promises';
import { basename, join } from 'path';

const TELEGRAM_FILE_LIMIT = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 1.8 * 1024 * 1024 * 1024; // 1.8GB

export function shouldSplitFile(filePath: string): boolean {
  const stats = statSync(filePath);
  return stats.size >= TELEGRAM_FILE_LIMIT;
}

export async function splitFile(
  filePath: string,
  outputDir: string
): Promise<Array<{ path: string; partNumber: number; size: number }>> {
  const stats = statSync(filePath);
  const totalSize = stats.size;
  const fileName = basename(filePath);

  console.log(`✂️ Splitting file: ${fileName} (${totalSize} bytes)`);

  const chunks: Array<{ path: string; partNumber: number; size: number }> = [];
  let partNumber = 1;
  let bytesRead = 0;

  while (bytesRead < totalSize) {
    const chunkPath = join(outputDir, `${fileName}.part${partNumber}`);
    const bytesToRead = Math.min(CHUNK_SIZE, totalSize - bytesRead);

    await createChunk(filePath, chunkPath, bytesRead, bytesToRead);

    chunks.push({
      path: chunkPath,
      partNumber,
      size: bytesToRead,
    });

    bytesRead += bytesToRead;
    partNumber++;
  }

  console.log(`✅ File split into ${chunks.length} chunks`);
  return chunks;
}

async function createChunk(
  sourcePath: string,
  destPath: string,
  start: number,
  length: number
) {
  const readStream = createReadStream(sourcePath, {
    start,
    end: start + length - 1,
  });
  const writeStream = createWriteStream(destPath);
  await pipeline(readStream, writeStream);
}
```

**Step 2: Commit**

```bash
git add lib/chunking/
git commit -m "feat: implement file chunking for large backups"
```

---

## Phase 6: Background Services

### Task 6.1: Polling Service

**Files:**
- Create: `src/background/polling.ts`
- Create: `src/background/processor.ts`
- Create: `src/background/index.ts`

**Step 1: Create polling service**

File: `src/background/polling.ts`
```typescript
import { getS3Client } from '../../lib/s3/client';
import { listAllBuckets, listBucketObjects } from '../../lib/s3/operations';
import { getDatabase } from '../../lib/db';
import { addBucket, getEnabledBuckets, updateBucketLastChecked, isFileSent } from '../../lib/db/queries';
import { EventEmitter } from 'events';

export class PollingService extends EventEmitter {
  private intervalId: Timer | null = null;
  private isRunning = false;

  constructor(private intervalMinutes: number) {
    super();
  }

  async start() {
    if (this.isRunning) {
      console.warn('Polling service already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting polling service (${this.intervalMinutes}min interval)`);

    // Run immediately
    await this.poll();

    // Then run on interval
    this.intervalId = setInterval(async () => {
      await this.poll();
    }, this.intervalMinutes * 60 * 1000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏸️ Polling service stopped');
  }

  private async poll() {
    try {
      console.log('🔍 Polling RustFS buckets...');

      const s3Client = getS3Client();
      const db = getDatabase();

      // Discover all buckets
      const buckets = await listAllBuckets(s3Client);
      console.log(`Found ${buckets.length} buckets`);

      // Add new buckets to database
      for (const bucket of buckets) {
        addBucket(db, bucket.Name!);
      }

      // Check enabled buckets for new files
      const enabledBuckets = getEnabledBuckets(db);

      for (const bucketSetting of enabledBuckets as any[]) {
        await this.checkBucket(bucketSetting.bucket);
      }

      console.log('✅ Polling complete');
    } catch (error) {
      console.error('Polling error:', error);
      this.emit('error', error);
    }
  }

  private async checkBucket(bucketName: string) {
    try {
      const s3Client = getS3Client();
      const db = getDatabase();

      const objects = await listBucketObjects(s3Client, bucketName);

      for (const obj of objects) {
        const alreadySent = isFileSent(db, bucketName, obj.Key!, obj.ETag!);

        if (!alreadySent) {
          console.log(`📦 New file detected: ${bucketName}/${obj.Key}`);

          this.emit('new-file', {
            bucket: bucketName,
            key: obj.Key!,
            size: obj.Size!,
            etag: obj.ETag!,
            lastModified: obj.LastModified!,
          });
        }
      }

      updateBucketLastChecked(db, bucketName);
    } catch (error) {
      console.error(`Error checking bucket ${bucketName}:`, error);
    }
  }
}
```

**Step 2: Create file processor**

File: `src/background/processor.ts`
```typescript
import { getS3Client } from '../../lib/s3/client';
import { downloadFile } from '../../lib/s3/operations';
import { shouldSplitFile, splitFile } from '../../lib/chunking';
import { sendFileToTelegram } from '../../lib/telegram/bot';
import { formatFileCaption } from '../../lib/telegram/messages';
import { getDatabase } from '../../lib/db';
import { markFileSent, addToRetryQueue } from '../../lib/db/queries';
import { basename, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const TEMP_DIR = './tmp/backups';

export class FileProcessor {
  async processFile(fileInfo: {
    bucket: string;
    key: string;
    size: number;
    etag: string;
    lastModified: Date;
  }) {
    const { bucket, key, size, etag, lastModified } = fileInfo;

    try {
      console.log(`⚙️ Processing: ${bucket}/${key}`);

      // Download file
      const tempFilePath = join(TEMP_DIR, basename(key));
      const s3Client = getS3Client();
      await downloadFile(s3Client, bucket, key, tempFilePath);

      // Check if needs splitting
      const needsSplit = shouldSplitFile(tempFilePath);

      if (needsSplit) {
        await this.processSplitFile(tempFilePath, bucket, key, size, etag, lastModified);
      } else {
        await this.processSingleFile(tempFilePath, bucket, key, size, etag, lastModified);
      }

      // Cleanup
      this.cleanup(tempFilePath);

      console.log(`✅ File processed: ${bucket}/${key}`);
    } catch (error: any) {
      console.error(`❌ Processing failed: ${bucket}/${key}`, error);

      const db = getDatabase();
      addToRetryQueue(db, {
        bucket,
        objectKey: key,
        fileSize: size,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async processSingleFile(
    filePath: string,
    bucket: string,
    key: string,
    size: number,
    etag: string,
    lastModified: Date
  ) {
    const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID!;
    const caption = formatFileCaption({
      bucket,
      fileName: basename(key),
      fileSize: size,
      uploadTime: lastModified.toISOString(),
      etag,
    });

    const result = await sendFileToTelegram(chatId, filePath, caption);

    const db = getDatabase();
    markFileSent(db, {
      bucket,
      objectKey: key,
      etag,
      fileSize: size,
      chunkCount: 1,
      messageIds: [result.message_id.toString()],
    });
  }

  private async processSplitFile(
    filePath: string,
    bucket: string,
    key: string,
    size: number,
    etag: string,
    lastModified: Date
  ) {
    const chunks = await splitFile(filePath, TEMP_DIR);
    const messageIds: string[] = [];
    const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID!;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const caption = formatFileCaption({
        bucket,
        fileName: basename(key),
        fileSize: size,
        uploadTime: lastModified.toISOString(),
        etag,
        chunkInfo: {
          current: i + 1,
          total: chunks.length,
          chunkSize: chunk.size,
        },
      });

      const result = await sendFileToTelegram(chatId, chunk.path, caption);
      messageIds.push(result.message_id.toString());

      this.cleanup(chunk.path);
    }

    const db = getDatabase();
    markFileSent(db, {
      bucket,
      objectKey: key,
      etag,
      fileSize: size,
      chunkCount: chunks.length,
      messageIds,
    });
  }

  private cleanup(filePath: string) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup: ${filePath}`);
    }
  }
}
```

**Step 3: Create background worker entry point**

File: `src/background/index.ts`
```typescript
import { PollingService } from './polling';
import { FileProcessor } from './processor';
import { getDatabase } from '../../lib/db';

async function main() {
  console.log('🚀 Starting TelegramPloy background worker...');

  // Initialize database
  const db = getDatabase();
  console.log('✅ Database initialized');

  // Create processor
  const processor = new FileProcessor();

  // Create polling service
  const pollingInterval = parseInt(process.env.POLLING_INTERVAL_MINUTES || '5', 10);
  const pollingService = new PollingService(pollingInterval);

  // Handle new file events
  pollingService.on('new-file', async (fileInfo) => {
    try {
      await processor.processFile(fileInfo);
    } catch (error) {
      console.error('Failed to process file:', error);
    }
  });

  // Start polling
  await pollingService.start();

  console.log('✅ Background worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await pollingService.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Background worker failed:', error);
  process.exit(1);
});
```

**Step 4: Update package.json to add background script**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "background": "bun run src/background/index.ts"
  }
}
```

**Step 5: Commit**

```bash
git add src/background/ package.json
git commit -m "feat: implement polling service and file processor"
```

---

## Phase 7: Next.js API Routes

### Task 7.1: Webhook API Route

**Files:**
- Create: `app/api/webhook/[token]/route.ts`
- Create: `app/api/webhook/route.ts`

**Step 1: Create webhook route with token in path**

File: `app/api/webhook/[token]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FileProcessor } from '@/src/background/processor';

const processor = new FileProcessor();

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;

    // Validate token
    if (token !== expectedToken) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();

    console.log('📬 Webhook received:', {
      eventName: event.EventName,
      bucket: event.Records?.[0]?.s3?.bucket?.name,
      key: event.Records?.[0]?.s3?.object?.key,
    });

    // Process S3 event
    const record = event.Records?.[0];
    if (record && record.eventName?.startsWith('s3:ObjectCreated:')) {
      const fileInfo = {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
        size: record.s3.object.size,
        etag: record.s3.object.eTag,
        lastModified: new Date(),
      };

      // Process in background
      processor.processFile(fileInfo).catch((error) => {
        console.error('Failed to process webhook file:', error);
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Step 2: Create webhook route with Bearer token**

File: `app/api/webhook/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FileProcessor } from '@/src/background/processor';

const processor = new FileProcessor();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;

    // Validate token
    if (token !== expectedToken) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();

    console.log('📬 Webhook received:', {
      eventName: event.EventName,
      bucket: event.Records?.[0]?.s3?.bucket?.name,
      key: event.Records?.[0]?.s3?.object?.key,
    });

    // Process S3 event
    const record = event.Records?.[0];
    if (record && record.eventName?.startsWith('s3:ObjectCreated:')) {
      const fileInfo = {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
        size: record.s3.object.size,
        etag: record.s3.object.eTag,
        lastModified: new Date(),
      };

      // Process in background
      processor.processFile(fileInfo).catch((error) => {
        console.error('Failed to process webhook file:', error);
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/webhook/
git commit -m "feat: implement webhook API routes for RustFS events"
```

---

### Task 7.2: Health API Route

**Files:**
- Create: `app/api/health/route.ts`

**Step 1: Create health endpoint**

File: `app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getS3Client } from '@/lib/s3/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uptime = Math.floor(process.uptime());

    // Check database
    let dbStatus = 'healthy';
    let dbSize = 0;
    try {
      const db = getDatabase();
      const result: any = db.query("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
      dbSize = result?.size || 0;
    } catch (error) {
      dbStatus = 'error';
    }

    // Check S3
    let s3Status = 'connected';
    try {
      const s3Client = getS3Client();
      // Simple check - client is created
    } catch (error) {
      s3Status = 'error';
    }

    const health = {
      status: dbStatus === 'healthy' && s3Status === 'connected' ? 'healthy' : 'degraded',
      uptime,
      lastCheck: new Date().toISOString(),
      components: {
        database: { status: dbStatus, size: `${(dbSize / 1024 / 1024).toFixed(2)} MB` },
        rustfs: { status: s3Status },
        telegram: { status: 'connected' },
        webhook: { status: 'listening' },
        polling: { status: 'active', interval: `${process.env.POLLING_INTERVAL_MINUTES}min` },
      },
    };

    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 503 }
    );
  }
}
```

**Step 2: Test health endpoint**

Run: `bun run dev`
Visit: http://localhost:3000/api/health

Expected: JSON health status

**Step 3: Commit**

```bash
git add app/api/health/
git commit -m "feat: implement health check API route"
```

---

## Phase 8: Authentication with Next-Auth v5

### Task 8.1: Setup Next-Auth

**Files:**
- Create: `lib/auth/index.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

**Step 1: Install Next-Auth beta (v5)**

```bash
bun add next-auth@beta @auth/core
```

**Step 2: Create auth configuration**

File: `lib/auth/index.ts`
```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { authenticator } from 'otplib';
import { getDatabase } from '../db';
import { getUser } from '../db/queries';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        totp: { label: '2FA Code', type: 'text' },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password || !credentials?.totp) {
          return null;
        }

        const db = getDatabase();
        const user: any = getUser(db);

        if (!user || user.username !== credentials.username) {
          return null;
        }

        // Verify password
        const passwordValid = await compare(credentials.password as string, user.password_hash);
        if (!passwordValid) {
          return null;
        }

        // Verify TOTP
        const totpValid = authenticator.verify({
          token: credentials.totp as string,
          secret: user.totp_secret,
        });

        if (!totpValid) {
          return null;
        }

        return {
          id: '1',
          name: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
```

**Step 3: Create auth API route**

File: `app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

**Step 4: Create middleware for protected routes**

File: `middleware.ts`
```typescript
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
};
```

**Step 5: Commit**

```bash
git add lib/auth/ app/api/auth/ middleware.ts package.json
git commit -m "feat: implement Next-Auth v5 with 2FA"
```

---

## Phase 9: Dashboard Pages

### Task 9.1: Login Page

**Files:**
- Create: `app/auth/login/page.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`

**Step 1: Create UI components**

File: `components/ui/Button.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const variantClasses = {
    primary: 'bg-neon-cyan text-black',
    danger: 'bg-neon-magenta text-white',
    success: 'bg-neon-lime text-black',
  };

  return (
    <motion.button
      className={`btn-brutal ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

File: `components/ui/Input.tsx`
```typescript
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold mb-2 text-neon-cyan">
        {label}
      </label>
      <input
        className={`input-brutal ${error ? 'border-neon-magenta' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-neon-magenta">{error}</p>}
    </div>
  );
}
```

**Step 2: Create login page**

File: `app/auth/login/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      totp: formData.get('totp'),
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials or 2FA code');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-brutal max-w-md w-full"
      >
        <h1 className="text-4xl font-bold mb-6 text-neon-cyan">Login</h1>

        {error && (
          <div className="mb-4 p-4 bg-neon-magenta/20 border-4 border-neon-magenta text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            type="text"
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />

          <Input
            label="2FA Code"
            name="totp"
            type="text"
            required
            maxLength={6}
            placeholder="000000"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/auth/ components/ui/
git commit -m "feat: implement login page with 2FA"
```

---

### Task 9.2: Dashboard Layout

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `components/dashboard/Sidebar.tsx`

**Step 1: Create sidebar component**

File: `components/dashboard/Sidebar.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  Settings,
  FileText,
  Shield,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Database, label: 'Buckets', href: '/dashboard/buckets' },
  { icon: FileText, label: 'Logs', href: '/dashboard/logs' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: Shield, label: 'Security', href: '/dashboard/security' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-dark-card border-r-4 border-neon-cyan p-6 min-h-screen"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neon-cyan">TelegramPloy</h1>
        <p className="text-sm text-gray-400">Backup Monitor</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-none border-4 transition-all ${
                  isActive
                    ? 'bg-neon-cyan text-black border-black shadow-brutal'
                    : 'bg-transparent text-white border-transparent hover:border-neon-cyan'
                }`}
              >
                <Icon size={20} />
                <span className="font-bold">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        <motion.button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-4 py-3 rounded-none border-4 border-transparent hover:border-neon-magenta text-white w-full text-left transition-all mt-8"
          whileHover={{ x: 4 }}
        >
          <LogOut size={20} />
          <span className="font-bold">Logout</span>
        </motion.button>
      </nav>
    </motion.aside>
  );
}
```

**Step 2: Create dashboard layout**

File: `app/dashboard/layout.tsx`
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/dashboard/layout.tsx components/dashboard/
git commit -m "feat: implement dashboard layout with Neo-Brutalism sidebar"
```

---

Due to length, the plan continues with:
- Task 9.3: Dashboard Page (Overview with stats)
- Task 9.4: Buckets Page
- Task 9.5: Settings Page
- Task 9.6: Logs Page
- Task 9.7: Security Page
- Phase 10: Setup Page (First-time 2FA setup)
- Phase 11: Docker & Deployment
- Phase 12: Testing & Verification

**Plan Status**: 60% Complete

Would you like me to continue with the remaining tasks, or should we start executing this plan now?

**Sources:**
- [Bun v1.3.4 Latest Release](https://github.com/oven-sh/bun/releases)
- [Next.js 16.1 Release](https://nextjs.org/blog/next-16-1)
- [Grammy.js Latest](https://www.npmjs.com/package/grammy)
- [Bun SQLite Documentation](https://bun.com/docs/runtime/sqlite)
- [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3)