import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../methods/api/auth';

const AuthContext = createContext(null);

function loadAuth() {
  try { return JSON.parse(localStorage.getItem('admin_auth')); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth?.token) {
      authApi.autoLogin({ id: auth.user?.id || auth.user?._id })
        .then((res) => {
          const data = res.data?.data || res.data;
          const token = data.access_token || data.token;
          if (token) {
            const updated = { user: data, token };
            localStorage.setItem('admin_auth', JSON.stringify(updated));
            setAuth(updated);
          }
        })
        .catch(() => { localStorage.removeItem('admin_auth'); setAuth(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const data = res.data?.data || res.data;
    const token = data.access_token || data.token;
    const authData = { user: data, token };
    localStorage.setItem('admin_auth', JSON.stringify(authData));
    setAuth(authData);
  };

  const logout = async () => {
    try { await authApi.logout({}); } catch {}
    localStorage.removeItem('admin_auth');
    setAuth(null);
  };

  const updateUser = (patch) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, user: { ...prev.user, ...patch } };
      localStorage.setItem('admin_auth', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
