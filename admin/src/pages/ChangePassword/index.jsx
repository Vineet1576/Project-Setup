import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { authApi } from '../../methods/api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormControl from '../../components/common/FormControl';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

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
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password';
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="flex justify-center mb-5">
          <Link to="/">
            <Brand />
          </Link>
        </div>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Account security
          </span>
          <h2 className="mt-4 text-[22px] sm:text-[28px] text-white font-bold tracking-tight">
            Change your password
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Update the password used to sign in to your account.
          </p>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">Current Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes.current ? 'text' : 'password'}
                placeholder="Enter current password"
                value={form.currentPassword}
                required
                autoComplete="current-password"
                onChange={(e) => setForm({ ...form, currentPassword: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes({ ...eyes, current: !eyes.current })}
              >
                {eyes.current ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">New Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes.next ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={form.newPassword}
                minLength={8}
                required
                autoComplete="new-password"
                onChange={(e) => setForm({ ...form, newPassword: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes({ ...eyes, next: !eyes.next })}
              >
                {eyes.next ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes.confirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                minLength={8}
                required
                autoComplete="new-password"
                onChange={(e) => setForm({ ...form, confirmPassword: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes({ ...eyes, confirm: !eyes.confirm })}
              >
                {eyes.confirm ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-12 rounded-xl w-full px-8 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </div>

          <div className="flex justify-center mt-5">
            <button type="button" onClick={() => navigate('/profile')} className="bg-transparent border-none text-[#3b82f6] font-semibold text-[14px] cursor-pointer hover:underline">
              Back to Profile
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}