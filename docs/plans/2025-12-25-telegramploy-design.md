# TelegramPloy - RustFS Backup Monitor Design

**Date:** 2025-12-25
**Status:** Approved
**Version:** 1.0.0

## Executive Summary

TelegramPloy is a disaster recovery system that monitors RustFS S3-compatible storage buckets and automatically sends backup files to Telegram as off-site storage. This ensures critical backups for Dokploy and other applications are never lost, even if the VPS crashes or becomes corrupted.

## System Architecture

### Overview
```
┌─────────────┐
│   Dokploy   │──┐
│   + Apps    │  │ Upload backups (cron)
└─────────────┘  │
                 ▼
┌─────────────────────────────┐
│   RustFS (api.s3.v244.net)  │
│   - Auto-discover buckets   │
│   - S3 events + polling     │
└─────────────────────────────┘
          │ Webhook    │ Poll every X min
          ▼            ▼
┌──────────────────────────────┐
│   TelegramPloy App           │
│   - Node.js + Grammy.js      │
│   - SQLite tracking          │
│   - File chunking (<50MB)    │
│   - Retry queue              │
│   - Web Dashboard (React)    │
└──────────────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│   Telegram                   │
│   - Main chat (backups)      │
│   - Admin chat (alerts)      │
└──────────────────────────────┘
```

### Core Components

1. **RustFS Monitor**
   - Auto-discovers all buckets on startup
   - Dual detection: Webhooks (primary) + Polling (fallback)
   - Tracks processed files to prevent duplicates

2. **File Processor**
   - Downloads files from RustFS
   - Splits large files (≥50MB) into 1.8GB chunks
   - Generates captions with metadata

3. **Telegram Sender**
   - Sends files/chunks to Telegram
   - Retry queue with exponential backoff
   - Admin alerts on failures

4. **Web Dashboard**
   - Neo-Brutalism dark design
   - Real-time backup feed (WebSocket)
   - Single-user auth with 2FA
   - Configuration management

5. **SQLite Database**
   - Tracks sent files
   - Retry queue
   - User authentication
   - Bucket settings
   - System logs

## Detailed Design

### 1. File Detection & Processing

#### Detection Methods

**Primary: RustFS Webhook Notifications**
- Endpoint: `POST /webhook/:secretToken` or `POST /webhook` with `Authorization: Bearer :token`
- Events: `s3:ObjectCreated:*`
- Real-time notification when files are uploaded

**Fallback: Polling**
- Configurable interval (default: 5 minutes)
- Lists all buckets, discovers new ones automatically
- Compares objects with `sent_files` table
- Processes new files

#### Processing Pipeline

1. **Detection** → New file via webhook or polling
2. **Validation** → Check `sent_files` table (bucket + object_key + ETag)
3. **Download** → Stream from RustFS to `/tmp/backups`
4. **Size Check**:
   - `< 50MB`: Send directly
   - `≥ 50MB`: Split into 1.8GB chunks
5. **Upload** → Send to Telegram with caption
6. **Cleanup** → Delete temp files
7. **Database** → Insert into `sent_files`

#### File Chunking

```javascript
const CHUNK_SIZE = 1.8 * 1024 * 1024 * 1024; // 1.8GB

// For files ≥ 50MB, split into chunks
chunks = splitFile(filePath, CHUNK_SIZE);

// Send each chunk with reassembly instructions
for (let i = 0; i < chunks.length; i++) {
  caption = `[Part ${i+1}/${chunks.length}] ${bucketName}/${fileName}

📦 Bucket: ${bucketName}
📄 Original File: ${fileName}
💾 Part Size: ${formatSize(chunkSize)}
📊 Total Size: ${formatSize(totalSize)}
🕐 Uploaded: ${timestamp}

🔧 Reassembly (Linux/Mac):
cat ${fileName}.part* > ${fileName}

🔧 Reassembly (Windows):
copy /b ${fileName}.part* ${fileName}`;

  await bot.api.sendDocument(chatId, chunk, { caption });
}
```

