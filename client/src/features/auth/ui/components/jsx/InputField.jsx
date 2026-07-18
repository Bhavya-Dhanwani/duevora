import { useState } from "react";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "../css/InputField.module.css";

export default function InputField({
  label,
  type = "text",
  name,
  placeholder,
  icon,
  value,
  onChange,
  required = false,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const iconMap = {
    email: MdEmail,
    lock: MdLock,
    person: MdPerson,
  };

  const IconComponent = iconMap[icon];

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {IconComponent && (
          <span className={styles.icon}>
            <IconComponent />
          </span>
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`${styles.input} ${error ? styles.inputError : ""}`}
          autoComplete={isPassword ? "current-password" : name}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.actionIcon}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        )}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
