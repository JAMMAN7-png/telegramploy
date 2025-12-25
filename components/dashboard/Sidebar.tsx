'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  Settings,
  FileText,
  Shield,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Database, label: 'Buckets', href: '/dashboard/buckets' },
  { icon: FileText, label: 'Logs', href: '/dashboard/logs' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: Shield, label: 'Security', href: '/dashboard/security' },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-dark-card border-r-4 border-neon-cyan p-6 min-h-screen"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neon-cyan">TelegramPloy</h1>
        <p className="text-sm text-gray-400">Backup Monitor</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-none border-4 transition-all ${
                  isActive
                    ? 'bg-neon-cyan text-black border-black shadow-brutal'
                    : 'bg-transparent text-white border-transparent hover:border-neon-cyan'
                }`}
              >
                <Icon size={20} />
                <span className="font-bold">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-none border-4 border-transparent hover:border-neon-magenta text-white w-full text-left transition-all mt-8"
          whileHover={{ x: 4 }}
        >
          <LogOut size={20} />
          <span className="font-bold">Logout</span>
        </motion.button>
      </nav>
    </motion.aside>
  );
}
