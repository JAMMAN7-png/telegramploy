'use client';

import { Shield, Key, Smartphone, AlertCircle } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-neon-cyan">Security</h1>

      <div className="card-brutal mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-neon-lime" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-neon-lime">Authentication Status</h2>
            <p className="text-gray-400">You are logged in with 2FA enabled</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card-brutal">
          <div className="flex items-center gap-3 mb-4">
            <Key className="text-neon-cyan" size={24} />
            <h3 className="text-xl font-bold text-neon-cyan">Password</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Your password is securely hashed using bcrypt.
          </p>
          <div className="p-4 bg-neon-cyan/10 border-4 border-neon-cyan">
            <p className="text-sm text-gray-300">
              To change your password, use the setup page or update the database directly.
            </p>
          </div>
        </div>

        <div className="card-brutal">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="text-neon-lime" size={24} />
            <h3 className="text-xl font-bold text-neon-lime">2FA (TOTP)</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Time-based One-Time Password authentication is active.
          </p>
          <div className="p-4 bg-neon-lime/10 border-4 border-neon-lime">
            <p className="text-sm text-gray-300">
              Your 2FA secret is securely stored. Use your authenticator app to generate codes.
            </p>
          </div>
        </div>
      </div>

      <div className="card-brutal">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-neon-yellow" size={24} />
          <h3 className="text-xl font-bold text-neon-yellow">Backup Codes</h3>
        </div>
        <p className="text-gray-400 mb-4">
          Backup codes can be used for emergency access if you lose your authenticator device.
        </p>
        <div className="p-4 bg-neon-yellow/10 border-4 border-neon-yellow">
          <p className="font-bold text-neon-yellow mb-2">Important:</p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Backup codes are one-time use only</li>
            <li>Store them securely in a password manager</li>
            <li>Each code can only be used once</li>
            <li>Generate new codes if you've used all of them</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 card-brutal bg-dark-bg/50">
        <p className="text-sm text-gray-400">
          <strong className="text-neon-cyan">Security Note:</strong> This is a single-user application.
          The user account was created during initial setup. Password and 2FA changes require database access
          or running the setup process again.
        </p>
      </div>
    </div>
  );
}
