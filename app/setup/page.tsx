'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { Shield, Key, Download, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if setup is already complete
    fetch('/api/setup')
      .then(res => res.json())
      .then(data => {
        if (data.setupComplete) {
          router.push('/auth/login');
        }
      })
      .catch(err => console.error('Failed to check setup status:', err));
  }, [router]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!username || username.length === 0) {
      setError('Username is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-totp', username }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate 2FA');
      }

      const data = await res.json();
      setTotpSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to proceed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = () => {
    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate TOTP code
    if (!/^\d{6}$/.test(totpCode)) {
      setError('2FA code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          username,
          password,
          totpSecret,
          backupCodes,
          totpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      if (data.success) {
        // Redirect to login
        router.push('/auth/login');
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telegramploy-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-brutal max-w-2xl w-full"
      >
        <h1 className="text-4xl font-bold mb-6 text-neon-cyan">Initial Setup</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-neon-magenta/20 border-4 border-neon-magenta text-white"
          >
            {error}
          </motion.div>
        )}

        {/* Step 1: Create Account */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="flex items-center gap-3 mb-6">
              <Key className="text-neon-cyan" size={24} />
              <h2 className="text-2xl font-bold">Create Admin Account</h2>
            </div>

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Generating 2FA...' : 'Continue'}
            </Button>
          </form>
        )}

        {/* Step 2: Setup 2FA */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-neon-lime" size={24} />
              <h2 className="text-2xl font-bold">Setup Two-Factor Authentication</h2>
            </div>

            <div className="mb-6 text-center">
              <p className="mb-4 text-gray-300">Scan this QR code with your authenticator app:</p>
              {qrCode && (
                <div className="inline-block p-4 bg-white">
                  <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                </div>
              )}
              <p className="mt-4 text-sm text-gray-400">
                Or enter this code manually: <code className="bg-dark-bg px-2 py-1">{totpSecret}</code>
              </p>
            </div>

            <Button onClick={handleStep2} variant="primary" className="w-full">
              I've Scanned the QR Code
            </Button>
          </div>
        )}

        {/* Step 3: Save Backup Codes */}
        {step === 3 && (
          <form onSubmit={handleStep3}>
            <div className="flex items-center gap-3 mb-6">
              <Download className="text-neon-yellow" size={24} />
              <h2 className="text-2xl font-bold">Save Backup Codes</h2>
            </div>

            <div className="mb-6 p-4 bg-dark-bg border-4 border-neon-yellow">
              <p className="font-bold text-neon-yellow mb-2">Important!</p>
              <p className="text-sm text-gray-300 mb-4">
                These backup codes will allow you to access your account if you lose your 2FA device.
                Save them in a secure location.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, i) => (
                  <code key={i} className="bg-dark-card p-2 text-center font-mono text-neon-cyan">
                    {code}
                  </code>
                ))}
              </div>
              <Button type="button" onClick={downloadBackupCodes} variant="success" className="w-full">
                <Download size={20} className="mr-2" />
                Download Backup Codes
              </Button>
            </div>

            <Input
              label="Enter 2FA Code to Verify"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
              pattern="\d{6}"
              required
              disabled={loading}
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              <CheckCircle size={20} className="mr-2" />
              {loading ? 'Completing Setup...' : 'Complete Setup'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-sm text-gray-400 text-center">
          Step {step} of 3
        </div>
      </motion.div>
    </div>
  );
}
