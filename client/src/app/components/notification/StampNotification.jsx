import { createPortal } from "react-dom";
import styles from "./StampNotification.module.css";
import successStamp from "../../../assets/stamp/success-stamp.png";
import errorStamp from "../../../assets/stamp/error-stamp.png";

const STAMPS = {
  success: successStamp,
  error: errorStamp,
};

export default function StampNotification({ notification, onClose }) {
  if (!notification) return null;

  const { type, message, exiting } = notification;

  return createPortal(
    <div
      className={`${styles.container} ${exiting ? styles.exiting : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={`${styles.notification} ${styles[type]} ${exiting ? styles.stampExit : styles.stampIn}`}>
        <img
          src={STAMPS[type]}
          alt=""
          className={styles.background}
          draggable={false}
        />
        <div className={styles.messageWrap}>
          <p className={`${styles.message} ${styles[`${type}Text`]}`}>
            {message}
          </p>
        </div>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}
