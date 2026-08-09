import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import EmptyState from '../../components/common/EmptyState';
import { capitalizeName } from '../../utils/name';
import RoleForm from './RoleForm';

const STATUS_BADGE = {
  active: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
  inactive: { bg: 'rgba(217,119,6,0.14)', border: 'rgba(217,119,6,0.4)', text: '#fbbf24' },
};

export default function EditRolePage() {
  const navigate = useNavigate();
  const { record, notFound } = useEntity(null);

  const name = capitalizeName(record?.name) || 'Role';
  const status = record?.status || 'active';
  const badge = STATUS_BADGE[status] || STATUS_BADGE.active;

  return (
    <FormPageLayout
      eyebrow="Access"
      title={`Edit ${name}`}
      subtitle={record && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.text }}>
          {status}
        </span>
      )}
      onBack={() => navigate('/roles')}
    >
      {notFound ? (
        <EmptyState title="Role not found" description="Please open it from the roles list." />
      ) : (
        <RoleForm record={record} onDone={() => navigate('/roles')} />
      )}
    </FormPageLayout>
  );
}
