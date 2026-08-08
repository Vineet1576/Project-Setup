import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { faqsApi } from '../../methods/api/faqs';
import FaqForm from './FaqForm';

export default function ViewFaqPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(faqsApi.getById);
  const faq = record;
  const category = faq?.category || 'Uncategorized';

  return (
    <FormPageLayout
      eyebrow="Support"
      title="FAQ Details"
      subtitle={faq?.question ? (
        <span style={{ fontSize: 13, color: 'var(--body)' }}>{faq.question}</span>
      ) : undefined}
      onBack={() => navigate('/faqs')}
      actions={faq && (
        <>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: '1px solid var(--hairline)', background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
            {category}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Order: {faq?.order ?? 0}</span>
          <button
            type="button"
            onClick={() => navigate(`/faqs/edit/${faq.id || faq._id}`, { state: { record: faq } })}
            className="button-primary"
          >
            Edit FAQ
          </button>
        </>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound || !faq ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>FAQ not found.</div>
      ) : (
        <FaqForm record={faq} readOnly onDone={() => navigate('/faqs')} />
      )}
    </FormPageLayout>
  );
}

