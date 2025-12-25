'use client';

import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-neon-cyan">Settings</h1>

      <div className="card-brutal mb-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-neon-yellow" size={24} />
          <p className="text-gray-300">
            Environment variables are read-only from this interface.
            To change settings, update your <code className="bg-dark-bg px-2 py-1">.env</code> file and restart the application.
          </p>
        </div>
      </div>

      <div className="card-brutal">
        <h2 className="text-2xl font-bold mb-6 text-neon-cyan">Current Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">RustFS Endpoint</label>
            <div className="input-brutal bg-dark-bg opacity-60 cursor-not-allowed">
              {process.env.NEXT_PUBLIC_RUSTFS_ENDPOINT || 'Not configured (server-side only)'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">Polling Interval</label>
            <div className="input-brutal bg-dark-bg opacity-60 cursor-not-allowed">
              {process.env.NEXT_PUBLIC_POLLING_INTERVAL || '5'} minutes
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">Database Path</label>
            <div className="input-brutal bg-dark-bg opacity-60 cursor-not-allowed">
              ./data/telegramploy.db
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-400">Environment</label>
            <div className="input-brutal bg-dark-bg opacity-60 cursor-not-allowed">
              {process.env.NODE_ENV || 'development'}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-neon-cyan/10 border-4 border-neon-cyan">
          <p className="font-bold text-neon-cyan mb-2">How to Update Settings:</p>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>Edit <code className="bg-dark-bg px-1">.env</code> file in project root</li>
            <li>Update the desired environment variables</li>
            <li>Restart both Next.js server and background worker</li>
            <li>Refresh this page to see updated values</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
