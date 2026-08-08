import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { plansApi } from '../../methods/api/plans';
import PlanForm from './PlanForm';

export default function ViewPlanPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(plansApi.getById);
  return (
    <FormPageLayout
      eyebrow="Billing"
      title={`View ${record?.name || 'Plan'}`}
      onBack={() => navigate('/plans')}
      actions={record && (
        <button type="button" className="button-primary" onClick={() => navigate(`/plans/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Plan not found.</div>
      ) : (
        <PlanForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
