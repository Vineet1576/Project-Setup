import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const { setAuth } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('idle');
      return;
    }
    (async () => {
      try {
        const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
        const { id, code } = JSON.parse(decodeURIComponent(decoded));
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
        const res = await fetch(`${API_BASE}/users/verify?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`);
        const data = await res.json();
        const jwtToken = data?.token || data?.data?.token;
        if (jwtToken) {
          const authData = { token: jwtToken, user: data?.user || data?.data?.user };
          localStorage.setItem('auth', JSON.stringify(authData));
          setAuth(authData);
          setStatus('success');
          setMessage('Email verified! Redirecting...');
          setTimeout(() => window.location.href = '/profile', 1500);
        } else {
          setStatus('failed');
          setMessage(data?.message || 'Verification failed. The link may be invalid or expired.');
        }
      } catch {
        setStatus('failed');
        setMessage('Verification failed. The link may be invalid or expired.');
      }
    })();
  }, []);

  const renderState = () => {
    if (status === 'loading') return <div className="auth-page"><div className="auth-card"><span className="eyebrow">One moment</span><h2 className="auth-title">Verifying your email...</h2></div></div>;
    if (status === 'success') return <div className="auth-page"><div className="auth-card"><span className="eyebrow">Success</span><h2 className="auth-title">{message}</h2></div></div>;
    if (status === 'idle') return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="eyebrow">Verify your email</span>
          <h2 className="auth-title">Check your inbox</h2>
          <p className="auth-subtitle">A verification link was sent to your email. Please check your inbox.</p>
          <div className="helper-row"><span></span><Link to="/login" className="link-inline">Go to Login</Link></div>
        </div>
      </div>
    );

    return <div className="auth-page"><div className="auth-card"><span className="eyebrow">Verification issue</span><h2 className="auth-title">{message}</h2><div className="helper-row"><span></span><Link to="/login" className="link-inline">Back to Login</Link></div></div></div>;
  };

  return renderState();
}
