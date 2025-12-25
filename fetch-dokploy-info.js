#!/usr/bin/env node

/**
 * Fetch Dokploy Instance Information
 * Run: node fetch-dokploy-info.js
 */

const DOKPLOY_URL = 'https://dok.v244.net';
const API_KEY = 'claudeEqDTWIIYMTpEojgiTalsDtVwwzLPUJTwlLbpWNbMHVIiVDbaiBlXUBpntuojXgVY';

async function fetchDokployInfo() {
  const headers = {
    'accept': 'application/json',
    'x-api-key': API_KEY
  };

  try {
    console.log('🔍 Fetching Dokploy Instance Information...\n');

    // Get all servers
    const serversRes = await fetch(`${DOKPLOY_URL}/api/server.all`, { headers });
    const servers = await serversRes.json();
    console.log('📊 Servers:', JSON.stringify(servers, null, 2));

    // Get all projects
    const projectsRes = await fetch(`${DOKPLOY_URL}/api/project.all`, { headers });
    const projects = await projectsRes.json();
    console.log('\n📁 Projects:', JSON.stringify(projects, null, 2));

    // Get server public IP
    const ipRes = await fetch(`${DOKPLOY_URL}/api/server.publicIp`, { headers });
    const ipData = await ipRes.json();
    console.log('\n🌐 Public IP:', JSON.stringify(ipData, null, 2));

    // Get server count
    const countRes = await fetch(`${DOKPLOY_URL}/api/server.count`, { headers });
    const count = await countRes.json();
    console.log('\n🔢 Server Count:', JSON.stringify(count, null, 2));

    console.log('\n✅ Dokploy information fetched successfully!');
  } catch (error) {
    console.error('❌ Error fetching Dokploy info:', error.message);
  }
}

fetchDokployInfo();
