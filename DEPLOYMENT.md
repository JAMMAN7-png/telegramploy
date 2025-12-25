# TelegramPloy Deployment Guide

Deploy TelegramPloy to your Dokploy instance at https://dok.v244.net

## Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/BotFather) and get the token
2. **Chat ID**: Get your Telegram chat ID (use [@userinfobot](https://t.me/userinfobot))
3. **RustFS S3 Credentials**: Access key, secret key, and endpoint URL
4. **NextAuth Secret**: Generate with `openssl rand -base64 32`

## Deployment Steps

### 1. Create New Application in Dokploy

1. Log in to https://dok.v244.net
2. Click **"Create Application"**
3. Select **"Docker Compose"**
4. Connect your Git repository or upload files

### 2. Configure Environment Variables

In Dokploy, add the following environment variables:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `S3_ENDPOINT` | RustFS S3 endpoint | `https://s3.example.com` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | S3 access key | `your-access-key` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `your-secret-key` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | Your chat ID | `123456789` |
| `NEXTAUTH_URL` | Full deployment URL | `https://telegramploy.dok.v244.net` |
| `NEXTAUTH_SECRET` | Random secret | Generate with `openssl rand -base64 32` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POLL_INTERVAL_MS` | `60000` | Polling interval (60s) |
| `MAX_FILE_SIZE_MB` | `2000` | Max file size to process |
| `CHUNK_SIZE_MB` | `50` | Chunk size for large files |
| `DATABASE_PATH` | `/app/data/telegramploy.db` | SQLite database path |
| `S3_FORCE_PATH_STYLE` | `true` | Use path-style URLs (required for RustFS) |

### 3. Configure Domain

1. In Dokploy, go to **Settings** > **Domain**
2. Add your domain: `telegramploy.dok.v244.net`
3. Dokploy will automatically generate SSL certificates via Let's Encrypt

### 4. Deploy

1. Click **"Deploy"** in Dokploy
2. Wait for the build to complete
3. Check logs for any errors

### 5. Initial Setup

1. Visit `https://telegramploy.dok.v244.net/setup`
2. Create your admin account
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. **IMPORTANT**: Download and save your backup codes securely
5. Enter a 2FA code to verify setup

### 6. Configure RustFS Webhooks (Optional)

For real-time file detection, configure RustFS to send webhooks:

```bash
# Using MinIO Client (mc)
mc admin config set myminio notify_webhook:telegramploy endpoint="https://telegramploy.dok.v244.net/api/webhook/s3"
mc admin config set myminio notify_webhook:telegramploy queue_limit="10"
mc admin config set myminio notify_webhook:telegramploy auth_token=""

# Enable webhook notifications for specific bucket
mc event add myminio/your-bucket arn:minio:sqs::telegramploy:webhook --event put,delete
```

**Note**: Webhook event schema may differ from standard S3. The polling service will still detect files even without webhooks.

## Post-Deployment

### Enable Bucket Monitoring

1. Log in to `https://telegramploy.dok.v244.net/auth/login`
2. Navigate to **Buckets** page
3. Toggle monitoring ON for desired buckets
4. Files will be automatically sent to your Telegram chat

### Monitor System

- **Dashboard**: View stats and recent files
- **Logs**: Check system logs with filtering
- **Settings**: Configure Telegram chat ID and polling interval
- **Security**: View authentication status and backup codes

## Troubleshooting

### Container Won't Start

Check Dokploy logs:
```bash
docker logs telegramploy
```

### Database Issues

Ensure the volume is mounted correctly:
```bash
docker exec telegramploy ls -la /app/data
```

### S3 Connection Failed

Verify credentials and endpoint:
```bash
docker exec telegramploy bun run -e "console.log(process.env.S3_ENDPOINT)"
```

### Telegram Bot Not Responding

1. Verify bot token is correct
2. Check chat ID is correct
3. Ensure bot is started (send `/start` to your bot)

### Health Check Failing

Check the health endpoint:
```bash
curl https://telegramploy.dok.v244.net/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T...",
  "database": "connected",
  "backgroundWorker": "running"
}
```

## Backup & Recovery

### Database Backup

The SQLite database is stored in the `telegramploy-data` volume:

```bash
# Backup
docker exec telegramploy cat /app/data/telegramploy.db > backup.db

# Restore
docker cp backup.db telegramploy:/app/data/telegramploy.db
docker restart telegramploy
```

### Backup Codes

If you lose your authenticator device:
1. Use a backup code to log in
2. Each backup code is single-use only
3. Generate new backup codes in **Security** settings

## Updating

To update to the latest version:

1. Pull latest code from Git
2. Click **"Rebuild"** in Dokploy
3. Monitor deployment logs
4. Verify health check passes

## Security Notes

- Change default admin password after first login
- Store backup codes in a secure password manager
- Use strong S3 credentials
- Rotate `NEXTAUTH_SECRET` periodically
- Monitor logs for unauthorized access attempts

## Support

For issues or questions:
- Check logs in Dokploy dashboard
- Review system logs at `/dashboard/logs`
- Verify all environment variables are set correctly
