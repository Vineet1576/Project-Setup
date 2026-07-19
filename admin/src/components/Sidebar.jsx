import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/roles', label: 'Roles', icon: '🔑' },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="brand-mark">✦</span>
        <div>
          <div className="admin-brand-title">Admin Panel</div>
          <div className="admin-brand-subtitle">Operations Suite</div>
        </div>
      </div>
      <nav className="admin-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
