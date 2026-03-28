import { useState, useEffect } from 'react';
import { Settings2, Cpu, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { JiraConfigForm } from '../components/forms/JiraConfigForm';
import { LLMConfigForm } from '../components/forms/LLMConfigForm';
import { TemplateUpload } from '../components/forms/TemplateUpload';
import { api, Template } from '../services/api';

const tabs = [
  { id: 'jira',      label: 'JIRA',      icon: Settings2 },
  { id: 'llm',       label: 'LLM',       icon: Cpu       },
  { id: 'templates', label: 'Templates', icon: FileText  },
];

export default function Settings() {
  const [tab, setTab] = useState<'jira' | 'llm' | 'templates'>('jira');
  const [templates, setTemplates] = useState<Template[]>([]);

  const loadTemplates = () => {
    api.templates.list().then(r => setTemplates(r.templates)).catch(() => {});
  };

  useEffect(() => { loadTemplates(); }, []);

  return (
    <div className="p-8 max-w-3xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cosmic-indigo">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure JIRA, LLM providers, and test plan templates.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-cosmic-indigo-light shadow-card w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === id ? 'bg-cosmic-indigo text-white' : 'text-dark-matter hover:bg-cosmic-indigo-light'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'jira' && (
        <Card>
          <CardHeader><CardTitle>JIRA Configuration</CardTitle></CardHeader>
          <JiraConfigForm />
        </Card>
      )}

      {tab === 'llm' && (
        <Card>
          <CardHeader><CardTitle>LLM Provider Settings</CardTitle></CardHeader>
          <LLMConfigForm />
        </Card>
      )}

      {tab === 'templates' && (
        <Card>
          <CardHeader><CardTitle>Test Plan Templates</CardTitle></CardHeader>
          <TemplateUpload templates={templates} onRefresh={loadTemplates} />
        </Card>
      )}
    </div>
  );
}
