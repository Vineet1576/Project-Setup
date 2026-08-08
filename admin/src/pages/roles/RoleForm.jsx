import { useState, useEffect } from 'react';
import { rolesApi } from '../../methods/api/roles';
import { useToast } from '../../components/common/Toast';

export default function RoleForm({ record, onDone, readOnly = false }) {
  const role = record;
  const [form, setForm] = useState({ name: '', displayName: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({
      name: role?.name || '',
      displayName: role?.displayName || '',
      description: role?.description || '',
    });
    setError('');
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Role name is required'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        id: role?.id || role?._id,
        name: form.name.trim(),
        displayName: form.displayName.trim() || form.name.trim(),
        description: form.description,
        permissions: role?.permissions || [],
      };
      if (role) await rolesApi.update(payload);
      else {
        const { id, ...createPayload } = payload;
        await rolesApi.create(createPayload);
      }
      showToast(role ? 'Role updated' : 'Role created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save role';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="Role name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type="text" placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical' }} />
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (role ? 'Update' : 'Create')}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
          </div>
        )}
      </form>
    </>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
