import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { getLogs } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const logs = getLogs(db, 100);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('❌ Failed to get logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get logs' },
      { status: 500 }
    );
  }
}
