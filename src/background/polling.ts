import { getS3Client } from '../../lib/s3/client';
import { listAllBuckets, listBucketObjects } from '../../lib/s3/operations';
import { getDatabase } from '../../lib/db';
import { addBucket, getEnabledBuckets, updateBucketLastChecked, isFileSent } from '../../lib/db/queries';
import { EventEmitter } from 'events';

export class PollingService extends EventEmitter {
  private intervalId: Timer | null = null;
  private isRunning = false;
  private isPolling = false; // Prevent concurrent polls

  constructor(private intervalMinutes: number) {
    super();

    // Validate interval
    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      throw new Error('Polling interval must be between 1 and 1440 minutes (24 hours)');
    }
  }

  async start() {
    if (this.isRunning) {
      console.warn('⚠️ Polling service already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting polling service (${this.intervalMinutes}min interval)`);

    try {
      // Run immediately
      await this.poll();

      // Then run on interval
      this.intervalId = setInterval(async () => {
        await this.poll();
      }, this.intervalMinutes * 60 * 1000);
    } catch (error) {
      console.error('❌ Failed to start polling service:', error);
      this.isRunning = false;
      throw error;
    }
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
    // Prevent concurrent polls
    if (this.isPolling) {
      console.warn('⚠️ Previous poll still running, skipping this cycle');
      return;
    }

    this.isPolling = true;
    const startTime = Date.now();

    try {
      console.log('🔍 Polling RustFS buckets...');

      const s3Client = getS3Client();
      const db = getDatabase();

      // Discover all buckets with timeout
      const buckets = await this.withTimeout(
        listAllBuckets(s3Client),
        30000, // 30 second timeout
        'List buckets timed out'
      );

      console.log(`📦 Found ${buckets.length} buckets`);

      // Add new buckets to database
      for (const bucket of buckets) {
        if (bucket.Name) {
          try {
            addBucket(db, bucket.Name);
          } catch (error) {
            console.warn(`Failed to add bucket ${bucket.Name}:`, error);
          }
        }
      }

      // Check enabled buckets for new files
      const enabledBuckets = getEnabledBuckets(db);

      for (const bucketSetting of enabledBuckets as any[]) {
        if (bucketSetting.bucket) {
          await this.checkBucket(bucketSetting.bucket);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Polling complete (${duration}ms)`);
    } catch (error) {
      console.error('❌ Polling error:', error);
      this.emit('error', error);
    } finally {
      this.isPolling = false;
    }
  }

  private async checkBucket(bucketName: string) {
    try {
      const s3Client = getS3Client();
      const db = getDatabase();

      // List objects with timeout
      const objects = await this.withTimeout(
        listBucketObjects(s3Client, bucketName),
        30000, // 30 second timeout
        `List objects in ${bucketName} timed out`
      );

      let newFilesCount = 0;

      for (const obj of objects) {
        if (!obj.Key || !obj.ETag) {
          continue; // Skip invalid objects
        }

        const alreadySent = isFileSent(db, bucketName, obj.Key, obj.ETag);

        if (!alreadySent) {
          console.log(`📦 New file detected: ${bucketName}/${obj.Key}`);
          newFilesCount++;

          this.emit('new-file', {
            bucket: bucketName,
            key: obj.Key,
            size: obj.Size || 0,
            etag: obj.ETag,
            lastModified: obj.LastModified || new Date(),
          });
        }
      }

      if (newFilesCount > 0) {
        console.log(`📊 Found ${newFilesCount} new files in ${bucketName}`);
      }

      updateBucketLastChecked(db, bucketName);
    } catch (error) {
      console.error(`❌ Error checking bucket ${bucketName}:`, error);
      // Don't throw - continue checking other buckets
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  }
}
