import { useState, useCallback, useRef } from "react";
import NotificationContext from "./NotificationContext";
import StampNotification from "./StampNotification";

const DEFAULT_DURATION = 3000;

export default function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  }, []);

  const show = useCallback(
    ({ type, message, duration = DEFAULT_DURATION } = {}) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotification(null);

      requestAnimationFrame(() => {
        setAnimKey((k) => k + 1);
        setNotification({ type, message, duration });

        timerRef.current = setTimeout(() => {
          setNotification((prev) => (prev ? { ...prev, exiting: true } : null));
          setTimeout(() => {
            setNotification(null);
            timerRef.current = null;
          }, 300);
        }, duration);
      });
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ show, hide }}>
      {children}
      <StampNotification
        key={animKey}
        notification={notification}
        onClose={hide}
      />
    </NotificationContext.Provider>
  );
}
