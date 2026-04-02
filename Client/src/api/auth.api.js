import axiosInstance from "./axiosInstance.js";

export const registerUser = async (userData) => {
  const { data } = await axiosInstance.post("/auth/register", userData);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await axiosInstance.post("/auth/login", credentials);
  return data;
};

export const logoutUser = async () => {
  const { data } = await axiosInstance.post("/auth/logout");
  return data;
};

export const getMe = async () => {
  const { data } = await axiosInstance.get("/auth/me");
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await axiosInstance.put("/auth/profile", profileData);
  return data;
};

export const uploadProfilePhoto = async (formData) => {
  const { data } = await axiosInstance.put("/auth/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const refreshToken = async () => {
  const { data } = await axiosInstance.post("/auth/refresh-token");
  return data;
};
