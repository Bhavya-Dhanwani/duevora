import { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
  return ctx;
}

export default NotificationContext;
