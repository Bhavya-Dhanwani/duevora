import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../../../app/store/hooks";
import { setCredentials, logout as logoutAction } from "../state/authSlice";
import { setAccessToken } from "../../../lib/api";
import { authApi } from "../api/authApi";
import useNotification from "../../../app/components/notification/useNotification";

export default function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const handleAuthResponse = useCallback(
    (data, message) => {
      const { user, accessToken } = data;
      setAccessToken(accessToken);
      dispatch(setCredentials({ user, accessToken }));
      success(message);
      return { success: true, user };
    },
    [dispatch, success]
  );

  const signup = useCallback(
    async ({ name, email, password, confirmPassword, token }) => {
      try {
        const res = await authApi.signup({ name, email, password, confirmPassword, token });
        const { user, accessToken } = res.data;
        setAccessToken(accessToken);
        dispatch(setCredentials({ user, accessToken }));
        success(res.message || "Account created successfully");
        if (!user.isVerified) {
          navigate("/verify-email", { state: { email: user.email } });
        }
        return { success: true, user };
      } catch (err) {
        const msg = err.response?.data?.message || "Signup failed";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [dispatch, success, error, navigate]
  );

  const login = useCallback(
    async ({ email, password }) => {
      try {
        const res = await authApi.login({ email, password });
        const { user, accessToken } = res.data;
        setAccessToken(accessToken);
        dispatch(setCredentials({ user, accessToken }));
        success(res.message || "Logged in successfully");
        if (!user.isVerified) {
          navigate("/verify-email", { state: { email: user.email } });
        } else {
          navigate("/dashboard");
        }
        return { success: true, user };
      } catch (err) {
        const msg = err.response?.data?.message || "Login failed";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [dispatch, success, error, navigate]
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      try {
        const res = await authApi.googleLogin(credential);
        const { user, accessToken } = res.data;
        setAccessToken(accessToken);
        dispatch(setCredentials({ user, accessToken }));
        success(res.message || "Logged in with Google");
        navigate("/dashboard");
        return { success: true, user };
      } catch (err) {
        const msg = err.response?.data?.message || "Google login failed";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [dispatch, success, error, navigate]
  );

  const verifyEmail = useCallback(
    async (otp) => {
      try {
        const res = await authApi.verifyEmail(otp);
        const { user, accessToken } = res.data;
        setAccessToken(accessToken);
        dispatch(setCredentials({ user, accessToken }));
        success(res.message || "Email verified successfully");
        navigate("/dashboard");
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || "Verification failed";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [dispatch, success, error, navigate]
  );

  const sendOtp = useCallback(async () => {
    try {
      const res = await authApi.sendOtp();
      success(res.message || "OTP sent successfully");
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      error(msg);
      return { success: false, error: msg };
    }
  }, [success, error]);

  const forgotPassword = useCallback(
    async (email) => {
      try {
        const res = await authApi.forgotPassword(email);
        success(res.message || "Reset link sent to your email");
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to send reset link";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [success, error]
  );

  const resetPassword = useCallback(
    async ({ token, password }) => {
      try {
        const res = await authApi.resetPassword({ token, password });
        success(res.message || "Password reset successfully");
        navigate("/login");
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to reset password";
        error(msg);
        return { success: false, error: msg };
      }
    },
    [success, error, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // silent fail - clear local state regardless
    } finally {
      setAccessToken(null);
      dispatch(logoutAction());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  const restoreSession = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      const { user, accessToken } = res.data;
      setAccessToken(accessToken);
      dispatch(setCredentials({ user, accessToken }));
      return { success: true, user };
    } catch {
      setAccessToken(null);
      dispatch(logoutAction());
      return { success: false };
    }
  }, [dispatch]);

  return {
    signup,
    login,
    loginWithGoogle,
    verifyEmail,
    sendOtp,
    forgotPassword,
    resetPassword,
    logout,
    restoreSession,
  };
}
