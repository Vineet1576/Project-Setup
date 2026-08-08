import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import FormControl from '../../components/common/FormControl';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [eyes, setEyes] = useState(false);
  const { login, auth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth) navigate('/profile', { replace: true });
  }, [auth, navigate]);

  if (auth) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.showToast('Login successful', 'success');
      navigate('/profile');
    } catch (err) {
      toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed', 'error');
    }
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Welcome back
          </span>
          <h2 className="mt-4 text-[22px] sm:text-[28px] text-white font-bold tracking-tight">
            Login to your account
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Secured with end-to-end encryption.
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
            <label className="text-[14px] font-[500] mb-1 text-white/80">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormControl
                type={eyes ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e })}
              />
              <span
                className="absolute right-[12px] top-[13px] text-white/40 cursor-pointer hover:text-blue-400"
                onClick={() => setEyes(!eyes)}
              >
                {eyes ? <FaRegEye /> : <FaRegEyeSlash />}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-12 rounded-xl w-full px-8 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </div>

          <div className="flex justify-between items-center mt-5 text-[14px]">
            <Link to="/forgot-password" className="text-[#3b82f6] font-semibold cursor-pointer hover:underline">
              Forgot Password?
            </Link>
            <Link to="/register" className="text-[#3b82f6] font-semibold cursor-pointer hover:underline">
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