#### Caption Format (Single File)

```
📦 Bucket: dokploy-backups
📄 File: dokploy-full-backup-2025-12-25-14-30.tar.gz
💾 Size: 125.4 MB
🕐 Uploaded: 2025-12-25 14:30:42 UTC
🔐 ETag: a3f5e8d9c2b1...
```

### 2. Retry Logic & Reliability

#### Retry Strategy

**Immediate Retries (Network Errors)**
- Max 3 attempts with 5-second delay
- For transient network issues

**Queue-Based Retries (Persistent Failures)**
- Stored in `retry_queue` table
- Exponential backoff: 1min → 5min → 15min → 1hr → 6hr → 24hr
- Max 10 retry attempts
- Survives app restarts

**Admin Alerts**
- Sent to admin chat after 3rd failed attempt
- Final alert when retries exhausted (10 attempts)

```
⚠️ Backup Upload Failed (Attempt 3/10)

📦 Bucket: dokploy-backups
📄 File: backup-2025-12-25.tar.gz
💾 Size: 125 MB
❌ Error: Telegram API timeout

🔄 Next retry: in 15 minutes
📊 Queue depth: 2 files pending
```

### 3. Database Schema

```sql
-- Tracks successfully sent files (prevents duplicates)
CREATE TABLE sent_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  etag TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  chunk_count INTEGER DEFAULT 1,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  telegram_message_ids TEXT, -- JSON array
  UNIQUE(bucket, object_key, etag)
);

-- Retry queue for failed uploads
CREATE TABLE retry_queue (
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

-- Single-user authentication
CREATE TABLE users (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one user
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL, -- JSON array of hashed codes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bucket monitoring settings
CREATE TABLE bucket_settings (
  bucket TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT 1,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_checked DATETIME
);

-- System logs
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL, -- info, warn, error, debug
  message TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Web Dashboard

#### Design System: Dark Neo-Brutalism

**Visual Style**
- **Colors**:
  - Background: Deep charcoal (#0a0a0a, #1a1a1a)
  - Accents: Electric cyan (#00f0ff), Hot magenta (#ff006e), Lime green (#00ff88), Bright yellow (#ffea00)
  - Borders: Thick (3-4px) in contrasting accent colors
  - Shadows: Bold offset shadows in accent colors

- **Typography**: Bold sans-serif (Space Grotesk, Clash Display, DM Sans)
- **Layout**: Fixed sidebar with gradient, main content with bold card shadows
- **Icons**: Lucide Icons or Phosphor Icons with hover animations
- **Animations**: Framer Motion for smooth transitions, slides, fades, pulses

#### Tech Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS + custom Neo-Brutalism utilities
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts (styled for Neo-Brutalism)
- **Real-time**: Socket.io for live updates

#### Authentication Flow

**First-Time Setup** (`/setup`)
1. Only accessible if no user exists in database
2. Create username + password (bcrypt hash)
3. Generate TOTP secret (QR code for authenticator app)
4. Generate 10 backup codes
5. Save backup codes to:
   - SQLite (encrypted)
   - Telegram admin chat
   - RustFS bucket (encrypted file)
   - Docker volume (encrypted file)
6. Lock registration (id=1 constraint prevents additional users)

**Login Flow** (`/login`)
1. Username + password validation
2. TOTP code from authenticator app
3. Generate JWT/session cookie
4. Redirect to dashboard

**Password & 2FA Recovery**
- No password reset (permanent)
- Recovery via backup codes only
- Can regenerate 2FA secret from dashboard (requires current password + backup code)

#### Dashboard Pages

**1. Overview/Dashboard**
- System status card (uptime, last check, component health)
- Today's statistics (backups sent, files processed, total size)
- Real-time backup activity feed (WebSocket updates)
- Health indicators (webhook, polling, Telegram, RustFS)

**2. Buckets**
- Auto-discovered bucket list with last backup timestamp
- Toggle monitoring per bucket (enable/disable)
- Bucket statistics (total files, total size, last activity)
- Refresh/force discovery button

**3. Settings**
- Environment variables editor (with restart warning)
- Webhook secret token management
- Telegram chat IDs configuration
- Polling interval slider
- Session timeout configuration

**4. Logs & History**
- Backup send history (filterable by bucket, date, status)
- Failed uploads with retry status and error details
- System logs with severity levels (color-coded)
- Export logs as JSON/CSV

**5. Security**
- Change password
- Regenerate 2FA secret
- View/regenerate backup codes
- Active sessions list (with revoke option)
- Audit log

**WebSocket Events** (real-time updates)
- `backup:detected` - New file found
- `backup:downloading` - Download started
- `backup:sending` - Uploading to Telegram
- `backup:sent` - Successfully delivered
- `backup:failed` - Upload failed
- `bucket:discovered` - New bucket found
- `health:update` - Component status changed

### 5. Health Monitoring

#### Health Check Endpoint

**GET `/health`**
```json
{
  "status": "healthy",
  "uptime": "5d 12h 34m",
  "lastCheck": "2025-12-25T14:30:42Z",
  "components": {
    "rustfs": {
      "status": "connected",
      "lastPing": "2025-12-25T14:30:40Z"
    },
    "telegram": {
      "status": "connected",
      "lastMessage": "2025-12-25T14:15:22Z"
    },
    "database": {
      "status": "healthy",
      "size": "24.5 MB"
    },
    "webhook": {
      "status": "listening",
      "port": 3000
    },
    "polling": {
      "status": "active",
      "interval": "5min",
      "lastPoll": "2025-12-25T14:28:15Z"
    }
  },
  "stats": {
    "bucketsMonitored": 8,
    "backupsSentToday": 12,
    "retryQueueDepth": 0
  }
}
```

#### Daily Heartbeat (9:00 AM UTC)

Sent to admin Telegram chat:
```
✅ TelegramPloy System Operational

