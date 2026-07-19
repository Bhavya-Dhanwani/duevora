import s from "../css/SkeletonLoader.module.css";

export function SkeletonLine({ width = "100%", height = 16 }) {
  return (
    <div
      className={s.line}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = 40 }) {
  return (
    <div
      className={s.circle}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <SkeletonLine width={120} height={14} />
        <SkeletonCircle size={32} />
      </div>
      <SkeletonLine height={28} />
      <SkeletonLine width="60%" height={12} />
      <div className={s.cardFooter}>
        <SkeletonLine width={80} height={12} />
        <SkeletonLine width={60} height={12} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className={s.table}>
      <div className={s.tableHeader}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} height={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div className={s.tableRow} key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLine;
