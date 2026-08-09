import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi } from '../../methods/api/transactions';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import { capitalizeName } from '../../utils/name';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { useRecord } from '../../context/RecordContext';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const fmtMoney = (v) => `$${Number(v ?? 0).toFixed(2)}`;

const compactNum = (x) => {
  const abs = Math.abs(x);
  if (abs >= 100) return x.toFixed(0);
  if (abs >= 10) return x.toFixed(1);
  return x.toFixed(2);
};

const fmtCompact = (v) => {
  const n = Number(v ?? 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}$${compactNum(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}$${compactNum(abs / 1e3)}K`;
  return `${sign}$${abs.toFixed(2)}`;
};

const intervalLabel = (iv) => {
  if (!iv?.type) return null;
  const count = Number(iv.interval_count || 1);
  if (iv.type === 'month') return count > 1 ? `${count} mo` : 'Monthly';
  if (iv.type === 'year') return count > 1 ? `${count} yr` : 'Annual';
  return iv.type;
};

const intervalStyle = (iv) => {
  const type = iv?.type;
  if (type === 'year') return { color: '#a78bfa', bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.4)' };
  if (type === 'month') return { color: '#38bdf8', bg: 'rgba(56,189,248,0.14)', border: 'rgba(56,189,248,0.4)' };
  return { color: '#9ca3af', bg: 'rgba(156,163,175,0.14)', border: 'rgba(156,163,175,0.4)' };
};

const columns = [
  {
    key: 'transactionId', label: 'Transaction ID', minWidth: 200, mono: true, nowrap: true, truncate: true,
    render: (v) => <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{v || '-'}</span>,
  },
  { key: 'createdAt', label: 'Date', minWidth: 120, nowrap: true, render: (v) => fmtDate(v) },
  {
    key: 'subscriberInfo', label: 'Customer', minWidth: 170, nowrap: true, truncate: true,
    render: (v, row) => capitalizeName(v?.name) || v?.email || row.userId || '-',
  },
  {
    key: 'email', label: 'Email', minWidth: 220, nowrap: true, truncate: true,
    render: (_, row) => row.subscriberInfo?.email || '-',
  },
  {
    key: 'planDetails', label: 'Plan', minWidth: 220, nowrap: true, truncate: true,
    render: (v, row) => {
      const iv = row.interval || row.planDetails?.interval;
      const style = intervalStyle(iv);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ fontWeight: 600 }}>{v?.name || '-'}</span>
          {iv && (
            <span style={{
              color: style.color,
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}>{intervalLabel(iv)}</span>
          )}
        </div>
      );
    },
  },
  {
    key: 'amount', label: 'Amount Charged', minWidth: 140, nowrap: true,
    render: (v) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmtMoney(v)}</span>,
  },
  {
    key: 'stripe_fee', label: 'Stripe Fee', minWidth: 130, nowrap: true,
    render: (v) => <span style={{ color: '#f59e0b', fontWeight: 600 }}>-{fmtMoney(v)}</span>,
  },
  {
    key: 'net_amount', label: 'Net Amount', minWidth: 140, nowrap: true,
    render: (v) => <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmtMoney(v)}</span>,
  },
  { key: 'status', label: 'Status', minWidth: 120, nowrap: true, render: (v) => (
    <span style={{ color: v === 'paid' || v === 'succeeded' || v === 'success' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{v || '-'}</span>
  )},
];

export default function Transactions() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setTransactions(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await transactionsApi.analytics({ status: status || undefined });
      setAnalytics(res.data?.data || res.data || null);
    } catch {
      setAnalytics(null);
    }
  }, [status]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const handleSendInvoice = async (tx) => {
    try {
      const res = await transactionsApi.sendInvoice({ id: tx._id || tx.id });
      const result = res.data?.data || res.data;
      if (result?.sent) {
        showToast('Invoice sent to email', 'success');
      } else {
        showToast(result?.message || 'Invoice sent', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send invoice', 'error');
    }
  };

  const handleDownload = async (tx) => {
    try {
      const res = await transactionsApi.download({ id: tx._id || tx.id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${tx._id || tx.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to download invoice', 'error');
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Billing" title="Transactions">
        <button onClick={handleRefresh} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg className={refreshing ? 'spin' : ''} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard
          label="Total Charged"
          value={fmtCompact(analytics?.totalCharged)}
          sub={`This month: ${fmtCompact(analytics?.thisMonth?.charged)}`}
          icon={CardIcon}
          accent="#3b82f6"
          iconBg="rgba(59,130,246,0.14)"
        />
        <StatCard
          label="Stripe Fees"
          value={fmtCompact(analytics?.totalStripeFees)}
          sub={`This month: ${fmtCompact(analytics?.thisMonth?.fees)}`}
          icon={FeeIcon}
          accent="#f59e0b"
          iconBg="rgba(245,158,11,0.14)"
        />
        <StatCard
          label="Net Amount"
          value={fmtCompact(analytics?.totalNetAmount)}
          sub={`This month: ${fmtCompact(analytics?.thisMonth?.net)}`}
          icon={WalletIcon}
          accent="#22c55e"
          iconBg="rgba(34,197,94,0.14)"
        />
        <StatCard
          label="Transactions"
          value={analytics ? String(analytics.totalTransactions ?? 0) : '—'}
          sub={analytics ? `${analytics.statusCounts?.success ?? 0} success · ${analytics.statusCounts?.pending ?? 0} pending` : ''}
          icon={ChartIcon}
          accent="#a78bfa"
          iconBg="rgba(167,139,250,0.14)"
        />
      </div>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search by transaction ID..."
        statusOptions={[
          { value: 'success', label: 'Success' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />

      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scrollbar" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1330, borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {columns.map((col) => (
                  <th key={col.key} style={{
                    padding: '14px 16px',
                    textAlign: col.align || 'left',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    minWidth: col.minWidth,
                    whiteSpace: 'nowrap',
                  }}>{col.label}</th>
                ))}
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && transactions.map((row, i) => (
                <tr key={row._id || row.id || i} style={{ borderTop: '1px solid var(--hairline)' }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      textAlign: col.align || 'left',
                      color: 'var(--body)',
                      whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                      fontFamily: col.mono ? "'SFMono-Regular', Consolas, monospace" : undefined,
                      maxWidth: col.truncate ? col.maxWidth || 260 : undefined,
                      overflow: col.truncate ? 'hidden' : undefined,
                      textOverflow: col.truncate ? 'ellipsis' : undefined,
                    }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
<td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => { setActiveId(row._id || row.id); navigate('/transactions/view', { state: { record: row } }); }}
                          className="button-secondary"
                          title="View transaction"
                          style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {ViewIcon} View
                        </button>
                        <ActionButton icon={InvoiceIcon} label="Send Invoice" loadingLabel="Sending..." onClick={() => handleSendInvoice(row)} title="Send invoice" />
                        <ActionButton icon={DownloadIcon} label="Download Invoice" loadingLabel="Downloading..." onClick={() => handleDownload(row)} title="Download invoice" />
                      </div>
                    </td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={columns.length + 1} style={{ padding: 0 }}><EmptyState /></td></tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: 0 }}>
                    <div className="animate-pulse" style={{ padding: '14px 16px' }}>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <div key={r} style={{ display: 'flex', gap: 24, alignItems: 'center', padding: '12px 0', borderTop: r > 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ height: 12, width: 190, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                          <div style={{ height: 12, width: 110, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                          <div style={{ height: 12, width: 220, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                          <div style={{ height: 12, width: 150, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                          <div style={{ height: 24, width: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginLeft: 'auto' }} />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
      </div>
    </div>
  );
}

const StatCard = ({ label, value, sub, icon, accent, iconBg }) => (
  <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', minWidth: 0 }}>
    <div style={{
      width: 46,
      height: 46,
      borderRadius: 12,
      background: iconBg,
      color: accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  </div>
);

const ViewIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const InvoiceIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
const DownloadIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
);
const CardIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
);
const FeeIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const WalletIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
);
const ChartIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 13l4-4 3 3 5-6" /></svg>
);

const SpinnerIcon = (
  <svg className="animate-spin" viewBox="0 0 24 24" width="17" height="17" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path d="M2 12a10 10 0 0 1 10-10v4a6 6 0 0 0-6 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ActionButton = ({ icon, label, onClick, title, loadingLabel }) => {
  const rippleRef = useRef(null);
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerRipple = () => {
    if (rippleRef.current) {
      rippleRef.current.style.transform = 'scale(0)';
      rippleRef.current.style.opacity = '0.5';
      requestAnimationFrame(() => {
        rippleRef.current.style.transform = 'scale(2.5)';
        rippleRef.current.style.opacity = '0';
      });
    }
  };

  const handleClick = async (e) => {
    setPressed(true);
    setLoading(true);
    triggerRipple();
    try {
      await onClick?.(e);
    } finally {
      setLoading(false);
      setTimeout(() => setPressed(false), 120);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={() => !loading && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      disabled={loading}
      title={title}
      className="button-secondary"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '6px 12px',
        fontSize: 13,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, opacity 0.18s ease',
        transform: pressed && !loading ? 'scale(0.96)' : 'scale(1)',
      }}
    >
      <span
        ref={rippleRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 'inherit',
          transform: 'scale(0)',
          opacity: 0,
          transition: 'transform 0.35s ease-out, opacity 0.35s ease-out',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {loading ? SpinnerIcon : icon}
        <span>{loading ? loadingLabel : label}</span>
      </span>
    </button>
  );
};
