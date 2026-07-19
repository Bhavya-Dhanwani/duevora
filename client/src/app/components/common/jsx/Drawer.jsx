import { useEffect } from "react";
import { HiXMark } from "react-icons/hi2";
import s from "../css/Drawer.module.css";

export default function Drawer({ isOpen, onClose, title, children, side = "right" }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={[s.drawer, s[side]].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={s.header}>
            <h2 className={s.title}>{title}</h2>
            <button className={s.close} onClick={onClose} type="button">
              <HiXMark />
            </button>
          </div>
        )}
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
