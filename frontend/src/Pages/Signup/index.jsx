import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { authApi } from '../../methods/api/auth';
import { roleApi } from '../../methods/api/role';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import FormControl from '../../components/common/FormControl';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

export default function Signup() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobileno: '' });
  const [userRoleId, setUserRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { auth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (auth) { navigate('/profile', { replace: true }); return null; }

  useEffect(() => {
    let mounted = true;
    roleApi
      .getFrontendRoles()
      .then((res) => {
        const roles = res.data?.roles || res.data?.data || [];
        const userRole = roles.find((r) => (r.name || '').toLowerCase() === 'user');
        if (mounted && userRole) setUserRoleId(userRole.id || userRole._id);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ ...form, role: userRoleId });
      toast.showToast('Account created successfully. Please verify your email.', 'success');
      navigate('/verify-email');
    } catch (err) {
      toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed', 'error');
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
            Join Raksha
          </span>
          <h2 className="mt-4 text-[22px] sm:text-[28px] text-white font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Set up your account and begin your verified experience.
          </p>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FormControl
              type="text"
              label="First Name"
              placeholder="First Name"
              value={form.firstName}
              isCharacterOnly
              required
              onChange={(e) => setForm({ ...form, firstName: e })}
            />
            <FormControl
              type="text"
              label="Last Name"
              placeholder="Last Name"
              value={form.lastName}
              isCharacterOnly
              required
              onChange={(e) => setForm({ ...form, lastName: e })}
            />
          </div>

          <div className="mb-4">
            <FormControl
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e })}
            />
          </div>

          <div className="mb-4">
            <FormControl
              type="tel"
              label="Mobile (optional)"
              placeholder="Enter mobile number"
              value={form.mobileno}
              onChange={(e) => setForm({ ...form, mobileno: e })}
            />
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-[500] mb-1 text-white/80">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                minLength={6}
                required
                onChange={(e) => setForm({ ...form, password: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-12 rounded-xl w-full px-8 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-[14px] text-white/70 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#3b82f6] font-semibold cursor-pointer hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
