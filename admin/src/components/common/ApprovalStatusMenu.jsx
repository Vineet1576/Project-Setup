import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const COLORS = {
  approved: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  pending: { fg: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  rejected: { fg: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
};

const OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ApprovalStatusMenu({ value, loading, onSelect }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const v = value ? String(value).toLowerCase() : '';
  const cfg = COLORS[v] || { fg: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)' };

  const close = () => { setOpen(false); setPlaced(false); };

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const onScroll = () => close();
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      const m = menuRef.current?.getBoundingClientRect();
      if (!b || !m) return;
      let top = b.bottom + 6;
      if (top + m.height > window.innerHeight - 8) top = b.top - m.height - 6;
      let left = b.right - m.width;
      left = Math.min(Math.max(8, left), window.innerWidth - m.width - 8);
      top = Math.max(8, top);
      setPos({ top, left });
      setPlaced(true);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={loading}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ ...pill(cfg), cursor: loading ? 'progress' : 'pointer' }}
        title={`Change approval status (${v})`}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.fg, flexShrink: 0 }} />
        {v}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              ...menu,
              top: pos.top,
              left: pos.left,
              opacity: placed ? 1 : 0,
              pointerEvents: placed ? 'auto' : 'none',
              animation: placed ? 'menu-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
          >
            <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approval Status</div>
            {OPTIONS.map((o) => {
              const c = COLORS[o.value];
              const active = o.value === v;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); close(); onSelect(o.value); }}
                  className="menu-pop-item"
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.fg, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                  {active && <span style={{ color: c.fg, fontSize: 12 }}>&#10003;</span>}
                </button>
              );
            })}
          </div>,
          document.body
        )
      }

      <style>{`
        @keyframes menu-pop {
          0% { opacity: 0; transform: translateY(-6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

const pill = (cfg) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: cfg.bg,
  color: cfg.fg,
  textTransform: 'capitalize',
  border: 'none',
  letterSpacing: '0.02em',
  transition: 'filter 0.15s ease',
});

const menu = {
  position: 'fixed',
  minWidth: 170,
  background: 'var(--surface-card)',
  border: '1px solid var(--hairline)',
  borderRadius: 12,
  boxShadow: '0 12px 28px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
  zIndex: 9999,
  overflow: 'hidden',
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
};
