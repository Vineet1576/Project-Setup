import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../methods/api/auth';

const AuthContext = createContext(null);

export const AUTH_STORAGE_KEY = 'auth';

const USER_FIELDS = ['id', '_id', 'name', 'fullName', 'email', 'role', 'avatar', 'image', 'profilePic', 'subscriptionId'];

export function pickUser(user) {
  if (!user || typeof user !== 'object') return null;
  const picked = {};
  for (const key of USER_FIELDS) {
    if (user[key] !== undefined && user[key] !== null) picked[key] = user[key];
  }
  return picked;
}

export function saveAuth(authData) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...authData, user: pickUser(authData?.user) }),
  );
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function loadAuth() {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth?.token) {
      authApi.autoLogin({ id: auth.user?.id })
        .then((res) => {
          const data = res.data?.data || res.data;
          const token = data.access_token || data.token;
          if (token) {
            const updated = { user: data, token };
            saveAuth(updated);
            setAuth(updated);
          }
        })
        .catch(() => { clearAuth(); setAuth(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const data = res.data?.data || res.data;
    const token = data.access_token || data.token;
    const authData = { user: data, token };
    saveAuth(authData);
    setAuth(authData);
  };

  const logout = async () => {
    try { await authApi.logout({}); } catch {}
    clearAuth();
    setAuth(null);
  };

  const updateUser = (patch) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, user: { ...prev.user, ...patch } };
      saveAuth(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, setAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
