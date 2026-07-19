import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = params.get('token');
  let decodedOtp = '';
  if (token) {
    try {
      const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(decoded);
      decodedOtp = data.code || '';
      if (data.email) form.email = data.email;
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { email: form.email, password: form.password };
      if (decodedOtp) payload.otp = decodedOtp;
      const res = await authApi.resetPassword(payload);
      setSuccess(res.data?.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="eyebrow">Secure reset</span>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">Choose a new password for your account.</p>
        </div>
        {error && <div className="status-message status-error">{error}</div>}
        {success && <div className="status-message status-success">{success}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field" />
          <input type="password" placeholder="New Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-field" />
          <input type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required minLength={6} className="input-field" />
          <button type="submit" disabled={loading} className="button-primary">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
        <div className="helper-row">
          <span></span>
          <Link to="/login" className="link-inline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
