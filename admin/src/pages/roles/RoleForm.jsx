import { useState, useEffect } from 'react';
import { rolesApi } from '../../api/roles';
import Modal from '../../components/Modal';

export default function RoleForm({ open, onClose, role, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setForm({ name: role.name || '', description: role.description || '' });
    } else {
      setForm({ name: '', description: '' });
    }
    setError('');
  }, [role, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Role name is required'); return; }
    setError('');
    setSaving(true);
    try {
      if (role) await rolesApi.update({ id: role._id, ...form });
      else await rolesApi.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save role');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Edit Role' : 'Add Role'}>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" placeholder="Role name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
        <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (role ? 'Update' : 'Create')}</button>
          <button type="button" onClick={onClose} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
