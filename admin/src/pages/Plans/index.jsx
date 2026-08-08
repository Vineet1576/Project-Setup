import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi } from '../../methods/api/plans';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { useConfirm } from '../../context/ConfirmContext';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';

const fmtPrice = (pricing) => {
  if (!Array.isArray(pricing) || pricing.length === 0) return '-';
  return pricing
    .map((p) => `$${(p.unit_amount || 0)} / ${p.interval || '-'}`)
    .join(', ');
};

export default function Plans() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await plansApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setPlans(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load plans', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (plan) => navigate(`/plans/view/${plan.id || plan._id}`, { state: { record: plan } });
  const goEdit = (plan) => navigate(`/plans/edit/${plan.id || plan._id}`, { state: { record: plan } });

  const handleDelete = async (plan) => {
    const ok = await confirm({
      title: 'Delete Plan?',
      message: `This will permanently delete "${plan.name}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await plansApi.delete({ id: plan.id || plan._id });
      showToast('Plan deleted', 'success');
      fetchPlans();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete plan', 'error');
    }
  };

  const handleToggleStatus = async (plan) => {
    const id = plan.id || plan._id;
    const next = plan.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await plansApi.changeStatus({ id, status: next });
      showToast(`Plan ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchPlans();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'name', label: 'Plan' },
    { key: 'plan_type', label: 'Type', render: (v) => v || '-' },
    { key: 'pricing', label: 'Pricing', render: (v) => fmtPrice(v) },
    { key: 'description', label: 'Description', render: (v) => v ? (
      <div style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--muted)', fontSize: 13 }} title={v}>{v}</div>
    ) : '-' },
    { key: 'recommended', label: 'Most Popular', render: (v) => v === 'yes' ? (
      <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Most Popular</span>
    ) : (
      <span style={{ color: 'var(--muted)' }}>-</span>
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'active'} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
  ];

  return (
    <div>
      <PageHeader eyebrow="Billing" title="Plans">
        <button onClick={() => navigate('/plans/add')} className="button-primary">+ Add Plan</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search plans..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={plans} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
