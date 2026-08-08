import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { featuresApi } from '../../methods/api/features';
import FeatureForm from './FeatureForm';

export default function EditFeaturePage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(featuresApi.getById);
  return (
    <FormPageLayout eyebrow="Catalog" title="Edit Feature" onBack={() => navigate('/features')}>
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Feature not found.</div>
      ) : (
        <FeatureForm record={record} onDone={() => navigate('/features')} />
      )}
    </FormPageLayout>
  );
}
