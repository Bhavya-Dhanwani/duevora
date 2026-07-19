import s from "../css/Button.module.css";

const SIZES = {
  sm: s.sm,
  md: s.md,
  lg: s.lg,
};

const VARIANTS = {
  primary: s.primary,
  secondary: s.secondary,
  danger: s.danger,
  ghost: s.ghost,
};

export default function Button({
  children,
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={[
        s.btn,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && s.fullWidth,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={s.spinner} />
      ) : Icon ? (
        <Icon className={s.icon} />
      ) : null}
      {children && <span>{children}</span>}
      {IconRight && !loading && <IconRight className={s.icon} />}
    </button>
  );
}
