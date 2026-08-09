import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import StatusToggle from '../../components/common/StatusToggle';
import ApprovalStatusMenu from '../../components/common/ApprovalStatusMenu';
import { usersApi } from '../../methods/api/users';
import { API_BASE } from '../../methods/api/apiClient';
import { capitalizeName, getInitials } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import { useRecord } from '../../context/RecordContext';

const toFullImage = (url) => (url && url.startsWith('http') ? url : `${API_BASE}/${url}`);

const ROLE_BADGE = {
  admin: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5' },
  moderator: { bg: 'rgba(132,94,246,0.12)', border: 'rgba(132,94,246,0.35)', text: '#c4b5ff' },
  user: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd' },
};

const toApproval = (v) => (v === 'completed' ? 'approved' : v);

const getSubscriptionInterval = (sub) => {
  const iv = sub?.interval;
  if (!iv) return { type: '', count: 1 };
  if (typeof iv === 'string') {
    const parts = iv.split(':');
    return { type: parts[0] || iv, count: Number(parts[1]) || 1 };
  }
  return { type: iv.type || '', count: Number(iv.interval_count) || 1 };
};

const intervalLabel = (type, count = 1) => {
  if (type === 'month') return count > 1 ? `Every ${count} months` : 'Monthly';
  if (type === 'year') return count > 1 ? `Every ${count} years` : 'Annual';
  return type ? capitalizeName(type) : '-';
};

const durationLabel = (type, count = 1) => {
  if (type === 'month') return count > 1 ? `${count} months` : '1 month';
  if (type === 'year') return count > 1 ? `${count} years` : '1 year';
  return '-';
};

const matchedPricing = (plan, type, count) =>
  Array.isArray(plan?.pricing)
    ? plan.pricing.find((p) => (p.interval || '').toLowerCase() === type.toLowerCase() && (Number(p.interval_count) || 1) === count)
    : null;

const priceLabel = (entry) => {
  if (!entry) return undefined;
  const amt = (Number(entry.unit_amount) || 0) / 100;
  const suffix = entry.interval === 'year' ? '/yr' : '/mo';
  return `$${amt.toFixed(2)} ${suffix}`;
};

