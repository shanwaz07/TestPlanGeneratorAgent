/**
 * Tool: test_ollama_connection.ts
 * Verifies Ollama is running and lists installed models
 * Run: npm run tool:ollama
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

async function testOllamaConnection(): Promise<void> {
  console.log('\n🔗 Testing Ollama Connection...');
  console.log(`   URL: ${OLLAMA_BASE_URL}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`❌ Ollama returned ${res.status}`);
      process.exit(1);
    }

    const data = await res.json() as OllamaTagsResponse;
    const models = data.models || [];

    console.log(`✅ Ollama Connected`);

    if (models.length === 0) {
      console.log('   ⚠️  No models installed. Pull one with: ollama pull llama3');
    } else {
      console.log(`   Installed models (${models.length}):`);
      models.forEach((m) => {
        const sizeMB = (m.size / 1024 / 1024 / 1024).toFixed(1);
        console.log(`     - ${m.name} (${sizeMB} GB)`);
      });
    }
    console.log();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error('❌ Ollama timed out — is it running? Start with: ollama serve');
    } else {
      console.error('❌ Ollama error:', (err as Error).message);
      console.error('   Make sure Ollama is installed and running: ollama serve');
    }
    process.exit(1);
  }
}

testOllamaConnection();
