const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export const api = {
  settings: {
    saveJira: (body: { baseUrl: string; email: string; apiToken: string }) =>
      request('/settings/jira', { method: 'POST', body: JSON.stringify(body) }),

    getJira: () =>
      request<{ configured: boolean; connected?: boolean; baseUrl?: string; email?: string; user?: string; error?: string }>('/settings/jira'),

    saveLLM: (body: object) =>
      request('/settings/llm', { method: 'POST', body: JSON.stringify(body) }),

    getLLM: () =>
      request<{ provider: string; groq: { model: string; temperature: number }; openai: { model: string; temperature: number }; ollama: { baseUrl: string; model: string } }>('/settings/llm'),

    getModels: (provider: string) =>
      request<{ provider: string; models: string[] }>(`/settings/llm/models?provider=${provider}`),
  },

  jira: {
    fetch: (ticketId: string) =>
      request<{ ticket: JiraTicket }>('/jira/fetch', { method: 'POST', body: JSON.stringify({ ticketId }) }),

    recent: () =>
      request<{ tickets: { ticket_id: string; summary: string; fetched_at: string }[] }>('/jira/recent'),
  },

  templates: {
    list: () =>
      request<{ templates: Template[] }>('/templates'),

    upload: (file: File, name: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('name', name);
      return fetch(`${BASE}/templates/upload`, { method: 'POST', body: form })
        .then(r => r.json()) as Promise<Template & { error?: string }>;
    },

    delete: (id: string) =>
      request(`/templates/${id}`, { method: 'DELETE' }),

    setDefault: (id: string) =>
      request(`/templates/${id}/default`, { method: 'PATCH' }),
  },

  testplan: {
    history: () =>
      request<{ plans: TestPlan[] }>('/testplan/history'),

    get: (id: string) =>
      request<{ plan: TestPlan }>(`/testplan/${id}`),

    delete: (id: string) =>
      request(`/testplan/${id}`, { method: 'DELETE' }),

    /** Returns a fetch Response for SSE stream consumption */
    generate: (body: { ticketId: string; templateId?: string; provider: string }) =>
      fetch(`${BASE}/testplan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface JiraTicket {
  ticketId: string;
  key: string;
  summary: string;
  description: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | string;
  status: string;
  assignee: string | null;
  labels: string[];
  acceptanceCriteria: string | null;
  attachments: { filename: string; url: string }[];
}

export interface Template {
  id: string;
  name: string;
  filename: string;
  sections: string[];
  uploadedAt: string;
  isDefault: boolean;
}

export interface TestPlan {
  id: string;
  ticket_id: string;
  ticket_summary: string;
  template_id: string | null;
  provider: string;
  model: string;
  content: string;
  generated_at: string;
}
