import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { authApi } from '../../methods/api/auth';
import { API_BASE } from '../../methods/api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { capitalizeName, getInitials } from '../../utils/name';

const toFullImage = (url) => (url && url.startsWith('http') ? url : `${API_BASE}/${url}`);

function resizeImage(file, maxSize = 512) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { auth, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = auth?.user;
  const fileRef = useRef(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', image: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fill = (u) => ({
    firstName: u?.firstName || '',
    lastName: u?.lastName || '',
    image: u?.image ? toFullImage(u.image) : (u?.profilePic || u?.avatar || ''),
    email: u?.email || '',
  });

  useEffect(() => { setForm(fill(user)); setImgError(false); }, [user]);

  const displayName = capitalizeName(`${form.firstName} ${form.lastName}`.trim() || user?.fullName || 'Admin');
  const initials = getInitials(displayName);

  const persistImage = async (image) => {
    const firstName = capitalizeName(form.firstName.trim());
    const lastName = capitalizeName(form.lastName.trim());
    await authApi.updateProfile({ firstName, lastName, image });
    updateUser({ firstName, lastName, image, fullName: `${firstName} ${lastName}`.trim() });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }

    setUploading(true);
    try {
      const imageBase64 = await resizeImage(file);
      const res = await authApi.uploadImage(imageBase64);
      const filePath = res.data?.filePath || res.data?.data?.filePath;
      if (!filePath) throw new Error('Upload failed');
      const full = toFullImage(filePath);
      setForm((f) => ({ ...f, image: full }));
      setImgError(false);
      if (!editing) await persistImage(full);
      showToast('Image uploaded', 'success');
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to upload image';
      showToast(message, 'error');
    } finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) { showToast('First name is required', 'error'); return; }
    setSaving(true);
    try {
      const firstName = capitalizeName(form.firstName.trim());
      const lastName = capitalizeName(form.lastName.trim());
      const image = form.image.trim();
      await authApi.updateProfile({ firstName, lastName, image });
      updateUser({ firstName, lastName, image, fullName: `${firstName} ${lastName}`.trim() });
      showToast('Profile updated', 'success');
      setEditing(false);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update profile';
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  const startEdit = () => { setForm(fill(user)); setEditing(true); };
  const cancelEdit = () => { setForm(fill(user)); setEditing(false); };

  const avatar = (
    <div className="profile-avatar-wrap" style={{ width: 104, height: 104, marginTop: -52 }}>
      <span className="profile-avatar-main" style={{ width: 104, height: 104, fontSize: 34, position: 'relative' }}>
        {form.image && !imgError ? (
          <img src={form.image} onError={() => setImgError(true)} alt={displayName} />
        ) : (
          <span>{initials}</span>
        )}
      </span>
      <button
        type="button"
        className="profile-avatar-edit"
        onClick={() => fileRef.current?.click()}
        aria-label="Upload profile image"
        disabled={uploading}
        title={uploading ? 'Uploading...' : 'Change photo'}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" subtitle="View and manage your personal information." />

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 20 }}>
        <div className="panel-card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center' }}>
          <div className="profile-cover" style={{ height: 96 }} />
          <div style={{ padding: '0 20px 22px' }}>
            {avatar}
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginTop: 14 }}>{displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{form.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 12px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Administrator
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => navigate('/change-password')}
                className="button-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="panel-card" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
          {editing ? (
            <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder="First name" />
                <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Last name" />
              </div>
              <Field label="Email" value={form.email} disabled />
              <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16 }}>
                <button type="submit" disabled={saving || uploading} className="button-primary" style={{ minWidth: 130 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={cancelEdit} className="button-secondary">Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Account Details</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Your personal information</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <InfoRow label="First name" value={capitalizeName(form.firstName || '-')} />
                <InfoRow label="Last name" value={capitalizeName(form.lastName || '-')} />
                <InfoRow label="Email" value={form.email || '-'} />
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <button type="button" onClick={startEdit} className="button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className="admin-field-input"
      />
    </label>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--hairline)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--body)' }}>{value}</span>
    </div>
  );
}
