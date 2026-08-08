const TYPE_ICON = {
  subscription_reminder: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 16 9 13 2 20" /></svg>
  ),
  subscription_expired: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
  ),
  payment_success: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="9 11 12 14 15.17 11" /></svg>
  ),
  payment_failed: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
  ),
  new_message: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4v-5.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  account_approved: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
};

const TYPE_GRADIENT = {
  payment_success: 'from-emerald-500 to-teal-400',
  payment_failed: 'from-red-500 to-rose-400',
  subscription_expired: 'from-orange-500 to-amber-400',
  account_approved: 'from-yellow-400 to-amber-400',
  system: 'from-purple-500 to-indigo-500',
  default: 'from-blue-500 to-indigo-400',
};

export default function NotificationPopup({ notification, onClose }) {
  const type = notification?.type;
  const icon = TYPE_ICON[type] || TYPE_ICON.default;
  const gradient = TYPE_GRADIENT[type] || TYPE_GRADIENT.default;

  return (
    <div
      className="
        relative flex items-start gap-3 rounded-[14px] border border-white/10
        bg-[#131318]/95 px-4 py-3.5 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.7)]
        animate-pop-in
      "
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-[10px] font-medium uppercase text-white/40">{type || 'notification'}</div>
        <div className="mt-0.5 text-sm font-semibold text-white">{notification?.title || 'New notification'}</div>
        {notification?.message && <div className="mt-1 text-xs text-white/60 line-clamp-2">{notification.message}</div>}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-white/30 hover:text-white/80 hover:bg-white/5 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${gradient}`} style={{ animation: 'progress 5s linear' }} />
    </div>
  );
}
