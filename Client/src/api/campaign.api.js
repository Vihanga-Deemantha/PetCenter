import axiosInstance from "./axiosInstance";

// Public
export const getCampaigns = (params = {}) =>
  axiosInstance.get("/campaigns", { params });

export const getCampaignDetail = (id) =>
  axiosInstance.get(`/campaigns/${id}`);

export const getCampaignDonors = (id, params = {}) =>
  axiosInstance.get(`/campaigns/${id}/donors`, { params });

// Admin
export const getAdminCampaigns = () =>
  axiosInstance.get("/campaigns/admin/all");

export const createCampaign = (formData) =>
  axiosInstance.post("/campaigns/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateCampaign = (id, formData) =>
  axiosInstance.put(`/campaigns/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const publishCampaign = (id) =>
  axiosInstance.patch(`/campaigns/admin/${id}/publish`);

export const closeCampaign = (id, closeReason) =>
  axiosInstance.patch(`/campaigns/admin/${id}/close`, { closeReason });

export const deleteCampaign = (id) =>
  axiosInstance.delete(`/campaigns/admin/${id}`);
