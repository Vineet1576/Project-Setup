import { useState } from 'react';
import { niceTicks } from './tickUtils';

export default function LineAreaChart({ data = [], color = '#3b82f6', height = 260, formatValue = (v) => v }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const pad = { t: 18, r: 14, b: 30, l: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = data.length;
  const { max, ticks } = niceTicks(Math.max(...data.map((d) => d.value), 0));

  const x = (i) => (n <= 1 ? pad.l + innerW / 2 : pad.l + (i / (n - 1)) * innerW);
  const y = (v) => pad.t + innerH - (v / (max || 1)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const areaPath = n > 0
    ? `${linePath} L${x(n - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`
    : '';

  const labelStep = n > 12 ? Math.ceil(n / 8) : 1;
  const gradId = `area-${color.replace('#', '')}`;
  const hasData = n > 0 && ticks.some((t) => t > 0);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)">{formatValue(t)}</text>
          </g>
        ))}
        {hasData && <path d={areaPath} fill={`url(#${gradId})`} />}
        {hasData && <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
        {hasData && data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={i === hover ? 5 : 3} fill="#0b0b10" stroke={color} strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
        ))}
        {hasData && data.map((d, i) => (
          <rect
            key={`h-${i}`}
            x={i === 0 ? 0 : x(i) - innerW / n / 2}
            y={0}
            width={innerW / n}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {n > 0 && data.map((d, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          return <text key={`l-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">{d.label}</text>;
        })}
      </svg>
      {hasData && hover !== null && data[hover] && (
        <div style={{
          position: 'absolute', top: 8, left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)',
          background: '#1a1a24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          padding: '6px 10px', fontSize: 12, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 5, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{data[hover].label}</div>
          <div style={{ fontWeight: 600, color }}>{formatValue(data[hover].value)}</div>
        </div>
      )}
    </div>
  );
}
