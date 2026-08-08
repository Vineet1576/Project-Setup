import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import PlanForm from './PlanForm';

export default function AddPlanPage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="Billing" title="Add Plan" onBack={() => navigate('/plans')}>
      <PlanForm onDone={() => navigate('/plans')} />
    </FormPageLayout>
  );
}
