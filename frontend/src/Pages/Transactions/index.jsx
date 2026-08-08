import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/global/layout';
import ProfileSidebar from '../../components/global/profilePanels/ProfileSidebar';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import Pagination from '../../components/common/Pagination';
import { transactionsApi } from '../../methods/api/transactions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { capitalizeName } from '../../utils/name';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const fmtDateTime = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return [date.toLocaleDateString(), date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })].join(' ');
};

const fmtMoney = (v) => `$${Number(v ?? 0).toFixed(2)}`;

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

export default function Transactions() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [viewTx, setViewTx] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const userId = auth?.user?.id || auth?.user?._id;

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await transactionsApi.list({ userId, page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setTransactions(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally { setLoading(false); }
  }, [userId, debouncedSearch, status, page, pageSize, showToast]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleDownload = async (tx) => {
    try {
      const res = await transactionsApi.download({ id: tx._id || tx.id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${tx._id || tx.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = 'Failed to download invoice';
      const data = err.response?.data;
      try {
        if (data instanceof Blob) {
          const parsed = JSON.parse(await data.text());
          message = parsed?.error?.message || parsed?.message || message;
        } else {
          message = data?.error?.message || data?.message || message;
        }
      } catch {
        // keep fallback message
      }
      showToast(message, 'error');
    }
  };

  const detailRows = (tx) => {
    const iv = tx.interval || tx.planDetails?.interval;
    return [
      { label: 'Date', value: fmtDateTime(tx.createdAt) },
      { label: 'Customer', value: capitalizeName(tx.subscriberInfo?.name) || tx.subscriberInfo?.email || tx.userId || '-' },
      { label: 'Email', value: tx.subscriberInfo?.email || '-' },
      { label: 'Plan', value: tx.planDetails?.name || tx.plan_name || '-' },
      { label: 'Plan Interval', value: intervalLabel(iv) || '-', badge: intervalStyle(iv) },
    ];
  };

  const columns = [
    {
      key: 'transactionId', label: 'Transaction ID', minWidth: 200, mono: true, nowrap: true, truncate: true,
      render: (v, row) => (
        <button
          type="button"
          onClick={() => setViewTx(row)}
          title="View transaction"
          style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
        >
          {v || '-'}
        </button>
      ),
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
    { key: 'status', label: 'Status', minWidth: 120, nowrap: true, render: (v) => (
      <span style={{ color: v === 'paid' || v === 'succeeded' || v === 'success' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{v || '-'}</span>
    )},
  ];

  return (
    <Layout wide>
      <div className="flex flex-col lg:flex-row">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-8">
            <PageHeader eyebrow="Billing" title="Transactions">
              <button onClick={handleRefresh} className="button-secondary">Refresh</button>
            </PageHeader>

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
                              onClick={() => setViewTx(row)}
                              className="button-secondary"
                              title="View transaction"
                              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              {ViewIcon} View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(row)}
                              className="button-secondary"
                              title="Download invoice"
                              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              {DownloadIcon} Download Invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && transactions.length === 0 && (
                      <tr><td colSpan={columns.length + 1} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No records found</td></tr>
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

            {viewTx && (
              <div
                onClick={() => setViewTx(null)}
                style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              >
                <div
                  className="panel-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column', animation: 'pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15)' }}
                >
                  <div style={{ position: 'relative', padding: '28px', background: 'radial-gradient(circle at 15% 15%, rgba(96,165,250,0.32), transparent 45%), radial-gradient(circle at 85% 80%, rgba(59,130,246,0.2), transparent 50%), linear-gradient(135deg, #1e3a8a, #0b0b10)', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
                    <button
                      onClick={() => setViewTx(null)}
                      aria-label="Close"
                      style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.18s ease' }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Transaction
                    </span>
                    <h3 style={{ margin: '12px 0 0', fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'SFMono-Regular', Consolas, monospace", paddingRight: 40 }}>
                      {viewTx.transactionId || viewTx._id || 'Transaction details'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Amount Charged</div>
                        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtMoney(viewTx.amount)}</div>
                      </div>
                      {(() => {
                        const st = statusStyle(viewTx.status);
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, boxShadow: `0 0 12px ${st.glow}` }} />
                            {viewTx.status || '-'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {detailRows(viewTx).map((r) => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{r.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflowWrap: 'anywhere', textAlign: 'right', minWidth: 0 }}>
                          {r.badge ? (
                            <span style={{ color: r.badge.color, background: r.badge.bg, border: `1px solid ${r.badge.border}`, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {r.value}
                            </span>
                          ) : r.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
    </Layout>
  );
}

const statusStyle = (s) => {
  if (['success', 'succeeded', 'paid', 'completed'].includes(s)) {
    return { color: '#34d399', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', glow: 'rgba(16,185,129,0.8)' };
  }
  if (['failed', 'cancelled', 'refunded', 'expired'].includes(s)) {
    return { color: '#f87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', glow: 'rgba(239,68,68,0.8)' };
  }
  return { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)', glow: 'rgba(245,158,11,0.8)' };
};

const ViewIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const DownloadIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
);
