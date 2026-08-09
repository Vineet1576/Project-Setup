import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { transactionsApi } from '../../methods/api/transactions';
import { capitalizeName } from '../../utils/name';
import { useToast } from '../../components/common/Toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-');

const STATUS_META = {
  success: { label: 'Success', color: '#86efac', bg: 'rgba(34,197,94,0.15)', dot: '#10b981', glow: 'rgba(16,185,129,0.9)' },
  paid: { label: 'Paid', color: '#86efac', bg: 'rgba(34,197,94,0.15)', dot: '#10b981', glow: 'rgba(16,185,129,0.9)' },
  pending: { label: 'Pending', color: '#fde68a', bg: 'rgba(245,158,11,0.15)', dot: '#f59e0b', glow: 'rgba(245,158,11,0.9)' },
  failed: { label: 'Failed', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', glow: 'rgba(239,68,68,0.9)' },
  cancelled: { label: 'Cancelled', color: '#d1d5db', bg: 'rgba(156,163,175,0.15)', dot: '#9ca3af', glow: 'rgba(156,163,175,0.9)' },
};

const statusMeta = (status) => STATUS_META[status?.toLowerCase()] || STATUS_META.pending;

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

export default function ViewTransactionPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(null);
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSendInvoice = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await transactionsApi.sendInvoice({ id: record._id || record.id });
      const result = res.data?.data || res.data;
      if (result?.sent) {
        showToast('Invoice sent to email', 'success');
      } else {
        showToast(result?.message || 'Invoice sent', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send invoice', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await transactionsApi.download({ id: record._id || record.id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${record._id || record.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Invoice downloaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to download invoice', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const customer = capitalizeName(record?.subscriberInfo?.name) || record?.subscriberInfo?.email || record?.userId || '-';
  const amount = Number(record?.amount ?? 0).toFixed(2);
  const interval = record?.interval || record?.planDetails?.interval || null;
  const iStyle = intervalStyle(interval);
  const status = record?.status || '-';
  const meta = statusMeta(status);

  return (
    <FormPageLayout
      eyebrow="Billing"
      title="Transaction Details"
      onBack={() => navigate('/transactions')}
      actions={record && (
        <>
          <button type="button" onClick={handleSendInvoice} disabled={sending} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 600, fontSize: 14, background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', color: '#fff', boxShadow: '0 8px 24px -8px rgba(16,185,129,0.6)', transition: 'all 0.2s ease', cursor: 'pointer' }}>
            {sending ? (
              <span className="spin" style={{ display: 'inline-flex' }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
              </span>
            ) : (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            )}
            {sending ? 'Sending...' : 'Send Invoice'}
          </button>
          <button type="button" className="button-primary" onClick={handleDownload} disabled={downloading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {downloading ? (
              <span className="spin" style={{ display: 'inline-flex' }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
              </span>
            ) : (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            )}
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Transaction not found. Please open it from the transactions list.</div>
      ) : record ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              border: '1px solid var(--hairline)',
              background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)',
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${meta.dot}, #6366f1)`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 28px -8px ${meta.glow}`, flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
            </span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment from</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{customer}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: meta.color, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 6 }}>{fmtMoney(amount)}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 999, textTransform: 'capitalize', border: `1px solid ${meta.bg}`, background: meta.bg, color: meta.color, flexShrink: 0, marginLeft: 'auto' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, boxShadow: `0 0 10px ${meta.glow}` }} />
              {meta.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <DetailCard title="Customer Information" icon={UserIcon} tint="rgba(59,130,246,0.12)" color="#93c5fd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                  boxShadow: '0 8px 20px -6px rgba(59,130,246,0.7)',
                }}>
                  {initials(customer)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.subscriberInfo?.email || record.email || '-'}</div>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Plan & Billing" icon={PlanIcon} tint="rgba(167,139,250,0.12)" color="#c4b5ff">
              <InfoRow label="Plan" value={(
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{record.planDetails?.name || '-'}</span>
                  {interval && (
                    <span style={{
                      color: iStyle.color,
                      background: iStyle.bg,
                      border: `1px solid ${iStyle.border}`,
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>{intervalLabel(interval)}</span>
                  )}
                </div>
              )} />
              <InfoRow label="Amount Charged" value={<span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 16 }}>{fmtMoney(amount)}</span>} />
              <InfoRow label="Stripe Fee" value={<span style={{ color: '#fbbf24', fontWeight: 600 }}>-{fmtMoney(record.stripe_fee)}</span>} />
              <InfoRow label="Net Amount" value={<span style={{ color: '#34d399', fontWeight: 700 }}>{fmtMoney(record.net_amount)}</span>} />
            </DetailCard>

            <DetailCard title="Payment" icon={PaymentIcon} tint="rgba(56,189,248,0.12)" color="#7dd3fc">
              <InfoRow label="Date" value={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>{fmtDate(record.createdAt)}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtTime(record.createdAt)}</span>
                </div>
              )} />
              <InfoRow label="Transaction ID" value={<Copyable text={record.transactionId || '-'} mono />} />
            </DetailCard>
          </div>

          <DetailCard title="Invoice" icon={InvoiceIcon} tint="rgba(34,197,94,0.12)" color="#6ee7b7">
            {record.invoiceUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                <InfoRow label="Invoice ID" value={<Copyable text={record.invoiceId || '-'} mono />} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'var(--primary)', display: 'inline-flex', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </span>
                  <span
                    style={{
                      fontFamily: "'SFMono-Regular', Consolas, monospace",
                      fontSize: 13,
                      color: 'var(--body)',
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={record.invoiceUrl}
                  >{record.invoiceUrl}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <a
                      href={record.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary"
                      style={{ padding: '5px 12px', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      Open
                    </a>
                    <Copyable text={record.invoiceUrl} mono iconOnly />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <InfoRow label="Invoice ID" value={<Copyable text={record.invoiceId || '-'} mono />} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface-soft)',
                  border: '1px dashed var(--hairline-strong, var(--hairline))',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: 'var(--muted)',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--muted)', display: 'inline-flex', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  </span>
                  <span>No invoice generated yet. Click "Send Invoice" to create and email it.</span>
                </div>
              </div>
            )}
          </DetailCard>
        </div>
      ) : null}
      <style>{`
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </FormPageLayout>
  );
}

function DetailCard({ title, icon, tint, color, children }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--hairline)',
      borderRadius: 16,
      padding: 18,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: tint, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--body)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function Copyable({ text, mono, iconOnly }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {!iconOnly && (
        <span style={{
          fontSize: 13,
          color: 'var(--body)',
          fontFamily: mono ? "'SFMono-Regular', Consolas, monospace" : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
          flex: 1,
        }} title={text}>{text}</span>
      )}
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(text); }}
        style={{
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 6,
          color: 'var(--primary)',
          cursor: 'pointer',
          padding: '3px 7px',
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'background 0.15s ease, transform 0.15s ease',
        }}
        title="Copy"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      </button>
    </div>
  );
}

const initials = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

const UserIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const PlanIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 6.5 7 .5-5.5 4.5L18 21l-6-3.5L6 21l1.5-7.5L2 9l7-.5z" /></svg>
);

const PaymentIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
);

const InvoiceIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
