import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="card-brutal max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-neon-cyan">
          TelegramPloy
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Disaster Recovery System for RustFS Backups
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="btn-brutal-primary">
            Dashboard
          </Link>
          <Link href="/setup" className="btn-brutal bg-neon-lime text-black">
            Initial Setup
          </Link>
        </div>
      </div>
    </main>
  );
}
