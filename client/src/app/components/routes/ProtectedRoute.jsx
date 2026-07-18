import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../../store/hooks";
import useAuth from "../../../features/auth/hooks/useAuth";

export default function ProtectedRoute({ requireVerified = false }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { restoreSession } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      restoreSession().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, restoreSession]);

  if (checking) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireVerified && !user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
