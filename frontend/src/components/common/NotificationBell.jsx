import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { notificationsApi } from '../../methods/api/notifications';
import { useToast } from './Toast';
import { FaBell, FaTimes } from 'react-icons/fa';
import { formatNotificationType } from '../../utils/notificationType';

const fmtDate = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

export default function NotificationBell() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { notificationCount, refreshCount, markAllRead: markAllReadCtx } = useSocket();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localCount, setLocalCount] = useState(notificationCount);
  const wrapRef = useRef(null);

  useEffect(() => {
    setLocalCount(notificationCount);
  }, [notificationCount]);

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
    if (!next) return;
    setLoading(true);
    try {
      const res = await notificationsApi.list({ count: 8 });
      const list = res.data?.data || res.data?.docs || [];
      setItems(list);
      refreshCount(res.data?.unreadCount ?? 0);
      setLocalCount(res.data?.unreadCount ?? 0);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (n) => {
    if (n.read) return;
    try {
      await notificationsApi.markRead({ id: n._id || n.id });
      setItems((prev) => prev.map((x) => (x._id === (n._id || n.id) ? { ...x, read: true } : x)));
      setLocalCount((c) => Math.max(0, c - 1));
      refreshCount(localCount - 1);
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDismiss = async (n) => {
    try {
      await notificationsApi.dismiss({ id: n._id || n.id });
      setItems((prev) => prev.filter((x) => x._id !== (n._id || n.id)));
    } catch {
      showToast('Failed to dismiss', 'error');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead({});
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setLocalCount(0);
      markAllReadCtx();
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
      >
        <FaBell className="h-5 w-5" />
        {localCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1 text-[10px] font-bold text-white">
            {localCount > 99 ? '99+' : localCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-50 w-80 max-w-[calc(100vw-2rem)] divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#131318] shadow-[0_20px_48px_-12px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {items.length > 0 && localCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="animate-pulse divide-y divide-white/5">
                {[1, 2, 3].map((r) => (
                  <div key={r} className="px-4 py-3 space-y-1">
                    <div className={`h-3 w-${r === 1 ? '5/6' : r === 2 ? '2/3' : '4/5'} rounded bg-white/10`} />
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">No notifications</div>
            ) : (
              items.map((n) => {
                const nid = n._id || n.id;
                return (
                  <div
                    key={nid}
                    className={`px-4 py-3 transition-colors ${n.read ? 'bg-transparent' : 'bg-blue-500/5'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleMarkRead(n)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMarkRead(n)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium uppercase text-white/40">{formatNotificationType(n.type)}</span>
                          {!n.read && <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-white">{n.title}</div>
                        <div className="mt-0.5 text-xs text-white/60">{n.message}</div>
                        <div className="mt-1 text-[10px] text-white/30">{fmtDate(n.createdAt)}</div>
                      </div>
                      <button
                        onClick={() => handleDismiss(n)}
                        aria-label="Dismiss"
                        className="shrink-0 rounded p-1 text-white/40 hover:text-white/80 hover:bg-white/5"
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={() => { setOpen(false); navigate('/profile'); }}
              className="block w-full px-4 py-3 text-center text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              View profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}
