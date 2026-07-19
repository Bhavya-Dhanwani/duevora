import { HiOutlineInbox } from "react-icons/hi2";
import s from "../css/EmptyState.module.css";

export default function EmptyState({ icon: Icon = HiOutlineInbox, title, description, action }) {
  return (
    <div className={s.empty}>
      <div className={s.iconWrap}>
        <Icon />
      </div>
      <h3 className={s.title}>{title}</h3>
      {description && <p className={s.desc}>{description}</p>}
      {action && <div className={s.actions}>{action}</div>}
    </div>
  );
}
