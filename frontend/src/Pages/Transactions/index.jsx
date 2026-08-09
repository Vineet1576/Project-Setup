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
import EmptyState from '../../components/common/EmptyState';

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
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
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

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (tx) => {
    const id = tx._id || tx.id;
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      const res = await transactionsApi.download({ id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${id}.pdf`;
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
    } finally {
      setDownloadingId('');
    }
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
              <button onClick={handleRefresh} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg className={refreshing ? 'spin' : ''} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
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
                      <tr
                        key={row._id || row.id || i}
                        className="tx-row"
                        onClick={() => setViewTx(row)}
                        style={{ borderTop: '1px solid var(--hairline)' }}
                      >
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
                              onClick={(e) => { e.stopPropagation(); setViewTx(row); }}
                              className="button-secondary"
                              title="View transaction"
                              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              {ViewIcon} View
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDownload(row); }}
                              className="button-secondary"
                              title="Download invoice"
                              disabled={!!downloadingId}
                              style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: downloadingId ? 0.6 : 1, cursor: downloadingId ? 'not-allowed' : 'pointer' }}
                            >
                              {downloadingId === (row._id || row.id) ? (
                                <span className="spin" style={{ display: 'inline-flex' }}>
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 10 10" /></svg>
                                </span>
                              ) : DownloadIcon}
                              {downloadingId === (row._id || row.id) ? 'Downloading...' : 'Download Invoice'}
                            </button>
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

            {viewTx && (
              <div
                onClick={() => setViewTx(null)}
                style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              >
                <div
                  className="panel-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', maxWidth: 640, padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15)' }}
                >
                  <div style={{ position: 'relative', padding: '26px 28px 22px', background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.35), transparent 45%), radial-gradient(circle at 88% 100%, rgba(139,92,246,0.22), transparent 50%), linear-gradient(135deg, #101323, #0b0b10)', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
                    <button
                      onClick={() => setViewTx(null)}
                      aria-label="Close"
                      style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.18s ease' }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                        Transaction
                      </span>
                      {(() => {
                        const st = statusStyle(viewTx.status);
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, boxShadow: `0 0 10px ${st.glow}` }} />
                            {viewTx.status || '-'}
                          </span>
                        );
                      })()}
                    </div>

                    <div style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: "'SFMono-Regular', Consolas, monospace", letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 40 }}>
                      {viewTx.transactionId || viewTx._id || 'Transaction details'}
                    </div>
                    {viewTx.invoiceId && (
                      <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'SFMono-Regular', Consolas, monospace" }}>
                        Invoice {viewTx.invoiceId}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Amount Charged</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtMoney(viewTx.amount)}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{viewTx.currency || 'usd'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Date</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{fmtDateTime(viewTx.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <ModalSection icon={PlanIcon} title="Plan details">
                      {viewTx.planDetails?.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', marginBottom: 10 }}>
                          <span style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                            {(viewTx.planDetails.name || 'P').charAt(0).toUpperCase()}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewTx.planDetails.name}</div>
                            {viewTx.planDetails.plan_type && (
                              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{viewTx.planDetails.plan_type} plan</div>
                            )}
                          </div>
                          {(() => {
                            const iv = viewTx.interval || viewTx.planDetails?.interval;
                            const style = intervalStyle(iv);
                            return iv ? (
                              <span style={{ marginLeft: 'auto', color: style.color, background: style.bg, border: `1px solid ${style.border}`, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                                {intervalLabel(iv)}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                        <ModalRow label="Billing cycle" value={(() => { const iv = viewTx.interval || viewTx.planDetails?.interval; return intervalLabel(iv) || '-'; })()} />
                        <ModalRow label="Plan type" value={viewTx.planDetails?.plan_type ? capitalizeName(viewTx.planDetails.plan_type) : '-'} />
                      </div>
                    </ModalSection>

                    <ModalSection icon={UserIcon} title="Customer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)' }}>
                        {viewTx.subscriberInfo?.image ? (
                          <img src={viewTx.subscriberInfo.image} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', color: '#fff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {(viewTx.subscriberInfo?.name || viewTx.subscriberInfo?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {capitalizeName(viewTx.subscriberInfo?.name) || viewTx.subscriberInfo?.email || 'Customer'}
                          </div>
                          {viewTx.subscriberInfo?.email && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewTx.subscriberInfo.email}</div>
                          )}
                        </div>
                      </div>
                    </ModalSection>
                  </div>

                  <div style={{ padding: '16px 22px', borderTop: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleDownload(viewTx)}
                      className="button-primary"
                      disabled={!!downloadingId}
                      style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: downloadingId ? 0.6 : 1, cursor: downloadingId ? 'not-allowed' : 'pointer' }}
                    >
                      {downloadingId === (viewTx._id || viewTx.id) ? (
                        <span className="spin" style={{ display: 'inline-flex' }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 10 10" /></svg>
                        </span>
                      ) : DownloadIcon}
                      {downloadingId === (viewTx._id || viewTx.id) ? 'Downloading...' : 'Download Invoice'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
    </Layout>
  );
}

function ModalSection({ icon, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59,130,246,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ModalRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textAlign: 'right', overflowWrap: 'anywhere', minWidth: 0, fontFamily: mono ? "'SFMono-Regular', Consolas, monospace" : undefined }}>
        {value}
      </span>
    </div>
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
const PlanIcon = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 8.5 4.5v9L12 20l-8.5-4.5v-9L12 2Z" /><path d="M12 11 3.5 6.5" /><path d="M12 11v9" /><path d="m20.5 6.5-8.5 4.5" /></svg>
);
const UserIcon = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
