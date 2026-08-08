import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Brand from '../../common/Brand';
import NotificationBell from '../../common/NotificationBell';
import { capitalizeName, getInitials } from '../../../utils/name';

export default function Layout({ children, wide = false }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const user = auth?.user;
  const displayName = capitalizeName(user?.fullName || user?.name || 'User');
  const avatar = user?.image || user?.profilePic || user?.avatar || '';
  const initials = getInitials(displayName);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b10] text-white">
      <nav className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-[#0b0b10]/80 backdrop-blur border-b border-white/10">
        <Link to="/">
          <Brand />
        </Link>
        {auth ? (
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Profile"
                style={{ border: 'none', cursor: 'pointer', padding: 0, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, overflow: 'hidden' }}
              >
                {avatar ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: 'var(--surface-card)', border: '1px solid var(--hairline)', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.35)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--hairline)' }}>
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, overflow: 'hidden', flexShrink: 0 }}>
                      {avatar ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                    </div>
                  </div>
                  <button className="menu-pop-item" onClick={() => { setProfileOpen(false); navigate('/'); }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
                    <span style={{ flex: 1, textAlign: 'left' }}>Home</span>
                  </button>
                  <button className="menu-pop-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span style={{ flex: 1, textAlign: 'left' }}>Profile</span>
                  </button>
                  <button className="menu-pop-item" onClick={() => { setProfileOpen(false); navigate('/change-password'); }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span style={{ flex: 1, textAlign: 'left' }}>Change Password</span>
                  </button>
                  <div style={{ height: 1, background: 'var(--hairline)', margin: '4px 0' }} />
                  <button className="menu-pop-item danger" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
                    <span style={{ flex: 1, textAlign: 'left' }}>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-3 py-2 rounded-full text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-sm h-10 rounded-lg px-6 font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Register
            </Link>
          </div>
        )}
      </nav>
      <main className={wide ? 'flex-1 w-full' : 'flex-1 w-full max-w-[1120px] mx-auto px-4 py-8'}>{children}</main>
    </div>
  );
}
