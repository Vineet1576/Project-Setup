import { useState, useEffect } from 'react';
import { usersApi } from '../../api/users';
import Modal from '../../components/Modal';

export default function UserForm({ open, onClose, user, onSaved }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobileno: '', role: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', password: '', mobileno: user.mobileno || '', role: user.role?._id || user.role || '' });
    } else {
      setForm({ firstName: '', lastName: '', email: '', password: '', mobileno: '', role: '' });
    }
    setError('');
  }, [user, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = user ? { ...form, id: user._id } : form;
      if (!user && !payload.password) { setError('Password is required for new users'); setSaving(false); return; }
      if (user) delete payload.password;
      if (user) await usersApi.update(payload);
      else await usersApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required style={inputStyle} />
          <input type="text" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required style={inputStyle} />
        </div>
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={inputStyle} />
        <input type={user ? 'text' : 'password'} placeholder={user ? 'Leave blank to keep current' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} minLength={6} style={inputStyle} />
        <input type="tel" placeholder="Mobile" value={form.mobileno} onChange={(e) => setForm({ ...form, mobileno: e.target.value })} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (user ? 'Update' : 'Create')}</button>
          <button type="button" onClick={onClose} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
