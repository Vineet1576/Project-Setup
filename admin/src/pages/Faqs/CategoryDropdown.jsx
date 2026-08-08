import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CategoryDropdown({ value, categories = [], readOnly = false, onSelect, onAddNew }) {
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
  }, [open, categories.length]);

  const pick = (cat) => {
    close();
    onSelect(cat);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !readOnly && setOpen((o) => !o)}
        disabled={readOnly}
        style={triggerStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <TagIcon />
              <span style={{ color: 'var(--ink)' }}>{value}</span>
            </span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Select category</span>
          )}
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
            <div style={menuLabel}>Choose a category</div>
            {categories.length > 0 ? (
              <div style={menuList}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="option"
                    aria-selected={cat === value}
                    onClick={(e) => { e.stopPropagation(); pick(cat); }}
                    className="menu-pop-item"
                    style={{ ...menuItem, ...(cat === value ? activeItem : null) }}
                  >
                    <TagIcon />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                    {cat === value && (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No categories yet</div>
            )}
            <div style={{ height: 1, margin: '4px 0', background: 'var(--hairline)' }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); close(); onAddNew(); }} className="menu-pop-item" style={{ ...menuItem, color: '#60a5fa' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add new category...</span>
            </button>
          </div>,
          document.body
        )
      }

      <style>{`
        @keyframes category-pop {
          0% { opacity: 0; transform: translateY(-6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

const TagIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6', flexShrink: 0 }}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <path d="M7 7h.01" />
  </svg>
);

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
