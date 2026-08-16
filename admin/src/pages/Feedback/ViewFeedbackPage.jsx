import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { feedbackApi } from '../../methods/api/feedback';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import { useToast } from '../../components/common/Toast';

const STATUS_LABELS = {
  new: 'New',
  unread: 'Unread',
  read: 'Read',
  resolved: 'Resolved',
};

const STATUS_META = {
  new: { label: 'New', color: '#93c5fd', bg: 'rgba(59,130,246,0.15)', dot: '#3b82f6', glow: 'rgba(59,130,246,0.9)' },
  unread: { label: 'Unread', color: '#93c5fd', bg: 'rgba(59,130,246,0.15)', dot: '#3b82f6', glow: 'rgba(59,130,246,0.9)' },
  read: { label: 'Read', color: '#c4b5ff', bg: 'rgba(132,94,246,0.15)', dot: '#8b5cf6', glow: 'rgba(139,92,246,0.9)' },
  resolved: { label: 'Resolved', color: '#86efac', bg: 'rgba(34,197,94,0.15)', dot: '#10b981', glow: 'rgba(16,185,129,0.9)' },
};

const initials = (name = '') => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || '?';
};

export default function ViewFeedbackPage() {
  const navigate = useNavigate();
  const { record, loading, notFound, refetch, setRecord } = useEntity(feedbackApi.getById);
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
      const res = await feedbackApi.reply({ id, message: trimmed });
      const result = res.data?.data || res.data || {};
      showToast('Reply sent to the user', 'success');
      setReply('');
      const newReplies = result.replies || (result.detail && result.detail.replies);
      if (Array.isArray(newReplies)) {
        const detail = record?.detail || {};
        setRecord({ ...record, replies: newReplies, detail: { ...detail, replies: newReplies } });
      } else {
        refetch();
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send reply.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const name = capitalizeName([record?.firstName, record?.lastName].filter(Boolean).join(' ') || record?.fullName) || 'Anonymous';
  const topic = record?.topic || 'Uncategorized';
  const status = record?.status || 'unread';
  const meta = STATUS_META[status] || STATUS_META.unread;
  const replies = record?.replies || record?.detail?.replies || [];

  return (
    <FormPageLayout
      eyebrow="Inbox"
      title="Feedback Details"
      subtitle={`${topic} • ${name}`}
      onBack={() => navigate('/feedback')}
      actions={(
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 999, textTransform: 'capitalize', border: `1px solid ${meta.bg}`, background: meta.bg, color: meta.color }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, boxShadow: `0 0 10px ${meta.glow}` }} />
          {STATUS_LABELS[status] || status}
        </span>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Message not found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {error && <div className="status-message status-error">{error}</div>}

          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              border: '1px solid var(--hairline)',
              background: 'radial-gradient(circle at 10% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 92% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)',
              padding: '24px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                background: `linear-gradient(135deg, ${meta.dot}, #6366f1)`,
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, letterSpacing: '0.02em',
                boxShadow: `0 12px 28px -8px ${meta.glow}`,
              }}
            >
              {initials(name)}
            </span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{topic}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{record?.email || '-'}</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 'auto' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              Received {fmtDateTime(record?.createdAt)}
            </div>
          </div>

          <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Message</span>
            </div>
            <div style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{record?.message || '-'}</div>
          </div>

          {replies.length > 0 && (
            <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: '#34d399', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Replies sent ({replies.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {replies.map((r) => (
                  <div key={r._id || r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px -6px rgba(16,185,129,0.6)', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ padding: '13px 16px', borderRadius: 14, borderTopLeftRadius: 4, border: '1px solid var(--hairline)', background: 'rgba(16,185,129,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Support Team</span>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDateTime(r.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'linear-gradient(180deg, rgba(59,130,246,0.05), rgba(255,255,255,0.02))', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Send reply</span>
              </div>
              <span style={{ fontSize: 12, color: reply.length > 480 ? '#ef4444' : 'var(--muted)' }}>{reply.length} / 500</span>
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
        </div>
      )}
    </FormPageLayout>
  );
}
