# TelegramPloy Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment

### 1. Prerequisites

- [ ] Telegram bot created via [@BotFather](https://t.me/BotFather)
- [ ] Bot token obtained and saved securely
- [ ] Telegram chat ID obtained (use [@userinfobot](https://t.me/userinfobot))
- [ ] RustFS S3 endpoint URL available
- [ ] S3 access key and secret key obtained
- [ ] Dokploy instance accessible at https://dok.v244.net
- [ ] Domain name configured: `telegramploy.dok.v244.net`

### 2. Environment Variables

Run the test script to verify all required variables:

```bash
bun run scripts/test-deployment.ts
```

Required variables:
- [ ] `S3_ENDPOINT` - RustFS S3 endpoint URL
- [ ] `S3_REGION` - S3 region (default: us-east-1)
- [ ] `S3_ACCESS_KEY_ID` - S3 access key
- [ ] `S3_SECRET_ACCESS_KEY` - S3 secret key
- [ ] `TELEGRAM_BOT_TOKEN` - Bot token
- [ ] `TELEGRAM_CHAT_ID` - Chat ID
- [ ] `NEXTAUTH_URL` - Full deployment URL
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`

Optional (with defaults):
- [ ] `POLL_INTERVAL_MS` (60000)
- [ ] `MAX_FILE_SIZE_MB` (2000)
- [ ] `CHUNK_SIZE_MB` (50)
- [ ] `DATABASE_PATH` (/app/data/telegramploy.db)
- [ ] `S3_FORCE_PATH_STYLE` (true)

### 3. Code Verification

- [ ] Run `bun run build` successfully
- [ ] No TypeScript errors
- [ ] All tests pass (if applicable)
- [ ] Database schema created successfully
- [ ] All required files present (check with test script)

## Deployment

### 4. Dokploy Setup

- [ ] Log in to https://dok.v244.net
- [ ] Create new application: "TelegramPloy"
- [ ] Select "Docker Compose" type
- [ ] Connect Git repository or upload files
- [ ] Configure domain: `telegramploy.dok.v244.net`
- [ ] Add all environment variables (required + optional)
- [ ] Mark secrets as "Secret" (bot token, S3 keys, NextAuth secret)

### 5. Deploy

- [ ] Click "Deploy" in Dokploy
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete
- [ ] Verify container is running
- [ ] Check health endpoint: `https://telegramploy.dok.v244.net/api/health`

Expected health response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T...",
  "database": "connected",
  "backgroundWorker": "running"
}
```

## Post-Deployment

### 6. Initial Setup

- [ ] Visit `https://telegramploy.dok.v244.net/setup`
- [ ] Create admin account with strong password (min 8 chars)
- [ ] Username and password saved in password manager
- [ ] Scan QR code with authenticator app
- [ ] Authenticator app shows 6-digit codes
- [ ] Download backup codes
- [ ] **CRITICAL**: Save backup codes in secure location
- [ ] Verify 2FA by entering code
- [ ] Setup completes successfully
- [ ] Redirect to login page

### 7. First Login

- [ ] Visit `https://telegramploy.dok.v244.net/auth/login`
- [ ] Enter username and password
- [ ] Enter 2FA code from authenticator
- [ ] Successfully logged in to dashboard

### 8. Configure Monitoring

- [ ] Navigate to **Buckets** page
- [ ] Verify RustFS buckets are listed
- [ ] Enable monitoring for desired buckets
- [ ] Check **Dashboard** for stats
- [ ] Verify polling service is running

### 9. Test File Transfer

- [ ] Upload test file to monitored bucket
- [ ] Wait for polling interval (default: 60s)
- [ ] Verify file appears in Telegram chat
- [ ] Check **Dashboard** shows processed file
- [ ] Review **Logs** for any errors

### 10. Optional: Configure Webhooks

For real-time detection (optional):

- [ ] Install MinIO Client (`mc`)
- [ ] Configure webhook endpoint in RustFS:
  ```bash
  mc admin config set myminio notify_webhook:telegramploy \
    endpoint="https://telegramploy.dok.v244.net/api/webhook/s3"
  ```
- [ ] Enable event notifications for bucket:
  ```bash
  mc event add myminio/bucket-name \
    arn:minio:sqs::telegramploy:webhook --event put
  ```
- [ ] Test webhook by uploading file
- [ ] Verify immediate detection (no polling delay)

## Monitoring & Maintenance

### 11. Regular Checks

- [ ] Monitor **Dashboard** for stats
- [ ] Review **Logs** daily for errors
- [ ] Check **Buckets** status weekly
- [ ] Verify Telegram bot is responsive
- [ ] Test backup codes periodically

### 12. Security

- [ ] Change default admin password (if used)
- [ ] Rotate S3 credentials quarterly
- [ ] Rotate `NEXTAUTH_SECRET` quarterly
- [ ] Review logs for unauthorized access
- [ ] Keep backup codes in secure location
- [ ] Test disaster recovery procedure

### 13. Database Backup

Set up regular backups:

```bash
# Weekly backup (add to cron)
docker exec telegramploy cat /app/data/telegramploy.db > \
  backup-$(date +%Y%m%d).db
```

- [ ] Backup script created
- [ ] Cron job configured
- [ ] Backup restoration tested
- [ ] Backups stored off-site

## Troubleshooting

### Common Issues

**Health check failing:**
- [ ] Check Dokploy logs
- [ ] Verify all environment variables set
- [ ] Check database volume mounted
- [ ] Restart container

**Telegram not receiving files:**
- [ ] Verify bot token is correct
- [ ] Check chat ID is correct
- [ ] Send `/start` to bot
- [ ] Check bucket monitoring is enabled
- [ ] Review logs for errors

**S3 connection failed:**
- [ ] Verify endpoint URL is correct
- [ ] Check credentials are valid
- [ ] Ensure `S3_FORCE_PATH_STYLE=true`
- [ ] Test S3 connection from container

**Login not working:**
- [ ] Verify user was created during setup
- [ ] Check 2FA code is current (30s window)
- [ ] Try backup code instead
- [ ] Review logs for errors

## Rollback Plan

If deployment fails:

1. [ ] Check error logs in Dokploy
2. [ ] Restore previous version from Git
3. [ ] Redeploy previous working version
4. [ ] Restore database from backup (if needed)
5. [ ] Verify health endpoint
6. [ ] Test login and file transfer

## Sign-Off

Deployment completed by: ________________

Date: ________________

All checklist items completed: [ ] Yes [ ] No

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

## Next Steps

After successful deployment:

1. Monitor for 24 hours
2. Test with production S3 bucket
3. Verify Telegram delivery rate
4. Document any issues encountered
5. Update team on deployment status

---

**Deployment Status:**

- [ ] Pre-deployment complete
- [ ] Deployment successful
- [ ] Post-deployment verification complete
- [ ] Production ready

**Deployment URL:** https://telegramploy.dok.v244.net

**Deployed Version:** (Git commit hash)

**Deployment Date:** (YYYY-MM-DD)
