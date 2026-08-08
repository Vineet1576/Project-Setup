import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import RoleForm from './RoleForm';

export default function EditRolePage() {
  const navigate = useNavigate();
  const { record, notFound } = useEntity(null);
  return (
    <FormPageLayout eyebrow="Access" title="Edit Role" onBack={() => navigate('/roles')}>
      {notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Role not found. Please open it from the roles list.</div>
      ) : (
        <RoleForm record={record} onDone={() => navigate('/roles')} />
      )}
    </FormPageLayout>
  );
}
