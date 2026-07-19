import { HiOutlineFunnel } from "react-icons/hi2";
import SearchInput from "./SearchInput";
import s from "../css/FilterBar.module.css";

export default function FilterBar({ search, onSearch, searchPlaceholder, children }) {
  return (
    <div className={s.bar}>
      <div className={s.left}>
        <SearchInput
          onChange={onSearch}
          placeholder={searchPlaceholder}
          value={search}
        />
      </div>
      {(children || true) && (
        <div className={s.right}>
          <HiOutlineFunnel className={s.filterIcon} />
          {children}
        </div>
      )}
    </div>
  );
}
