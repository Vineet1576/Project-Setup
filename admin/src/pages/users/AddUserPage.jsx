import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import UserForm from './UserForm';

export default function AddUserPage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="People" title="Add User" onBack={() => navigate('/users')}>
      <UserForm onDone={() => navigate('/users')} />
    </FormPageLayout>
  );
}
