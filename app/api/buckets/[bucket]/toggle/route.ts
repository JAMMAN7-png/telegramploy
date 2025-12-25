import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { updateBucketEnabled } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: { bucket: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bucket } = params;

    // Validate bucket name
    if (!bucket || typeof bucket !== 'string' || bucket.length === 0) {
      return NextResponse.json({ error: 'Invalid bucket name' }, { status: 400 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { enabled } = body;

    // Validate enabled flag
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    const db = getDatabase();
    updateBucketEnabled(db, bucket, enabled);

    console.log(`✅ Bucket ${bucket} ${enabled ? 'enabled' : 'disabled'}`);

    return NextResponse.json({ success: true, bucket, enabled });
  } catch (error: any) {
    console.error('❌ Failed to toggle bucket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle bucket' },
      { status: 500 }
    );
  }
}
