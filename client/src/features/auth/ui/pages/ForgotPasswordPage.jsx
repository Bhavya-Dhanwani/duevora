import { useState } from "react";
import { useNavigate } from "react-router";
import ForgotPasswordLayout from "../components/jsx/ForgotPasswordLayout";
import useAuth from "../../hooks/useAuth";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (email) => {
    setIsLoading(true);
    await forgotPassword(email);
    setIsLoading(false);
  };

  return (
    <ForgotPasswordLayout
      onSubmit={handleSubmit}
      onBack={() => navigate("/login")}
      isLoading={isLoading}
    />
  );
}
