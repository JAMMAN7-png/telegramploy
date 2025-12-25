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
  // Validate required fields
  if (!data.bucket || !data.fileName || data.fileSize === undefined || !data.uploadTime || !data.etag) {
    throw new Error('Missing required fields for file caption');
  }

  if (data.chunkInfo) {
    const { current, total, chunkSize } = data.chunkInfo;

    // Validate chunk info
    if (current < 1 || total < 1 || current > total || chunkSize < 1) {
      throw new Error('Invalid chunk information');
    }

    return `[Part ${current}/${total}] <b>${data.bucket}/${data.fileName}</b>

📦 Bucket: <code>${data.bucket}</code>
📄 Original File: <code>${data.fileName}</code>
💾 Part Size: ${formatBytes(chunkSize)}
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
  if (bytes < 0) {
    throw new Error('Bytes must be non-negative');
  }

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2))} ${sizes[sizeIndex]}`;
}

export function formatAdminAlert(message: string): string {
  if (!message) {
    throw new Error('Alert message is required');
  }

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
  // Validate stats
  if (stats.backupsSent < 0 || stats.totalSize < 0 || stats.bucketsActive < 0 ||
      stats.bucketsTotal < 0 || stats.failedUploads < 0 || stats.retryQueueDepth < 0) {
    throw new Error('Invalid stats: all numbers must be non-negative');
  }

  if (stats.bucketsActive > stats.bucketsTotal) {
    throw new Error('Active buckets cannot exceed total buckets');
  }

  return `✅ <b>TelegramPloy System Operational</b>

📊 Last 24 Hours:
• Backups Sent: ${stats.backupsSent} files (${formatBytes(stats.totalSize)})
• Buckets Active: ${stats.bucketsActive}/${stats.bucketsTotal}
• Failed Uploads: ${stats.failedUploads}
• Retry Queue: ${stats.retryQueueDepth > 0 ? `${stats.retryQueueDepth} pending` : 'Empty'}

🔍 Last Backup: ${stats.lastBackup || 'None'}

⏰ Next heartbeat: ${stats.nextHeartbeat}`;
}
