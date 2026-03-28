# findings.md — Research & Discoveries

> Updated whenever new constraints, API behaviors, or architectural decisions are discovered.

---

## 📋 Tech Stack Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend language | Node.js + TypeScript | Full-stack TS consistency with frontend |
| Backend framework | Express.js | Lightweight, well-supported, easy SSE |
| PDF parsing | `pdf-parse` npm package | Simple text extraction, no native deps |
| Secure key storage | Node.js `crypto` AES-256-GCM | keytar requires VS C++ build tools on Windows — using encrypted `.secrets.json` instead |
| SQLite client | `sql.js` (WASM) | better-sqlite3 requires VS C++ on Windows — sql.js is pure WASM, zero native build |
| Streaming | SSE (Server-Sent Events) | Simpler than WebSockets for one-way LLM stream |

---

## 🔗 API Notes

### JIRA REST API v3
- Base: `{baseUrl}/rest/api/3/`
- Auth: Basic Auth (`email:apiToken` base64)
- Fetch ticket: `GET /issue/{ticketId}`
- Acceptance criteria often in `customfield_10016` or parsed from description
- Test connection: `GET /myself`

### Groq API
- SDK: `groq-sdk` npm package
- Streaming supported via `stream: true` option
- Model list: hardcoded (Groq doesn't have a list endpoint in v1)
- Default models: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `gemma2-9b-it`
- Note: `llama3-70b-8192` and `mixtral-8x7b-32768` are **decommissioned** — do not use

### OpenAI API
- SDK: `openai` npm package
- Streaming supported via `stream: true` option
- Default models: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- Model list: hardcoded (or fetch from `GET /v1/models` and filter by `gpt-*`)
- Timeout: 60s

### Ollama REST API
- List models: `GET {baseUrl}/api/tags`
- Generate (chat): `POST {baseUrl}/api/chat` with `stream: true`
- Health check: `GET {baseUrl}/api/tags` (returns 200 if running)

---

## ⚠️ Known Constraints

- JIRA API tokens have no programmatic rotation — user must manage manually
- Ollama must be installed and running locally before use
- PDF text extraction quality depends on PDF type (scanned PDFs need OCR — out of scope)
- keytar requires OS-level keychain access; may need fallback to AES-encrypted file on some systems
- Groq free tier has rate limits (~30 req/min on free plan)
- OpenAI API requires paid account for GPT-4o; GPT-3.5-turbo available on free tier

---

## 📁 Directory Layout (Final)

```
/intelligent-test-plan-agent    ← project root
├── claude.md
├── task_plan.md
├── findings.md
├── progress.md
├── .env.example
├── docker-compose.yml
├── /frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── components/
│       │   ├── ui/
│       │   ├── forms/
│       │   └── jira-display/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── /backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── db.ts
│       ├── routes/
│       ├── services/
│       └── utils/
├── /templates        ← PDF storage
├── /data             ← SQLite DB
└── /.tmp             ← ephemeral processing
```
