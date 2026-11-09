import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userService from "../service/userRegister";

export const Register = createAsyncThunk(
  "auth/register",
  async (data, thunkApi) => {
    try {
      const response = await userService.userRegister(data);
      console.log(data);
      return response.data;
    } catch (err) {
      console.log("user Register failed...", err.response?.data || err.message);
      const errorMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" && !err.response.data.includes("<html")
          ? err.response.data
          : err.message || "User Register Failed...");
      return thunkApi.rejectWithValue(errorMsg);
    }
  },
);

export const login = createAsyncThunk("auth/Login", async (data, thunkApi) => {
  try {
    const response = await userService.userLogin(data);
    console.log("Login API response:", response.data);
    return response.data; // full response: { token, user }
  } catch (error) {
    console.log("user Login failed");
    return thunkApi.rejectWithValue("error occured during the login");
  }
});


export const updateProfile = createAsyncThunk(
  "profile/update",
  async ({ data, userId }, thunkApi) => {
    try {
      const response = await userService.updateProfile(data, userId);

      console.log("Response from backend:", response.data);

      return response.data;
    } catch (error) {
      console.log("Profile update error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === "string" && !error.response.data.includes("<html")
          ? error.response.data
          : error.message || "Error occurred during profile update");
      return thunkApi.rejectWithValue(errorMsg);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data, thunkApi) => {
    try {
      const response = await userService.forgotPassword(data);
      return response.data;
    } catch (error) {
      console.log("Forgot password error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset code. Please try again.";
      return thunkApi.rejectWithValue(errorMsg);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, thunkApi) => {
    try {
      const response = await userService.verifyOtp(data);
      return response.data;
    } catch (error) {
      console.log("Verify OTP error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Invalid or expired verification code.";
      return thunkApi.rejectWithValue(errorMsg);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data, thunkApi) => {
    try {
      const response = await userService.resetPassword(data);
      return response.data;
    } catch (error) {
      console.log("Reset password error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password. Please try again.";
      return thunkApi.rejectWithValue(errorMsg);
    }
  }
);


const initialState = {
  user: null,
  loading: false,
  error: null,
  isLogin: false
};

const RegisterSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state, action) => {
      state.user = null;
      state.token = null;
      state.isLogin = false;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(Register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(Register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload?.user || action.payload;
        state.token = action.payload?.token || null;
        state.isLogin = true;
      })

      .addCase(Register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(login.pending, (state, action) => {
        state.error = null;
        state.loading = true;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLogin = true;
      })

      .addCase(login.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        console.log("Payload:", action.payload);

        state.loading = false;
        state.user = action.payload?.user || action.payload;
      })

      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { setUser, logout } = RegisterSlice.actions;
export default RegisterSlice.reducer;
