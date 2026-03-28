import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api, Template } from '../../services/api';

interface Props {
  templates: Template[];
  onRefresh: () => void;
}

export function TemplateUpload({ templates, onRefresh }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) { toast('error', 'Only PDF files allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('error', 'File must be under 5MB.'); return; }
    setUploading(true);
    try {
      const result = await api.templates.upload(file, file.name.replace('.pdf', ''));
      if (result.error) throw new Error(result.error);
      const count = (result as unknown as { sectionsCount?: number }).sectionsCount ?? result.sections?.length ?? 0;
      toast('success', `Template "${result.name}" uploaded with ${count} sections.`);
      onRefresh();
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-stellar-blue bg-stellar-blue-light' : 'border-cosmic-indigo-light hover:border-stellar-blue hover:bg-stellar-blue-light/30'}`}
      >
        <Upload size={28} className="mx-auto mb-2 text-stellar-blue" />
        <p className="text-sm font-medium text-cosmic-indigo">Drop PDF template here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse · max 5MB</p>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>

      {uploading && (
        <div className="callout-info text-sm text-stellar-blue font-medium flex items-center gap-2">
          <span className="animate-pulse">Parsing PDF and extracting sections…</span>
        </div>
      )}

      {/* Template list */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-cosmic-indigo uppercase tracking-wide">Uploaded Templates</p>
          {templates.map(t => (
            <div key={t.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-cosmic-indigo-light">
              <FileText size={16} className="text-stellar-blue shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-matter truncate">{t.name}</p>
                <p className="text-xs text-gray-400">{t.sections.length} sections</p>
              </div>
              {t.isDefault && (
                <span className="text-xs bg-nebula-green/20 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Star size={10} /> Default
                </span>
              )}
              <div className="flex gap-1">
                {!t.isDefault && (
                  <Button size="sm" variant="ghost" title="Set as default"
                    onClick={async () => { await api.templates.setDefault(t.id); toast('success', 'Default template updated.'); onRefresh(); }}>
                    <Star size={12} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" title="Delete"
                  onClick={async () => { await api.templates.delete(t.id); toast('info', 'Template deleted.'); onRefresh(); }}>
                  <Trash2 size={12} className="text-alert-red" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
