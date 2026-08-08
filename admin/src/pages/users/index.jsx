import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../methods/api/users';
import { rolesApi } from '../../methods/api/roles';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../components/common/Toast';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import StatusToggle from '../../components/common/StatusToggle';
import ApprovalStatusMenu from '../../components/common/ApprovalStatusMenu';
import Pagination from '../../components/common/Pagination';

export default function UserList() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const [approvalTogglingId, setApprovalTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let active = true;
    const resolveUserRole = async () => {
      try {
        const res = await rolesApi.list({ limit: 100 });
        const roles = res.data?.data || res.data?.docs || res.data || [];
        const role = roles.find((r) => (r.name || '').toLowerCase() === 'user')
          || roles.find((r) => (r.displayName || '').toLowerCase() === 'user');
        if (active) setUserRoleId(role?._id || role?.id || '');
      } catch { /* keep empty */ }
    };
    resolveUserRole();
    return () => { active = false; };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, count: pageSize, role: userRoleId || undefined, search: debouncedSearch || undefined, status: status || undefined, approvalStatus: approvalStatus || undefined });
      setUsers(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || res.data?.pagination?.total || 0);
    } catch {
      showToast('Failed to load users', 'error');
    } finally { setLoading(false); }
  }, [showToast, userRoleId, debouncedSearch, status, approvalStatus, page, pageSize]);

  useEffect(() => {
    if (userRoleId) fetchUsers();
  }, [fetchUsers, userRoleId]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, approvalStatus]);

  const goView = (user) => navigate(`/users/view/${user.id || user._id}`, { state: { record: user } });
  const goEdit = (user) => navigate(`/users/edit/${user.id || user._id}`, { state: { record: user } });

  const handleDelete = async (user) => {
    const ok = await confirm({
      title: 'Delete User?',
      message: `This will permanently delete "${user.email}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await usersApi.delete({ id: user.id || user._id });
      showToast('User deleted', 'success');
      fetchUsers();
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    const id = user.id || user._id;
    const next = user.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await usersApi.changeStatus({ id, status: next });
      showToast(`User ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const toApproval = (v) => (v === 'completed' ? 'approved' : v);

  const handleApprovalSelect = async (user, approvalStatus) => {
    const id = user.id || user._id;
    setApprovalTogglingId(id);
    try {
      await usersApi.changeApprovalStatus({ id, approvalStatus });
      showToast(`Approval status set to ${approvalStatus}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update approval status', 'error');
    } finally {
      setApprovalTogglingId('');
    }
  };

  const columns = [
    { key: 'firstName', label: 'Name', render: (_, row) => capitalizeName(`${row.firstName || ''} ${row.lastName || ''}`.trim()) || '-' },
    { key: 'email', label: 'Email' },
    { key: 'mobileNo', label: 'Mobile' },
    { key: 'status', label: 'Status', render: (v, row) => {
      const busy = togglingId === (row.id || row._id);
      return (
        <StatusToggle
          value={v}
          loading={busy}
          onToggle={() => handleToggleStatus(row)}
          title={`Click to ${v === 'active' ? 'deactivate' : 'activate'}`}
        />
      );
    }},
    { key: 'approvalStatus', label: 'Approval Status', render: (v, row) => {
      const busy = approvalTogglingId === (row.id || row._id);
      return (
        <ApprovalStatusMenu
          value={toApproval(v)}
          loading={busy}
          onSelect={(status) => handleApprovalSelect(row, status)}
        />
      );
    }},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="People" title="Users">
        <button onClick={() => navigate('/users/add')} className="button-primary">+ Add User</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search users by name or email..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        secondaryValue={approvalStatus}
        onSecondaryChange={setApprovalStatus}
        secondaryPlaceholder="All approval status"
        secondaryOptions={[
          { value: 'approved', label: 'Approved' },
          { value: 'pending', label: 'Pending' },
          { value: 'rejected', label: 'Rejected' },
        ]}
      />

      <DataTable columns={columns} data={users} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
