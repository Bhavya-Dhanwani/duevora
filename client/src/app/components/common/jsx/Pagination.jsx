import {
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
} from "react-icons/hi2";
import s from "../css/Pagination.module.css";

export default function Pagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange }) {
  if (totalPages <= 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className={s.bar}>
      <div className={s.info}>
        {onPageSizeChange && (
          <select
            className={s.select}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            value={pageSize}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={s.pages}>
        <button
          className={s.btn}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          type="button"
        >
          <HiChevronDoubleLeft />
        </button>
        <button
          className={s.btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <HiChevronLeft />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span className={s.ellipsis} key={`e${i}`}>
              ...
            </span>
          ) : (
            <button
              className={[s.btn, p === page && s.active].filter(Boolean).join(" ")}
              key={p}
              onClick={() => onPageChange(p)}
              type="button"
            >
              {p}
            </button>
          )
        )}

        <button
          className={s.btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <HiChevronRight />
        </button>
        <button
          className={s.btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          type="button"
        >
          <HiChevronDoubleRight />
        </button>
      </div>
    </div>
  );
}
