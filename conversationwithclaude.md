# Conversation with Claude — Test Plan Generator Project

**Date:** 2026-03-28 / 2026-03-29
**Project:** Intelligent Test Plan Generator (Full-Stack Web App)
**Working Directory:** `C:\My Drive\AI\AI learning\AI_Tester\TestPlanGeneratorWithLLMFromJira`

---

## Session Summary

This document records the full build session between the user and Claude Code, following the **B.L.A.S.T. protocol** defined in `BLAST.md`.

---

## Protocol 0: Initialization

**User:** Provided `BLAST.md` (B.L.A.S.T. protocol) and `propmt.md` (full project specification).

**Specification (from propmt.md):**
- Full-stack web app to automate test plan creation from JIRA tickets using LLMs
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Node.js (Express) + TypeScript
- Storage: SQLite + encrypted secrets file
- LLM Providers: Groq, OpenAI, Ollama (added OpenAI per user request)
- JIRA Integration: REST API v3

**Files Created:**
| File | Purpose |
|------|---------|
| `claude.md` | Project Constitution — data schemas, invariants, DB schema, system prompt (renamed from gemini.md per user preference) |
| `task_plan.md` | Full phased B.L.A.S.T. checklist |
| `findings.md` | Tech decisions, API notes, constraints |
| `progress.md` | Execution log |

**User Preferences Captured:**
- Use `claude.md` instead of `gemini.md` for project constitution
- No VWO-specific references anywhere in the project
- Add OpenAI API support alongside Groq and Ollama

---

## Phase 1: L — Link (Connectivity)

**Files Created:**
- `.env.example` — template for all environment variables
- `backend/package.json` — Node.js backend dependencies
- `backend/tsconfig.json` — TypeScript configuration
- `backend/tools/test_jira_connection.ts` — JIRA auth test
- `backend/tools/test_groq_connection.ts` — Groq API test
- `backend/tools/test_openai_connection.ts` — OpenAI API test
- `backend/tools/test_ollama_connection.ts` — Ollama local test
- `package.json` (root) — proxy scripts so tools run from project root

**Key Decision — No Native Modules:**
- `better-sqlite3` → replaced with `sql.js` (WASM, no Visual Studio C++ needed)
- `keytar` → replaced with Node.js built-in `crypto` AES-256-GCM + `.secrets.json`

**Connection Results (all ✅):**
| Service | Result |
|---------|--------|
| JIRA | ✅ Shanwaz Halageri @ spectraforcejira.atlassian.net |
| Groq | ✅ `llama-3.3-70b-versatile` (fixed: `llama3-70b-8192` decommissioned) |
| OpenAI | ✅ GPT-3.5 + GPT-4 family available |
| Ollama | ✅ 5 models: llama3.2, codellama, llama3, deepseek-coder, mistral |

**Fix applied:** Root `package.json` added so all `npm run tool:*` commands work from project root (not just `backend/`).

---

## Phase 2: A — Architect (Backend)

**14 files built, 0 TypeScript errors, server boots clean at `http://localhost:5000`**

### Files Created

**Foundation:**
| File | Purpose |
|------|---------|
| `backend/src/db.ts` | sql.js WASM SQLite init, `dbGet`/`dbAll`/`dbRun` helpers, auto-persist to `data/app.db` |
| `backend/src/utils/encryption.ts` | AES-256-GCM encrypt/decrypt, `.secrets.json` storage |
| `backend/src/utils/validators.ts` | JIRA ID regex `/^[A-Z]+-\d+$/`, URL, provider validation |

**Services:**
| File | Purpose |
|------|---------|
| `backend/src/services/jira-client.ts` | JIRA REST API v3 — fetch ticket, test connection, ADF→plain text conversion |
| `backend/src/services/pdf-parser.ts` | pdf-parse wrapper + section heading extractor |
| `backend/src/services/llm-providers/groq.ts` | Groq SDK SSE streaming |
| `backend/src/services/llm-providers/openai.ts` | OpenAI SDK SSE streaming + dynamic model list |
| `backend/src/services/llm-providers/ollama.ts` | Ollama REST SSE streaming + model list |
| `backend/src/services/llm-providers/index.ts` | Provider factory + system prompt builder |

**Routes:**
| File | Endpoints |
|------|-----------|
| `backend/src/routes/settings.ts` | `POST/GET /api/settings/jira`, `POST/GET /api/settings/llm`, `GET /api/settings/llm/models` |
| `backend/src/routes/jira.ts` | `POST /api/jira/fetch`, `GET /api/jira/recent` |
| `backend/src/routes/templates.ts` | `POST /api/templates/upload`, `GET /api/templates`, `GET/DELETE /api/templates/:id`, `PATCH /api/templates/:id/default` |
| `backend/src/routes/testplan.ts` | `POST /api/testplan/generate` (SSE), `GET /api/testplan/history`, `GET/DELETE /api/testplan/:id` |

**Entry:**
- `backend/src/index.ts` — Express server, CORS (localhost only), routes, error handler

**System Prompt Template (from claude.md):**
```
You are a senior QA Engineer. Generate a comprehensive, professional test plan in Markdown.
JIRA Ticket: {ticketId, summary, description, priority, acceptanceCriteria, labels}
Template Structure: {templateSections}
Instructions: Follow template structure, write specific test cases, cover positive/negative/edge cases.
```

---

## Phase 3: A — Architect (Frontend)

**Design Language Applied: Leoforce Design Language 2.0**

Source: `C:\My Drive\AI\MDFiles\Design_Language\Leoforce_Design_Language_Reference.md`

### Design Tokens Applied

