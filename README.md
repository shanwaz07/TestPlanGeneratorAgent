# Intelligent Test Plan Generator

A full-stack web application that automates QA test plan creation by fetching JIRA tickets and generating comprehensive test plans using AI — powered by Groq, OpenAI, or Ollama.

Built with the **Leoforce Design Language 2.0**.

---

## Features

- **JIRA Integration** — Fetch any ticket by ID, auto-parse description, acceptance criteria, priority, labels
- **Multi-LLM Support** — Switch between Groq (cloud), OpenAI (cloud), or Ollama (local) with one click
- **PDF Template Upload** — Upload your own test plan template; the AI follows its structure exactly
- **Real-time Streaming** — Watch the test plan generate live via SSE streaming
- **History** — All generated plans are saved, viewable, and exportable
- **Export** — Download as Markdown or copy to clipboard
- **Secure** — API keys stored AES-256-GCM encrypted locally, never sent to the frontend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via `sql.js` (WASM — no native build needed) |
| Secret Storage | Node.js `crypto` AES-256-GCM → `.secrets.json` |
| LLM — Cloud | Groq SDK (`llama-3.3-70b-versatile`) |
| LLM — Cloud | OpenAI SDK (`gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`) |
| LLM — Local | Ollama REST API (any installed model) |
| JIRA | REST API v3 |
| PDF Parsing | `pdf-parse` |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A JIRA account with an [API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- At least one LLM provider:
  - **Groq** — free API key at [console.groq.com](https://console.groq.com)
  - **OpenAI** — API key at [platform.openai.com](https://platform.openai.com)
  - **Ollama** — install from [ollama.com](https://ollama.com), then run `ollama pull llama3.2`

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/shanwaz07/TestPlanGeneratorAgent.git
cd TestPlanGeneratorAgent
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your_jira_api_token

GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
OLLAMA_BASE_URL=http://localhost:11434

PORT=5000
ENCRYPTION_SECRET=change_this_to_a_random_32char_string
```

### 3. Launch

**Windows — double-click:**
```
launch.bat
```

**Or manually:**
```bash
# Install dependencies (first time only)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start both servers
npm run dev
```

- Frontend → [http://localhost:3000](http://localhost:3000)
- Backend API → [http://localhost:5000](http://localhost:5000)

---

## Verify Connections

```bash
npm run tool:jira      # Test JIRA credentials
npm run tool:groq      # Test Groq API key
npm run tool:openai    # Test OpenAI API key
npm run tool:ollama    # Test Ollama local server
npm run tool:all       # Run all tests at once
```

---

## Usage

### 1. Configure Settings
Navigate to **Settings** and fill in:
- **JIRA** tab — base URL, email, API token → click *Save & Test Connection*
- **LLM** tab — select provider, enter API key, choose model
- **Templates** tab — optionally upload a PDF test plan template

### 2. Generate a Test Plan
1. Go to **Generate**
2. Enter a JIRA ticket ID (e.g. `PROJECT-123`) and click **Fetch Ticket**
3. Review the ticket details
4. Select LLM provider and template, then click **Generate** (or `Ctrl+Enter`)
5. Watch the plan stream in real time

### 3. Export
- **Copy** — copies raw Markdown to clipboard
- **Download** — saves as `.md` file
- All plans are auto-saved to **History**

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express server entry
│   │   ├── db.ts                     # SQLite (sql.js) helpers
│   │   ├── routes/                   # API route handlers
│   │   ├── services/
│   │   │   ├── jira-client.ts        # JIRA REST API wrapper
│   │   │   ├── pdf-parser.ts         # PDF text extraction
│   │   │   └── llm-providers/        # Groq / OpenAI / Ollama
│   │   └── utils/
│   │       ├── encryption.ts         # AES-256-GCM secrets
│   │       └── validators.ts         # Input validation
│   └── tools/                        # Connection test scripts
├── frontend/
│   └── src/
│       ├── components/               # UI, forms, layout
│       ├── pages/                    # Dashboard, Settings, History
│       └── services/api.ts           # Typed API client
├── templates/                        # Uploaded PDF templates
├── data/                             # SQLite database (auto-created)
├── .env.example                      # Environment variable template
└── launch.bat                        # One-click Windows launcher
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/settings/jira` | Save JIRA credentials |
| `GET` | `/api/settings/jira` | Get JIRA connection status |
| `POST` | `/api/settings/llm` | Save LLM configuration |
| `GET` | `/api/settings/llm/models` | List available models |
| `POST` | `/api/jira/fetch` | Fetch JIRA ticket by ID |
| `GET` | `/api/jira/recent` | Get last 5 fetched tickets |
| `POST` | `/api/templates/upload` | Upload PDF template |
| `GET` | `/api/templates` | List uploaded templates |
| `POST` | `/api/testplan/generate` | Generate test plan (SSE stream) |
| `GET` | `/api/testplan/history` | Get generation history |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Generate test plan |
| `Ctrl + Shift + S` | Save confirmation |

---

## Supported Groq Models

| Model | Description |
|-------|-------------|
| `llama-3.3-70b-versatile` | Best quality (default) |
| `llama-3.1-8b-instant` | Fastest |
| `gemma2-9b-it` | Lightweight |

---

## License

Internal tool — Leoforce / Spectraforce.
