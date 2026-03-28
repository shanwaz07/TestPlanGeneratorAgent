import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Zap, Copy, Download, Save, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { TicketCard } from '../components/jira-display/TicketCard';
import { useToast } from '../components/ui/Toast';
import { api, JiraTicket, Template } from '../services/api';

type Step = 'input' | 'ticket' | 'generating' | 'output';

const PROVIDERS = [
  { value: 'groq',   label: 'Groq'   },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama' },
];

const STEPS = ['Ticket Input', 'Ticket Review', 'Generating', 'Test Plan'];

export default function Dashboard() {
  const { toast } = useToast();
  const [ticketId, setTicketId]     = useState('');
  const [ticket, setTicket]         = useState<JiraTicket | null>(null);
  const [fetching, setFetching]     = useState(false);
  const [provider, setProvider]     = useState('groq');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [recent, setRecent]         = useState<{ ticket_id: string; summary: string }[]>([]);
  const [step, setStep]             = useState<Step>('input');
  const [streamContent, setStreamContent] = useState('');
  const [statusMsg, setStatusMsg]   = useState('');
  const [planId, setPlanId]         = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.templates.list().then(r => {
      setTemplates(r.templates);
      const def = r.templates.find(t => t.isDefault);
      if (def) setTemplateId(def.id);
    }).catch(() => {});
    api.jira.recent().then(r => setRecent(r.tickets)).catch(() => {});
    api.settings.getLLM().then(r => setProvider(r.provider)).catch(() => {});
  }, []);

  const fetchTicket = async () => {
    if (!ticketId.trim()) return;
    setFetching(true);
    try {
      const res = await api.jira.fetch(ticketId.trim().toUpperCase());
      setTicket(res.ticket);
      setStep('ticket');
      setRecent(prev => {
        const filtered = prev.filter(t => t.ticket_id !== res.ticket.ticketId);
        return [{ ticket_id: res.ticket.ticketId, summary: res.ticket.summary }, ...filtered].slice(0, 5);
      });
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const generate = useCallback(async () => {
    if (!ticket) return;
    setStep('generating');
    setStreamContent('');
    setStatusMsg('Starting…');

    try {
      const res = await api.testplan.generate({ ticketId: ticket.ticketId, templateId: templateId || undefined, provider });
      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { setStep('output'); continue; }
          try {
            const event = JSON.parse(raw) as { type: string; content?: string; message?: string; planId?: string };
            if (event.type === 'chunk' && event.content)  setStreamContent(prev => prev + event.content);
            if (event.type === 'status' && event.message) setStatusMsg(event.message);
            if (event.type === 'done'   && event.planId)  setPlanId(event.planId);
            if (event.type === 'error'  && event.message) { toast('error', event.message); setStep('ticket'); }
          } catch { /* skip malformed */ }
        }
      }

      setStep('output');
    } catch (e) {
      toast('error', (e as Error).message);
      setStep('ticket');
    }
  }, [ticket, provider, templateId, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && step === 'ticket') generate();
      if (e.ctrlKey && e.shiftKey && e.key === 'S' && step === 'output') {
        toast('info', `Test plan saved (ID: ${planId.slice(0, 8)})`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, generate, planId, toast]);

  const stepIndex = ['input', 'ticket', 'generating', 'output'].indexOf(step);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(streamContent);
    toast('success', 'Copied to clipboard!');
  };

  const downloadMd = () => {
    const blob = new Blob([streamContent], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `testplan-${ticket?.ticketId ?? 'export'}.md`;
    a.click();
    toast('success', 'Downloaded as Markdown.');
  };

  const templateOptions = [
    { value: '', label: 'Default (built-in)' },
    ...templates.map(t => ({ value: t.id, label: `${t.name}${t.isDefault ? ' ★' : ''}` })),
  ];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cosmic-indigo">Generate Test Plan</h1>
        <p className="text-sm text-gray-500 mt-1">Fetch a JIRA ticket and generate a comprehensive test plan with AI.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${i < stepIndex ? 'bg-nebula-green/20 text-emerald-700' : i === stepIndex ? 'bg-stellar-blue text-white' : 'bg-cosmic-indigo-light text-gray-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
                ${i < stepIndex ? 'bg-nebula-green text-white' : i === stepIndex ? 'bg-white text-stellar-blue' : 'bg-gray-200 text-gray-400'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-6 rounded ${i < stepIndex ? 'bg-nebula-green' : 'bg-cosmic-indigo-light'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Step 1 — JIRA Ticket</CardTitle></CardHeader>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="PROJECT-123"
                value={ticketId}
                onChange={e => setTicketId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && fetchTicket()}
                className="pr-10 font-mono uppercase"
              />
              {recent.length > 0 && (
                <button onClick={() => setShowRecent(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-stellar-blue">
                  <ChevronDown size={14} />
                </button>
              )}
              {showRecent && (
                <div className="absolute top-full mt-1 w-full bg-white border border-cosmic-indigo-light rounded-lg shadow-card-hover z-10">
                  {recent.map(r => (
                    <button key={r.ticket_id} onClick={() => { setTicketId(r.ticket_id); setShowRecent(false); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-lunar-mist text-sm flex items-center gap-3">
                      <span className="font-mono text-stellar-blue font-semibold text-xs shrink-0">{r.ticket_id}</span>
                      <span className="text-dark-matter truncate">{r.summary}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={fetchTicket} loading={fetching} size="md">
              <Search size={14} /> Fetch Ticket
            </Button>
          </div>
        </Card>

        {/* Step 2: Ticket display */}
        {ticket && step !== 'input' && (
          <div>
            <TicketCard ticket={ticket} />

            {/* Step 3: Generation controls */}
            {(step === 'ticket' || step === 'generating' || step === 'output') && (
              <Card className="mt-4">
                <CardHeader><CardTitle>Step 2 — Generation Settings</CardTitle></CardHeader>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Select label="LLM Provider" value={provider}
                      onChange={e => setProvider(e.target.value)} options={PROVIDERS} />
                  </div>
                  <div className="flex-1">
                    <Select label="Template" value={templateId}
                      onChange={e => setTemplateId(e.target.value)} options={templateOptions} />
                  </div>
                  <Button size="md" onClick={generate} disabled={step === 'generating'} loading={step === 'generating'}>
                    <Zap size={14} /> Generate
                    <span className="text-xs opacity-70 ml-1">Ctrl+↵</span>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Generating state */}
        {step === 'generating' && (
          <Card className="border-stellar-blue">
            <div className="flex items-center gap-3 py-2">
              <Spinner size={18} className="text-stellar-blue" />
              <div>
                <p className="text-sm font-semibold text-cosmic-indigo">{statusMsg}</p>
                <p className="text-xs text-gray-400">Streaming response from {provider}…</p>
              </div>
            </div>
            {streamContent && (
              <div className="mt-4 max-h-64 overflow-y-auto bg-lunar-mist rounded-lg p-4 text-xs text-dark-matter font-mono whitespace-pre-wrap">
                {streamContent}
              </div>
            )}
          </Card>
        )}

        {/* Step 4: Output */}
        {step === 'output' && streamContent && (
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-stellar-blue">
              <div>
                <h3 className="text-cosmic-indigo font-bold">Generated Test Plan</h3>
                <p className="text-xs text-gray-400">{ticket?.ticketId} · {provider} · {streamContent.split(' ').length} words</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={copyToClipboard}>
                  <Copy size={12} /> Copy
                </Button>
                <Button size="sm" variant="secondary" onClick={downloadMd}>
                  <Download size={12} /> .md
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast('info', `Saved: ${planId.slice(0, 8)}`)}>
                  <Save size={12} /> Saved
                </Button>
              </div>
            </div>
            <div ref={outputRef} className="markdown-body max-h-[60vh] overflow-y-auto pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
