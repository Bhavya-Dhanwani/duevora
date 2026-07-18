import { useCallback } from "react";
import { useNotificationContext } from "./NotificationContext";

export default function useNotification() {
  const { show, hide } = useNotificationContext();

  const success = useCallback(
    (message, options) => show({ type: "success", message, ...options }),
    [show]
  );

  const error = useCallback(
    (message, options) => show({ type: "error", message, ...options }),
    [show]
  );

  return { success, error, hide };
}
