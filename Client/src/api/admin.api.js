import axiosInstance from "./axiosInstance.js";

export const getDashboardStats = async () => {
  const { data } = await axiosInstance.get("/admin/dashboard");
  return data;
};

// Users
export const getAdminUsers = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/users", { params });
  return data;
};

export const blockUser = async (id) => {
  const { data } = await axiosInstance.put(`/admin/users/${id}/block`);
  return data;
};

export const unblockUser = async (id) => {
  const { data } = await axiosInstance.put(`/admin/users/${id}/unblock`);
  return data;
};

// Listings
export const getAdminListings = async (params = {}) => {
  const { data } = await axiosInstance.get("/admin/listings", { params });
  return data;
};

export const approveListing = async (id) => {
  const { data } = await axiosInstance.put(`/admin/listings/${id}/approve`);
  return data;
};

export const rejectListing = async (id, note = "") => {
  const { data } = await axiosInstance.put(`/admin/listings/${id}/reject`, { note });
  return data;
};

export const removeListingAdmin = async (id, note = "") => {
  const { data } = await axiosInstance.put(`/admin/listings/${id}/remove`, { note });
  return data;
};
