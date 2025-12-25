import { NextRequest, NextResponse } from 'next/server';
import { isSetupComplete, generateTOTPSecret, generateBackupCodes, completeSetup } from '@/lib/auth/setup';
import { authenticator } from 'otplib';

export async function GET() {
  try {
    const setupComplete = await isSetupComplete();
    return NextResponse.json({ setupComplete });
  } catch (error: any) {
    console.error('❌ Failed to check setup status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { action, username, password, totpSecret, backupCodes, totpCode } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Generate TOTP and backup codes
    if (action === 'generate-totp') {
      if (!username || typeof username !== 'string') {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
      }

      const { secret, qrCode } = await generateTOTPSecret(username);
      const codes = generateBackupCodes();

      return NextResponse.json({ secret, qrCode, backupCodes: codes });
    }

    // Complete setup
    if (action === 'complete') {
      // Validate all required fields
      if (!username || !password || !totpSecret || !backupCodes || !totpCode) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }

      // Validate TOTP code format
      if (!/^\d{6}$/.test(totpCode)) {
        return NextResponse.json(
          { error: '2FA code must be 6 digits' },
          { status: 400 }
        );
      }

      // Verify TOTP code before completing setup
      const totpValid = authenticator.verify({
        token: totpCode,
        secret: totpSecret,
      });

      if (!totpValid) {
        return NextResponse.json(
          { error: 'Invalid 2FA code. Please try again.' },
          { status: 400 }
        );
      }

      // Complete setup
      await completeSetup({ username, password, totpSecret, backupCodes });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Setup API error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}
