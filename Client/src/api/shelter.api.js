import axiosInstance from "./axiosInstance";

// Public
export const getShelters = (params = {}) =>
  axiosInstance.get("/shelters", { params });

export const getShelterDetail = (id) =>
  axiosInstance.get(`/shelters/${id}`);

export const revealShelterContact = (id) =>
  axiosInstance.post(`/shelters/${id}/reveal-contact`);

// Admin
export const getAdminShelters = () =>
  axiosInstance.get("/shelters/admin/all");

export const createShelter = (formData) =>
  axiosInstance.post("/shelters/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateShelter = (id, formData) =>
  axiosInstance.put(`/shelters/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteShelter = (id) =>
  axiosInstance.delete(`/shelters/admin/${id}`);
