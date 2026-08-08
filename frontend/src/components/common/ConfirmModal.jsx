import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ANIMATION = `
@keyframes cm-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes cm-slide-up { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes cm-pop { 0% { transform: scale(0.55); opacity: 0; } 40% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
`;

const VariantIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L9.5 2H14.5l.79 1.86" />
    <path d="M3 6h18" />
    <path d="M5.41 6l1.33 14.33A2 2 0 0 0 8.66 22h6.68a2 2 0 0 0 1.92-1.92L16.59 6" />
    <path d="M9 11v6" />
    <path d="M15 11v6" />
    <path d="M10 3H14" />
  </svg>
);

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', loading = false, onCancel, onConfirm }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setShow(open), 0);
      return () => clearTimeout(t);
    }
    setShow(true);
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') { e.preventDefault(); if (!loading) onConfirm?.(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm, loading]);

  const handleBackdrop = (e) => { e.stopPropagation(); };

  if (!open && !show) return null;

  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10000,
        animation: open ? 'cm-fade-in 0.18s ease-out' : 'cm-fade-in 0.12s ease-out reverse',
      }}
    >
      <style>{ANIMATION}</style>
      <div
        onClick={handleBackdrop}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 460,
          background: 'linear-gradient(180deg, rgba(20,20,28,0.99) 0%, rgba(16,16,22,0.99) 100%)',
          border: `1px solid ${variant === 'danger' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 20,
          boxShadow: variant === 'danger'
            ? '0 28px 72px -16px rgba(239,68,68,0.45), 0 0 0 1px rgba(239,68,68,0.2)'
            : '0 24px 64px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
          overflow: 'hidden',
          animation: 'cm-slide-up 0.32s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: variant === 'danger'
              ? 'rgba(239,68,68,0.12)'
              : 'rgba(59,130,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: variant === 'danger' ? '#ef4444' : '#3b82f6',
            marginBottom: 6,
            animation: 'cm-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            <VariantIcon />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '10px 0 4px', letterSpacing: '-0.01em' }}>{title}</h2>
          {message && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, maxWidth: 380 }}>{message}</p>}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '16px 24px 24px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="button-secondary"
            style={{ flex: 1, padding: '10px 18px', fontSize: 13.5, fontWeight: 600 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="button-primary"
            style={{
              flex: 1,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: variant === 'danger'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : undefined,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading && <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />}
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
