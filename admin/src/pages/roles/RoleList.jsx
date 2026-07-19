import { useState, useEffect, useCallback } from 'react';
import { rolesApi } from '../../api/roles';
import DataTable from '../../components/DataTable';
import RoleForm from './RoleForm';

const columns = [
  { key: 'name', label: 'Role Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status', render: (v) => (
    <span style={{ color: v === 'active' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{v || 'active'}</span>
  )},
];

export default function RoleList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rolesApi.list({ limit: 100 });
      setRoles(res.data?.data?.docs || res.data?.docs || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try { await rolesApi.delete({ id: role._id }); fetchRoles(); } catch {}
  };

  return (
    <div>
      <div className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p className="admin-eyebrow">Access</p>
          <h1 style={{ fontSize: 22 }}>Roles</h1>
        </div>
        <button onClick={() => { setEditRole(null); setShowForm(true); }} className="button-primary">+ Add Role</button>
      </div>

      <DataTable columns={columns} data={roles} onDelete={handleDelete} loading={loading} />

      <RoleForm open={showForm} onClose={() => { setShowForm(false); setEditRole(null); }} role={editRole} onSaved={() => { setShowForm(false); setEditRole(null); fetchRoles(); }} />
    </div>
  );
}
