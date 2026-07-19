import { Link } from "react-router";
import { HiChevronRight } from "react-icons/hi2";
import s from "../css/Breadcrumb.module.css";

export default function Breadcrumb({ items }) {
  return (
    <nav className={s.nav} aria-label="Breadcrumb">
      <ol className={s.list}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li className={s.item} key={i}>
              {isLast ? (
                <span className={s.current}>{item.label}</span>
              ) : (
                <Link className={s.link} to={item.to}>
                  {item.label}
                </Link>
              )}
              {!isLast && <HiChevronRight className={s.sep} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