📊 Last 24 Hours:
• Backups Sent: 24 files (1.2 GB)
• Buckets Active: 8/8
• Failed Uploads: 0
• Retry Queue: Empty

🔍 Last Backup: dokploy-backups/backup-2025-12-25.tar.gz (12 min ago)

⏰ Next heartbeat: 2025-12-26 09:00 UTC
```

#### Silent Period Alert (24h+ no backups)

```
⚠️ No backups received in 24 hours

Last backup: dokploy-backups/backup-2025-12-24.tar.gz
Time since: 26 hours ago

Possible causes:
• Dokploy backup cron not running
• RustFS connection issue
• Bucket misconfiguration

Check: https://backup.v244.net/logs
```

### 6. Environment Configuration

```bash
# RustFS Configuration
RUSTFS_ENDPOINT=https://api.s3.v244.net
RUSTFS_ACCESS_KEY=pishro
RUSTFS_SECRET_KEY=ESLIsfcD2whxPlr9VpSZNj4zVlWb9jkY
RUSTFS_REGION=us-east-1

# Telegram Configuration
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_BACKUP_CHAT_ID=<chat ID for backups>
TELEGRAM_ADMIN_CHAT_ID=<chat ID for alerts>

# Webhook Configuration
WEBHOOK_SECRET_TOKEN=<random secure token>
WEBHOOK_PORT=3000

# Polling Configuration
POLLING_INTERVAL_MINUTES=5

# Dashboard Configuration
DASHBOARD_PORT=3000
SESSION_SECRET=<random secure token>

