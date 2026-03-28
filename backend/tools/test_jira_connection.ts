/**
 * Tool: test_jira_connection.ts
 * Verifies JIRA credentials by calling GET /rest/api/3/myself
 * Run: npm run tool:jira
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

async function testJiraConnection(): Promise<void> {
  console.log('\n🔗 Testing JIRA Connection...');

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('❌ Missing env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN');
    process.exit(1);
  }

  const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/myself`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`❌ JIRA returned ${res.status}: ${body}`);
      process.exit(1);
    }

    const user = await res.json() as { displayName: string; emailAddress: string };
    console.log(`✅ JIRA Connected`);
    console.log(`   User  : ${user.displayName}`);
    console.log(`   Email : ${user.emailAddress}`);
    console.log(`   Base  : ${JIRA_BASE_URL}\n`);
  } catch (err) {
    console.error('❌ Network error:', (err as Error).message);
    process.exit(1);
  }
}

testJiraConnection();
