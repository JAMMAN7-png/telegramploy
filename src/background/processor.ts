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
const TELEGRAM_RATE_LIMIT_MS = 100; // 100ms between messages (max 10 msg/sec, safe margin)

export class FileProcessor {
  private lastTelegramSend = 0;

  async processFile(fileInfo: {
    bucket: string;
    key: string;
    size: number;
    etag: string;
    lastModified: Date;
  }) {
    const { bucket, key, size, etag, lastModified } = fileInfo;
    let tempFilePath: string | null = null;
    const cleanupFiles: string[] = [];

    try {
      // Validate inputs
      if (!bucket || !key || !etag) {
        throw new Error('Invalid file info: bucket, key, and etag are required');
      }

      console.log(`⚙️ Processing: ${bucket}/${key} (${this.formatBytes(size)})`);

      // Download file
      tempFilePath = join(TEMP_DIR, basename(key));
      const s3Client = getS3Client();
      await downloadFile(s3Client, bucket, key, tempFilePath);
      cleanupFiles.push(tempFilePath);

      // Check if needs splitting
      const needsSplit = shouldSplitFile(tempFilePath);

      if (needsSplit) {
        console.log(`✂️ File requires splitting (≥50MB)`);
        await this.processSplitFile(tempFilePath, bucket, key, size, etag, lastModified, cleanupFiles);
      } else {
        await this.processSingleFile(tempFilePath, bucket, key, size, etag, lastModified);
      }

      // Cleanup on success
      this.cleanupAll(cleanupFiles);

      console.log(`✅ File processed successfully: ${bucket}/${key}`);
    } catch (error: any) {
      console.error(`❌ Processing failed: ${bucket}/${key}`, error);

      // Cleanup on failure
      if (tempFilePath) {
        this.cleanupAll([tempFilePath, ...cleanupFiles]);
      }

      // Add to retry queue
      try {
        const db = getDatabase();
        addToRetryQueue(db, {
          bucket,
          objectKey: key,
          fileSize: size,
          errorMessage: error.message || 'Unknown error',
        });
        console.log(`🔄 Added to retry queue: ${bucket}/${key}`);
      } catch (retryError) {
        console.error(`❌ Failed to add to retry queue:`, retryError);
      }

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
    const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID;

    if (!chatId) {
      throw new Error('TELEGRAM_BACKUP_CHAT_ID environment variable is not set');
    }

    // Validate caption length
    const caption = this.createCaption(bucket, key, size, etag, lastModified);

    // Rate limiting
    await this.rateLimitTelegram();

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

    console.log(`📤 Sent to Telegram (message ID: ${result.message_id})`);
  }

  private async processSplitFile(
    filePath: string,
    bucket: string,
    key: string,
    size: number,
    etag: string,
    lastModified: Date,
    cleanupFiles: string[]
  ) {
    const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID;

    if (!chatId) {
      throw new Error('TELEGRAM_BACKUP_CHAT_ID environment variable is not set');
    }

    // Split file
    const chunks = await splitFile(filePath, TEMP_DIR);
    console.log(`📦 Split into ${chunks.length} chunks`);

    // Track chunks for cleanup
    chunks.forEach(chunk => cleanupFiles.push(chunk.path));

    const messageIds: string[] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        console.log(`📤 Sending chunk ${i + 1}/${chunks.length}...`);

        const caption = this.createCaption(
          bucket,
          key,
          size,
          etag,
          lastModified,
          {
            current: i + 1,
            total: chunks.length,
            chunkSize: chunk.size,
          }
        );

        // Rate limiting
        await this.rateLimitTelegram();

        const result = await sendFileToTelegram(chatId, chunk.path, caption);
        messageIds.push(result.message_id.toString());

        console.log(`✅ Chunk ${i + 1}/${chunks.length} sent (message ID: ${result.message_id})`);

        // Cleanup chunk immediately after successful send
        this.cleanup(chunk.path);
      }

      // Mark as sent only after ALL chunks are sent successfully
      const db = getDatabase();
      markFileSent(db, {
        bucket,
        objectKey: key,
        etag,
        fileSize: size,
        chunkCount: chunks.length,
        messageIds,
      });
    } catch (error) {
      console.error(`❌ Failed to send chunk ${messageIds.length + 1}/${chunks.length}`);
      throw error; // Let parent handle cleanup and retry
    }
  }

  private createCaption(
    bucket: string,
    key: string,
    size: number,
    etag: string,
    lastModified: Date,
    chunkInfo?: { current: number; total: number; chunkSize: number }
  ): string {
    const caption = formatFileCaption({
      bucket,
      fileName: basename(key),
      fileSize: size,
      uploadTime: lastModified.toISOString(),
      etag,
      chunkInfo,
    });

    // Telegram caption limit is 1024 characters
    if (caption.length > 1024) {
      console.warn(`⚠️ Caption truncated from ${caption.length} to 1024 chars`);
      return caption.substring(0, 1021) + '...';
    }

    return caption;
  }

  private async rateLimitTelegram() {
    const now = Date.now();
    const timeSinceLastSend = now - this.lastTelegramSend;

    if (timeSinceLastSend < TELEGRAM_RATE_LIMIT_MS) {
      const waitTime = TELEGRAM_RATE_LIMIT_MS - timeSinceLastSend;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastTelegramSend = Date.now();
  }

  private cleanup(filePath: string) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`🗑️ Cleaned up: ${basename(filePath)}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup: ${filePath}`, error);
    }
  }

  private cleanupAll(files: string[]) {
    for (const file of files) {
      this.cleanup(file);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
