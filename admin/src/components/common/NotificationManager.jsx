import { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup from './NotificationPopup';

const Ctx = createContext(null);

export function NotificationManagerProvider({ children }) {
  const [stack, setStack] = useState([]);

  const dismiss = useCallback((id) => {
    setStack((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((notification, duration = 10000) => {
    const id = Date.now() + Math.random();
    setStack((prev) => [...prev, { id, notification }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value = { showNotification, dismiss };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="fixed top-0 right-0 z-[9999] m-4 flex w-full max-w-sm flex-col gap-3"
        style={{ pointerEvents: 'none' }}
      >
        {stack.map((n) => (
          <div key={n.id} style={{ pointerEvents: 'auto' }}>
            <NotificationPopup
              notification={n.notification}
              onClose={() => dismiss(n.id)}
            />
          </div>
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
