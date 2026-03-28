import { loadSecrets } from '../utils/encryption';
import { dbGet } from '../db';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraTicket {
  ticketId: string;
  key: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee: string | null;
  labels: string[];
  acceptanceCriteria: string | null;
  attachments: { filename: string; url: string }[];
}

interface SettingRow { value: string }

function getJiraConfig(): JiraConfig {
  const secrets = loadSecrets();
  const baseUrlRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['jira_base_url']);
  const emailRow = dbGet<SettingRow>('SELECT value FROM settings WHERE key = ?', ['jira_email']);

  const baseUrl = baseUrlRow?.value;
  const email = emailRow?.value;
  const apiToken = secrets['jira_api_token'];

  if (!baseUrl || !email || !apiToken) {
    throw new Error('JIRA is not configured. Please set credentials in Settings.');
  }

  return { baseUrl: baseUrl.replace(/\/$/, ''), email, apiToken };
}

function authHeader(email: string, token: string): string {
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}

function extractAcceptanceCriteria(fields: Record<string, unknown>): string | null {
  // Common JIRA custom field for acceptance criteria
  const ac = fields['customfield_10016'] as string | null;
  if (ac) return ac;

  // Try to parse from description
  const desc = fields['description'] as { content?: unknown[] } | string | null;
  if (typeof desc === 'string' && desc.toLowerCase().includes('acceptance criteria')) {
    const match = desc.match(/acceptance criteria[:\s]*([\s\S]+?)(?:\n\n|\n#|$)/i);
    return match ? match[1].trim() : null;
  }
  return null;
}

function descriptionToText(description: unknown): string {
  if (!description) return '';
  if (typeof description === 'string') return description;

  // ADF (Atlassian Document Format) → plain text
  const adf = description as { content?: { content?: { text?: string }[] }[] };
  const lines: string[] = [];

  function traverse(node: { type?: string; text?: string; content?: unknown[] }): void {
    if (node.text) lines.push(node.text);
    if (node.content) node.content.forEach(c => traverse(c as typeof node));
  }

  if (adf.content) adf.content.forEach(c => traverse(c as Parameters<typeof traverse>[0]));
  return lines.join(' ');
}

export async function fetchTicket(ticketId: string): Promise<JiraTicket> {
  const config = getJiraConfig();
  const url = `${config.baseUrl}/rest/api/3/issue/${ticketId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(config.email, config.apiToken),
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 404) throw new Error(`Ticket ${ticketId} not found.`);
    if (res.status === 401) throw new Error('JIRA authentication failed. Check your credentials.');
    throw new Error(`JIRA error ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    key: string;
    fields: Record<string, unknown>;
  };

  const fields = data.fields;
  const priority = (fields['priority'] as { name?: string } | null)?.name ?? 'Medium';
  const status = (fields['status'] as { name?: string } | null)?.name ?? 'Unknown';
  const assignee = (fields['assignee'] as { displayName?: string } | null)?.displayName ?? null;
  const labels = (fields['labels'] as string[]) ?? [];
  const attachments = ((fields['attachment'] as { filename: string; content: string }[]) ?? [])
    .map(a => ({ filename: a.filename, url: a.content }));

  return {
    ticketId,
    key: data.key,
    summary: (fields['summary'] as string) ?? '',
    description: descriptionToText(fields['description']),
    priority,
    status,
    assignee,
    labels,
    acceptanceCriteria: extractAcceptanceCriteria(fields),
    attachments,
  };
}

export async function testConnection(): Promise<{ displayName: string; email: string }> {
  const config = getJiraConfig();
  const url = `${config.baseUrl}/rest/api/3/myself`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(config.email, config.apiToken),
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`JIRA auth failed (${res.status})`);

  const user = await res.json() as { displayName: string; emailAddress: string };
  return { displayName: user.displayName, email: user.emailAddress };
}
