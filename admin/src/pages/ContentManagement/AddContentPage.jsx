import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import ContentForm from './ContentForm';

export default function AddContentPage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="Site" title="Add Content" onBack={() => navigate('/content-management')}>
      <ContentForm onDone={() => navigate('/content-management')} />
    </FormPageLayout>
  );
}
