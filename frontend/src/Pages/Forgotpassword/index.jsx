import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../methods/api/auth';
import AuthLayout from '../../components/AuthLayout';
import FormControl from '../../components/common/FormControl';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      toast.showToast(res.data?.message || 'Check your email for reset instructions.', 'success');
      navigate('/login');
    } catch (err) {
      toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Something went wrong', 'error');
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
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Account recovery
          </span>
          <h2 className="mt-4 text-[22px] sm:text-[28px] text-white font-bold tracking-tight">
            Forgot your password?
          </h2>
          <p className="mt-2 text-[14px] text-white/60">
            Enter your email and we'll send a secure reset link.
          </p>
          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <FormControl
              type="email"
              label="Email"
              placeholder="Your email address"
              value={email}
              required
              onChange={(e) => setEmail(e)}
            />
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-12 rounded-xl w-full px-8 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
