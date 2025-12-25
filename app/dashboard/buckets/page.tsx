'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Bucket {
  bucket: string;
  enabled: boolean;
  discovered_at: string;
  last_checked: string | null;
}

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingBucket, setTogglingBucket] = useState<string | null>(null);

  const fetchBuckets = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/buckets');

      if (!res.ok) {
        throw new Error(`Failed to fetch buckets: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setBuckets(data.buckets || []);
    } catch (err: any) {
      console.error('Failed to fetch buckets:', err);
      setError(err.message || 'Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  const toggleBucket = async (bucketName: string, currentEnabled: boolean) => {
    setTogglingBucket(bucketName);

    try {
      const res = await fetch(`/api/buckets/${bucketName}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (!res.ok) {
        throw new Error(`Failed to toggle bucket: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh buckets after successful toggle
      await fetchBuckets();
    } catch (err: any) {
      console.error('Failed to toggle bucket:', err);
      setError(err.message || 'Failed to toggle bucket');
    } finally {
      setTogglingBucket(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-neon-cyan">Buckets</h1>
        <Button onClick={fetchBuckets} variant="primary" disabled={loading}>
          <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-neon-magenta/20 border-4 border-neon-magenta text-white">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card-brutal text-center">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-neon-cyan" size={24} />
            <span>Loading buckets...</span>
          </div>
        </div>
      ) : buckets.length === 0 ? (
        <div className="card-brutal text-center text-gray-400">
          <p className="mb-2">No buckets discovered yet.</p>
          <p className="text-sm">Run the background worker to discover buckets from RustFS.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {buckets.map((bucket, index) => (
            <motion.div
              key={bucket.bucket}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-brutal flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Database className="text-neon-cyan" size={24} />
                <div>
                  <h3 className="font-bold text-lg">{bucket.bucket}</h3>
                  <p className="text-sm text-gray-400">
                    Discovered: {new Date(bucket.discovered_at).toLocaleDateString()}
                    {bucket.last_checked && (
                      <> • Last checked: {new Date(bucket.last_checked).toLocaleString()}</>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleBucket(bucket.bucket, bucket.enabled)}
                disabled={togglingBucket === bucket.bucket}
                className={`flex items-center gap-2 px-4 py-2 border-4 font-bold transition-all disabled:opacity-50 ${
                  bucket.enabled
                    ? 'bg-neon-lime text-black border-black hover:translate-x-1 hover:translate-y-1'
                    : 'bg-dark-bg text-gray-400 border-gray-600 hover:border-neon-cyan'
                }`}
              >
                {togglingBucket === bucket.bucket ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Toggling...
                  </>
                ) : bucket.enabled ? (
                  <>
                    <CheckCircle size={20} />
                    Enabled
                  </>
                ) : (
                  <>
                    <XCircle size={20} />
                    Disabled
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
