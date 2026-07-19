import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

function loadAuth() {
  try { return JSON.parse(localStorage.getItem('admin_auth')); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth?.token) {
      authApi.autoLogin()
        .then((res) => {
          if (res.data?.token) {
            const updated = { user: res.data, token: res.data.token };
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
    const authData = { user: data, token: data.token };
    localStorage.setItem('admin_auth', JSON.stringify(authData));
    setAuth(authData);
  };

  const logout = async () => {
    try { await authApi.logout({}); } catch {}
    localStorage.removeItem('admin_auth');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
