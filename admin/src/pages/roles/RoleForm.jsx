import { useState, useEffect, useRef } from 'react';
import { rolesApi } from '../../methods/api/roles';
import { useToast } from '../../components/common/Toast';
import { capitalizeName } from '../../utils/name';

export default function RoleForm({ record, onDone, readOnly = false }) {
  const role = record;
  const [form, setForm] = useState({ name: '', displayName: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const errorRef = useRef(null);
  const { showToast } = useToast();

  const status = role?.status || 'active';

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

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
      {error && <div ref={errorRef} className="status-message status-error">{error}</div>}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1 1 420px', minWidth: 0 }}>
          <SectionTitle subtitle={readOnly ? 'Read-only summary of this role.' : 'Give the role a clear identity shown across the app.'}>
            Role details
          </SectionTitle>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Role name">
              <input type="text" placeholder="e.g. Editor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
            </Field>
            <Field label="Display name">
              <input type="text" placeholder="e.g. Content Editor" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
            </Field>
          </div>

          <Field label="Description" style={{ flex: '0 0 auto' }}>
            <textarea placeholder="What does this role do? (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical', minHeight: 96 }} />
          </Field>

          {!readOnly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {role ? 'Update Role' : 'Create Role'}
                </>
              )}</button>
              <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Cancel
              </button>
            </div>
          )}
        </form>

        <div style={{ flex: '0 1 320px', minWidth: 270, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RoleSummary name={form.name || capitalizeName(role?.name)} displayName={form.displayName || capitalizeName(role?.displayName)} description={form.description || role?.description} status={status} />
        </div>
      </div>
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

function RoleSummary({ name, displayName, description, status }) {
  const active = status === 'active';
  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(20,20,28,0.9) 0%, rgba(16,16,22,0.95) 100%)', color: '#fff', border: '1px solid var(--hairline)', borderRadius: 16, boxShadow: '0 20px 48px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06)', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24, boxShadow: '0 10px 28px -8px rgba(59,130,246,0.7)' }}>
        {(name || 'R').charAt(0).toUpperCase()}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>{name || 'Role'}</div>
      {displayName && displayName !== name && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{displayName}</div>}
      <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: active ? 'rgba(34,197,94,0.14)' : 'rgba(217,119,6,0.14)', color: active ? '#4ade80' : '#fbbf24', border: `1px solid ${active ? 'rgba(34,197,94,0.4)' : 'rgba(217,119,6,0.4)'}` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#4ade80' : '#fbbf24' }} />
        {active ? 'Active' : 'Inactive'}
      </div>
      {description && <div style={{ fontSize: 13, color: 'var(--body)', marginTop: 12, textAlign: 'left', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hairline)', borderRadius: 12, padding: '12px 14px' }}>{description}</div>}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
