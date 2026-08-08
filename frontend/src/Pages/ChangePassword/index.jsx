import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/layout';
import ProfileSidebar from '../../components/global/profilePanels/ProfileSidebar';
import { authApi } from '../../methods/api/auth';
import { useToast } from '../../components/common/Toast';

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="m1 1 22 22" /><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" /></svg>
);

export default function ChangePassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [eyes, setEyes] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) { showToast('Current password is required', 'error'); return; }
    if (form.newPassword.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (form.newPassword !== form.confirmPassword) { showToast('New passwords do not match', 'error'); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Password changed successfully', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      navigate('/profile');
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password';
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <Layout wide>
      <div className="flex flex-col lg:flex-row">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-8">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div className="panel-card" style={{ maxWidth: 460, width: '100%', padding: '36px 36px 30px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.1)', fontSize: 12, fontWeight: 600, color: '#7ab3fb' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Security
                  </span>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 14 }}>
                    Change Password
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
                    Update the password used to sign in to your account.
                  </p>
                  <div style={{ margin: '18px auto 0', height: 1, width: 80, background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
                </div>

                <form onSubmit={handleSubmit} noValidate style={{ marginTop: 26 }}>
                  <PasswordField
                    label="Current Password"
                    value={form.currentPassword}
                    onChange={(v) => setForm({ ...form, currentPassword: v })}
                    placeholder="Enter current password"
                    show={eyes.current}
                    onToggle={() => setEyes({ ...eyes, current: !eyes.current })}
                  />
                  <PasswordField
                    label="New Password"
                    value={form.newPassword}
                    onChange={(v) => setForm({ ...form, newPassword: v })}
                    placeholder="At least 8 characters"
                    show={eyes.next}
                    onToggle={() => setEyes({ ...eyes, next: !eyes.next })}
                  />
                  <PasswordField
                    label="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(v) => setForm({ ...form, confirmPassword: v })}
                    placeholder="Re-enter new password"
                    show={eyes.confirm}
                    onToggle={() => setEyes({ ...eyes, confirm: !eyes.confirm })}
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', cursor: 'pointer', marginTop: 4, boxShadow: '0 12px 32px -12px rgba(59,130,246,0.8)', transition: 'opacity 0.2s', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Updating...' : 'Change Password'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 18 }}>
                    <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}>
                      Back to Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
    </Layout>
  );
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: focused ? '#60a5fa' : 'rgba(255,255,255,0.8)', transition: 'color 0.2s ease' }}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${focused ? '#3b82f6' : 'var(--hairline)'}`, borderRadius: 12, background: 'var(--surface-card)', paddingLeft: 14, paddingRight: 8, transition: 'border-color 0.2s ease' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', WebkitAppearance: 'none', color: 'var(--body)', fontSize: 14, padding: '13px 0' }}
        />
        <button type="button" onClick={onToggle} style={{ background: 'none', border: 'none', color: focused ? '#60a5fa' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6 }}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}
