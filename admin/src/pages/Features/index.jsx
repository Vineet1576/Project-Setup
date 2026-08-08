import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { featuresApi } from '../../methods/api/features';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';

export default function Features() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await featuresApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setFeatures(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load features', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (feature) => navigate(`/features/view/${feature.id || feature._id}`, { state: { record: feature } });
  const goEdit = (feature) => navigate(`/features/edit/${feature.id || feature._id}`, { state: { record: feature } });

  const handleDelete = async (feature) => {
    const ok = await confirm({
      title: 'Delete Feature?',
      message: `This will permanently delete "${feature.name}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await featuresApi.delete({ id: feature.id || feature._id });
      showToast('Feature deleted', 'success');
      fetchFeatures();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete feature', 'error');
    }
  };

  const handleToggleStatus = async (feature) => {
    const id = feature.id || feature._id;
    const next = feature.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await featuresApi.changeStatus({ id, status: next });
      showToast(`Feature ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchFeatures();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'name', label: 'Feature' },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'active'} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Features">
        <button onClick={() => navigate('/features/add')} className="button-primary">+ Add Feature</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search features..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={features} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
