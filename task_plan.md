# task_plan.md — Project Blueprint

> Phases, goals, and checklists for the Intelligent Test Plan Generator.

---

## ✅ Protocol 0: Initialization
- [x] Read BLAST.md protocol
- [x] Read propmt.md specification
- [x] Create `claude.md` (Project Constitution)
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [ ] User approves Blueprint before coding begins

---

## Phase 1: L — Link (Verify Connectivity)
> Goal: Confirm all external APIs respond before building core logic.

- [ ] Create `.env.example`
- [ ] `tools/test_jira_connection.ts` — validate JIRA credentials + fetch user info
- [ ] `tools/test_groq_connection.ts` — validate Groq API key + list models
- [ ] `tools/test_openai_connection.ts` — validate OpenAI API key + list models
- [ ] `tools/test_ollama_connection.ts` — ping Ollama `/api/tags`
- [ ] All 3 connections verified ✅

---

## Phase 2: A — Architect (Backend)
> Goal: Build deterministic backend API layer.

### 2a. Project Scaffold
- [ ] Initialize monorepo structure (`/frontend`, `/backend`, `/templates`, `/.tmp`)
- [ ] Backend: `npm init` + TypeScript + Express + dependencies
- [ ] Frontend: `npm create vite@latest` + React + TypeScript + Tailwind + shadcn/ui
- [ ] SQLite DB init script (`data/app.db` with schema from `gemini.md`)

### 2b. Backend Routes & Services
- [ ] `routes/settings.ts` — JIRA + LLM config endpoints
- [ ] `routes/jira.ts` — fetch ticket, recent history
- [ ] `routes/templates.ts` — upload PDF, list templates
- [ ] `routes/testplan.ts` — generate + stream + history
- [ ] `services/jira-client.ts` — JIRA REST API v3 wrapper
- [ ] `services/llm-providers/groq.ts` — Groq SDK integration
- [ ] `services/llm-providers/openai.ts` — OpenAI SDK integration
- [ ] `services/llm-providers/ollama.ts` — Ollama REST API integration
- [ ] `services/pdf-parser.ts` — PDF text extraction + section parsing
- [ ] `utils/encryption.ts` — keytar / AES encryption for API keys
- [ ] `utils/validators.ts` — JIRA ID regex, URL validation

### 2c. API Endpoints (per gemini.md)
- [ ] `POST /api/settings/jira`
- [ ] `GET  /api/settings/jira`
- [ ] `POST /api/settings/llm`
- [ ] `GET  /api/settings/llm/models` (Ollama + OpenAI dynamic, Groq hardcoded)
- [ ] `POST /api/jira/fetch`
- [ ] `GET  /api/jira/recent`
- [ ] `POST /api/testplan/generate`
- [ ] `GET  /api/testplan/stream` (SSE)
- [ ] `POST /api/templates/upload`
- [ ] `GET  /api/templates`

---

## Phase 3: A — Architect (Frontend)
> Goal: Build React UI matching spec.

### 3a. Layout & Navigation
- [ ] Sidebar: Settings | Generate | History
- [ ] Main content area shell
- [ ] Toast notification system
- [ ] Loading skeleton components

### 3b. Pages
- [ ] `pages/Settings.tsx` — JIRA config, LLM config, Template management
- [ ] `pages/Dashboard.tsx` — Main generate workflow (4 steps)
- [ ] `pages/History.tsx` — Saved test plans list + view

### 3c. Components
- [ ] `forms/JiraConfigForm.tsx`
- [ ] `forms/LLMConfigForm.tsx`
- [ ] `forms/TemplateUpload.tsx`
- [ ] `jira-display/TicketCard.tsx`
- [ ] `ui/ProgressStepper.tsx`
- [ ] `ui/MarkdownEditor.tsx`
- [ ] `ui/ExportButtons.tsx`

### 3d. Hooks & Services
- [ ] `hooks/useJira.ts`
- [ ] `hooks/useLLM.ts`
- [ ] `hooks/useTemplates.ts`
- [ ] `services/api.ts` — typed API client

---

## Phase 4: S — Stylize
- [ ] Apply blue/gray professional QA theme
- [ ] Keyboard shortcuts: Ctrl+Enter to generate, Ctrl+Shift+S to save
- [ ] Responsive layout (desktop-first, min 1024px)
- [ ] Toast notifications for all success/error states
- [ ] Side-by-side template vs generated content view

---

## Phase 5: T — Trigger (Deployment)
- [ ] `docker-compose.yml` for one-command startup
- [ ] `README.md` with full setup guide
- [ ] Production build test (`npm run build`)
- [ ] Final end-to-end test: JIRA fetch → generate → export

---

## 🎯 Success Criteria (from spec)
- [ ] Fetch a JIRA ticket successfully (e.g. PROJECT-1)
- [ ] Upload testplan.pdf and extract structure
- [ ] Generate test plan via Groq (cloud)
- [ ] Generate test plan via OpenAI (cloud)
- [ ] Generate test plan via Ollama (local)
- [ ] Generated content follows template structure + JIRA specifics
- [ ] API keys persist securely between sessions
