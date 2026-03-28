# claude.md — Project Constitution

> This file is LAW. Update only when schema changes, rules are added, or architecture is modified.

---

## 🏛️ Project Identity

**Name:** Intelligent Test Plan Generator
**Goal:** Full-stack web app that fetches JIRA tickets and generates structured test plans via LLM (Groq or Ollama), guided by uploadable PDF templates.
**URL:** `http://localhost:3000` (frontend) | `http://localhost:5000` (backend API)

---

## 🗂️ Data Schemas

### 1. JIRA Ticket (Input)
```json
{
  "ticketId": "string (e.g. PROJECT-123)",
  "key": "string",
  "summary": "string",
  "description": "string (markdown)",
  "priority": "Highest | High | Medium | Low | Lowest",
  "status": "string",
  "assignee": "string | null",
  "labels": ["string"],
  "acceptanceCriteria": "string | null",
  "attachments": [{ "filename": "string", "url": "string" }]
}
```

### 2. Template (Stored)
```json
{
  "id": "string (uuid)",
  "name": "string",
  "filename": "string",
  "extractedText": "string",
  "sections": ["string"],
  "uploadedAt": "ISO8601 timestamp",
  "isDefault": "boolean"
}
```

### 3. LLM Config (Stored — never in frontend)
```json
{
  "provider": "groq | ollama | openai",
  "groq": {
    "apiKey": "encrypted string",
    "model": "string (e.g. llama-3.3-70b-versatile)",
    "temperature": "number (0-1)"
  },
  "openai": {
    "apiKey": "encrypted string",
    "model": "string (e.g. gpt-4o)",
    "temperature": "number (0-1)"
  },
  "ollama": {
    "baseUrl": "string (default: http://localhost:11434)",
    "model": "string"
  }
}
```

### 4. JIRA Config (Stored — never in frontend)
```json
{
  "baseUrl": "string (e.g. https://company.atlassian.net)",
  "email": "string",
  "apiToken": "encrypted string"
}
```

### 5. Test Plan (Output)
```json
{
  "id": "string (uuid)",
  "ticketId": "string",
  "ticketSummary": "string",
  "templateId": "string | null",
  "provider": "groq | ollama",
  "model": "string",
  "content": "string (markdown)",
  "generatedAt": "ISO8601 timestamp"
}
```

### 6. Generation Request (API Payload)
```json
{
  "ticketId": "string",
  "templateId": "string | null",
  "provider": "groq | ollama | openai"
}
```

---

## 🏗️ Architectural Invariants

1. **API keys NEVER touch the frontend** — stored AES-256-GCM encrypted in `.secrets.json` via Node.js `crypto`
2. **Backend is the single source of truth** for all credentials and settings
3. **LLM calls are backend-only** — frontend receives SSE stream or final JSON
4. **SQLite via `sql.js`** (WASM) is the only persistence layer for settings, history, templates metadata — saved to `data/app.db`
5. **`.tmp/`** is used for all intermediate file processing (PDF text extraction, etc.)
6. **CORS** is locked to `localhost` only
7. Backend: **Node.js + Express + TypeScript** (chosen for full-stack TS consistency)
8. Frontend port: **3000**, Backend port: **5000**

---

## 📐 System Prompt Template (LLM)

```
You are a senior QA Engineer. Your task is to generate a comprehensive, professional test plan.

JIRA Ticket:
- ID: {ticketId}
- Summary: {summary}
- Description: {description}
- Priority: {priority}
- Acceptance Criteria: {acceptanceCriteria}

Template Structure to follow:
{templateSections}

Instructions:
- Map all ticket details to the appropriate template sections.
- Generate specific, actionable test scenarios from the acceptance criteria.
- Include positive, negative, and edge case scenarios.
- Maintain the template's formatting and section structure exactly.
- Output in clean Markdown.
```

---

## 🔒 Behavioral Rules

- JIRA IDs must match regex: `/^[A-Z]+-\d+$/`
- PDF uploads: max 5MB, extract text only (no execution)
- LLM timeouts: Groq = 30s, OpenAI = 60s, Ollama = 120s
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Recent tickets history: last 5 only
- If no template uploaded, use built-in default template

---

## 🗄️ Database Schema (SQLite — `data/app.db`)

```sql
-- Settings (key-value store for non-secret config)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  extracted_text TEXT,
  sections TEXT,  -- JSON array as string
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_default INTEGER DEFAULT 0
);

-- Test Plan History
CREATE TABLE test_plans (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  ticket_summary TEXT,
  template_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📦 Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | Initial constitution created | Project init |
| 2026-03-28 | Renamed from gemini.md to claude.md; removed VWO references | User preference |
| 2026-03-28 | Added OpenAI as third LLM provider (gpt-4o, gpt-4-turbo, gpt-3.5-turbo) | User request |
