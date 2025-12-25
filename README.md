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
