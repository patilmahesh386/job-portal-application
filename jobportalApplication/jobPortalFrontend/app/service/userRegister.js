import api from "../api/axios";

const userRegister = async (data) => {
  const response = await api.post("/user/register", data);
  return response;
};

const userLogin = async (data) => {
  const response = await api.post("/user/login", data);
  return response;
};

const updateProfile = async (data, userId) => {
  const response = await api.put(`/user/profile/${userId}`, data);
  return response;
};

const forgotPassword = async (data) => {
  const response = await api.post("/user/forgot-password", data);
  return response;
};

const verifyOtp = async (data) => {
  const response = await api.post("/user/verify-otp", data);
  return response;
};

const resetPassword = async (data) => {
  const response = await api.post("/user/reset-password", data);
  return response;
};

export default {
  userRegister,
  userLogin,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
