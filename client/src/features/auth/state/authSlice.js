import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.isAuthenticated = true;
    },
    setUser: (state, { payload }) => {
      state.user = payload;
    },
    setAccessToken: (state, { payload }) => {
      state.accessToken = payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setUser, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
