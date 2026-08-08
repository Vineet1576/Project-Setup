import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

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
  }, [open, items.length]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={menuBtn}
        aria-label="Row actions"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ ...menuOverlay, top: pos.top, left: pos.left, opacity: placed ? 1 : 0, pointerEvents: placed ? 'auto' : 'none', animation: placed ? 'menu-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'none' }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); close(); item.onClick(); }}
                className={`menu-pop-item${item.danger ? ' danger' : ''}`}
              >
                {item.icon}
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            ))}
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

const menuBtn = {
  width: 34,
  height: 34,
  border: 'none',
  background: 'transparent',
  borderRadius: 10,
  color: 'rgba(255,255,255,0.55)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s ease, color 0.15s ease',
};

const menuOverlay = {
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