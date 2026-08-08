import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const baseButton = {
  minWidth: 34,
  height: 34,
  padding: '0 10px',
  borderRadius: 10,
  border: '1px solid var(--hairline)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

const arrowButton = {
  ...baseButton,
  padding: '0 12px',
  fontSize: 16,
  lineHeight: 1,
};

const triggerStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 120,
  padding: '10px 12px',
  border: '1px solid var(--hairline)',
  borderRadius: 12,
  background: 'var(--surface-card)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const menuStyle = {
  position: 'fixed',
  minWidth: 160,
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

export default function Pagination({
  page = 1,
  count = 10,
  total = 0,
  onPageChange,
  onCountChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
}) {
  const totalCount = Number(total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / count));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalCount === 0 ? 0 : (safePage - 1) * count + 1;
  const end = Math.min(safePage * count, totalCount);

  const maxButtons = 5;
  let from = Math.max(1, safePage - Math.floor(maxButtons / 2));
  let to = Math.min(totalPages, from + maxButtons - 1);
  from = Math.max(1, to - maxButtons + 1);
  const pages = [];
  for (let i = from; i <= to; i++) pages.push(i);

  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [pageSizePos, setPageSizePos] = useState({ top: 0, left: 0 });
  const [pageSizePlaced, setPageSizePlaced] = useState(false);
  const pageSizeBtnRef = useRef(null);
  const pageSizeMenuRef = useRef(null);

  const closePageSize = () => { setPageSizeOpen(false); setPageSizePlaced(false); };

  useEffect(() => {
    if (!pageSizeOpen) return;
    const outside = (e) => {
      if (pageSizeMenuRef.current?.contains(e.target) || pageSizeBtnRef.current?.contains(e.target)) return;
      closePageSize();
    };
    const esc = (e) => { if (e.key === 'Escape') closePageSize(); };
    const onScroll = () => closePageSize();
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [pageSizeOpen]);

  useLayoutEffect(() => {
    if (!pageSizeOpen) return;
    const place = () => {
      const b = pageSizeBtnRef.current?.getBoundingClientRect();
      const m = pageSizeMenuRef.current?.getBoundingClientRect();
      if (!b || !m) return;
      let top = b.bottom + 6;
      if (top + m.height > window.innerHeight - 8) top = b.top - m.height - 6;
      let left = b.right - m.width;
      left = Math.min(Math.max(8, left), window.innerWidth - m.width - 8);
      top = Math.max(8, top);
      setPageSizePos({ top, left });
      setPageSizePlaced(true);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [pageSizeOpen, pageSizeOptions.length]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderTop: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {totalCount === 0 ? 'No records' : (
            <>
              Showing{' '}
              <strong style={{ color: 'var(--primary)' }}>{start}–{end}</strong>{' '}
              of{' '}
              <strong style={{ color: 'var(--primary)' }}>{totalCount}</strong>
            </>
          )}
        </span>
        <div>
          <button
            ref={pageSizeBtnRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); setPageSizeOpen((o) => !o); }}
            style={triggerStyle}
            aria-label={count + ' per page'}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{count} per page</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6, transform: pageSizeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {pageSizeOpen &&
            createPortal(
              <div
                ref={pageSizeMenuRef}
                style={{
                  ...menuStyle,
                  top: pageSizePos.top,
                  left: pageSizePos.left,
                  opacity: pageSizePlaced ? 1 : 0,
                  pointerEvents: pageSizePlaced ? 'auto' : 'none',
                  animation: pageSizePlaced ? 'menu-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                }}
              >
                {pageSizeOptions.map((n) => {
                  const active = n === count;
                  return (
                    <button
                      key={n}
                      type="button"
                      className="menu-pop-item"
                      onClick={(e) => { e.stopPropagation(); closePageSize(); onCountChange(n); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', borderRadius: 8, background: active ? 'rgba(59,130,246,0.15)' : 'transparent', color: 'var(--ink)', fontSize: 13, fontWeight: 500, textAlign: 'left', cursor: 'pointer' }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--primary)' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{n} per page</span>
                      {active && <span style={{ color: 'var(--primary)', fontSize: 12 }}>&#10003;</span>}
                    </button>
                  );
                })}
              </div>,
              document.body
            )
          }
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} style={{ ...arrowButton, opacity: safePage <= 1 ? 0.4 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }} aria-label="Previous page">‹</button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                ...baseButton,
                background: p === safePage ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.04)',
                color: p === safePage ? '#fff' : 'var(--body)',
                borderColor: p === safePage ? 'transparent' : 'var(--hairline)',
                boxShadow: p === safePage ? '0 8px 20px -8px rgba(59,130,246,0.7)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
          <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)} style={{ ...arrowButton, opacity: safePage >= totalPages ? 0.4 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }} aria-label="Next page">›</button>
        </div>
      )}
    </div>
  );
}
