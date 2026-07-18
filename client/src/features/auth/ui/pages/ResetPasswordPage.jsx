import { useParams, useNavigate } from "react-router";
import ResetPasswordLayout from "../components/jsx/ResetPasswordLayout";
import useAuth from "../../hooks/useAuth";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();

  const handleSubmit = async (password) => {
    const result = await resetPassword(token, password);
    if (result.success) {
      navigate("/login");
    }
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
