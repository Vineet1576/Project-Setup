import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import { notificationsApi } from '../../methods/api/notifications';
import { useToast } from '../../components/common/Toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

export default function ViewNotificationPage() {
  const navigate = useNavigate();
  const { record, notFound } = useEntity(null);
  const { showToast } = useToast();

  const handleMarkRead = async () => {
    try {
      await notificationsApi.markRead({ id: record._id || record.id });
      showToast('Notification marked as read', 'success');
      navigate('/notifications');
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDismiss = async () => {
    try {
      await notificationsApi.dismiss({ id: record._id || record.id });
      showToast('Notification dismissed', 'success');
      navigate('/notifications');
    } catch {
      showToast('Failed to dismiss', 'error');
    }
  };

  return (
    <FormPageLayout
      eyebrow="Inbox"
      title="Notification Details"
      onBack={() => navigate('/notifications')}
      actions={record && (
        <>
          {!record.read && (
            <button type="button" className="button-secondary" onClick={handleMarkRead}>Mark as read</button>
          )}
          <button type="button" className="button-primary" onClick={handleDismiss}>Dismiss</button>
        </>
      )}
    >
      {notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Notification not found. Please open it from the notifications list.</div>
      ) : record ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={labelStyle}>Type</div>
            <div style={valueStyle}>{record.type}</div>
          </div>
          <div>
            <div style={labelStyle}>Title</div>
            <div style={{ ...valueStyle, fontWeight: 600 }}>{record.title}</div>
          </div>
          <div>
            <div style={labelStyle}>Message</div>
            <div style={valueStyle}>{record.message}</div>
          </div>
          <div>
            <div style={labelStyle}>Status</div>
            <div style={valueStyle}>{record.read ? 'Read' : 'Unread'}</div>
          </div>
          <div>
            <div style={labelStyle}>Sent</div>
            <div style={valueStyle}>{fmtDate(record.createdAt)}</div>
          </div>
        </div>
      ) : null}
    </FormPageLayout>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 };
const valueStyle = { fontSize: 14, color: 'var(--body)', wordBreak: 'break-word' };
