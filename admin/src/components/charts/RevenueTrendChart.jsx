import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

const GRADIENT_ID = 'revenueBarGrad';

export default function RevenueTrendChart({ data = [], height = 280 }) {
  const hoverColor = '#60a5fa';
  const formatter = (v) => `$${v}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          tickFormatter={(v) => formatter(v)}
          width={52}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const v = payload[0]?.value ?? 0;
            return (
              <div style={{
                background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '10px 12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            );
          }}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
        <Bar dataKey="value" radius={[7, 7, 7, 7]} maxBarSize={34}>
          {data.map((d, i) => {
            const isMax = d.value === Math.max(...data.map((x) => x.value));
            return <Cell key={i} fill={isMax ? hoverColor : `url(#${GRADIENT_ID})`} />;
          })}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}