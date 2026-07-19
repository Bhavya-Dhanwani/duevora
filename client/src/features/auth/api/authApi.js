import api from "../../../lib/api";

export const authApi = {
  signup: async ({ name, email, password, confirmPassword, token }) => {
    const response = await api.post("/auth/signup", { name, email, password, confirmPassword, token });
    return response.data;
  },

  login: async ({ email, password, token }) => {
    const response = await api.post("/auth/login", { email, password, token });
    return response.data;
  },

  googleLogin: async (credential) => {
    const response = await api.post("/auth/google-login", { credential });
    return response.data;
  },

  verifyEmail: async (otp) => {
    const response = await api.post("/auth/verify-email", { otp });
    return response.data;
  },

  sendOtp: async () => {
    const response = await api.post("/auth/send-email");
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async ({ token, password }) => {
    const response = await api.post("/auth/reset-password", { token, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post("/auth/logout-all");
    return response.data;
  },
};
