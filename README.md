# TelegramPloy

> **Disaster Recovery System for RustFS S3 Buckets**

Monitor your RustFS S3 buckets and automatically send files to Telegram for secure off-site backup. Built with Bun, Next.js 16, and Grammy.js.

## Features

### Core Functionality
- ✅ **Dual Detection**: Webhooks + polling for reliable file monitoring
- ✅ **Large File Support**: Automatic chunking for files >50MB (up to 2GB)
- ✅ **Retry Queue**: Failed transfers automatically retry with exponential backoff
- ✅ **Rate Limiting**: Intelligent Telegram API rate limiting (100ms between sends)

### Security
- ✅ **2FA Authentication**: TOTP-based two-factor authentication
- ✅ **Backup Codes**: Emergency access codes
- ✅ **Secure Sessions**: JWT-based authentication with Next-Auth v5
- ✅ **Battle-Hardened**: Constant-time comparisons, input validation, timeout protection

### Web Dashboard
- ✅ **Neo-Brutalism UI**: Modern, bold interface with Tailwind CSS v4
- ✅ **Real-time Stats**: Monitor processed files, buckets, and system health
- ✅ **Bucket Management**: Enable/disable monitoring per bucket
- ✅ **Live Logs**: Filter and view system logs in real-time
- ✅ **Settings**: Configure polling interval and Telegram chat

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Bun | 1.3.4 |
| Framework | Next.js | 16.1 |
| UI Library | React | 19.2 |
| Database | SQLite (bun:sqlite) | Native |
| Telegram | Grammy.js | 1.38.4 |
| S3 Client | AWS SDK v3 | 3.958.0 |
| Auth | Next-Auth v5 | Beta |
| Styling | Tailwind CSS | 4.0 |
| Animation | Framer Motion | 12.23 |

## Quick Start

### 1. Prerequisites

