import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { fetchTicket } from '../services/jira-client';
import { streamGenerate, Provider } from '../services/llm-providers';
import { dbAll, dbGet, dbRun } from '../db';
import { isValidJiraId, sanitizeJiraId, isValidProvider } from '../utils/validators';

const router = Router();

interface TemplateRow { extracted_text: string; sections: string }
interface PlanRow {
  id: string;
  ticket_id: string;
  ticket_summary: string;
  template_id: string;
  provider: string;
  model: string;
  content: string;
  generated_at: string;
}
interface SettingRow { value: string }

// POST /api/testplan/generate  — streams SSE
router.post('/generate', async (req: Request, res: Response) => {
  const { ticketId: rawId, templateId, provider: rawProvider } = req.body as {
    ticketId: string;
    templateId?: string;
    provider: string;
  };

  const ticketId = sanitizeJiraId(rawId ?? '');

  if (!isValidJiraId(ticketId)) {
    return res.status(400).json({ error: `Invalid ticket ID: "${rawId}"` });
  }
  if (!isValidProvider(rawProvider)) {
    return res.status(400).json({ error: 'provider must be groq, openai, or ollama.' });
  }

  // Set SSE headers before any async work
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent({ type: 'status', message: 'Fetching ticket...' });
    const ticket = await fetchTicket(ticketId);

    sendEvent({ type: 'ticket', ticket });
    sendEvent({ type: 'status', message: 'Preparing template...' });

    // Load template sections
    let templateSections = '';
    let resolvedTemplateId: string | null = templateId ?? null;

    if (templateId) {
      const row = dbGet<TemplateRow>('SELECT extracted_text, sections FROM templates WHERE id = ?', [templateId]);
      if (row) {
        const sections = JSON.parse(row.sections || '[]') as string[];
        templateSections = sections.length > 0 ? sections.join('\n') : row.extracted_text;
      }
    } else {
      // Use default template
      const row = dbGet<TemplateRow>('SELECT id, extracted_text, sections FROM templates WHERE is_default = 1');
      if (row) {
        const sections = JSON.parse((row as unknown as TemplateRow & { id: string }).sections || '[]') as string[];
        templateSections = sections.length > 0 ? sections.join('\n') : row.extracted_text;
        resolvedTemplateId = (row as unknown as { id: string }).id;
      }
    }

    sendEvent({ type: 'status', message: `Generating with ${rawProvider}...` });

    const fullContent = await streamGenerate(rawProvider as Provider, ticket, templateSections, res);

    // Determine model used
    const modelKey = `${rawProvider}_model`;
    const modelRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', [modelKey]);
    const defaultModels: Record<string, string> = {
      groq: 'llama-3.3-70b-versatile',
      openai: 'gpt-4o',
      ollama: 'llama3.2:latest',
    };
    const model = modelRow?.value ?? defaultModels[rawProvider] ?? rawProvider;

    // Save to history
    const planId = uuidv4();
    dbRun(
      'INSERT INTO test_plans (id, ticket_id, ticket_summary, template_id, provider, model, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [planId, ticketId, ticket.summary, resolvedTemplateId, rawProvider, model, fullContent],
    );

    sendEvent({ type: 'done', planId, ticketId, provider: rawProvider, model });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    sendEvent({ type: 'error', message: (err as Error).message });
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// GET /api/testplan/history
router.get('/history', (_req: Request, res: Response) => {
  const rows = dbAll<PlanRow>(
    'SELECT id, ticket_id, ticket_summary, template_id, provider, model, generated_at FROM test_plans ORDER BY generated_at DESC LIMIT 50',
  );
  return res.json({ plans: rows });
});

// GET /api/testplan/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = dbGet<PlanRow>('SELECT * FROM test_plans WHERE id = ?', [req.params['id']!]);
  if (!row) return res.status(404).json({ error: 'Test plan not found.' });
  return res.json({ plan: row });
});

// DELETE /api/testplan/:id
router.delete('/:id', (req: Request, res: Response) => {
  const row = dbGet<PlanRow>('SELECT id FROM test_plans WHERE id = ?', [req.params['id']!]);
  if (!row) return res.status(404).json({ error: 'Test plan not found.' });
  dbRun('DELETE FROM test_plans WHERE id = ?', [req.params['id']!]);
  return res.json({ success: true });
});

export default router;