export default function ViewUserPage() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { record, loading, notFound, refetch } = useEntity(usersApi.getById);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const name = capitalizeName(`${record?.firstName || ''} ${record?.lastName || ''}`.trim()) || capitalizeName(record?.fullName) || 'User';
  const email = record?.email || '';
  const roleName = typeof record?.role === 'object'
    ? (record.role.displayName || record.role.name || record.role.roleName || '')
    : (record?.roleName || record?.role || '');
  const roleBadge = ROLE_BADGE[roleName.toLowerCase()] || ROLE_BADGE.user;
  const status = record?.status || 'active';
  const approval = toApproval(record?.approvalStatus || 'approved');

  const handleToggleStatus = async () => {
    const next = status === 'active' ? 'inactive' : 'active';
    setStatusLoading(true);
    try {
      await usersApi.changeStatus({ id: record.id || record._id, status: next });
      showToast(`User ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApprovalSelect = async (approvalStatus) => {
    setApprovalLoading(true);
    try {
      await usersApi.changeApprovalStatus({ id: record.id || record._id, approvalStatus });
      showToast(`Approval status set to ${approvalStatus}`, 'success');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update approval status', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const mobile = [record?.dialCode, record?.mobileno].filter(Boolean).join(' ');
  const address = [record?.address, record?.city, record?.state, record?.country, record?.pinCode].filter(Boolean).join(', ');
  const plan = record?.planId || null;
  const subscription = record?.subscriptionId || null;
  const { type: intervalType, count: intervalCount } = getSubscriptionInterval(subscription);
  const priceEntry = matchedPricing(plan, intervalType, intervalCount);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete User?',
      message: `This will permanently delete "${email || name}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await usersApi.delete({ id: record.id || record._id });
      showToast('User deleted', 'success');
      navigate('/users');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <FormPageLayout
      eyebrow="People"
      title={`View ${name}`}
      subtitle={record && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {email && <span style={{ fontSize: 13, color: 'var(--body)' }}>{email}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 999, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
            Member since {fmtDateTime(record?.firstJoinDate || record?.createdAt)}
          </span>
        </span>
      )}
      onBack={() => navigate('/users')}
      actions={record && (
        <>
          <button type="button" className="button-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            Delete
          </button>
          <button type="button" className="button-primary" onClick={() => { setActiveId(record.id || record._id); navigate('/users/edit', { state: { record } }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            Edit
          </button>
        </>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <EmptyState title="User not found" description="Please open it from the users list." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ProfileHero
            name={name}
            email={email}
            image={record?.image ? toFullImage(record.image) : ''}
            roleName={roleName}
            roleBadge={roleBadge}
          >
            <StatusToggle
              value={status}
              loading={statusLoading}
              onToggle={handleToggleStatus}
              title={`Click to ${status === 'active' ? 'deactivate' : 'activate'} this user`}
            />
            <ApprovalStatusMenu
              value={approval}
              loading={approvalLoading}
              onSelect={handleApprovalSelect}
            />
          </ProfileHero>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <DetailCard icon={ContactIcon} title="Contact Information">
              <InfoRow label="Email" value={email} />
              <InfoRow label="Mobile" value={mobile || undefined} />
              <InfoRow label="Address" value={record?.address || undefined} />
              <InfoRow label="City" value={capitalizeName(record?.city)} />
              <InfoRow label="State" value={capitalizeName(record?.state)} />
              <InfoRow label="Country" value={capitalizeName(record?.country)} />
              <InfoRow label="Pin code" value={record?.pinCode} />
            </DetailCard>

            <DetailCard icon={AccountIcon} title="Account Information">
              <InfoRow label="Role" value={<span style={{ color: roleBadge.text, fontWeight: 600, textTransform: 'capitalize' }}>{roleName || '-'}</span>} />
              <InfoRow label="Status" value={capitalizeName(status)} />
              <InfoRow label="Approval status" value={capitalizeName(approval)} />
              <InfoRow label="Email verified" value={record?.isVerified === 'Y' ? 'Yes' : 'No'} />
              <InfoRow label="Last login" value={record?.lastLoginDate ? fmtDateTime(record.lastLoginDate) : 'Never'} />
              <InfoRow label="Account created" value={fmtDateTime(record?.createdAt)} />
            </DetailCard>

            <DetailCard icon={SubscriptionIcon} title="Subscription">
              {plan ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', margin: '2px 0 8px' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                    {(plan?.name || 'P').charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan?.name || 'Plan'}</div>
                  </div>
                  {priceEntry && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#93c5fd' }}>{priceLabel(priceEntry)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 13, color: 'var(--muted)' }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="m8 12 4 4 4-4" /></svg>
                  No subscription yet
                </div>
              )}
              <InfoRow label="Plan type" value={plan?.plan_type ? capitalizeName(plan.plan_type) : undefined} />
              <InfoRow label="Billing cycle" value={intervalLabel(intervalType, intervalCount)} />
              <InfoRow label="Duration" value={durationLabel(intervalType, intervalCount)} />
              <InfoRow label="Subscription status" value={subscription?.status ? capitalizeName(subscription.status) : undefined} />
              <InfoRow label="Valid until" value={subscription?.valid_upto ? fmtDateTime(subscription.valid_upto) : undefined} />
            </DetailCard>
          </div>
        </div>
      )}
    </FormPageLayout>
  );
}

function ProfileHero({ name, email, image, roleName, roleBadge, children }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = image && !imgFailed;
  return (
    <div style={{ background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)', border: '1px solid var(--hairline)', borderRadius: 18, boxShadow: '0 20px 48px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06)', padding: 24, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
      {showImage ? (
        <img src={image} alt={name} onError={() => setImgFailed(true)} style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', boxShadow: '0 10px 28px -8px rgba(59,130,246,0.6)' }} />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24, boxShadow: '0 10px 28px -8px rgba(59,130,246,0.7)' }}>
          {getInitials(name) || 'U'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{name}</span>
          {roleName && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: `1px solid ${roleBadge.border}`, background: roleBadge.bg, color: roleBadge.text }}>
              {roleName}
            </span>
          )}
        </div>
        {email && <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 2 }}>{email}</div>}
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DetailCard({ icon, title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}

const ContactIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
);

const AccountIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h2" /><path d="M7 13h2" /><path d="M15 9h2" /><path d="M15 13h2" /><path d="M7 17h10" /></svg>
);

const SubscriptionIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);
