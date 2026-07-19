import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobileno: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const navigate = useNavigate();

  if (auth) { navigate('/profile', { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/verify-email');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="eyebrow">Create account</span>
          <h1 className="auth-title">Join our community</h1>
          <p className="auth-subtitle">Set up your account and begin your verified experience.</p>
        </div>
        {error && <div className="status-message status-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="input-field" />
            <input type="text" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="input-field" />
          </div>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field" />
          <input type="tel" placeholder="Mobile (optional)" value={form.mobileno} onChange={(e) => setForm({ ...form, mobileno: e.target.value })} className="input-field" />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-field" />
          <button type="submit" disabled={loading} className="button-primary">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="helper-row">
          <span></span>
          <Link to="/login" className="link-inline">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
