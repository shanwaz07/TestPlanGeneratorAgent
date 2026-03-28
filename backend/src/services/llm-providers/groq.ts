import Groq from 'groq-sdk';
import { Response } from 'express';
import { loadSecrets } from '../../utils/encryption';
import { dbGet } from '../../db';

interface SettingRow { value: string }

export interface GroqConfig {
  model: string;
  temperature: number;
}

export function getGroqConfig(): GroqConfig {
  const modelRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['groq_model']);
  const tempRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['groq_temperature']);
  return {
    model: modelRow?.value ?? 'llama-3.3-70b-versatile',
    temperature: tempRow ? parseFloat(tempRow.value) : 0.3,
  };
}

export async function streamWithGroq(
  messages: { role: 'system' | 'user'; content: string }[],
  res: Response,
): Promise<string> {
  const secrets = loadSecrets();
  const apiKey = secrets['groq_api_key'];
  if (!apiKey) throw new Error('Groq API key not configured.');

  const config = getGroqConfig();
  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
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
