import s from "../css/StatusBadge.module.css";

const VARIANTS = {
  active: { bg: "#dcfce7", color: "#166534" },
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  pending: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#dbeafe", color: "#1e40af" },
  paid: { bg: "#dcfce7", color: "#166534" },
  unpaid: { bg: "#fef2f2", color: "#991b1b" },
  overdue: { bg: "#fef2f2", color: "#991b1b" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
  completed: { bg: "#dcfce7", color: "#166534" },
  failed: { bg: "#fef2f2", color: "#991b1b" },
  sent: { bg: "#dbeafe", color: "#1e40af" },
  partial: { bg: "#fef3c7", color: "#92400e" },
  returned: { bg: "#fce7f3", color: "#9d174d" },
};

export default function StatusBadge({ status, children }) {
  const key = (status || "").toLowerCase();
  const v = VARIANTS[key] || VARIANTS.draft;

  return (
    <span
      className={s.badge}
      style={{ background: v.bg, color: v.color }}
    >
      {children || status}
    </span>
  );
}