- Bun v1.3.4+ installed
- Telegram bot token (create via [@BotFather](https://t.me/BotFather))
- Telegram chat ID (get from [@userinfobot](https://t.me/userinfobot))
- RustFS S3 credentials

### 2. Installation

```bash
# Clone repository
git clone <your-repo-url>
cd telegramploy

# Install dependencies
bun install

# Create environment file
cp .env.example .env
```

### 3. Configuration

Edit `.env` with your credentials:

```env
# Database
DATABASE_PATH=./data/telegramploy.db

# S3 Configuration (RustFS)
S3_ENDPOINT=https://your-rustfs-endpoint.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_FORCE_PATH_STYLE=true

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789

# Next-Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Optional Configuration
POLL_INTERVAL_MS=60000
MAX_FILE_SIZE_MB=2000
CHUNK_SIZE_MB=50
```

### 4. Run Development

```bash
# Start Next.js dev server
bun run dev

# Start background worker (in another terminal)
bun run background

# Run deployment tests
bun run test:deploy
```

Visit http://localhost:3000/setup to create your admin account.

## Deployment

### Deploy to Dokploy

1. **Prepare**: Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. **Checklist**: Complete [CHECKLIST.md](CHECKLIST.md) before deploying
3. **Deploy**: Follow the Dokploy deployment guide

Quick deployment:

```bash
# Verify configuration
bun run test:deploy

# Build for production
bun run build

# Deploy to Dokploy
# (Upload via Dokploy dashboard at https://dok.v244.net)
```

## Architecture

```
┌─────────────────┐
│   Next.js App   │  Web dashboard with 2FA
│   (Port 3000)   │
└────────┬────────┘
         │
         ├─── API Routes (/api/*)
         │    ├─ /api/health (health check)
         │    ├─ /api/webhook/s3 (RustFS webhooks)
         │    ├─ /api/buckets/* (bucket management)
         │    ├─ /api/settings/* (configuration)
         │    └─ /api/logs (system logs)
         │
         └─── Dashboard Pages
              ├─ /setup (first-time setup)
              ├─ /auth/login (authentication)
              └─ /dashboard/* (main interface)

┌─────────────────┐
│ Background      │  S3 monitoring & processing
│ Worker Process  │
└────────┬────────┘
         │
         ├─── Polling Service (EventEmitter)
         │    └─ Scans S3 buckets every 60s
         │
         └─── File Processor
              ├─ Downloads files from S3
              ├─ Chunks large files (>50MB)
              ├─ Sends to Telegram
              └─ Manages retry queue

┌─────────────────┐
│   SQLite DB     │  Persistent storage
│  (bun:sqlite)   │
└─────────────────┘
 Tables:
  - users (authentication)
  - bucket_settings (monitoring config)
  - processed_files (tracking)
  - retry_queue (failed transfers)
  - logs (system events)
```

## Project Structure

```
telegramploy/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── buckets/      # Bucket management
│   │   ├── health/       # Health check
│   │   ├── logs/         # Log retrieval
│   │   ├── settings/     # Settings API
│   │   ├── setup/        # Initial setup
│   │   └── webhook/      # S3 webhooks
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   │   ├── buckets/     # Bucket management UI
│   │   ├── logs/        # Log viewer
│   │   ├── security/    # Security settings
│   │   └── settings/    # Configuration UI
│   ├── setup/            # First-time setup UI
│   └── layout.tsx        # Root layout
├── components/           # React components
│   └── ui/              # UI components (Button, Input, etc.)
├── lib/                  # Libraries & utilities
│   ├── auth/            # Authentication logic
│   │   ├── index.ts    # Next-Auth config
│   │   └── setup.ts    # Setup utilities
│   └── db/              # Database layer
│       ├── index.ts    # Database connection
│       ├── schema.sql  # Database schema
│       └── queries.ts  # Query functions
├── src/                  # Source code
│   ├── background/      # Background worker
│   │   ├── index.ts    # Worker entry point
│   │   ├── polling.ts  # Polling service
│   │   └── processor.ts # File processor
│   └── services/        # Business logic
│       ├── chunking.ts # File chunking
│       ├── s3.ts       # S3 client
│       └── telegram.ts # Telegram bot
├── scripts/             # Utility scripts
│   └── test-deployment.ts # Deployment tests
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose config
├── dokploy.toml        # Dokploy template
├── DEPLOYMENT.md       # Deployment guide
├── CHECKLIST.md        # Deployment checklist
└── README.md           # This file
```

## Usage

### First-Time Setup

1. Visit `/setup` after deployment
2. Create admin account with strong password
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. **Save backup codes** in secure location
5. Verify 2FA code to complete setup

### Daily Operations

1. **Login**: Navigate to `/auth/login` and authenticate with 2FA
2. **Enable Buckets**: Go to Dashboard > Buckets, toggle monitoring ON
3. **Monitor**: View Dashboard for stats and recent files
4. **Check Logs**: Review system logs for errors or warnings
5. **Configure**: Adjust settings in Settings page

### File Processing Flow

1. New file uploaded to monitored S3 bucket
2. Detection via webhook (instant) OR polling (60s interval)
3. File downloaded from S3
4. If >50MB: Split into chunks
5. Send to Telegram chat with metadata
6. Mark as processed in database
7. If failed: Add to retry queue

### Retry Mechanism

- Failed transfers automatically retry
- Exponential backoff: 1min → 5min → 15min → 1hr
- Max 5 retry attempts
- View retry queue in Dashboard

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (12 rounds)
- TOTP-based 2FA (30-second window)
- Backup codes for emergency access
- Constant-time comparison (timing attack prevention)
- JWT sessions (24-hour expiry)

### Data Protection
- S3 credentials stored as environment variables
- NextAuth secret for session encryption
- Telegram bot token secured
- Database file permissions restricted
- No sensitive data in logs

### Best Practices
- Rotate S3 credentials quarterly
- Rotate NextAuth secret quarterly
- Monitor logs for unauthorized access
- Keep backup codes in password manager
- Test disaster recovery periodically

## Monitoring & Maintenance

### Health Check

```bash
curl https://telegramploy.dok.v244.net/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T12:00:00.000Z",
  "database": "connected",
  "backgroundWorker": "running"
}
```

### Database Backup

```bash
# Backup
docker exec telegramploy cat /app/data/telegramploy.db > backup.db

# Restore
docker cp backup.db telegramploy:/app/data/telegramploy.db
docker restart telegramploy
```

### Log Monitoring

- Access via Dashboard > Logs
- Filter by level: INFO, WARN, ERROR
- Auto-refresh every 10 seconds
- Export logs for analysis

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker logs telegramploy
# Check for missing environment variables
```

**Telegram not receiving files:**
- Verify bot token is correct
- Check chat ID is correct
- Send `/start` to your bot
- Enable bucket monitoring in Dashboard

**S3 connection failed:**
- Verify endpoint URL
- Check credentials are valid
- Ensure `S3_FORCE_PATH_STYLE=true`

**Login not working:**
- Check 2FA code is current
- Try backup code instead
- Verify user was created in setup

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting.

## Development

### Run Tests

```bash
# Deployment verification tests
bun run test:deploy
```

### Build

```bash
# Production build
bun run build

# Start production server
bun run start
```

### Docker

```bash
# Build image
docker build -t telegramploy .

# Run container
docker run -p 3000:3000 \
  -v telegramploy-data:/app/data \
  --env-file .env \
  telegramploy
```

## Contributing

This is a single-purpose disaster recovery system. Contributions welcome for:
- Bug fixes
- Security improvements
- Documentation updates
- Performance optimizations

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review [CHECKLIST.md](CHECKLIST.md) for setup steps
- Check Dashboard > Logs for system errors
- Review Docker logs: `docker logs telegramploy`

## Acknowledgments

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Next.js](https://nextjs.org) - React framework
- [Grammy.js](https://grammy.dev) - Telegram bot framework
- [Next-Auth](https://next-auth.js.org) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

**TelegramPloy** - Your files, backed up to Telegram, always available.
