import React, { createContext, useCallback, useContext, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Variant = 'default' | 'success' | 'error' | 'info';
interface Toast { id: string; message: string; variant: Variant; }
interface ToastCtx { toast: (msg: string, variant?: Variant) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const ICONS: Record<Variant, React.ReactNode | null> = {
  default: null,
  success: <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0 }} />,
  error:   <AlertCircle  size={14} style={{ color: '#ef4444', flexShrink: 0 }} />,
  info:    <Info         size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Variant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="toast"
            >
              {ICONS[t.variant]}
              <span className="text-[13px] font-medium flex-1">{t.message}</span>
              <button
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                className="toolbar-btn w-5 h-5"
              >
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
