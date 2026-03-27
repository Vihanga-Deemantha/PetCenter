import API from "./api";

export const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await API.put("/auth/profile", userData);
  return response.data;
};
