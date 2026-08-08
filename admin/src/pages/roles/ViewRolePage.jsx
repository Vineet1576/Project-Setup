import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import RoleForm from './RoleForm';

export default function ViewRolePage() {
  const navigate = useNavigate();
  const { record, notFound } = useEntity(null);
  return (
    <FormPageLayout
      eyebrow="Access"
      title={`View ${record?.name || 'Role'}`}
      onBack={() => navigate('/roles')}
      actions={record && (
        <button type="button" className="button-primary" onClick={() => navigate(`/roles/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
      )}
    >
      {notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Role not found. Please open it from the roles list.</div>
      ) : (
        <RoleForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
