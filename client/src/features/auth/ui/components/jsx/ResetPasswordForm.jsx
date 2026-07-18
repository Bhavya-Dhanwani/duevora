import { useState } from "react";
import styles from "../css/ForgotPasswordForm.module.css";
import PasswordField from "./PasswordField";
import LoginButton from "./LoginButton";
import SwitchText from "./SwitchText";
import { resetPasswordSchema } from "../../../api/validation";
import useNotification from "../../../../../app/components/notification/useNotification";

export default function ResetPasswordForm({ onSubmit, onBack, isLoading }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const { error: showError } = useNotification();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = resetPasswordSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      showError(result.error.issues[0].message);
      return;
    }
    onSubmit(form.password);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <PasswordField
        value={form.password}
        onChange={handleChange("password")}
        label="NEW PASSWORD"
        placeholder="Enter new password"
        error={errors.password}
      />

      <PasswordField
        value={form.confirmPassword}
        onChange={handleChange("confirmPassword")}
        label="CONFIRM PASSWORD"
        placeholder="Confirm new password"
        error={errors.confirmPassword}
      />

      <LoginButton isLoading={isLoading} text="RESET PASSWORD" />

      <SwitchText
        text="Back to"
        actionText="Login"
        onSwitch={onBack}
      />
    </form>
  );
}
