import React, { createContext, useCallback, useContext, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Variant = 'default' | 'success' | 'error' | 'info';
interface Toast { id: string; message: string; variant: Variant; }
interface ToastCtx { toast: (msg: string, variant?: Variant) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Variant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const icons: Record<Variant, React.ReactNode | null> = {
    default: null,
    success: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
    error:   <AlertCircle  className="h-4 w-4 text-red-400   shrink-0" />,
    info:    <Info         className="h-4 w-4 text-blue-400  shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[500] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border border-accents-2 bg-background/95 backdrop-blur-md px-4 py-3 shadow-2xl min-w-[240px] max-w-xs"
            >
              {icons[t.variant]}
              <span className="text-sm font-medium flex-1">{t.message}</span>
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="toolbar-btn w-5 h-5 ml-1">
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
