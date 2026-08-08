import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../methods/api/notifications';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import RowMenu from '../../components/common/RowMenu';
import { useToast } from '../../components/common/Toast';
import Pagination from '../../components/common/Pagination';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { useConfirm } from '../../context/ConfirmContext';
import { useSocket } from '../../context/SocketContext';
import { formatNotificationType } from '../../utils/notificationType';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

export default function Notifications() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { refreshCount } = useSocket();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [viewN, setViewN] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({
        page,
        count: pageSize,
        search: debouncedSearch || undefined,
        read: status ? (status === 'read' ? 'true' : 'false') : undefined,
      });
      setItems(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
      setUnreadCount(res.data?.unreadCount || 0);
      refreshCount(res.data?.unreadCount || 0);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally { setLoading(false); }
  }, [showToast, refreshCount, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const handleBroadcast = async () => {
    const ok = await confirm({
      title: 'Compose Broadcast?',
      message: 'You are about to compose a broadcast notification to all users. Continue?',
      confirmLabel: 'Continue',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    navigate('/notifications/broadcast');
  };

  const handleView = async (n) => {
    const nid = n._id || n.id;
    const wasUnread = !n.read;
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
      refreshCount(Math.max(0, unreadCount - 1));
      setItems((prev) => prev.map((x) => (x._id === nid ? { ...x, read: true } : x)));
      try {
        await notificationsApi.markRead({ id: nid });
      } catch {
        showToast('Failed to mark as read', 'error');
      }
    }
    setViewN({ ...n, read: true });
  };

  const handleDismiss = async (n) => {
    try {
      await notificationsApi.dismiss({ id: n._id || n.id });
      if (!n.read) setUnreadCount((c) => Math.max(0, c - 1));
      fetchNotifications();
    } catch {
      showToast('Failed to dismiss', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const ok = await confirm({
      title: 'Mark all as read?',
      message: `You have ${unreadCount} unread notifications. Mark them all as read?`,
      confirmLabel: 'Mark all read',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await notificationsApi.markAllRead({});
      setUnreadCount(0);
      fetchNotifications();
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Notifications" subtitle={`${unreadCount} unread`}>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          title={unreadCount === 0 ? 'No unread notifications to mark' : 'Mark all notifications as read'}
          className="button-secondary"
        >Mark all read</button>
        <button onClick={handleBroadcast} className="button-primary">Broadcast</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search notifications..."
        statusOptions={[
          { value: 'unread', label: 'Unread' },
          { value: 'read', label: 'Read' },
        ]}
      />

      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <SkeletonLoader variant="table" rows={5} />
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No notifications</div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((n) => (
                <li key={n._id || n.id} onClick={() => handleView(n)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--hairline)', background: n.read ? 'transparent' : 'rgba(59,130,246,0.08)', cursor: 'pointer', transition: 'background 0.18s ease' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="admin-eyebrow" style={{ marginBottom: 0 }}>{formatNotificationType(n.type)}</span>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{fmtDate(n.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <RowMenu
                      items={[
                        { label: 'Dismiss', icon: DismissIcon, danger: true, onClick: () => handleDismiss(n) },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
          </>
        )}
      </div>

      {viewN && (
        <div
          onClick={() => setViewN(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            className="panel-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden', animation: 'pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15)' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '24px 28px', background: 'radial-gradient(circle at 15% 15%, rgba(96,165,250,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(59,130,246,0.22), transparent 50%), linear-gradient(135deg, #1e3a8a, #0b0b10)', borderBottom: '1px solid var(--hairline)' }}>
              <button
                onClick={() => setViewN(null)}
                aria-label="Close"
                style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.18s ease' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </span>
              <div style={{ minWidth: 0, paddingRight: 40 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {formatNotificationType(viewN.type)}
                </span>
                <h3 style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{viewN.title}</h3>
              </div>
            </div>

            <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Message</div>
                <div style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.7 }}>{viewN.message}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: viewN.read ? '#10b981' : 'var(--primary)', boxShadow: viewN.read ? '0 0 12px rgba(16,185,129,0.8)' : '0 0 12px rgba(59,130,246,0.8)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: viewN.read ? '#34d399' : 'var(--primary)' }}>{viewN.read ? 'Read' : 'Unread'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(viewN.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DismissIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
