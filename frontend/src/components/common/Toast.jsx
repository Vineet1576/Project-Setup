import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

let nextId = 0;

const typeStyles = {
  success: {
    border: 'border-emerald-400/40',
    accent: 'text-emerald-400',
    icon: <FaCheckCircle />,
    bar: 'from-emerald-400 to-emerald-600',
  },
  error: {
    border: 'border-[#f87171]/40',
    accent: 'text-[#ff8080]',
    icon: <FaExclamationCircle />,
    bar: 'from-[#ff8080] to-[#f87171]',
  },
  info: {
    border: 'border-blue-400/40',
    accent: 'text-[#3b82f6]',
    icon: <FaInfoCircle />,
    bar: 'from-[#3b82f6] to-[#60a5fa]',
  },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const styles = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className={`pointer-events-auto w-full max-w-[380px] animate-toast-in rounded-xl border ${styles.border} bg-[#0e0d15]/95 backdrop-blur shadow-[0_16px_40px_-16px_rgba(0,0,0,0.8)] overflow-hidden`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`mt-0.5 text-[18px] shrink-0 ${styles.accent}`}>{styles.icon}</span>
        <p className="flex-1 text-[14px] leading-snug text-white/90 break-words">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors"
        >
          <FaTimes size={12} />
        </button>
      </div>
      <div className={`h-0.5 bg-gradient-to-r ${styles.bar}`} />
    </div>
  );
}
