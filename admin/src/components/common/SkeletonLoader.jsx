const block = { background: 'rgba(255,255,255,0.08)', borderRadius: 8 };

const WIDTHS = [140, 220, 120, 180, 90, 150];

export default function SkeletonLoader({ variant = 'table', rows = 6, cards = 6, height }) {
  if (variant === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="panel-card animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
            <div style={{ ...block, width: 46, height: 46, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ ...block, height: 11, width: '55%' }} />
              <div style={{ ...block, height: 20, width: '75%' }} />
              <div style={{ ...block, height: 11, width: '45%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="panel-card animate-pulse" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...block, height: 14, width: '35%' }} />
        <div style={{ ...block, height: height || 220, width: '100%', borderRadius: 12 }} />
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="panel-card animate-pulse" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ ...block, height: 18, width: '30%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ ...block, height: 11, width: '40%' }} />
              <div style={{ ...block, height: 14, width: '80%' }} />
            </div>
          ))}
        </div>
        <div style={{ ...block, height: 120, width: '100%', borderRadius: 12 }} />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="panel-card animate-pulse" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...block, height: 12, width: '80%' }} />
        <div style={{ ...block, height: 12, width: '60%' }} />
        <div style={{ ...block, height: 12, width: '70%' }} />
      </div>
    );
  }

  return (
    <div className="panel-card animate-pulse" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '15px 16px', display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {WIDTHS.slice(0, 5).map((w, i) => (
          <div key={i} style={{ ...block, height: 11, width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '15px 16px', display: 'flex', gap: 24, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {WIDTHS.map((w, j) => (
            <div key={j} style={{ ...block, height: i % 2 === 0 && j === 1 ? 28 : 12, width: w, borderRadius: j === 0 ? '50%' : 8 }} />
          ))}
          <div style={{ ...block, height: 24, width: 90, borderRadius: 8, marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}