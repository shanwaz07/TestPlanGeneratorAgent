import OpenAI from 'openai';
import { Response } from 'express';
import { loadSecrets } from '../../utils/encryption';
import { dbGet } from '../../db';

interface SettingRow { value: string }

export interface OpenAIConfig {
  model: string;
  temperature: number;
}

export function getOpenAIConfig(): OpenAIConfig {
  const modelRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['openai_model']);
  const tempRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['openai_temperature']);
  return {
    model: modelRow?.value ?? 'gpt-4o',
    temperature: tempRow ? parseFloat(tempRow.value) : 0.3,
  };
}

export async function streamWithOpenAI(
  messages: { role: 'system' | 'user'; content: string }[],
  res: Response,
): Promise<string> {
  const secrets = loadSecrets();
  const apiKey = secrets['openai_api_key'];
  if (!apiKey) throw new Error('OpenAI API key not configured.');

  const config = getOpenAIConfig();
  const openai = new OpenAI({ apiKey });

  const stream = await openai.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    stream: true,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
    }
  }
  return fullContent;
}

export async function listOpenAIModels(): Promise<string[]> {
  const secrets = loadSecrets();
  const apiKey = secrets['openai_api_key'];
  if (!apiKey) return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  const openai = new OpenAI({ apiKey });
  const page = await openai.models.list();
  return page.data
    .filter(m => m.id.startsWith('gpt-'))
    .map(m => m.id)
    .sort();
}
