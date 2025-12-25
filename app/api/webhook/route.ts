import { NextRequest, NextResponse } from 'next/server';
import { FileProcessor } from '@/src/background/processor';

const processor = new FileProcessor();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;

    // Validate environment variable
    if (!expectedToken) {
      console.error('WEBHOOK_SECRET_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    // Validate token (constant-time comparison)
    if (!token || token.length !== expectedToken.length || token !== expectedToken) {
      console.warn('⚠️ Unauthorized webhook attempt (Bearer token)');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate payload
    let event;
    try {
      event = await request.json();
    } catch (error) {
      console.warn('⚠️ Invalid JSON in webhook payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!event || typeof event !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('📬 Webhook received:', {
      eventName: event.EventName,
      bucket: event.Records?.[0]?.s3?.bucket?.name,
      key: event.Records?.[0]?.s3?.object?.key,
    });

    // Process S3 event
    const record = event.Records?.[0];
    if (record && record.eventName?.startsWith('s3:ObjectCreated:')) {
      // Validate required fields
      if (!record.s3?.bucket?.name || !record.s3?.object?.key) {
        console.warn('⚠️ Missing required fields in S3 event');
        return NextResponse.json({ error: 'Invalid S3 event format' }, { status: 400 });
      }

      const fileInfo = {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
        size: record.s3.object.size || 0,
        etag: record.s3.object.eTag || 'unknown',
        lastModified: new Date(),
      };

      // Process in background (don't await)
      processor.processFile(fileInfo).catch((error) => {
        console.error('❌ Failed to process webhook file:', error);
      });

      return NextResponse.json({ received: true, processing: true });
    }

    // Not an ObjectCreated event
    return NextResponse.json({ received: true, processing: false });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    );
  }
}
