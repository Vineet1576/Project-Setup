const TYPE_LABELS = {
  subscription_reminder: 'Subscription Reminder',
  subscription_expired: 'Subscription Expired',
  payment_success: 'Payment Success',
  payment_failed: 'Payment Failed',
  new_message: 'New Message',
  account_approved: 'Account Approved',
  admin_broadcast: 'Admin Broadcast',
  system: 'System',
};

export const formatNotificationType = (type) =>
  TYPE_LABELS[type] ||
  String(type || '')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
