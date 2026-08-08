import { FaBell, FaTimes, FaCheck, FaBan, FaEnvelope, FaStar, FaInfoCircle } from 'react-icons/fa';

const TYPE_ICON = {
  subscription_reminder: <FaEnvelope className="h-4 w-4" />,
  subscription_expired: <FaBan className="h-4 w-4" />,
  payment_success: <FaCheck className="h-4 w-4" />,
  payment_failed: <FaBan className="h-4 w-4" />,
  new_message: <FaEnvelope className="h-4 w-4" />,
  account_approved: <FaStar className="h-4 w-4" />,
  system: <FaInfoCircle className="h-4 w-4" />,
  default: <FaBell className="h-4 w-4" />,
};

const TYPE_GRADIENT = {
  payment_success: 'from-emerald-500 to-teal-500',
  payment_failed: 'from-red-500 to-rose-500',
  subscription_expired: 'from-orange-500 to-amber-500',
  account_approved: 'from-yellow-400 to-amber-500',
  default: 'from-blue-500 to-indigo-500',
};

export default function NotificationPopup({ notification, onClose }) {
  const type = notification?.type;
  const icon = TYPE_ICON[type] || TYPE_ICON.default;
  const gradient = TYPE_GRADIENT[type] || TYPE_GRADIENT.default;

  return (
    <div
      className={`
        relative flex w-full max-w-sm items-start gap-3 rounded-xl border border-white/10
        bg-[#131318]/95 p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]
        animate-pop-in
      `}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r ${gradient} text-white`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-xs font-medium uppercase text-white/50">{type || 'notification'}</div>
        <div className="mt-0.5 text-sm font-semibold text-white">{notification?.title || 'New notification'}</div>
        {notification?.message && (
          <div className="mt-1 text-sm text-white/70 line-clamp-2">{notification.message}</div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors"
      >
        <FaTimes className="h-3 w-3" />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${gradient}`}
        style={{ animation: 'progress 4s linear' }}
      />
    </div>
  );
}
