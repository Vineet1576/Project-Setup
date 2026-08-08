import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  {
    to: '/notifications',
    label: 'Notifications',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" /><path d="M16 13v.01" /><path d="M12 13v.01" /><path d="M8 13v.01" /></svg>,
  },
];

export default function ProfileSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="admin-sidebar">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="admin-brand"
        style={{ cursor: 'pointer', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
        title="Go to Home"
      >
        <span className="brand-mark">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>
        </span>
        <div>
          <div className="admin-brand-title">My Account</div>
          <div className="admin-brand-subtitle">Manage your account</div>
        </div>
      </button>

      <nav className="admin-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
