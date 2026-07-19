import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, auth } = useAuth();
  const navigate = useNavigate();

  if (auth) { navigate('/', { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card">
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <span className="eyebrow">Administrative access</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 8 }}>Admin Login</h1>
          <p style={{ color: 'var(--body)' }}>Sign in to your admin account</p>
        </div>
        {error && <div className="status-message status-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" className="button-primary">Sign In</button>
        </form>
      </div>
    </div>
  );
}
