import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi } from '../../methods/api/content';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';

export default function ContentManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contentApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setItems(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load content', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (item) => navigate(`/content-management/view/${item.id || item._id}`, { state: { record: item } });
  const goEdit = (item) => navigate(`/content-management/edit/${item.id || item._id}`, { state: { record: item } });

  const handleToggleStatus = async (item) => {
    const id = item.id || item._id;
    const next = item.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await contentApi.changeStatus({ id, status: next, title: item.title });
      showToast(`Content ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug', render: (v) => v || '-' },
    { key: 'type', label: 'Type', render: (v) => v || '-' },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'active'} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Site" title="Content Management">
        <button onClick={() => navigate('/content-management/add')} className="button-primary">+ Add Content</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search by title or slug..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={items} onView={goView} onEdit={goEdit} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
