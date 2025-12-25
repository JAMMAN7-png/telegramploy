'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Info, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Log {
  id: number;
  level: string;
  message: string;
  metadata: string | null;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/logs');

      if (!res.ok) {
        throw new Error(`Failed to fetch logs: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level.toLowerCase() === filter);

  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <XCircle className="text-neon-magenta" size={20} />;
      case 'warn':
        return <AlertTriangle className="text-neon-yellow" size={20} />;
      case 'info':
        return <Info className="text-neon-cyan" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-neon-cyan">Logs</h1>
        <Button onClick={fetchLogs} variant="primary" disabled={loading}>
          <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-neon-magenta/20 border-4 border-neon-magenta text-white">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {['all', 'info', 'warn', 'error'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 border-4 font-bold transition-all ${
              filter === level
                ? 'bg-neon-cyan text-black border-black'
                : 'bg-dark-card text-gray-400 border-gray-600 hover:border-neon-cyan'
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && logs.length === 0 ? (
        <div className="card-brutal text-center">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-neon-cyan" size={24} />
            <span>Loading logs...</span>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card-brutal text-center text-gray-400">
          <p>No logs found{filter !== 'all' ? ` for level: ${filter}` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
              className="bg-dark-card border-l-4 border-neon-cyan p-4"
            >
              <div className="flex items-start gap-3">
                {getLogIcon(log.level)}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm text-gray-400">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white">{log.message}</p>
                  {log.metadata && (
                    <pre className="mt-2 text-xs text-gray-400 bg-dark-bg p-2 overflow-x-auto">
                      {log.metadata}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-400 text-center">
        Showing {filteredLogs.length} of {logs.length} logs • Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}
