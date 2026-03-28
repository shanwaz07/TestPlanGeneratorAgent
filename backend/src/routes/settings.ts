import { Router, Request, Response } from 'express';
import { dbGet, dbRun } from '../db';
import { saveSecrets, loadSecrets } from '../utils/encryption';
import { isValidUrl, isValidProvider } from '../utils/validators';
import { testConnection } from '../services/jira-client';
import { listOllamaModels } from '../services/llm-providers/ollama';
import { listOpenAIModels } from '../services/llm-providers/openai';

const router = Router();

// ─── JIRA Settings ───────────────────────────────────────────────────────────

router.post('/jira', (req: Request, res: Response) => {
  const { baseUrl, email, apiToken } = req.body as Record<string, string>;

  if (!baseUrl || !email || !apiToken) {
    return res.status(400).json({ error: 'baseUrl, email, and apiToken are required.' });
  }
  if (!isValidUrl(baseUrl)) {
    return res.status(400).json({ error: 'Invalid JIRA base URL.' });
  }

  dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['jira_base_url', baseUrl]);
  dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['jira_email', email]);
  saveSecrets({ jira_api_token: apiToken });

  return res.json({ success: true });
});

router.get('/jira', async (_req: Request, res: Response) => {
  interface SettingRow { value: string }
  const baseUrlRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['jira_base_url']);
  const emailRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['jira_email']);
  const secrets = loadSecrets();

  const configured = !!(baseUrlRow && emailRow && secrets['jira_api_token']);

  if (!configured) {
    return res.json({ configured: false });
  }

  try {
    const user = await testConnection();
    return res.json({
      configured: true,
      connected: true,
      baseUrl: baseUrlRow?.value,
      email: emailRow?.value,
      user: user.displayName,
    });
  } catch (err) {
    return res.json({
      configured: true,
      connected: false,
      error: (err as Error).message,
    });
  }
});

// ─── LLM Settings ────────────────────────────────────────────────────────────

router.post('/llm', (req: Request, res: Response) => {
  const { provider, groq, openai, ollama } = req.body as {
    provider: string;
    groq?: { apiKey?: string; model?: string; temperature?: number };
    openai?: { apiKey?: string; model?: string; temperature?: number };
    ollama?: { baseUrl?: string; model?: string };
  };

  if (!isValidProvider(provider)) {
    return res.status(400).json({ error: 'provider must be groq, openai, or ollama.' });
  }

  dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['llm_provider', provider]);

  if (groq) {
    if (groq.apiKey) saveSecrets({ groq_api_key: groq.apiKey });
    if (groq.model) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['groq_model', groq.model]);
    if (groq.temperature != null) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['groq_temperature', String(groq.temperature)]);
  }

  if (openai) {
    if (openai.apiKey) saveSecrets({ openai_api_key: openai.apiKey });
    if (openai.model) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['openai_model', openai.model]);
    if (openai.temperature != null) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['openai_temperature', String(openai.temperature)]);
  }

  if (ollama) {
    if (ollama.baseUrl) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ollama_base_url', ollama.baseUrl]);
    if (ollama.model) dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['ollama_model', ollama.model]);
  }

  return res.json({ success: true });
});

router.get('/llm', (_req: Request, res: Response) => {
  interface SettingRow { value: string }
  const get = (key: string) => dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', [key])?.value;

  return res.json({
    provider: get('llm_provider') ?? 'groq',
    groq: { model: get('groq_model') ?? 'llama-3.3-70b-versatile', temperature: parseFloat(get('groq_temperature') ?? '0.3') },
    openai: { model: get('openai_model') ?? 'gpt-4o', temperature: parseFloat(get('openai_temperature') ?? '0.3') },
    ollama: { baseUrl: get('ollama_base_url') ?? 'http://localhost:11434', model: get('ollama_model') ?? '' },
  });
});

router.get('/llm/models', async (req: Request, res: Response) => {
  const provider = (req.query['provider'] as string) ?? 'ollama';

  if (provider === 'ollama') {
    const models = await listOllamaModels();
    return res.json({ provider, models });
  }

  if (provider === 'openai') {
    const models = await listOpenAIModels();
    return res.json({ provider, models });
  }

  // Groq: hardcoded current models
  return res.json({
    provider: 'groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
  });
});

export default router;
