import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
} from 'recharts';

const COLORS = ['#3b82f6', '#60a5fa', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

export default function DonutChart({
  data = [],
  size = 200,
  thickness = 26,
  centerValue,
  centerLabel,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = data.reduce((s, d) => s + d.value, 0);
  const innerR = (size - thickness) / 2;
  const outerR = size / 2;

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={5}
        />
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((d, i) => {
                const c = d.color || COLORS[i % COLORS.length];
                const gid = `donutGrad-${i}`;
                return (
                  <linearGradient key={gid} id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                  </linearGradient>
                );
              })}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={4}
              cornerRadius={6}
              stroke="rgba(11,11,16,0.6)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(0)}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={`url(#donutGrad-${i})`} style={{ transition: 'transform 0.2s ease' }} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div style={{
                    background: '#1a1a24',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {p.value}
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginLeft: 6 }}>
                        {total ? `${Math.round((p.value / total) * 100)}%` : ''}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{centerValue !== undefined ? centerValue : total}</div>
          {centerLabel && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{centerLabel}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
        {data.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No data</div>}
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          const c = d.color || COLORS[i % COLORS.length];
          const isActive = i === activeIndex;
          return (
            <div
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(0)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                padding: '6px 10px', borderRadius: 8, cursor: 'default',
                background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'background 0.15s ease',
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
              <span style={{ color: 'var(--body)', textTransform: 'capitalize' }}>{d.label}</span>
              <span style={{ color: 'var(--muted)', marginLeft: 'auto', fontWeight: 600 }}>{d.value}</span>
              <span style={{ color: c, fontWeight: 700, minWidth: 38, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}