import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { featuresApi } from '../../methods/api/features';
import FeatureForm from './FeatureForm';

export default function ViewFeaturePage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(featuresApi.getById);
  const name = typeof record?.name === 'string' ? record.name : (record?.name || 'Feature');
  return (
    <FormPageLayout
      eyebrow="Catalog"
      title={`View ${name}`}
      onBack={() => navigate('/features')}
      actions={record && (
        <button type="button" className="button-primary" onClick={() => navigate(`/features/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Feature not found.</div>
      ) : (
        <FeatureForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
