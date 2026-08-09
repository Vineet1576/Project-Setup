import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import LineAreaChart from '../../components/charts/LineAreaChart';
import RevenueTrendChart from '../../components/charts/RevenueTrendChart';
import DonutChart from '../../components/charts/DonutChart';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { dashboardApi } from '../../methods/api/dashboard';
import { useAuth } from '../../context/AuthContext';
import { useRecord } from '../../context/RecordContext';
import { useToast } from '../../components/common/Toast';
import { capitalizeName } from '../../utils/name';

const money = (v) => {
  const n = Number(v) || 0;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${Math.round(n)}`;
};

const hexToRgba = (hex, a) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return `rgba(255,255,255,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const DONUT_COLORS = ['#3b82f6', '#60a5fa', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];
const STATUS_COLORS = { success: '#22c55e', pending: '#f59e0b', failed: '#ef4444', cancelled: '#a855f7' };
const APPROVAL_COLORS = { approved: '#22c55e', completed: '#22c55e', pending: '#f59e0b', rejected: '#ef4444', suspended: '#ef4444' };

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

const initials = (name) => {
  const s = String(name || '').trim();
  if (!s) return '?';
  return s.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
};

const badgeStyle = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--hairline)', borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap' };

const Icons = {
  users: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  active: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 12-8.5-5v4.5L2 7v10l11.5-4.5V17z" /></svg>,
  approved: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
  pending: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  transactions: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
  revenue: <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [range, setRange] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('transactions');
  const [tabLoading, setTabLoading] = useState(false);
  const tabTimer = useRef(null);

  useEffect(() => () => clearTimeout(tabTimer.current), []);

  const handleTabChange = (t) => {
    if (t === tab) return;
    setTabLoading(true);
    setTab(t);
    clearTimeout(tabTimer.current);
    tabTimer.current = setTimeout(() => setTabLoading(false), 400);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.stats({ ...range });
      setStats(res.data?.data || res.data);
    } catch {
      showToast('Failed to load dashboard data', 'error');
    } finally { setLoading(false); }
  }, [range, showToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const s = stats || {};
  const tm = s.thisMonth || {};
  const cards = [
    { label: 'Total Users', value: s.totalUsers ?? 0, sub: `This month: ${tm.users ?? 0}`, color: '#60a5fa', icon: Icons.users },
    { label: 'Active Users', value: s.activeUsers ?? 0, sub: `This month: ${tm.activeUsers ?? 0}`, color: '#22c55e', icon: Icons.active },
    { label: 'Approved Users', value: s.approvedUsers ?? 0, sub: `This month: ${tm.approvedUsers ?? 0}`, color: '#a855f7', icon: Icons.approved },
    { label: 'Pending Approvals', value: s.pendingUsers ?? 0, sub: `This month: ${tm.pendingUsers ?? 0}`, color: '#f59e0b', icon: Icons.pending },
    { label: 'Transactions', value: s.totalTransactions ?? 0, sub: `This month: ${tm.transactions ?? 0}`, color: '#14b8a6', icon: Icons.transactions },
    { label: 'Total Revenue', value: money(s.totalRevenue ?? 0), sub: `This month: ${money(tm.revenue ?? 0)}`, color: '#3b82f6', icon: Icons.revenue },
  ];

  const userTrend = (s.userTrend || []).map((d) => ({ label: d.label, value: d.count || 0 }));
  const revenueTrend = (s.transactionTrend || []).map((d) => ({ label: d.label, value: d.revenue || 0 }));
  const txCountTrend = (s.transactionTrend || []).map((d) => ({ label: d.label, value: d.count || 0 }));
  const txStatus = (s.transactionStatus || []).map((x, i) => ({ label: x.status, value: x.count || 0, color: STATUS_COLORS[x.status] || DONUT_COLORS[i % DONUT_COLORS.length] }));
  const planDist = (s.planDistribution || []).map((p, i) => ({ label: p.name, value: p.count || 0, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  const userTrendSum = userTrend.reduce((a, d) => a + d.value, 0);
  const revenueTrendSum = revenueTrend.reduce((a, d) => a + d.value, 0);
  const txTrendSum = txCountTrend.reduce((a, d) => a + d.value, 0);
  const txStatusTotal = txStatus.reduce((a, d) => a + d.value, 0);
  const successRate = txStatusTotal ? Math.round(((txStatus.find((x) => x.label === 'success')?.value || 0) / txStatusTotal) * 100) : 0;
  const planDistTotal = planDist.reduce((a, d) => a + d.value, 0);

  const sectionTitle = (title, { accent = '#3b82f6', right } = {}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: accent, boxShadow: `0 0 12px ${hexToRgba(accent, 0.8)}`, flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      </div>
      {right}
    </div>
  );

  const txColumns = [
    {
      label: 'Customer',
      render: (t) => (
        <PersonCell
          name={capitalizeName(t.customer) || t.email || '-'}
          sub={t.email}
          color={STATUS_COLORS[t.status] || '#60a5fa'}
        />
      ),
    },
    { label: 'Plan', render: (t) => t.plan || 'No plan' },
    { label: 'Date', render: (t) => fmtDate(t.date) },
    {
      label: 'Amount',
      align: 'center',
      render: (t) => (
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', fontFamily: "'SFMono-Regular', Consolas, monospace" }}>{money(t.amount)}</span>
      ),
    },
    { label: 'Status', align: 'center', render: (t) => <Pill label={t.status} color={STATUS_COLORS[t.status] || '#60a5fa'} /> },
  ];

  const signupColumns = [
    {
      label: 'Name',
      render: (u) => (
        <PersonCell
          name={capitalizeName(u.name) || u.email || '-'}
          sub={u.email}
          color={APPROVAL_COLORS[u.approvalStatus || u.status] || '#60a5fa'}
        />
      ),
    },
    { label: 'Date', render: (u) => fmtDate(u.date) },
    { label: 'Approval', align: 'center', render: (u) => <Pill label={u.approvalStatus || u.status || '-'} color={APPROVAL_COLORS[u.approvalStatus || u.status] || '#60a5fa'} /> },
  ];

  return (
    <div>
      {loading && !stats ? (
        <>
          <PageHeader eyebrow="Overview" title="Dashboard" subtitle={`Welcome back, ${capitalizeName(auth?.user?.fullName || auth?.user?.name || 'Admin')}.`} subtitleStyle={{ color: '#60a5fa' }}>
            <DateRangeFilter onChange={setRange} />
          </PageHeader>
          <SkeletonLoader variant="cards" cards={6} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <SkeletonLoader variant="chart" height={260} />
            <SkeletonLoader variant="chart" height={260} />
          </div>
        </>
      ) : (
        <>
          <PageHeader eyebrow="Overview" title="Dashboard" subtitle={`Welcome back, ${capitalizeName(auth?.user?.fullName || auth?.user?.name || 'Admin')}.`} subtitleStyle={{ color: '#60a5fa' }}>
            <DateRangeFilter onChange={setRange} />
          </PageHeader>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            {cards.map((card) => (
              <div key={card.label} className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', minWidth: 0 }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: hexToRgba(card.color, 0.14),
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.value}</div>
                  {card.sub && <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="panel-card" style={{ padding: 22 }}>
              {sectionTitle('Users Trend', { accent: '#60a5fa', right: <span style={badgeStyle}>{userTrendSum} users this period</span> })}
              <LineAreaChart data={userTrend} color="#60a5fa" height={260} />
            </div>
            <div className="panel-card" style={{ padding: 22 }}>
              {sectionTitle('Revenue Trend', { accent: '#3b82f6', right: <span style={{ ...badgeStyle, color: '#3b82f6' }}>{money(revenueTrendSum)} this period</span> })}
              <RevenueTrendChart data={revenueTrend} height={280} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="panel-card" style={{ padding: 22 }}>
              {sectionTitle('Transactions', { accent: '#14b8a6', right: <span style={badgeStyle}>{txTrendSum} transactions</span> })}
              <LineAreaChart data={txCountTrend} color="#14b8a6" height={240} />
            </div>
            <div className="panel-card" style={{ padding: 22 }}>
              {sectionTitle('Transaction Status', { accent: '#f59e0b', right: <span style={badgeStyle}>{successRate}% success</span> })}
              <DonutChart data={txStatus} size={200} thickness={26} centerLabel="transactions" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="panel-card" style={{ padding: 22 }}>
              {sectionTitle('Plan Distribution', { accent: '#a855f7', right: <span style={badgeStyle}>{planDistTotal} subscriptions</span> })}
              {planDist.length === 0 ? (
                <EmptyState compact title="No subscriptions yet" />
              ) : (
                <DonutChart data={planDist} size={200} thickness={26} centerLabel="subscriptions" />
              )}
            </div>
            <div className="panel-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.8)', flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Recent Activity</div>
                </div>
                <button type="button" onClick={() => navigate(tab === 'transactions' ? '/transactions' : '/users')} className="button-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}>View all</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 999,
                  padding: 4,
                }}>
                  <button
                    type="button"
                    onClick={() => handleTabChange('transactions')}
                    style={{
                      ...tabBtn,
                      borderRadius: 999,
                      border: 'none',
                      background: tab === 'transactions'
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'transparent',
                      color: tab === 'transactions' ? '#fff' : 'var(--muted)',
                      boxShadow: tab === 'transactions'
                        ? '0 6px 18px -6px rgba(34,197,94,0.65)'
                        : 'none',
                    }}
                  >
                    {TxIcon} Recent Transactions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('signups')}
                    style={{
                      ...tabBtn,
                      borderRadius: 999,
                      border: 'none',
                      background: tab === 'signups'
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'transparent',
                      color: tab === 'signups' ? '#fff' : 'var(--muted)',
                      boxShadow: tab === 'signups'
                        ? '0 6px 18px -6px rgba(34,197,94,0.65)'
                        : 'none',
                    }}
                  >
                    {UserIcon} Recent Signups
                  </button>
                </div>
              </div>
              {tabLoading ? (
                <MiniTableSkeleton rows={4} />
              ) : tab === 'transactions' ? (
                <MiniTable columns={txColumns} rows={s.recentTransactions || []} onRowClick={(t) => { setActiveId(t.id); navigate('/transactions/view', { state: { record: t } }); }} empty="No transactions yet" />
              ) : (
                <MiniTable columns={signupColumns} rows={s.recentSignups || []} onRowClick={(u) => { setActiveId(u.id); navigate('/users/view'); }} empty="No signups yet" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const tabBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 16px',
  borderRadius: 999,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--hairline)',
  color: 'var(--muted)',
  transition: 'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
};

const TxIcon = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /></svg>
);

const UserIcon = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const MiniTableSkeleton = ({ rows = 4 }) => (
  <div className="animate-pulse" style={{ borderRadius: 12, border: '1px solid var(--hairline)', overflow: 'hidden' }}>
    <div style={{ padding: '12px', display: 'flex', gap: 24, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--hairline)' }}>
      {[160, 120, 140, 90].map((w, i) => (
        <div key={i} style={{ height: 11, width: w, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ padding: '11px 12px', display: 'flex', gap: 24, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ height: 12, width: 140, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
        <div style={{ height: 12, width: 90, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
        <div style={{ height: 12, width: 130, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
        <div style={{ height: 22, width: 80, background: 'rgba(255,255,255,0.08)', borderRadius: 999, marginLeft: 'auto' }} />
      </div>
    ))}
  </div>
);

const Avatar = ({ name, color }) => (
  <span style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: hexToRgba(color, 0.15), color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 12,
  }}>{initials(name)}</span>
);

const PersonCell = ({ name, sub, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Avatar name={name} color={color} />
    <div style={{ minWidth: 0, maxWidth: 150 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize',
    color, background: hexToRgba(color, 0.15), border: `1px solid ${hexToRgba(color, 0.35)}`,
  }}>{label || '-'}</span>
);

const MiniTable = ({ columns, rows, onRowClick, empty }) => {
  if (!rows.length) {
    return <EmptyState compact title={empty || 'No records'} />;
  }
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {columns.map((c) => (
                <th key={c.label} style={{
                  padding: '12px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: c.align || 'left',
                  whiteSpace: 'nowrap',
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} className="table-row-hover" onClick={() => onRowClick?.(r)} style={{ borderTop: '1px solid var(--hairline)', cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map((c) => (
                  <td key={c.label} style={{
                    padding: '11px 12px',
                    fontSize: 13,
                    textAlign: c.align || 'left',
                    whiteSpace: 'nowrap',
                    color: 'var(--body)',
                  }}>
                    {c.render ? c.render(r) : (r[c.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
