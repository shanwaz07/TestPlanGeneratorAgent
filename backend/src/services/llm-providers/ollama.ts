import { Response } from 'express';
import { dbGet } from '../../db';

interface SettingRow { value: string }

interface OllamaMessage { role: string; content: string }
interface OllamaChatChunk { message?: { content?: string }; done?: boolean }
interface OllamaTagsResponse { models: { name: string; size: number }[] }

function getOllamaBaseUrl(): string {
  const row = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['ollama_base_url']);
  return (row?.value ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');
}

export function getOllamaConfig(): { model: string; baseUrl: string } {
  const modelRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['ollama_model']);
  return {
    model: modelRow?.value ?? 'llama3.2:latest',
    baseUrl: getOllamaBaseUrl(),
  };
}

export async function streamWithOllama(
  messages: OllamaMessage[],
  res: Response,
): Promise<string> {
  const config = getOllamaConfig();
  const url = `${config.baseUrl}/api/chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, messages, stream: true }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}: ${await response.text()}`);
  }

  if (!response.body) throw new Error('Ollama returned no response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line) as OllamaChatChunk;
        const delta = chunk.message?.content ?? '';
        if (delta) {
          fullContent += delta;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
        }
      } catch {
        // skip malformed line
      }
    }
  }

  return fullContent;
}

export async function listOllamaModels(): Promise<string[]> {
  const baseUrl = getOllamaBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as OllamaTagsResponse;
    return (data.models ?? []).map(m => m.name);
  } catch {
    return [];
  }
}
