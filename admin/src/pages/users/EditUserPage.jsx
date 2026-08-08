import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { usersApi } from '../../methods/api/users';
import UserForm from './UserForm';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(usersApi.getById);
  return (
    <FormPageLayout eyebrow="People" title="Edit User" onBack={() => navigate('/users')}>
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>User not found.</div>
      ) : (
        <UserForm record={record} onDone={() => navigate('/users')} />
      )}
    </FormPageLayout>
  );
}
