import InputField from "./InputField";

export default function PasswordField({ label, name, placeholder, value, onChange, error }) {
  return (
    <InputField
      label={label || "PASSWORD"}
      type="password"
      name={name || "password"}
      placeholder={placeholder || "Enter your password"}
      icon="lock"
      value={value}
      onChange={onChange}
      error={error}
      required
    />
  );
}
