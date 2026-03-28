import { Router, Request, Response } from 'express';
import { fetchTicket } from '../services/jira-client';
import { dbAll, dbRun } from '../db';
import { isValidJiraId, sanitizeJiraId } from '../utils/validators';

const router = Router();

interface RecentTicketRow {
  ticket_id: string;
  summary: string;
  fetched_at: string;
}

// POST /api/jira/fetch
router.post('/fetch', async (req: Request, res: Response) => {
  const rawId = (req.body as { ticketId?: string }).ticketId ?? '';
  const ticketId = sanitizeJiraId(rawId);

  if (!isValidJiraId(ticketId)) {
    return res.status(400).json({ error: `Invalid JIRA ticket ID: "${rawId}". Expected format: PROJECT-123` });
  }

  try {
    const ticket = await fetchTicket(ticketId);

    // Upsert into recent_tickets (keep last 5)
    dbRun(
      'INSERT OR REPLACE INTO recent_tickets (ticket_id, summary, fetched_at) VALUES (?, ?, datetime("now"))',
      [ticket.ticketId, ticket.summary],
    );

    // Trim to 5
    const all = dbAll<RecentTicketRow>('SELECT ticket_id FROM recent_tickets ORDER BY fetched_at DESC');
    if (all.length > 5) {
      const toDelete = all.slice(5).map(r => r.ticket_id);
      for (const id of toDelete) {
        dbRun('DELETE FROM recent_tickets WHERE ticket_id = ?', [id]);
      }
    }

    return res.json({ ticket });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/jira/recent
router.get('/recent', (_req: Request, res: Response) => {
  const rows = dbAll<RecentTicketRow>(
    'SELECT ticket_id, summary, fetched_at FROM recent_tickets ORDER BY fetched_at DESC LIMIT 5',
  );
  return res.json({ tickets: rows });
});

export default router;
