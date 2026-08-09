import { useState, useEffect, useRef } from 'react';
import { usersApi } from '../../methods/api/users';
import { useToast } from '../../components/common/Toast';

export default function UserForm({ record, onDone, readOnly = false }) {
  const user = record;
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', mobileno: '', address: '', city: '', country: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const errorRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      mobileno: user?.mobileNo || user?.mobileno || '',
      address: user?.address || '',
      city: user?.city || '',
      country: user?.country || '',
    });
    setError('');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = user ? { ...form, id: user.id || user._id } : form;
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
      {error && <div ref={errorRef} className="status-message status-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
        <SectionTitle subtitle={readOnly ? 'Read-only summary of this user.' : 'Basic identity details shown across the app.'}>
          Personal information
        </SectionTitle>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Field label="First name">
            <input type="text" placeholder="e.g. Vineet" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
          <Field label="Last name">
            <input type="text" placeholder="e.g. Rana" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Field label="Email address">
            <input type="email" placeholder="e.g. user@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
          <Field label="Mobile number">
            <input type="tel" placeholder="e.g. +91 98765 43210" value={form.mobileno} onChange={(e) => setForm({ ...form, mobileno: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
        </div>

        <SectionTitle subtitle={readOnly ? 'Read-only summary of this address.' : 'Where this user is located.'}>
          Address details
        </SectionTitle>

        <Field label="Address" style={{ flex: '1 1 100%' }}>
          <input type="text" placeholder="e.g. 21, Park Street" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        </Field>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Field label="City">
            <input type="text" placeholder="e.g. New Delhi" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
          <Field label="Country">
            <input type="text" placeholder="e.g. India" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
          </Field>
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                {user ? 'Update User' : 'Create User'}
              </>
            )}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              Cancel
            </button>
          </div>
        )}
      </form>
    </>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{label}</span>
      {children}
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: 8, marginBottom: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{children}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14, background: 'rgba(255,255,255,0.04)', color: 'var(--ink)' };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
