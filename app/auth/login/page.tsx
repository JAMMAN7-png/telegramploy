'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const totp = formData.get('totp') as string;

      // Client-side validation
      if (!username || !password || !totp) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      // Validate TOTP format (6 digits)
      if (!/^\d{6}$/.test(totp)) {
        setError('2FA code must be 6 digits');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        username,
        password,
        totp,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials or 2FA code');
        setLoading(false);
      } else if (result?.ok) {
        // Successful login
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('An unexpected error occurred');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-brutal max-w-md w-full"
      >
        <h1 className="text-4xl font-bold mb-6 text-neon-cyan">Login</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-neon-magenta/20 border-4 border-neon-magenta text-white"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            type="text"
            required
            autoComplete="username"
            disabled={loading}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={loading}
          />

          <Input
            label="2FA Code"
            name="totp"
            type="text"
            required
            maxLength={6}
            placeholder="000000"
            pattern="\d{6}"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
