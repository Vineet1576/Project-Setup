import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import RoleForm from './RoleForm';

export default function AddRolePage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="Access" title="Add Role" onBack={() => navigate('/roles')}>
      <RoleForm onDone={() => navigate('/roles')} />
    </FormPageLayout>
  );
}
