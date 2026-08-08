import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COUNTRIES } from './countryCodes';

const flagEmoji = (iso2) =>
  String.fromCodePoint(...[...iso2.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));

export default function CountryCodeDropdown({ value = '', onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.dial === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [query]);

  const close = () => {
    setOpen(false);
    setPlaced(false);
    setQuery('');
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      close();
    };
    const esc = (e) => {
      if (e.key === 'Escape') close();
    };
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      close();
    };
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
  }, [open, filtered.length]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const pick = (c) => {
    close();
    onChange(c.dial);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={triggerStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{selected.flag || flagEmoji(selected.iso2)}</span>
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{selected.dial}</span>
            </span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Select country</span>
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
            style={{ ...menuOverlay, top: pos.top, left: pos.left, width: Math.max(300, triggerRef.current?.getBoundingClientRect().width || 300), opacity: placed ? 1 : 0, pointerEvents: placed ? 'auto' : 'none', animation: placed ? 'country-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'none' }}
          >
            <div style={searchBox}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={searchIconStyle}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country..."
                style={searchInput}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} style={clearBtn} aria-label="Clear search">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div style={menuLabel}>Select a country</div>
            <div style={menuList}>
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    role="option"
                    aria-selected={c.dial === value}
                    onClick={(e) => { e.stopPropagation(); pick(c); }}
                    className="menu-pop-item"
                    style={{ ...menuItem, ...(c.dial === value ? activeItem : null) }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{c.flag || flagEmoji(c.iso2)}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{c.dial}</span>
                    {c.dial === value && (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No countries match</div>
              )}
            </div>
          </div>,
          document.body
        )
      }

      <style>{`
        @keyframes country-pop {
          0% { opacity: 0; transform: translateY(-6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

const triggerStyle = {
  width: '100%',
  height: 47,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 14px',
  border: '1px solid var(--hairline)',
  borderRadius: 12,
  fontSize: 14,
  background: 'var(--surface-card)',
  color: 'var(--ink)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const chevronWrap = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 8,
  color: 'rgba(255,255,255,0.45)',
  background: 'rgba(255,255,255,0.04)',
  flexShrink: 0,
};

const menuOverlay = {
  position: 'fixed',
  background: 'var(--surface-card)',
  border: 0,
  borderRadius: 12,
  boxShadow: '0 12px 28px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
  zIndex: 9999,
  overflow: 'hidden',
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
};

const searchBox = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const searchIconStyle = {
  position: 'absolute',
  left: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  flexShrink: 0,
};

const searchInput = {
  flex: 1,
  border: '1px solid var(--hairline)',
  borderRadius: 8,
  outline: 'none',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--body)',
  fontSize: 13,
  padding: '8px 10px 8px 32px',
};

const clearBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 6,
  border: 0,
  background: 'transparent',
  color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
  flexShrink: 0,
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
  maxHeight: 320,
  overflowY: 'auto',
  paddingRight: 2,
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(59,130,246,0.5) transparent',
};

const menuItem = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textAlign: 'left',
  padding: '9px 12px',
  border: 0,
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
