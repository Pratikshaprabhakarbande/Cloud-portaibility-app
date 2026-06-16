/**
 * NotificationContext — lightweight toast notifications.
 * `notify.success/error/info/warning(message)` pushes a toast that auto-dismisses.
 */
import { createContext, useCallback, useMemo, useState } from 'react';

export const NotificationContext = createContext(null);

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, timeout = 4000) => {
      const id = ++idCounter;
      setToasts((list) => [...list, { id, type, message }]);
      if (timeout) setTimeout(() => remove(id), timeout);
      return id;
    },
    [remove]
  );

  const notify = useMemo(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m, t),
      info: (m, t) => push('info', m, t),
      warning: (m, t) => push('warning', m, t)
    }),
    [push]
  );

  const value = useMemo(() => ({ toasts, notify, remove }), [toasts, notify, remove]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
