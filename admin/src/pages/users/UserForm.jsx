import { useState, useEffect } from 'react';
import { usersApi } from '../../methods/api/users';
import { rolesApi } from '../../methods/api/roles';
import { useToast } from '../../components/common/Toast';

export default function UserForm({ record, onDone, readOnly = false }) {
  const user = record;
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobileno: '', role: '' });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      mobileno: user?.mobileNo || user?.mobileno || '',
      role: user?.role?._id || user?.role || '',
    });
    setError('');
  }, [user]);

  useEffect(() => {
    rolesApi.list({ count: 100 })
      .then((res) => setRoles(res.data?.data || res.data?.docs || []))
      .catch(() => setError('Failed to load roles'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = user ? { ...form, id: user.id || user._id } : form;
      if (!user && !payload.password) { setError('Password is required for new users'); setSaving(false); return; }
      if (user) delete payload.password;
      if (user) await usersApi.update(payload);
      else await usersApi.create(payload);
      showToast(user ? 'User updated' : 'User created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save user';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          <input type="text" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        </div>
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type={user ? 'text' : 'password'} placeholder={user ? 'Leave blank to keep current' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} minLength={8} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type="tel" placeholder="Mobile" value={form.mobileno} onChange={(e) => setForm({ ...form, mobileno: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle}>
          <option value="">Select role...</option>
          {roles.map((r) => (
            <option key={r.id || r._id} value={r.id || r._id}>{r.displayName || r.name}</option>
          ))}
        </select>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (user ? 'Update' : 'Create')}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
          </div>
        )}
      </form>
    </>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
