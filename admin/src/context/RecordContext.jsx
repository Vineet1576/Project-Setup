import { createContext, useContext, useState, useCallback } from 'react';

const RecordContext = createContext(null);
const STORAGE_KEY = 'admin_active_record_id';

function loadStoredId() {
  try { return sessionStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export function RecordProvider({ children }) {
  const [id, setId] = useState(loadStoredId);

  const setActiveId = useCallback((value) => {
    setId(value);
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore storage errors */ }
  }, []);

  return (
    <RecordContext.Provider value={{ id, setActiveId }}>
      {children}
    </RecordContext.Provider>
  );
}

export const useRecord = () => useContext(RecordContext);
