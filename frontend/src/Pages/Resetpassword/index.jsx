import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { authApi } from '../../methods/api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormControl from '../../components/common/FormControl';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [eyes, setEyes] = useState({ password: false, confirmPassword: false });
  const toast = useToast();

  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = { email: form.email, password: form.password };
      const res = await authApi.resetPassword(payload);
      toast.showToast(res.data?.message || 'Password reset successfully!', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Reset failed', 'error');
    } finally { setLoading(false); }
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
              <path d="M21 2 3 20" />
              <path d="M6.5 5.5 4 8l4 4 2.5-2.5" />
              <path d="m14.5 7.5 3-3 2.5 2.5-3 3" />
              <path d="m8.5 15.5-3 3L9 22l3-3" />
              <path d="m15.5 12.5 2.5 2.5 3-3-2.5-2.5" />
            </svg>
            New password
          </span>
          <h2 className="mt-4 text-[22px] sm:text-[28px] text-white font-bold tracking-tight">
            Reset your password
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Choose a new password for your account.
          </p>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <FormControl
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e })}
            />
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">New Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes.password ? 'text' : 'password'}
                placeholder="Enter new password"
                value={form.password}
                minLength={6}
                required
                onChange={(e) => setForm({ ...form, password: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes({ ...eyes, password: !eyes.password })}
              >
                {eyes.password ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes.confirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                minLength={6}
                required
                onChange={(e) => setForm({ ...form, confirmPassword: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes({ ...eyes, confirmPassword: !eyes.confirmPassword })}
              >
                {eyes.confirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          {token && (
            <p className="mb-4 text-[12px] text-white/40 text-center">
              Security link verified. Enter your account email to continue.
            </p>
          )}

          <div className="mt-6 flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-12 rounded-xl w-full px-8 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          <div className="flex justify-center mt-5">
            <Link to="/login" className="text-[#3b82f6] font-semibold text-[14px] cursor-pointer hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
