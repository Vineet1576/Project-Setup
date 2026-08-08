import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { contactUsApi } from '../../methods/api/contactUs';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import { useToast } from '../../components/common/Toast';

const STATUS_LABELS = {
  new: 'New',
  unread: 'Unread',
  read: 'Read',
  resolved: 'Resolved',
};

const STATUS_COLORS = {
  new: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd' },
  unread: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd' },
  read: { bg: 'rgba(132,94,246,0.12)', border: 'rgba(132,94,246,0.35)', text: '#c4b5ff' },
  resolved: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', text: '#86efac' },
};

export default function ViewContactPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(contactUsApi.getById);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const id = record?._id || record?.id;

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSendReply = async () => {
    const trimmed = (reply || '').trim();
    if (!trimmed) {
      setError('Please enter a reply message before sending.');
      return;
    }
    if (trimmed.length < 5) {
      setError('Your reply is a bit short — please add more detail.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await contactUsApi.reply({ id, message: trimmed });
      showToast('Reply sent to the user', 'success');
      setReply('');
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send reply.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const name = capitalizeName([record?.firstName, record?.lastName].filter(Boolean).join(' ') || record?.fullName) || 'Message';
  const topic = record?.topic || 'Uncategorized';
  const status = record?.status || 'unread';
  const statusMeta = STATUS_COLORS[status] || STATUS_COLORS.unread;

  const detail = [
    { label: 'Name', value: name },
    { label: 'Email', value: record?.email || '-' },
    { label: 'Topic', value: topic },
    { label: 'Received', value: fmtDateTime(record?.createdAt) },
  ];

  return (
    <FormPageLayout
      eyebrow="Inbox"
      title={`View ${topic}`}
      subtitle={name}
      onBack={() => navigate('/feedback')}
      actions={(
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 999, border: `1px solid ${statusMeta.border}`, background: statusMeta.bg, color: statusMeta.text }}>
          {STATUS_LABELS[status] || status}
        </span>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Message not found.</div>
      ) : (
        <>
          {error && <div className="status-message status-error">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18, marginBottom: 18 }}>
            {detail.map((d) => (
              <div key={d.label}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 2 }}>{d.label}</div>
                <div style={{ fontSize: 14, color: 'var(--body)' }}>{d.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>Message</div>
            <div style={{ padding: 16, border: '1px solid var(--hairline)', borderRadius: 14, background: 'rgba(255,255,255,0.03)', fontSize: 14, color: 'var(--body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {record?.message || '-'}
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Send reply</div>
              <div style={{ fontSize: 12, color: reply.length > 480 ? '#ef4444' : 'var(--muted)' }}>{reply.length} / 500</div>
            </div>
            <textarea
              value={reply}
              onChange={(e) => { setReply(e.target.value.slice(0, 500)); setError(''); }}
              placeholder="Write your reply to the user..."
              maxLength={500}
              rows={6}
              className="admin-field-input"
            />
            <button
              type="button"
              onClick={handleSendReply}
              disabled={sending || !(reply || '').trim()}
              className="button-primary"
              style={{ marginTop: 12, width: '100%' }}
            >
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </>
      )}
    </FormPageLayout>
  );
}
