import s from "../css/Avatar.module.css";

export default function Avatar({ name = "", src, size = 36, className = "" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        alt={name}
        className={[s.avatar, className].filter(Boolean).join(" ")}
        src={src}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={[s.avatar, s.initials, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </span>
  );
}
