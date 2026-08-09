import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { plansApi } from '../../methods/api/plans';
import PlanForm from './PlanForm';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import { useRecord } from '../../context/RecordContext';

export default function ViewPlanPage() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { record, loading, notFound } = useEntity(plansApi.getById);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Plan?',
      message: `This will permanently delete "${record?.name || 'this plan'}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await plansApi.delete({ id: record.id || record._id });
      showToast('Plan deleted', 'success');
      navigate('/plans');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete plan', 'error');
    }
  };

  return (
    <FormPageLayout
      eyebrow="Billing"
      title={`View ${record?.name || 'Plan'}`}
      onBack={() => navigate('/plans')}
      actions={record && (
        <>
          <button type="button" className="button-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            Delete
          </button>
          <button type="button" className="button-primary" onClick={() => { setActiveId(record.id || record._id); navigate('/plans/edit', { state: { record } }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            Edit
          </button>
        </>
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
