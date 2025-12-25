import { PollingService } from './polling';
import { FileProcessor } from './processor';
import { getDatabase } from '../../lib/db';

async function main() {
  console.log('🚀 Starting TelegramPloy background worker...');

  try {
    // Initialize database
    const db = getDatabase();
    console.log('✅ Database initialized');

    // Validate required environment variables
    const requiredEnvVars = [
      'RUSTFS_ENDPOINT',
      'RUSTFS_ACCESS_KEY',
      'RUSTFS_SECRET_KEY',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_BACKUP_CHAT_ID',
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Create processor
    const processor = new FileProcessor();

    // Create polling service
    const pollingInterval = parseInt(process.env.POLLING_INTERVAL_MINUTES || '5', 10);

    if (isNaN(pollingInterval) || pollingInterval < 1) {
      throw new Error('POLLING_INTERVAL_MINUTES must be a positive number');
    }

    const pollingService = new PollingService(pollingInterval);

    // Handle new file events
    pollingService.on('new-file', async (fileInfo) => {
      try {
        await processor.processFile(fileInfo);
      } catch (error) {
        console.error('❌ Failed to process file:', error);
        // Don't crash the worker - file is already in retry queue
      }
    });

    // Handle polling errors
    pollingService.on('error', (error) => {
      console.error('❌ Polling service error:', error);
      // Don't crash the worker - polling will retry on next interval
    });

    // Start polling
    await pollingService.start();

    console.log('✅ Background worker started successfully');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      try {
        await pollingService.stop();
        console.log('✅ Background worker stopped');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      // Log but don't crash - let polling continue
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      // Log but don't crash - let polling continue
    });
  } catch (error) {
    console.error('❌ Failed to start background worker:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Background worker fatal error:', error);
  process.exit(1);
});
