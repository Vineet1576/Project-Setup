import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DOT_COLORS = {
  active: '#10b981',
  inactive: '#f59e0b',
  blocked: '#ef4444',
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  completed: '#10b981',
  read: '#10b981',
  unread: '#3b82f6',
  success: '#10b981',
  failed: '#ef4444',
  cancelled: '#f59e0b',
  new: '#3b82f6',
  resolved: '#10b981',
};

export default function StatusFilterDropdown({ value, onChange, options = [], placeholder = 'All statuses', fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const label = selected ? selected.label : placeholder;
  const dot = selected ? DOT_COLORS[selected.value] : null;

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
  }, [open, options.length]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ ...trigger, ...(fullWidth ? { width: '100%', minWidth: 0 } : {}) }}
        aria-label={label}
      >
        {dot ? (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />
          </svg>
        )}
        <span>{label}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
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
            <button
              type="button"
              className="menu-pop-item"
              onClick={(e) => { e.stopPropagation(); close(); onChange(''); }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{placeholder}</span>
              {value === '' && <span style={{ color: '#10b981', fontSize: 12 }}>&#10003;</span>}
            </button>
            {options.map((o) => {
              const c = DOT_COLORS[o.value];
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  className="menu-pop-item"
                  onClick={(e) => { e.stopPropagation(); close(); onChange(o.value); }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c || 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                  {active && <span style={{ color: '#10b981', fontSize: 12 }}>&#10003;</span>}
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

const trigger = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 160,
  width: 'auto',
  padding: '12px 14px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  background: '#131318',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const menu = {
  position: 'fixed',
  minWidth: 190,
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
