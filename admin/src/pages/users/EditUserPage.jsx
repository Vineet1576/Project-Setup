import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { usersApi } from '../../methods/api/users';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import UserForm from './UserForm';

const STATUS_BADGE = {
  active: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
  inactive: { bg: 'rgba(217,119,6,0.14)', border: 'rgba(217,119,6,0.4)', text: '#fbbf24' },
  blocked: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', text: '#f87171' },
};

export default function EditUserPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(usersApi.getById);

  const name = capitalizeName(`${record?.firstName || ''} ${record?.lastName || ''}`.trim()) || capitalizeName(record?.fullName) || 'User';
  const email = record?.email || '';
  const status = record?.status || 'active';
  const statusBadge = STATUS_BADGE[status] || STATUS_BADGE.active;

  return (
    <FormPageLayout
      eyebrow="People"
      title={record ? `Edit ${name}` : 'Edit User'}
      subtitle={record && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {email && <span style={{ fontSize: 13, color: 'var(--body)' }}>{email}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 999, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
            Member since {fmtDateTime(record?.firstJoinDate || record?.createdAt)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 999, border: `1px solid ${statusBadge.border}`, background: statusBadge.bg, color: statusBadge.text, textTransform: 'capitalize' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusBadge.text }} />
            {status}
          </span>
        </span>
      )}
      onBack={() => navigate('/users')}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <EmptyState title="User not found" description="Please open it from the users list." />
      ) : (
        <UserForm record={record} onDone={() => navigate('/users')} />
      )}
    </FormPageLayout>
  );
}
