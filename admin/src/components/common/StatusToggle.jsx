const COLORS = {
  active: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  inactive: { fg: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  deactive: { fg: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  blocked: { fg: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  read: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  unread: { fg: '#3b82f6', bg: 'rgba(59,130,246,0.14)' },
  pending: { fg: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  approved: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  rejected: { fg: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  success: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  new: { fg: '#3b82f6', bg: 'rgba(59,130,246,0.14)' },
  resolved: { fg: '#10b981', bg: 'rgba(16,185,129,0.14)' },
};

export default function StatusToggle({ value, loading, onToggle, colors, title, loadingLabel = 'Updating...' }) {
  const v = value ? String(value).toLowerCase() : '';
  const cfg = { ...COLORS, ...colors }[v] || { fg: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)' };
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onToggle}
      title={title}
      style={{
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
        cursor: loading ? 'progress' : 'pointer',
        transition: 'filter 0.15s ease',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.fg, flexShrink: 0 }} />
      {loading ? loadingLabel : value}
    </button>
  );
}