import { useState } from "react";
import styles from "../css/ForgotPasswordForm.module.css";
import InputField from "./InputField";
import LoginButton from "./LoginButton";
import SwitchText from "./SwitchText";
import { forgotPasswordSchema } from "../../../api/validation";
import useNotification from "../../../../../app/components/notification/useNotification";

export default function ForgotPasswordForm({ onSubmit, onBack, isLoading }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const { error: showError } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      showError(result.error.issues[0].message);
      return;
    }
    onSubmit(email);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <InputField
        label="EMAIL"
        type="email"
        name="email"
        placeholder="Enter your registered email"
        icon="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />

      <LoginButton isLoading={isLoading} text="SEND RESET LINK" />

      <SwitchText
        text="Remember your password?"
        actionText="Login"
        onSwitch={onBack}
      />
    </form>
  );
}
