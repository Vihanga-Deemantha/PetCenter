import axiosInstance from "./axiosInstance.js";

export const getListings = async (params = {}) => {
  const { data } = await axiosInstance.get("/listings", { params });
  return data;
};

export const getListing = async (id) => {
  const { data } = await axiosInstance.get(`/listings/${id}`);
  return data;
};

export const createListing = async (formData) => {
  const { data } = await axiosInstance.post("/listings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateListing = async (id, formData) => {
  const { data } = await axiosInstance.put(`/listings/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteListing = async (id) => {
  const { data } = await axiosInstance.delete(`/listings/${id}`);
  return data;
};

export const getMyListings = async () => {
  const { data } = await axiosInstance.get("/listings/my/listings");
  return data;
};

export const updateListingStatus = async (id, status) => {
  const { data } = await axiosInstance.put(`/listings/${id}/status`, { status });
  return data;
};
