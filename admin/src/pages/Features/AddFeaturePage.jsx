import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import FeatureForm from './FeatureForm';

export default function AddFeaturePage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="Catalog" title="Add Feature" onBack={() => navigate('/features')}>
      <FeatureForm onDone={() => navigate('/features')} />
    </FormPageLayout>
  );
}
