import { hash } from 'bcryptjs';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { getDatabase } from '../db';
import { getUser, createUser } from '../db/queries';

export async function isSetupComplete(): Promise<boolean> {
  try {
    const db = getDatabase();
    const user = getUser(db);
    return !!user;
  } catch (error) {
    console.error('Failed to check setup status:', error);
    return false;
  }
}

export async function generateTOTPSecret(username: string): Promise<{
  secret: string;
  qrCode: string;
}> {
  if (!username || typeof username !== 'string' || username.length === 0) {
    throw new Error('Valid username is required');
  }

  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(username, 'TelegramPloy', secret);
    const qrCode = await toDataURL(otpauth);

    return { secret, qrCode };
  } catch (error) {
    throw new Error(`Failed to generate TOTP secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function generateBackupCodes(count = 10): string[] {
  if (count < 1 || count > 100) {
    throw new Error('Backup code count must be between 1 and 100');
  }

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate cryptographically random codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function completeSetup(data: {
  username: string;
  password: string;
  totpSecret: string;
  backupCodes: string[];
}): Promise<void> {
  // Validate inputs
  if (!data.username || typeof data.username !== 'string' || data.username.length === 0) {
    throw new Error('Valid username is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!data.totpSecret || typeof data.totpSecret !== 'string') {
    throw new Error('TOTP secret is required');
  }

  if (!Array.isArray(data.backupCodes) || data.backupCodes.length === 0) {
    throw new Error('Backup codes are required');
  }

  try {
    const db = getDatabase();

    // Check if setup already complete
    if (await isSetupComplete()) {
      throw new Error('Setup already completed. Only one user is allowed.');
    }

    // Hash password (12 rounds for security)
    const passwordHash = await hash(data.password, 12);

    // Store backup codes as plain text (will be compared with input during login)
    // Note: In the auth handler, we check these directly, not hashed

    // Create user
    createUser(db, {
      username: data.username,
      passwordHash,
      totpSecret: data.totpSecret,
      backupCodes: data.backupCodes,
    });

    console.log('✅ Setup completed successfully');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}
