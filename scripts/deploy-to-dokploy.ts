#!/usr/bin/env bun

/**
 * Automated Dokploy Deployment Script
 * Deploys TelegramPloy to Dokploy instance at dok.v244.net
 */

const DOKPLOY_URL = 'https://dok.v244.net';
const DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY || '';
const PROJECT_NAME = 'general'; // Deploy to General project
const APP_NAME = 'telegramploy';
const DOMAIN = 'backup.v244.net';

interface DeploymentConfig {
  name: string;
  projectName: string;
  sourceType: 'github' | 'gitlab' | 'docker' | 'git';
  repository?: string;
  branch?: string;
  buildPath?: string;
  env: Record<string, string>;
  domains: Array<{
    host: string;
    https: boolean;
    certificateType: 'letsencrypt' | 'none';
  }>;
}

async function deployToDokploy() {
  console.log('🚀 Starting TelegramPloy deployment to Dokploy...\n');

  if (!DOKPLOY_API_KEY) {
    console.error('❌ Error: DOKPLOY_API_KEY environment variable not set!');
    console.log('\nSet it with: export DOKPLOY_API_KEY=your-api-key');
    process.exit(1);
  }

  // Read production environment variables
  const envFile = Bun.file('.env.production');
  const envContent = await envFile.text();
  const envVars: Record<string, string> = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  console.log('📝 Loaded environment variables:', Object.keys(envVars).join(', '));
  console.log('');

  const config: DeploymentConfig = {
    name: APP_NAME,
    projectName: PROJECT_NAME,
    sourceType: 'docker',
    buildPath: '.',
    env: envVars,
    domains: [
      {
        host: DOMAIN,
        https: true,
        certificateType: 'letsencrypt',
      },
    ],
  };

  try {
    // Step 1: Create application
    console.log('📦 Creating application in Dokploy...');
    const createResponse = await fetch(`${DOKPLOY_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOKPLOY_API_KEY}`,
      },
      body: JSON.stringify(config),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create application: ${createResponse.status} ${error}`);
    }

    const appData = await createResponse.json();
    console.log(`✅ Application created: ${appData.id}`);
    console.log('');

    // Step 2: Upload source code (if using git/github)
    // This would typically be done via git push or connecting repository
    console.log('📤 Note: Make sure to push code to repository or upload docker-compose.yml');
    console.log('');

    // Step 3: Trigger deployment
    console.log('🔨 Triggering deployment...');
    const deployResponse = await fetch(`${DOKPLOY_URL}/api/applications/${appData.id}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOKPLOY_API_KEY}`,
      },
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      throw new Error(`Failed to deploy: ${deployResponse.status} ${error}`);
    }

    const deployData = await deployResponse.json();
    console.log(`✅ Deployment started: ${deployData.deploymentId}`);
    console.log('');

    // Step 4: Monitor deployment status
    console.log('⏳ Monitoring deployment status...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(
        `${DOKPLOY_URL}/api/deployments/${deployData.deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${DOKPLOY_API_KEY}`,
          },
        }
      );

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log(`Status: ${status.status} (${++attempts}/${maxAttempts})`);

        if (status.status === 'success') {
          console.log('');
          console.log('✅ Deployment successful!');
          break;
        } else if (status.status === 'failed') {
          console.log('');
          console.error('❌ Deployment failed!');
          console.error('Logs:', status.logs);
          process.exit(1);
        }
      }
    }

    if (attempts >= maxAttempts) {
      console.log('⚠️  Deployment timeout. Check Dokploy dashboard for status.');
    }

    // Step 5: Verify health endpoint
    console.log('');
    console.log('🏥 Verifying health endpoint...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for container startup

    try {
      const healthResponse = await fetch(`https://${DOMAIN}/api/health`, {
        signal: AbortSignal.timeout(10000),
      });

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log('✅ Health check passed:', health);
      } else {
        console.log(`⚠️  Health check returned: ${healthResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️  Health endpoint not yet available. Give it a minute...');
    }

    // Final summary
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log(`📍 Application URL: https://${DOMAIN}`);
    console.log(`🔐 Setup URL: https://${DOMAIN}/setup`);
    console.log(`📊 Dashboard: https://${DOMAIN}/dashboard`);
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Visit setup URL to create admin account');
    console.log('2. Scan QR code with authenticator app');
    console.log('3. Download and save backup codes');
    console.log('4. Enable bucket monitoring in dashboard');
    console.log('');
    console.log('🤖 Bot: @TelegrasmPloyBot');
    console.log(`💬 Chat ID: ${envVars.TELEGRAM_CHAT_ID}`);
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('💥 Deployment error:', error.message);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('- Check DOKPLOY_API_KEY is correct');
    console.error('- Verify Dokploy instance is accessible');
    console.error('- Check project name exists in Dokploy');
    console.error('- Review Dokploy logs for details');
    process.exit(1);
  }
}

// Run deployment
deployToDokploy().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
