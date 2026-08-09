import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import { notificationsApi } from '../../methods/api/notifications';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import { formatNotificationType } from '../../utils/notificationType';

const typeOptions = [
  'subscription_reminder',
  'subscription_expired',
  'payment_success',
  'payment_failed',
  'new_message',
  'account_approved',
  'admin_broadcast',
  'system',
];

export default function BroadcastPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [form, setForm] = useState({ type: 'admin_broadcast', title: '', message: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setError('Title and message are required'); return; }
    setError('');
    const ok = await confirm({
      title: 'Send Broadcast?',
      message: `Send this broadcast to all users?\n\nType: ${formatNotificationType(form.type)}\nTitle: ${form.title}`,
      confirmLabel: 'Send',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await notificationsApi.broadcast(form);
      showToast(res.data?.message || 'Broadcast sent', 'success');
      navigate('/notifications');
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send broadcast';
      setError(message);
      showToast(message, 'error');
    } finally { setSending(false); }
  };

  return (
    <FormPageLayout eyebrow="Inbox" title="Send Broadcast" onBack={() => navigate('/notifications')}>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          {typeOptions.map((t) => <option key={t} value={t}>{formatNotificationType(t)}</option>)}
        </select>
        <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={inputStyle} />
        <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={sending} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {sending ? 'Sending...' : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
                Send
              </>
            )}
          </button>
          <button type="button" onClick={() => navigate('/notifications')} className="button-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            Cancel
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
