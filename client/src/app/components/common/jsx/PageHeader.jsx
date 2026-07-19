import s from "../css/PageHeader.module.css";

export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <div className={s.header}>
      <div className={s.text}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {(action || children) && (
        <div className={s.actions}>
          {children}
          {action}
        </div>
      )}
    </div>
  );
}
