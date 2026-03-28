import { useState, useEffect } from 'react';
import { Trash2, Eye, Download, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { api, TestPlan } from '../services/api';

export default function History() {
  const { toast } = useToast();
  const [plans, setPlans]     = useState<TestPlan[]>([]);
  const [selected, setSelected] = useState<TestPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.testplan.history()
      .then(r => setPlans(r.plans))
      .catch(() => toast('error', 'Failed to load history.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openPlan = async (id: string) => {
    try {
      const res = await api.testplan.get(id);
      setSelected(res.plan);
    } catch { toast('error', 'Could not load plan.'); }
  };

  const deletePlan = async (id: string) => {
    await api.testplan.delete(id);
    setPlans(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
    toast('info', 'Test plan deleted.');
  };

  const downloadPlan = (plan: TestPlan) => {
    const blob = new Blob([plan.content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `testplan-${plan.ticket_id}.md`;
    a.click();
  };

  const providerBadge = (p: string) => {
    const map: Record<string, 'info' | 'success' | 'purple'> = { groq: 'info', openai: 'success', ollama: 'purple' };
    return <Badge variant={map[p] ?? 'default'}>{p}</Badge>;
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cosmic-indigo">History</h1>
        <p className="text-sm text-gray-500 mt-1">Previously generated test plans.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={40} className="mx-auto text-cosmic-indigo-light mb-3" />
          <p className="text-gray-400 text-sm">No test plans generated yet.</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* List */}
          <div className="w-80 shrink-0 space-y-2">
            {plans.map(p => (
              <button key={p.id} onClick={() => openPlan(p.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors
                  ${selected?.id === p.id ? 'border-stellar-blue bg-stellar-blue-light' : 'border-cosmic-indigo-light bg-white hover:border-stellar-blue'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-stellar-blue">{p.ticket_id}</span>
                  {providerBadge(p.provider)}
                </div>
                <p className="text-sm text-dark-matter truncate">{p.ticket_summary || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.generated_at).toLocaleString()}</p>
              </button>
            ))}
          </div>

          {/* Detail pane */}
          {selected ? (
            <div className="flex-1 min-w-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selected.ticket_id} — Test Plan</CardTitle>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selected.model} · {new Date(selected.generated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => downloadPlan(selected)}>
                        <Download size={12} /> Download
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deletePlan(selected.id)}>
                        <Trash2 size={12} /> Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <div className="markdown-body max-h-[70vh] overflow-y-auto pr-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a plan to view</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
