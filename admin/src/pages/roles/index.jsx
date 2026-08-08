import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rolesApi } from '../../methods/api/roles';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';

export default function RoleList() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rolesApi.list({ page, limit: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setRoles(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.pagination?.total || res.data?.total || 0);
    } catch {
      showToast('Failed to load roles', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (role) => navigate(`/roles/view/${role.id || role._id}`, { state: { record: role } });
  const goEdit = (role) => navigate(`/roles/edit/${role.id || role._id}`, { state: { record: role } });

  const handleDelete = async (role) => {
    const ok = await confirm({
      title: 'Delete Role?',
      message: `This will permanently delete "${role.name}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await rolesApi.delete({ id: role.id || role._id });
      showToast('Role deleted', 'success');
      fetchRoles();
    } catch {
      showToast('Failed to delete role', 'error');
    }
  };

  const handleToggleStatus = async (role) => {
    const id = role.id || role._id;
    const next = role.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await rolesApi.changeStatus({ id, status: next });
      showToast(`Role ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'name', label: 'Role Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'active'} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Access" title="Roles">
        <button onClick={() => navigate('/roles/add')} className="button-primary">+ Add Role</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search roles..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={roles} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
