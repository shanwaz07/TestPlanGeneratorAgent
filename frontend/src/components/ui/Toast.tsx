import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast { id: number; type: ToastType; message: string }
interface ToastCtx { toast: (type: ToastType, message: string) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() { return useContext(Ctx); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 size={16} className="text-nebula-green shrink-0" />,
    error:   <XCircle     size={16} className="text-alert-red  shrink-0" />,
    info:    <Info        size={16} className="text-stellar-blue shrink-0" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-l-4 border-nebula-green',
    error:   'border-l-4 border-alert-red',
    info:    'border-l-4 border-stellar-blue',
  };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div key={t.id} className={`toast-enter flex items-start gap-3 bg-white rounded-lg shadow-card-hover p-3 ${borders[t.type]}`}>
            {icons[t.type]}
            <p className="text-sm text-dark-matter flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-dark-matter">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
