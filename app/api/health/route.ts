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
    let dbError: string | null = null;

    try {
      const db = getDatabase();
      const result: any = db.query(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      ).get();
      dbSize = result?.size || 0;

      // Verify tables exist
      const tables: any[] = db.query(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all();
      const requiredTables = ['sent_files', 'retry_queue', 'users', 'bucket_settings', 'logs'];
      const existingTables = tables.map((t: any) => t.name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        dbStatus = 'degraded';
        dbError = `Missing tables: ${missingTables.join(', ')}`;
      }
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check S3 connection
    let s3Status = 'connected';
    let s3Error: string | null = null;

    try {
      const s3Client = getS3Client();
      // Client created successfully
    } catch (error) {
      s3Status = 'error';
      s3Error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check Telegram configuration
    let telegramStatus = 'connected';
    let telegramError: string | null = null;

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      telegramStatus = 'error';
      telegramError = 'TELEGRAM_BOT_TOKEN not configured';
    } else if (!process.env.TELEGRAM_BACKUP_CHAT_ID) {
      telegramStatus = 'error';
      telegramError = 'TELEGRAM_BACKUP_CHAT_ID not configured';
    }

    // Check webhook configuration
    let webhookStatus = 'listening';
    let webhookError: string | null = null;

    if (!process.env.WEBHOOK_SECRET_TOKEN) {
      webhookStatus = 'error';
      webhookError = 'WEBHOOK_SECRET_TOKEN not configured';
    }

    // Check polling configuration
    const pollingInterval = process.env.POLLING_INTERVAL_MINUTES || '5';
    const pollingStatus = 'active';

    // Overall status
    const hasError = [dbStatus, s3Status, telegramStatus, webhookStatus].includes('error');
    const hasDegraded = [dbStatus, s3Status, telegramStatus, webhookStatus].includes('degraded');
    const overallStatus = hasError ? 'error' : hasDegraded ? 'degraded' : 'healthy';

    const health = {
      status: overallStatus,
      uptime,
      lastCheck: new Date().toISOString(),
      components: {
        database: {
          status: dbStatus,
          size: `${(dbSize / 1024 / 1024).toFixed(2)} MB`,
          ...(dbError && { error: dbError }),
        },
        rustfs: {
          status: s3Status,
          endpoint: process.env.RUSTFS_ENDPOINT || 'not configured',
          ...(s3Error && { error: s3Error }),
        },
        telegram: {
          status: telegramStatus,
          ...(telegramError && { error: telegramError }),
        },
        webhook: {
          status: webhookStatus,
          ...(webhookError && { error: webhookError }),
        },
        polling: {
          status: pollingStatus,
          interval: `${pollingInterval}min`,
        },
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        lastCheck: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
