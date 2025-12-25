import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { getAllBuckets } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const buckets = getAllBuckets(db);

    // Transform data for client (convert enabled to boolean)
    const bucketsData = (buckets as any[]).map(bucket => ({
      bucket: bucket.bucket,
      enabled: bucket.enabled === 1,
      discovered_at: bucket.discovered_at,
      last_checked: bucket.last_checked,
    }));

    return NextResponse.json({ buckets: bucketsData });
  } catch (error: any) {
    console.error('❌ Failed to get buckets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get buckets' },
      { status: 500 }
    );
  }
}
