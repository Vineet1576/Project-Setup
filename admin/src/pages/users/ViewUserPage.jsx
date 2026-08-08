import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { usersApi } from '../../methods/api/users';
import { capitalizeName } from '../../utils/name';
import UserForm from './UserForm';

const ROLE_BADGE = {
  admin: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5' },
  moderator: { bg: 'rgba(132,94,246,0.12)', border: 'rgba(132,94,246,0.35)', text: '#c4b5ff' },
  user: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93c5fd' },
};

export default function ViewUserPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(usersApi.getById);
  const name = capitalizeName(`${record?.firstName || ''} ${record?.lastName || ''}`.trim()) || 'User';
  const email = record?.email || '';
  const roleName = typeof record?.role === 'object' ? (record.role.displayName || record.role.name || record.role.roleName || '') : (record?.roleName || record?.role || '');

  return (
    <FormPageLayout
      eyebrow="People"
      title={`View ${name}`}
      subtitle={email && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--body)' }}>{email}</span>
          {roleName && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: `1px solid ${(ROLE_BADGE[roleName.toLowerCase()] || ROLE_BADGE.user).border}`, background: (ROLE_BADGE[roleName.toLowerCase()] || ROLE_BADGE.user).bg, color: (ROLE_BADGE[roleName.toLowerCase()] || ROLE_BADGE.user).text }}>
            {roleName}
          </span>
          )}
        </span>
      )}
      onBack={() => navigate('/users')}
      actions={record && (
        <button type="button" className="button-primary" onClick={() => navigate(`/users/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>User not found.</div>
      ) : (
        <UserForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}

