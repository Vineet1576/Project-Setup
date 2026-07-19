import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <Link to="/" className="brand-link">
          <span className="brand-mark">✦</span>
          <span className="brand-wordmark">{import.meta.env.VITE_APP_NAME || 'Aura'}</span>
        </Link>
        {auth ? (
          <div className="top-nav-actions">
            <Link to="/profile" className="top-nav-link">Profile</Link>
            <button onClick={handleLogout} className="button-secondary">Logout</button>
          </div>
        ) : (
          <div className="top-nav-actions">
            <Link to="/login" className="top-nav-link">Login</Link>
            <Link to="/register" className="button-secondary">Register</Link>
          </div>
        )}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