# Database
DATABASE_PATH=/data/telegramploy.db

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### 7. Docker Deployment

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "src/index.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  telegramploy:
    build: .
    restart: unless-stopped
    ports:
      - "3000"
    environment:
      - RUSTFS_ENDPOINT=${RUSTFS_ENDPOINT}
      - RUSTFS_ACCESS_KEY=${RUSTFS_ACCESS_KEY}
      - RUSTFS_SECRET_KEY=${RUSTFS_SECRET_KEY}
      - RUSTFS_REGION=${RUSTFS_REGION:-us-east-1}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_BACKUP_CHAT_ID=${TELEGRAM_BACKUP_CHAT_ID}
      - TELEGRAM_ADMIN_CHAT_ID=${TELEGRAM_ADMIN_CHAT_ID}
      - WEBHOOK_SECRET_TOKEN=${WEBHOOK_SECRET_TOKEN}
      - WEBHOOK_PORT=3000
      - POLLING_INTERVAL_MINUTES=${POLLING_INTERVAL_MINUTES:-5}
      - DASHBOARD_PORT=3000
      - SESSION_SECRET=${SESSION_SECRET}
      - DATABASE_PATH=/data/telegramploy.db
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - NODE_ENV=production
    volumes:
      - telegramploy-data:/data
      - telegramploy-temp:/tmp/backups
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.telegramploy.rule=Host(`backup.v244.net`)"
      - "traefik.http.routers.telegramploy.entrypoints=websecure"
      - "traefik.http.routers.telegramploy.tls.certresolver=letsencrypt"
      - "traefik.http.services.telegramploy.loadbalancer.server.port=3000"

volumes:
  telegramploy-data:
  telegramploy-temp:
```

### 8. Project Structure

```
telegramploy/
├── docker-compose.yml
├── Dockerfile
├── template.toml              # Dokploy template
├── package.json
├── .dockerignore
├── .env.example
├── README.md
├── docs/
│   └── plans/
│       └── 2025-12-25-telegramploy-design.md
├── src/
│   ├── index.js               # Main entry point
│   ├── config/
│   │   └── env.js             # Environment configuration
│   ├── services/
│   │   ├── rustfs.js          # RustFS S3 client
│   │   ├── telegram.js        # Grammy bot handler
│   │   ├── webhook.js         # Webhook listener
│   │   ├── polling.js         # Bucket polling service
│   │   ├── chunking.js        # File splitting logic
│   │   └── health.js          # Health monitoring
│   ├── database/
│   │   ├── db.js              # SQLite connection
│   │   └── migrations/        # DB schema migrations
│   ├── auth/
│   │   ├── session.js         # Session management
│   │   └── totp.js            # 2FA implementation
│   ├── api/
│   │   ├── server.js          # Express/Fastify setup
│   │   └── routes/            # API routes
│   │       ├── auth.js
│   │       ├── dashboard.js
│   │       ├── webhook.js
│   │       └── health.js
│   └── utils/
│       ├── logger.js          # Winston logger
│       └── helpers.js         # Utility functions
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Main React app
        ├── main.jsx
        ├── components/        # Reusable UI components
        │   ├── Sidebar.jsx
        │   ├── Card.jsx
        │   ├── Button.jsx
        │   └── Toast.jsx
        ├── pages/             # Dashboard pages
        │   ├── Dashboard.jsx
        │   ├── Buckets.jsx
        │   ├── Settings.jsx
        │   ├── Logs.jsx
        │   ├── Security.jsx
        │   ├── Login.jsx
        │   └── Setup.jsx
        ├── hooks/             # Custom React hooks
        │   └── useWebSocket.js
        ├── styles/            # TailwindCSS
        │   └── index.css
        └── utils/
            └── api.js         # API client
