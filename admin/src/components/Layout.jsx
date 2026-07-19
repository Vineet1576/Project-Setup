import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!auth) return <main>{children}</main>;

  return (
    <div className="app-shell admin-shell">
      <Sidebar />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Operations</p>
            <h2 className="admin-title">Administrative control</h2>
          </div>
          <div className="admin-header-actions">
            <span className="admin-user-pill">{auth?.user?.email || 'Admin'}</span>
            <button onClick={handleLogout} className="button-secondary">Logout</button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
