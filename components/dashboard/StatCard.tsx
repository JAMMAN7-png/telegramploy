'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'cyan' | 'magenta' | 'lime' | 'yellow';
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    cyan: 'border-neon-cyan shadow-[4px_4px_0_0_#00f0ff]',
    magenta: 'border-neon-magenta shadow-[4px_4px_0_0_#ff006e]',
    lime: 'border-neon-lime shadow-[4px_4px_0_0_#00ff88]',
    yellow: 'border-neon-yellow shadow-[4px_4px_0_0_#ffea00]',
  };

  const iconColorClasses = {
    cyan: 'text-neon-cyan',
    magenta: 'text-neon-magenta',
    lime: 'text-neon-lime',
    yellow: 'text-neon-yellow',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-dark-card border-4 p-6 ${colorClasses[color]} transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 font-bold">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className={iconColorClasses[color]} size={32} />
      </div>
    </motion.div>
  );
}