```

## Deployment to Dokploy

### Prerequisites

1. **Telegram Bot**
   - Create via @BotFather
   - Get bot token
   - Get chat IDs for backup channel and admin notifications

2. **RustFS Instance**
   - Already running at https://api.s3.v244.net
   - Access Key: `pishro`
   - Secret Key: `ESLIsfcD2whxPlr9VpSZNj4zVlWb9jkY`

### Deployment Steps

1. Navigate to Dokploy instance (https://dok.v244.net)
2. Select "General" project (ID: `qmbpYlC0OOR_fx43Jdrgk`)
3. Create new Docker Compose service
4. Name: "telegramploy"
5. Upload `docker-compose.yml`
6. Configure environment variables via `template.toml`
7. Add domain: `backup.v244.net` (with Let's Encrypt SSL)
8. Deploy

### Post-Deployment Configuration

1. **Initial Setup**
   - Visit https://backup.v244.net/setup
   - Create admin account (username + password)
   - Scan QR code with authenticator app (Google Authenticator, Authy)
   - Save 10 backup codes securely

2. **RustFS Webhook Configuration**
   ```bash
   # Configure webhook in RustFS
   mc admin config set rustfs notify_webhook:telegramploy \
     endpoint="https://backup.v244.net/webhook/${WEBHOOK_SECRET_TOKEN}" \
     auth_token="${WEBHOOK_SECRET_TOKEN}" \
     queue_dir="/tmp/events" \
     queue_limit="10000"

   # Restart RustFS to apply
   mc admin service restart rustfs

   # Add bucket notification
   mc event add rustfs/dokploy-backups arn:rustfs:s3:::telegramploy \
     --event put
   ```

3. **Verify Operation**
   - Check https://backup.v244.net/health
   - Verify buckets are discovered in dashboard
   - Upload test file to any bucket
   - Confirm notification in Telegram

## Technology Choices

### Runtime
- **Node.js 20** (instead of Bun)
- **Rationale**: Production stability and reliability over speed for mission-critical disaster recovery system

### Telegram Library
- **Grammy.js**
- **Rationale**: Modern, actively maintained, excellent TypeScript support, clean API

### Database
- **SQLite**
- **Rationale**: Simple, embedded, no external dependencies, perfect for single-instance deployment

### Frontend Framework
- **React + Vite**
- **Rationale**: Fast development, modern tooling, rich ecosystem

### Styling
- **TailwindCSS + Framer Motion**
- **Rationale**: Utility-first CSS for rapid development, Framer Motion for smooth animations

## Success Criteria

1. ✅ All buckets in RustFS are automatically discovered
2. ✅ New files trigger notifications within 1 minute (via webhook) or 5 minutes (via polling)
3. ✅ Files under 50MB are sent directly to Telegram
4. ✅ Files over 50MB are split and sent with reassembly instructions
5. ✅ No duplicate sends (tracked in database)
6. ✅ Failed uploads retry with exponential backoff
7. ✅ Admin alerts sent after 3 failed attempts
8. ✅ Daily heartbeat confirms system operational
9. ✅ Web dashboard shows real-time backup activity
10. ✅ Single-user auth with 2FA protects dashboard access
11. ✅ Health endpoint returns accurate component status
12. ✅ Survives container restarts without losing retry queue
13. ✅ Deploys successfully to Dokploy with docker-compose

## Security Considerations

1. **Authentication**
   - Bcrypt password hashing (cost factor 12)
   - TOTP 2FA with 30-second window
   - Encrypted backup codes
   - Secure session cookies (httpOnly, secure, sameSite)

2. **Secrets Management**
   - All sensitive data in environment variables
   - No secrets in code or logs
   - Webhook token validation (dual method: path + header)

3. **Network Security**
   - HTTPS-only for dashboard (Let's Encrypt)
   - Webhook endpoint requires secret token
   - No exposed database ports

4. **File Handling**
   - Temporary files cleaned after upload
   - No persistent storage of backup contents
   - Stream processing for large files

## Future Enhancements (Out of Scope for v1.0)

- Multi-user support with role-based access control
- Email notifications via SMTP
- Scheduled backup verification (download and checksum)
- Backup retention policies (auto-delete old backups from Telegram)
- Support for other storage backends (AWS S3, Backblaze B2)
- Metrics and alerting (Prometheus/Grafana integration)
- Backup restore functionality via dashboard
- Webhook replay for testing
- API for external integrations

---

**Design Status:** ✅ Approved
**Next Step:** Implementation Planning (/superpowers:writing-plans)
