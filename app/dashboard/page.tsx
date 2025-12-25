import { getDatabase } from '@/lib/db';
import { getSentFiles, getAllBuckets, getRetryQueueReady } from '@/lib/db/queries';
import { StatCard } from '@/components/dashboard/StatCard';
import { Database, FileCheck, AlertCircle, Activity } from 'lucide-react';
import { formatBytes } from '@/lib/telegram/messages';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  try {
    const db = getDatabase();

    const sentFiles = getSentFiles(db, 1000);
    const buckets = getAllBuckets(db);
    const retryQueue = getRetryQueueReady(db);

    // Calculate stats with type safety
    const sentFilesArray = sentFiles as any[];
    const bucketsArray = buckets as any[];
    const retryQueueArray = retryQueue as any[];

    const totalBackups = sentFilesArray.length;
    const totalSize = sentFilesArray.reduce((sum, file) => {
      const size = parseInt(file.file_size) || 0;
      return sum + size;
    }, 0);
    const bucketsCount = bucketsArray.length;
    const enabledBuckets = bucketsArray.filter(b => b.enabled === 1).length;
    const retryQueueDepth = retryQueueArray.length;

    // Last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last24h = sentFilesArray.filter(f => f.sent_at && f.sent_at > oneDayAgo);

    return {
      totalBackups,
      totalSize,
      bucketsCount,
      enabledBuckets,
      retryQueueDepth,
      backupsLast24h: last24h.length,
      lastBackup: sentFilesArray.length > 0 ? sentFilesArray[0].sent_at : null,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    // Return default stats on error
    return {
      totalBackups: 0,
      totalSize: 0,
      bucketsCount: 0,
      enabledBuckets: 0,
      retryQueueDepth: 0,
      backupsLast24h: 0,
      lastBackup: null,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-neon-cyan">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Backups"
          value={stats.totalBackups}
          icon={FileCheck}
          color="cyan"
          subtitle={formatBytes(stats.totalSize)}
        />

        <StatCard
          title="Buckets Monitored"
          value={`${stats.enabledBuckets}/${stats.bucketsCount}`}
          icon={Database}
          color="lime"
          subtitle="Active buckets"
        />

        <StatCard
          title="Last 24 Hours"
          value={stats.backupsLast24h}
          icon={Activity}
          color="yellow"
          subtitle="Backups sent"
        />

        <StatCard
          title="Retry Queue"
          value={stats.retryQueueDepth}
          icon={AlertCircle}
          color={stats.retryQueueDepth > 0 ? 'magenta' : 'cyan'}
          subtitle={stats.retryQueueDepth > 0 ? 'Pending retries' : 'All clear'}
        />
      </div>

      <div className="card-brutal">
        <h2 className="text-2xl font-bold mb-4 text-neon-cyan">Recent Activity</h2>
        <div className="text-gray-400">
          {stats.lastBackup ? (
            <p>Last backup: {new Date(stats.lastBackup).toLocaleString()}</p>
          ) : (
            <p>No backups yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
