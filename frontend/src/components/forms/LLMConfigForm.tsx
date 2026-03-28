import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';

const PROVIDERS = [
  { value: 'groq',   label: 'Groq (Cloud)'   },
  { value: 'openai', label: 'OpenAI (Cloud)'  },
  { value: 'ollama', label: 'Ollama (Local)'  },
];

const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B Versatile' },
  { value: 'llama-3.1-8b-instant',    label: 'LLaMA 3.1 8B Instant'    },
  { value: 'gemma2-9b-it',            label: 'Gemma 2 9B'              },
];

const OPENAI_DEFAULT_MODELS = [
  { value: 'gpt-4o',         label: 'GPT-4o'         },
  { value: 'gpt-4-turbo',    label: 'GPT-4 Turbo'    },
  { value: 'gpt-3.5-turbo',  label: 'GPT-3.5 Turbo'  },
];

export function LLMConfigForm() {
  const { toast } = useToast();
  const [provider, setProvider] = useState('groq');
  const [groqKey, setGroqKey]     = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [groqTemp, setGroqTemp]   = useState(0.3);
  const [openaiKey, setOpenaiKey]     = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [openaiTemp, setOpenaiTemp]   = useState(0.3);
  const [ollamaUrl, setOllamaUrl]   = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaModels, setOllamaModels] = useState<{ value: string; label: string }[]>([]);
  const [openaiModels, setOpenaiModels] = useState(OPENAI_DEFAULT_MODELS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.getLLM().then(cfg => {
      setProvider(cfg.provider);
      setGroqModel(cfg.groq.model);
      setGroqTemp(cfg.groq.temperature);
      setOpenaiModel(cfg.openai.model);
      setOpenaiTemp(cfg.openai.temperature);
      setOllamaUrl(cfg.ollama.baseUrl);
      setOllamaModel(cfg.ollama.model);
    }).catch(() => {});

    // Fetch dynamic model lists
    api.settings.getModels('ollama')
      .then(r => setOllamaModels(r.models.map(m => ({ value: m, label: m }))))
      .catch(() => {});
    api.settings.getModels('openai')
      .then(r => setOpenaiModels(r.models.map(m => ({ value: m, label: m }))))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.saveLLM({
        provider,
        groq:   { apiKey: groqKey || undefined, model: groqModel, temperature: groqTemp },
        openai: { apiKey: openaiKey || undefined, model: openaiModel, temperature: openaiTemp },
        ollama: { baseUrl: ollamaUrl, model: ollamaModel },
      });
      toast('success', 'LLM settings saved.');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Select label="Active Provider" value={provider}
        onChange={e => setProvider(e.target.value)} options={PROVIDERS} />

      {/* Groq */}
      <div className={`space-y-3 rounded-lg border p-4 transition-colors ${provider === 'groq' ? 'border-stellar-blue bg-stellar-blue-light/30' : 'border-cosmic-indigo-light'}`}>
        <p className="text-xs font-bold text-cosmic-indigo uppercase tracking-wide">Groq Configuration</p>
        <Input label="API Key" type="password" placeholder="gsk_••••••••" value={groqKey} onChange={e => setGroqKey(e.target.value)} hint="Leave blank to keep existing key" />
        <Select label="Model" value={groqModel} onChange={e => setGroqModel(e.target.value)} options={GROQ_MODELS} />
        <TemperatureSlider value={groqTemp} onChange={setGroqTemp} />
      </div>

      {/* OpenAI */}
      <div className={`space-y-3 rounded-lg border p-4 transition-colors ${provider === 'openai' ? 'border-stellar-blue bg-stellar-blue-light/30' : 'border-cosmic-indigo-light'}`}>
        <p className="text-xs font-bold text-cosmic-indigo uppercase tracking-wide">OpenAI Configuration</p>
        <Input label="API Key" type="password" placeholder="sk-••••••••" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} hint="Leave blank to keep existing key" />
        <Select label="Model" value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} options={openaiModels} />
        <TemperatureSlider value={openaiTemp} onChange={setOpenaiTemp} />
      </div>

      {/* Ollama */}
      <div className={`space-y-3 rounded-lg border p-4 transition-colors ${provider === 'ollama' ? 'border-stellar-blue bg-stellar-blue-light/30' : 'border-cosmic-indigo-light'}`}>
        <p className="text-xs font-bold text-cosmic-indigo uppercase tracking-wide">Ollama Configuration</p>
        <Input label="Base URL" placeholder="http://localhost:11434" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} />
        <Select label="Model" value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}
          options={ollamaModels.length ? ollamaModels : [{ value: '', label: 'No models found — run: ollama serve' }]} />
      </div>

      <Button onClick={handleSave} loading={saving}>Save LLM Settings</Button>
    </div>
  );
}

function TemperatureSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-cosmic-indigo uppercase tracking-wide">
        Temperature <span className="text-stellar-blue font-bold">{value.toFixed(1)}</span>
      </label>
      <input type="range" min={0} max={1} step={0.1} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-stellar-blue" />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Precise (0)</span><span>Creative (1)</span>
      </div>
    </div>
  );
}
