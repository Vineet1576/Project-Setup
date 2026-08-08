import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ContactTopicDropdown({ value, topics = [], onSelect }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = () => { setOpen(false); setPlaced(false); };

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
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
      const b = triggerRef.current?.getBoundingClientRect();
      const m = menuRef.current?.getBoundingClientRect();
      if (!b || !m) return;
      let top = b.bottom + 6;
      if (top + m.height > window.innerHeight - 8) top = Math.max(8, b.top - m.height - 6);
      const left = Math.min(Math.max(8, b.left), window.innerWidth - m.width - 8);
      setPos({ top, left });
      setPlaced(true);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, topics.length]);

  const pick = (t) => {
    close();
    onSelect(t);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.16)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
        style={triggerStyle}
        className="topic-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--ink)' : 'rgba(255,255,255,0.35)' }}>
          {value || 'Select a topic'}
        </span>
        <span style={chevronWrap}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ ...menuOverlay, top: pos.top, left: pos.left, width: Math.max(220, triggerRef.current?.getBoundingClientRect().width || 220), opacity: placed ? 1 : 0, pointerEvents: placed ? 'auto' : 'none', animation: placed ? 'category-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'none' }}
          >
            <div style={menuLabel}>Choose a topic</div>
            <div style={menuList}>
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={t === value}
                  onClick={(e) => { e.stopPropagation(); pick(t); }}
                  onMouseEnter={(e) => { if (t !== value) { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#ffffff'; } }}
                  onMouseLeave={(e) => { if (t !== value) { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; } }}
                  className="topic-menu-item"
                  style={{ ...menuItem, ...(t === value ? activeItem : null) }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                  {t === value && (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      }

      <style>{`
        @keyframes category-pop {
          0% { opacity: 0; transform: translateY(-6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .topic-trigger:hover { border-color: rgba(59,130,246,0.6); box-shadow: 0 0 0 3px rgba(59,130,246,0.16); }
        .topic-menu-item:hover { background: rgba(59,130,246,0.1); }
      `}</style>
    </>
  );
}

const triggerStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  border: '1px solid var(--hairline)',
  borderRadius: 14,
  fontSize: 14,
  background: 'transparent',
  color: 'var(--ink)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const chevronWrap = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 8,
  color: 'rgba(255,255,255,0.45)',
  background: 'rgba(255,255,255,0.04)',
  flexShrink: 0,
};

const menuOverlay = {
  position: 'fixed',
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

const menuLabel = {
  padding: '8px 12px 6px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
};

const menuList = {
  display: 'flex',
  flexDirection: 'column',
};

const menuItem = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textAlign: 'left',
  padding: '9px 12px',
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.85)',
  transition: 'background 0.18s ease, color 0.18s ease',
};

const activeItem = {
  background: 'rgba(59, 130, 246, 0.14)',
  color: '#ffffff',
};
