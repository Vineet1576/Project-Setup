import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../methods/api/notifications';
import { useToast } from './Toast';
import { useSocket } from '../../context/SocketContext';
import { formatNotificationType } from '../../utils/notificationType';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { socket, refreshCount } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const onNew = (notification) => {
      if (notification?.type === 'admin_broadcast') return;
      setUnread((c) => c + 1);
      refreshCount((c) => c + 1);
    };
    const onAllRead = () => { setUnread(0); refreshCount(0); };
    const onReadOrDismiss = () => setUnread((c) => Math.max(0, c - 1));
    socket.on('new_notification', onNew);
    socket.on('notifications_all_read', onAllRead);
    socket.on('notification_read', onReadOrDismiss);
    socket.on('notification_dismissed', onReadOrDismiss);
    return () => {
      socket.off('new_notification', onNew);
      socket.off('notifications_all_read', onAllRead);
      socket.off('notification_read', onReadOrDismiss);
      socket.off('notification_dismissed', onReadOrDismiss);
    };
  }, [socket, refreshCount]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await notificationsApi.list({ count: 6 });
        setItems(res.data?.data || res.data?.docs || []);
        setUnread(res.data?.unreadCount ?? 0);
        refreshCount(res.data?.unreadCount ?? 0);
      } catch {
        showToast('Failed to load notifications', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead({});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshCount(0);
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #f87171, #ef4444)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 340,
          maxWidth: '90vw',
          background: '#131318',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>Notifications</span>
            <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div className="animate-pulse" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map((r) => (
                  <div key={r} style={{ height: 12, width: r === 1 ? '85%' : r === 2 ? '70%' : '80%', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No notifications</div>
            ) : (
              items.map((n) => (
                <div key={n._id || n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: n.read ? 'transparent' : 'rgba(59,130,246,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="admin-eyebrow" style={{ marginBottom: 0 }}>{formatNotificationType(n.type)}</span>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginTop: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
