import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { plansApi } from '../../methods/api/plans';
import PlanForm from './PlanForm';

export default function EditPlanPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(plansApi.getById);
  return (
    <FormPageLayout eyebrow="Billing" title="Edit Plan" onBack={() => navigate('/plans')}>
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Plan not found.</div>
      ) : (
        <PlanForm record={record} onDone={() => navigate('/plans')} />
      )}
    </FormPageLayout>
  );
}
