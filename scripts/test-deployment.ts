#!/usr/bin/env bun

/**
 * Deployment Test Script
 * Verifies that TelegramPloy is correctly configured and deployed
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function runTests() {
  console.log('🧪 TelegramPloy Deployment Test Suite\n');

  // Test 1: Check required files exist
  console.log('📁 Checking project files...');
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'Dockerfile',
    'docker-compose.yml',
    'lib/db/index.ts',
    'lib/db/schema.sql',
    'src/services/s3.ts',
    'src/services/telegram.ts',
    'src/background/index.ts',
  ];

  for (const file of requiredFiles) {
    const exists = existsSync(file);
    test(`File: ${file}`, exists, exists ? 'Found' : 'Missing');
  }

  // Test 2: Check environment variables
  console.log('\n🔐 Checking environment variables...');
  const requiredEnvVars = [
    'S3_ENDPOINT',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'NEXTAUTH_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    const exists = !!process.env[envVar];
    test(
      `Env: ${envVar}`,
      exists,
      exists ? 'Set' : 'Not set (required for deployment)'
    );
  }

  // Test 3: Check optional environment variables
  console.log('\n⚙️  Checking optional configuration...');
  const optionalEnvVars = [
    { name: 'NEXTAUTH_URL', default: 'http://localhost:3000' },
    { name: 'DATABASE_PATH', default: './data/telegramploy.db' },
    { name: 'POLL_INTERVAL_MS', default: '60000' },
    { name: 'MAX_FILE_SIZE_MB', default: '2000' },
    { name: 'CHUNK_SIZE_MB', default: '50' },
    { name: 'S3_FORCE_PATH_STYLE', default: 'true' },
  ];

  for (const { name, default: defaultValue } of optionalEnvVars) {
    const value = process.env[name] || defaultValue;
    test(`Env: ${name}`, true, `${value} ${!process.env[name] ? '(default)' : ''}`);
  }

  // Test 4: Database connectivity
  console.log('\n💾 Testing database...');
  try {
    const { getDatabase } = await import('../lib/db/index.ts');
    const db = getDatabase();

    // Test database connection
    const result = db.query('SELECT 1 as test').get() as { test: number };
    test('Database connection', result.test === 1, 'Connected successfully');

    // Check tables exist
    const tables = db.query(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];

    const requiredTables = ['users', 'bucket_settings', 'processed_files', 'retry_queue', 'logs'];
    for (const tableName of requiredTables) {
      const exists = tables.some(t => t.name === tableName);
      test(`Table: ${tableName}`, exists, exists ? 'Created' : 'Missing');
    }
  } catch (error: any) {
    test('Database', false, `Error: ${error.message}`);
  }

  // Test 5: S3 client initialization
  console.log('\n☁️  Testing S3 client...');
  try {
    const { getS3Client } = await import('../src/services/s3.ts');
    const s3Client = getS3Client();
    test('S3 client', !!s3Client, 'Initialized successfully');
  } catch (error: any) {
    test('S3 client', false, `Error: ${error.message}`);
  }

  // Test 6: Telegram bot initialization
  console.log('\n📱 Testing Telegram bot...');
  try {
    const { bot } = await import('../src/services/telegram.ts');
    test('Telegram bot', !!bot, 'Initialized successfully');
  } catch (error: any) {
    test('Telegram bot', false, `Error: ${error.message}`);
  }

  // Test 7: Health endpoint (if server is running)
  console.log('\n🏥 Testing health endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    test(
      'Health endpoint',
      response.ok && data.status === 'healthy',
      response.ok ? `Status: ${data.status}` : `HTTP ${response.status}`
    );
  } catch (error: any) {
    test(
      'Health endpoint',
      false,
      'Not reachable (start server with: bun run dev)'
    );
  }

  // Test 8: Build verification
  console.log('\n🏗️  Testing build...');
  try {
    const buildResult = await Bun.spawn(['bun', 'run', 'build'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await buildResult.exited;
    test('Build', exitCode === 0, exitCode === 0 ? 'Success' : `Failed with code ${exitCode}`);
  } catch (error: any) {
    test('Build', false, `Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n📊 Test Results: ${passed}/${total} passed (${percentage}%)\n`);

  if (percentage === 100) {
    console.log('✅ All tests passed! Ready for deployment.');
    process.exit(0);
  } else if (percentage >= 80) {
    console.log('⚠️  Most tests passed. Review failures before deploying.');
    process.exit(1);
  } else {
    console.log('❌ Multiple tests failed. Fix issues before deploying.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});
