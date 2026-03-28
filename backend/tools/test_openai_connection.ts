/**
 * Tool: test_openai_connection.ts
 * Verifies OpenAI API key and lists available GPT models
 * Run: npm run tool:openai
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { OPENAI_API_KEY } = process.env;

async function testOpenAIConnection(): Promise<void> {
  console.log('\n🔗 Testing OpenAI Connection...');

  if (!OPENAI_API_KEY) {
    console.error('❌ Missing env var: OPENAI_API_KEY');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    // Fetch available models and filter to GPT variants
    const modelsPage = await openai.models.list();
    const gptModels = modelsPage.data
      .filter((m) => m.id.startsWith('gpt-'))
      .map((m) => m.id)
      .sort();

    // Minimal chat call to verify key works
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Reply with: OPENAI_OK' }],
      max_tokens: 10,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    console.log(`✅ OpenAI Connected`);
    console.log(`   Response : ${reply}`);
    console.log(`   GPT models available: ${gptModels.slice(0, 6).join(', ')}${gptModels.length > 6 ? '...' : ''}\n`);
  } catch (err) {
    console.error('❌ OpenAI error:', (err as Error).message);
    process.exit(1);
  }
}

testOpenAIConnection();
