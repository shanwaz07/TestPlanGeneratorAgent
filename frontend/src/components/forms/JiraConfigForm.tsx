import { useState } from 'react';
import { CheckCircle2, XCircle, Wifi } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';

export function JiraConfigForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ baseUrl: '', email: '', apiToken: '' });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; user?: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.baseUrl || !form.email || !form.apiToken) {
      toast('error', 'All fields are required.');
      return;
    }
    setSaving(true);
    try {
      await api.settings.saveJira(form);
      const res = await api.settings.getJira();
      setStatus({ connected: res.connected ?? false, user: res.user });
      toast('success', res.connected ? `Connected as ${res.user}` : 'Saved. Connection check failed.');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input label="JIRA Base URL" placeholder="https://yourcompany.atlassian.net"
        value={form.baseUrl} onChange={set('baseUrl')} />
      <Input label="Email" type="email" placeholder="you@company.com"
        value={form.email} onChange={set('email')} />
      <Input label="API Token" type="password" placeholder="••••••••••••••••"
        hint="Generate from: id.atlassian.com → Security → API Tokens"
        value={form.apiToken} onChange={set('apiToken')} />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          <Wifi size={14} /> Save & Test Connection
        </Button>
        {status && (
          <span className={`flex items-center gap-1.5 text-sm font-medium ${status.connected ? 'text-emerald-600' : 'text-alert-red'}`}>
            {status.connected
              ? <><CheckCircle2 size={14} /> Connected as {status.user}</>
              : <><XCircle size={14} /> Connection failed</>
            }
          </span>
        )}
      </div>
    </div>
  );
}
