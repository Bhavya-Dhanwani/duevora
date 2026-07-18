import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import ResetPasswordLayout from "../components/jsx/ResetPasswordLayout";
import useAuth from "../../hooks/useAuth";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password) => {
    setIsLoading(true);
    await resetPassword({ token, password });
    setIsLoading(false);
  };

  return (
    <ResetPasswordLayout
      token={token}
      onSubmit={handleSubmit}
      onBack={() => navigate("/login")}
      isLoading={isLoading}
    />
  );
}
