import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setSuccess(res.data?.message || 'Check your email for reset instructions.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="eyebrow">Reset access</span>
          <h1 className="auth-title">Forgot your password?</h1>
          <p className="auth-subtitle">Enter your email and we’ll send a secure reset link.</p>
        </div>
        {error && <div className="status-message status-error">{error}</div>}
        {success && <div className="status-message status-success">{success}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          <button type="submit" disabled={loading} className="button-primary">{loading ? 'Sending...' : 'Send Reset Link'}</button>
        </form>
        <div className="helper-row">
          <span></span>
          <Link to="/login" className="link-inline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
