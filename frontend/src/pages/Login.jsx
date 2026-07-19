import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, auth } = useAuth();
  const navigate = useNavigate();

  if (auth) { navigate('/profile', { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="eyebrow">Welcome back</span>
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">Access your profile and manage your details securely.</p>
        </div>
        {error && <div className="status-message status-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field" />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="input-field" />
          <button type="submit" className="button-primary">Sign In</button>
        </form>
        <div className="helper-row">
          <Link to="/forgot-password" className="link-inline">Forgot Password?</Link>
          <Link to="/register" className="link-inline">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
