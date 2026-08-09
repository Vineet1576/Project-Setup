import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const today = () => toISO(new Date());
const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const PRESETS = [
  { key: '7d', label: '7D', range: () => ({ start: daysAgo(6), end: today() }) },
  { key: '30d', label: '30D', range: () => ({ start: daysAgo(29), end: today() }) },
  { key: '90d', label: '90D', range: () => ({ start: daysAgo(89), end: today() }) },
  { key: 'month', label: 'This month', range: () => ({ start: toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), end: today() }) },
  { key: 'all', label: 'All time', range: () => ({ start: '', end: '' }) },
];

const PANEL_WIDTH = 580;

export default function DateRangeFilter({ onChange }) {
  const [active, setActive] = useState('30d');
  const [showCalendar, setShowCalendar] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [sel, setSel] = useState({ start: daysAgo(29), end: today() });
  const [draft, setDraft] = useState({ start: daysAgo(29), end: today() });
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const anchorRef = useRef(null);

  const todayISO = today();

  const applyPreset = (p) => {
    setActive(p.key);
    setShowCalendar(false);
    const { start, end } = p.range();
    onChange({ startDate: start || null, endDate: end || null });
  };

  const openCustom = () => {
    setActive('custom');
    setShowCalendar(true);
    setDraft({ start: sel.start, end: sel.end });
    setViewMonth(startOfMonth(sel.start ? parse(sel.start) : new Date()));
    const r = anchorRef.current?.getBoundingClientRect();
    if (r) {
      setPos({
        top: r.bottom + 8,
        left: Math.max(8, Math.min(r.left, window.innerWidth - PANEL_WIDTH - 8)),
      });
    }
  };

  const pickDate = (iso) => {
    if (iso > todayISO) return;
    if (!draft.start || (draft.start && draft.end)) {
      setDraft({ start: iso, end: null });
    } else if (iso >= draft.start) {
      setDraft({ start: draft.start, end: iso });
    } else {
      setDraft({ start: iso, end: null });
    }
  };

  const applyCustom = () => {
    if (!draft.start || !draft.end) return;
    setSel({ start: draft.start, end: draft.end });
    setShowCalendar(false);
    onChange({ startDate: draft.start, endDate: draft.end });
  };

  const renderMonth = (monthDate) => {
    const first = startOfMonth(monthDate);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
          {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', paddingBottom: 4, fontWeight: 600 }}>{w}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b-${i}`} />;
            const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
            const iso = toISO(d);
            const future = iso > todayISO;
            const isStart = iso === draft.start;
            const isEnd = iso === draft.end;
            const inRange = !!draft.start && !!draft.end && iso > draft.start && iso < draft.end;
            const isToday = iso === todayISO;
            return (
              <button
                key={i}
                onClick={() => pickDate(iso)}
                disabled={future}
                style={{
                  ...dayCell,
                  background: isStart || isEnd
                    ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                    : inRange ? 'rgba(59,130,246,0.18)' : 'transparent',
                  color: isStart || isEnd ? '#fff' : future ? 'rgba(255,255,255,0.18)' : 'var(--body)',
                  border: isToday && !isStart && !isEnd ? '1px solid rgba(96,165,250,0.6)' : '1px solid transparent',
                  boxShadow: isStart || isEnd ? '0 4px 12px -4px rgba(59,130,246,0.6)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!future && !isStart && !isEnd && !inRange) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!future && !isStart && !isEnd && !inRange) e.currentTarget.style.background = 'transparent';
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const calendar = (
    <>
      <div onClick={() => setShowCalendar(false)} style={{ position: 'fixed', inset: 0, zIndex: 9990 }} />
      <div
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 9991,
          width: PANEL_WIDTH,
          maxWidth: 'calc(100vw - 16px)',
          padding: 20,
          ...panel,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Select date range</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setViewMonth(addMonths(viewMonth, -1))} style={navBtn} aria-label="Previous months">&larr;</button>
            <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} style={navBtn} aria-label="Next months">&rarr;</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
          {renderMonth(viewMonth)}
          {renderMonth(addMonths(viewMonth, 1))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid var(--hairline)', paddingTop: 14, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {draft.start && !draft.end
              ? `Start: ${draft.start} — pick an end date`
              : draft.start && draft.end
                ? `Range: ${draft.start} to ${draft.end}`
                : 'Pick a start date'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setDraft({ start: null, end: null })} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Clear</button>
            <button onClick={() => setShowCalendar(false)} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              Cancel
            </button>
            <button onClick={applyCustom} disabled={!draft.start || !draft.end} className="button-primary" style={{ opacity: draft.start && draft.end ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div ref={anchorRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p)}
            style={{
              ...pill,
              background: active === p.key ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : 'transparent',
              color: active === p.key ? '#fff' : 'var(--body)',
              borderColor: active === p.key ? 'transparent' : 'var(--hairline)',
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={openCustom}
          style={{
            ...pill,
            background: active === 'custom' ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : 'transparent',
            color: active === 'custom' ? '#fff' : 'var(--body)',
            borderColor: active === 'custom' ? 'transparent' : 'var(--hairline)',
          }}
        >
          Custom
        </button>
      </div>
      {showCalendar && createPortal(calendar, document.body)}
    </div>
  );
}

const pill = { padding: '8px 14px', borderRadius: 999, border: '1px solid var(--hairline)', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s ease, color 0.15s ease' };
const dayCell = { width: '100%', height: 32, borderRadius: 8, fontSize: 12.5, cursor: 'pointer', padding: 0, transition: 'background 0.12s ease, color 0.12s ease' };
const navBtn = { padding: '6px 10px', border: '1px solid var(--hairline)', borderRadius: 8, background: 'transparent', color: 'var(--body)', fontSize: 14, cursor: 'pointer' };
const panel = {
  background: 'linear-gradient(180deg, #16161d 0%, #101016 100%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
};
