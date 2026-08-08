import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../../methods/api/categories';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';

const toText = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '-'));

export default function Categories() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setCategories(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (category) => navigate(`/categories/view/${category.id || category._id}`, { state: { record: category } });
  const goEdit = (category) => navigate(`/categories/edit/${category.id || category._id}`, { state: { record: category } });

  const handleDelete = async (category) => {
    const ok = await confirm({
      title: 'Delete Category?',
      message: `This will permanently delete "${toText(category.name)}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await categoriesApi.delete({ id: category.id || category._id });
      showToast('Category deleted', 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  const handleToggleStatus = async (category) => {
    const id = category.id || category._id;
    const next = category.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await categoriesApi.changeStatus({ id, status: next });
      showToast(`Category ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v) => toText(v) },
    { key: 'type', label: 'Type', render: (v) => toText(v) },
    { key: 'country', label: 'Country', render: (v) => toText(v) },
    { key: 'isParent', label: 'Parent', render: (v) => v ? 'Yes' : 'No' },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Categories">
        <button onClick={() => navigate('/categories/add')} className="button-primary">+ Add Category</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search categories..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={categories} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
