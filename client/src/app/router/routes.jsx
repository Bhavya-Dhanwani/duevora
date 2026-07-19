import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import VerifyEmailPage from "../../features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "../../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../../features/auth/pages/ResetPasswordPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import PublicRoute from "../components/routes/PublicRoute";
import ProtectedRoute from "../components/routes/ProtectedRoute";
import LandingPage from "../../features/landing/pages/LandingPage";

export const routes = [
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage/>,
      },
    ],
  },

  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            element: <LoginPage />,
          },
          {
            path: "/register",
            element: <RegisterPage />,
          },
          {
            path: "/forgot-password",
            element: <ForgotPasswordPage />,
          },
          {
            path: "/reset-password/:token",
            element: <ResetPasswordPage />,
          },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/verify-email",
            element: <VerifyEmailPage />,
          },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute requireVerified />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
];
