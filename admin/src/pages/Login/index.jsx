import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login, auth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (auth) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      showToast('Signed in successfully', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)] px-6 py-12">
      <div className="relative w-full max-w-[420px]">
        <div className="pointer-events-none absolute -inset-10 rounded-3xl bg-[#3b82f6]/10 blur-[80px]" />
        <div className="relative rounded-2xl border border-white/10 bg-[#0e0d15]/90 backdrop-blur p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2 7l10 5 10-5-10-5z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
              Administrative access
            </span>
            <h1 className="mt-5 text-[26px] sm:text-[30px] font-bold tracking-tight">Admin Login</h1>
            <p className="mt-2 text-[14px] text-white/60">Sign in to your admin account</p>
            <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[14px] font-[500] mb-1 block text-white/80">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', width: '100%', color: '#fff', fontSize: 14 }}
              />
            </div>
            <div>
              <label className="text-[14px] font-[500] mb-1 block text-white/80">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 44px 12px 14px', width: '100%', color: '#fff', fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 4, top: 4, bottom: 4, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 8, transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {showPwd ? (
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 h-12 rounded-xl px-8 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
