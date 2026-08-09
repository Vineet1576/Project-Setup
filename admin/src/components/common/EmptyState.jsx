import { useId } from 'react';

export default function EmptyState({ title = 'No records found', description, action, compact = false }) {
  const uid = useId().replace(/[:]/g, '');
  const g1 = `empty-g1-${uid}`;
  const g2 = `empty-g2-${uid}`;
  const w = compact ? 108 : 150;
  const h = compact ? 94 : 130;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: compact ? 24 : 48, gap: 4, maxWidth: 420, margin: '0 auto',
    }}>
      <svg width={w} height={h} viewBox="0 0 150 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 10 }}>
        <defs>
          <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(96,165,250,0.35)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.05)" />
          </linearGradient>
        </defs>

        <circle cx="22" cy="26" r="3.5" fill="#60a5fa" opacity="0.5" />
        <circle cx="128" cy="22" r="2.5" fill="#93c5fd" opacity="0.55" />
        <circle cx="133" cy="94" r="3" fill="#60a5fa" opacity="0.4" />
        <path d="M18 82 l2.6 -5 2.6 5 -2.6 5 z" fill="#3b82f6" opacity="0.4" />

        <ellipse cx="76" cy="106" rx="48" ry="9" fill={`url(#${g2})`} />

        <g>
          <rect x="42" y="16" width="66" height="80" rx="12" fill="#1a1a25" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
          <rect x="42" y="16" width="66" height="20" rx="12" fill={`url(#${g1})`} />
          <rect x="66" y="24" width="18" height="6" rx="3" fill="#fff" opacity="0.85" />
          <line x1="54" y1="52" x2="96" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeLinecap="round" />
          <line x1="54" y1="64" x2="86" y2="64" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />
          <line x1="54" y1="76" x2="90" y2="76" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />
        </g>

        <g>
          <circle cx="101" cy="82" r="17" stroke="#3b82f6" strokeWidth="5" fill="#131318" />
          <circle cx="101" cy="82" r="11.5" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
          <path d="M114 95 l11 11" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>

      <div style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: '#fff' }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{description}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
