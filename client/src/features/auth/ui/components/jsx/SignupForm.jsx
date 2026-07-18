import { useState } from "react";
import styles from "../css/SignupForm.module.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import LoginButton from "./LoginButton";
import Separator from "./Separator";
import GoogleButton from "./GoogleButton";
import SwitchText from "./SwitchText";
import { signupSchema } from "../../../api/validation";
import useNotification from "../../../../../app/components/notification/useNotification";

export default function SignupForm({ onSignup, onGoogleLogin, isLoading, onSwitch }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const { error: showError } = useNotification();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      showError(result.error.issues[0].message);
      return;
    }
    onSignup(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <InputField
        label="NAME"
        type="text"
        name="name"
        placeholder="Enter your full name"
        icon="person"
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
        required
      />

      <InputField
        label="EMAIL"
        type="email"
        name="email"
        placeholder="Enter your email"
        icon="email"
        value={form.email}
        onChange={handleChange("email")}
        error={errors.email}
        required
      />

      <PasswordField
        value={form.password}
        onChange={handleChange("password")}
        error={errors.password}
      />

      <PasswordField
        label="CONFIRM PASSWORD"
        placeholder="Confirm your password"
        value={form.confirmPassword}
        onChange={handleChange("confirmPassword")}
        error={errors.confirmPassword}
      />

      <LoginButton isLoading={isLoading} text="SIGNUP" />

      <SwitchText
        text="Already have an account?"
        actionText="Login"
        onSwitch={onSwitch}
      />

      <Separator text="OR" />

      <GoogleButton onClick={onGoogleLogin} />
    </form>
  );
}
