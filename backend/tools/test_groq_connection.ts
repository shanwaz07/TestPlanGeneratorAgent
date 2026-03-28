/**
 * Tool: test_groq_connection.ts
 * Verifies Groq API key with a minimal chat completion call
 * Run: npm run tool:groq
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import Groq from 'groq-sdk';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { GROQ_API_KEY } = process.env;

const AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

const TEST_MODEL = 'llama-3.3-70b-versatile';

async function testGroqConnection(): Promise<void> {
  console.log('\n🔗 Testing Groq Connection...');

  if (!GROQ_API_KEY) {
    console.error('❌ Missing env var: GROQ_API_KEY');
    process.exit(1);
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: TEST_MODEL,
      messages: [{ role: 'user', content: 'Reply with: GROQ_OK' }],
      max_tokens: 10,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    console.log(`✅ Groq Connected`);
    console.log(`   Model   : ${TEST_MODEL}`);
    console.log(`   Response: ${reply}`);
    console.log(`   Available models: ${AVAILABLE_MODELS.join(', ')}\n`);
  } catch (err) {
    console.error('❌ Groq error:', (err as Error).message);
    process.exit(1);
  }
}

testGroqConnection();
