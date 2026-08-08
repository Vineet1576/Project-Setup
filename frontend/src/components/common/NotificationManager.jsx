import { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup from './NotificationPopup';

const Ctx = createContext(null);

export function NotificationManagerProvider({ children }) {
  const [stack, setStack] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setStack((prev) => [...prev, { id, notification }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setStack((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = { showNotification, dismiss };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-0 right-0 z-[9999] m-4 flex flex-col gap-3 w-full max-w-sm">
        {stack.map((n) => (
          <NotificationPopup
            key={n.id}
            notification={n.notification}
            onClose={() => dismiss(n.id)}
          />
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useNotificationManager = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotificationManager must be used within NotificationManagerProvider');
  return ctx;
};
