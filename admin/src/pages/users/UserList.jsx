import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/users';
import DataTable from '../../components/DataTable';
import UserForm from './UserForm';

const columns = [
  { key: 'firstName', label: 'Name', render: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || '-' },
  { key: 'email', label: 'Email' },
  { key: 'mobileno', label: 'Mobile' },
  { key: 'status', label: 'Status', render: (v) => (
    <span style={{ color: v === 'active' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{v}</span>
  )},
  { key: 'isVerified', label: 'Verified', render: (v) => v === 'Y' ? '✅' : '❌' },
];

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ limit: 100 });
      setUsers(res.data?.data?.docs || res.data?.docs || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleEdit = (user) => {
    setEditUser(user);
    setShowForm(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.email}"?`)) return;
    try { await usersApi.delete({ id: user._id }); fetchUsers(); } catch {}
  };

  const handleFormClose = () => { setShowForm(false); setEditUser(null); };

  return (
    <div>
      <div className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p className="admin-eyebrow">People</p>
          <h1 style={{ fontSize: 22 }}>Users</h1>
        </div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="button-primary">+ Add User</button>
      </div>

      <DataTable columns={columns} data={users} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />

      <UserForm open={showForm} onClose={handleFormClose} user={editUser} onSaved={() => { handleFormClose(); fetchUsers(); }} />
    </div>
  );
}
