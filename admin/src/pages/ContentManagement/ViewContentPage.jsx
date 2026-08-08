import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { contentApi } from '../../methods/api/content';
import ContentForm from './ContentForm';

const CONTENT_STATUS = {
  active: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', text: '#86efac' },
  inactive: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5' },
};

export default function ViewContentPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(contentApi.getById);
  const status = record?.status || 'active';
  const statusMeta = CONTENT_STATUS[status] || CONTENT_STATUS.active;

  return (
    <FormPageLayout
      eyebrow="Site"
      title={`View ${record?.title || 'Content'}`}
      subtitle={record?.meta_title && (
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Meta: {record.meta_title}</span>
      )}
      onBack={() => navigate('/content-management')}
      actions={record && (
        <>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: `1px solid ${statusMeta.border}`, background: statusMeta.bg, color: statusMeta.text }}>
            {status}
          </span>
          <button type="button" className="button-primary" onClick={() => navigate(`/content-management/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
        </>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Content not found.</div>
      ) : (
        <ContentForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
