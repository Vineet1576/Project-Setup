import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import { transactionsApi } from '../../methods/api/transactions';
import { capitalizeName } from '../../utils/name';
import { useToast } from '../../components/common/Toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-');

const STATUS_STYLES = {
  success: { color: '#22c55e', bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.4)' },
  paid: { color: '#22c55e', bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.4)' },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)' },
  failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)' },
  cancelled: { color: '#9ca3af', bg: 'rgba(156,163,175,0.14)', border: 'rgba(156,163,175,0.4)' },
};

const statusStyle = (status) => STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.pending;

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
  const { record, notFound } = useEntity(null);
  const { showToast } = useToast();

  const handleSendInvoice = async () => {
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
    }
  };

  const handleDownload = async () => {
    try {
      const res = await transactionsApi.download({ id: record._id || record.id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${record._id || record.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to download invoice', 'error');
    }
  };

  const customer = capitalizeName(record?.subscriberInfo?.name) || record?.subscriberInfo?.email || record?.userId || '-';
  const amount = Number(record?.amount ?? 0).toFixed(2);
  const interval = record?.interval || record?.planDetails?.interval || null;
  const iStyle = intervalStyle(interval);
  const status = record?.status || '-';
  const sc = statusStyle(status);

  return (
    <FormPageLayout
      eyebrow="Billing"
      title="Transaction Details"
      onBack={() => navigate('/transactions')}
      actions={record && (
        <>
          <button type="button" className="button-secondary" onClick={handleSendInvoice}>Send Invoice</button>
          <button type="button" className="button-primary" onClick={handleDownload}>Download</button>
        </>
      )}
    >
      {notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Transaction not found. Please open it from the transactions list.</div>
      ) : record ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SummaryPanel
            planName={record.planDetails?.name || '-'}
            amount={fmtMoney(amount)}
            status={status}
            statusColor={sc.color}
            statusBg={sc.bg}
            statusBorder={sc.border}
            customer={customer}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <DetailCard title="Customer Information" icon={UserIcon}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(59,130,246,0.18)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {initials(customer)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.subscriberInfo?.email || record.email || '-'}</div>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Plan & Billing" icon={PlanIcon}>
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
              <InfoRow label="Stripe Fee" value={<span style={{ color: '#f59e0b', fontWeight: 600 }}>-{fmtMoney(record.stripe_fee)}</span>} />
              <InfoRow label="Net Amount" value={<span style={{ color: '#22c55e', fontWeight: 700 }}>{fmtMoney(record.net_amount)}</span>} />
            </DetailCard>

            <DetailCard title="Payment" icon={PaymentIcon}>
              <InfoRow label="Date" value={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>{fmtDate(record.createdAt)}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtTime(record.createdAt)}</span>
                </div>
              )} />
              <InfoRow label="Transaction ID" value={<Copyable text={record.transactionId || '-'} mono />} />
            </DetailCard>
          </div>

          <DetailCard title="Invoice" icon={InvoiceIcon}>
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
    </FormPageLayout>
  );
}

function SummaryPanel({ planName, amount, status, statusColor, statusBg, statusBorder, customer }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--surface-dark-elevated) 0%, var(--surface-soft) 100%)',
      border: '1px solid var(--hairline)',
      borderRadius: 16,
      padding: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 240 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(59,130,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{planName}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15 }}>{amount}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <StatusChip status={status} color={statusColor} bg={statusBg} border={statusBorder} />
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{customer}</div>
      </div>
    </div>
  );
}

function StatusChip({ status, color, bg, border }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 999,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {status}
    </span>
  );
}

function DetailCard({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--hairline)',
      borderRadius: 12,
      padding: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon && <span style={{ color: 'var(--muted)', display: 'inline-flex' }}>{icon}</span>}
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
