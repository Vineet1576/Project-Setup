import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { contentApi } from '../../methods/api/content';
import ContentForm from './ContentForm';

export default function EditContentPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(contentApi.getById);
  return (
    <FormPageLayout eyebrow="Site" title="Edit Content" onBack={() => navigate('/content-management')}>
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Content not found.</div>
      ) : (
        <ContentForm record={record} onDone={() => navigate('/content-management')} />
      )}
    </FormPageLayout>
  );
}