| Token | HEX | Used For |
|-------|-----|---------|
| Cosmic Indigo | `#2D2E67` | Sidebar, page headings, card borders |
| Stellar Blue | `#3E83FA` | Buttons, active nav, section underlines, callouts |
| Nebula Green | `#48E29A` | Success states, completed steps, footer tagline |
| Dark Matter | `#373A40` | All body text |
| Lunar Mist | `#F6F9FD` | Page background, card surfaces |
| Cosmic Indigo Light | `#EAEBF6` | Table headers, subtle tint panels |
| Stellar Blue Light | `#EBF2FE` | Info callout backgrounds |

**Typography:** Tenorite → Aptos → Calibri → Segoe UI (all available on Windows 11)

**Logo Assets Copied:**
- `frontend/public/logo-white.png` (Leoforce horizontal white)
- `frontend/public/logo-mark.png` (Leoforce pictorial mark stellar blue)

### Frontend Files Created

**Config:**
- `frontend/package.json`, `tsconfig.json`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `index.html`

**Source:**
| File | Purpose |
|------|---------|
| `src/index.css` | Leoforce CSS design tokens + Tailwind layers + markdown styles |
| `src/main.tsx` | React entry point |
| `src/App.tsx` | BrowserRouter + routes + ToastProvider |
| `src/services/api.ts` | Typed API client for all backend endpoints |

**UI Components:**
| Component | Description |
|-----------|-------------|
| `Button.tsx` | Primary / Secondary / Ghost / Danger variants, loading state |
| `Card.tsx` | White card with Stellar Blue header underline |
| `Badge.tsx` | Priority-colored badges (danger/warning/info/success/purple) |
| `Input.tsx` | Labeled input with Cosmic Indigo label, error/hint support |
| `Select.tsx` | Custom styled dropdown with chevron |
| `Spinner.tsx` | SVG animated spinner |
| `Toast.tsx` | Toast notification system (success/error/info) with slide-in animation |

**Layout:**
| Component | Description |
|-----------|-------------|
| `Sidebar.tsx` | Cosmic Indigo sidebar, white Leoforce logo, Stellar Blue active nav, Nebula Green tagline |
| `Layout.tsx` | Shell with sidebar + `<Outlet />` |

**Forms:**
| Component | Description |
|-----------|-------------|
| `JiraConfigForm.tsx` | JIRA base URL + email + API token, test connection button |
| `LLMConfigForm.tsx` | 3-provider config (Groq/OpenAI/Ollama), temperature slider, dynamic model lists |
| `TemplateUpload.tsx` | PDF drag-and-drop upload, template list with set-default + delete |

**Display:**
- `TicketCard.tsx` — Full JIRA ticket display with priority badge, status, description, acceptance criteria, labels, attachments

**Pages:**
| Page | Description |
|------|-------------|
| `Dashboard.tsx` | 4-step workflow: fetch ticket → review → generate (SSE streaming) → export |
| `Settings.tsx` | Tabbed settings panel (JIRA / LLM / Templates) |
| `History.tsx` | Split-pane history list + markdown viewer + download/delete |

**Keyboard Shortcuts:**
- `Ctrl+Enter` — Generate test plan
- `Ctrl+Shift+S` — Save confirmation

**TypeScript:** 0 errors
**Dependencies:** 235 packages, 0 critical vulnerabilities

---

## Phase 4 & 5: Pending

- [ ] Stylize polish pass
- [ ] Docker Compose
- [ ] README.md
- [ ] Final end-to-end test

---

## Server Launch

```bash
# From project root — starts both servers
npm run dev

# Individually
npm run backend:dev    # http://localhost:5000
npm run frontend:dev   # http://localhost:3000

# Connection tests
npm run tool:jira
npm run tool:groq
npm run tool:openai
npm run tool:ollama
```

---

## Key Technical Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend framework | Node.js + Express + TypeScript | Full-stack TS consistency |
| SQLite client | `sql.js` (WASM) | `better-sqlite3` requires VS C++ build tools on Windows — not available |
| Secret storage | Node.js `crypto` AES-256-GCM | `keytar` requires VS C++ on Windows |
| LLM streaming | SSE via `fetch` ReadableStream | Simpler than WebSockets for one-way stream |
| Groq default model | `llama-3.3-70b-versatile` | `llama3-70b-8192` was decommissioned |
| PDF parsing | `pdf-parse` npm | Pure JS, no native compilation |
| Design system | Leoforce Design Language 2.0 | User provided brand guidelines |
| Project constitution | `claude.md` | User preference (renamed from `gemini.md`) |

---

## Files Structure (Final)

```
TestPlanGeneratorWithLLMFromJira/
├── claude.md                    ← Project Constitution (LAW)
├── task_plan.md                 ← B.L.A.S.T. checklist
├── findings.md                  ← Research & decisions
├── progress.md                  ← Execution log
├── conversationwithclaude.md    ← This file
├── BLAST.md                     ← Protocol reference
├── propmt.md                    ← Original specification
├── .env                         ← Credentials (not committed)
├── .env.example                 ← Template
├── .secrets.json                ← AES-encrypted API keys (auto-generated)
├── package.json                 ← Root scripts (proxy to backend/frontend)
├── data/
│   └── app.db                   ← SQLite database (auto-created)
├── templates/                   ← Uploaded PDF templates
├── .tmp/                        ← Ephemeral processing files
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tools/                   ← Connection test scripts
│   └── src/
│       ├── index.ts
│       ├── db.ts
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── public/
    │   ├── logo-white.png
    │   └── logo-mark.png
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── components/
        ├── pages/
        └── services/
```

---

*Generated by Claude Code (claude-sonnet-4-6) — Anthropic*
