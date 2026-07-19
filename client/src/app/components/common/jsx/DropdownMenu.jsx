import { useEffect, useRef, useState } from "react";
import s from "../css/DropdownMenu.module.css";

export default function DropdownMenu({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={s.wrap} ref={ref}>
      <div onClick={() => setOpen(!open)} role="button" tabIndex={0}>
        {trigger}
      </div>
      {open && (
        <div className={s.menu} role="menu">
          {typeof children === "function" ? children({ onClose: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      className={[s.item, danger && s.danger].filter(Boolean).join(" ")}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {Icon && <Icon />}
      <span>{label}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className={s.divider} />;
}
