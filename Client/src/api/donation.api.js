import axiosInstance from "./axiosInstance";

export const createDonationPaymentIntent = (donationData) =>
  axiosInstance.post("/donations/create-payment-intent", donationData);

export const getMyDonations = () =>
  axiosInstance.get("/donations/my-donations");

export const getAdminDonations = () =>
  axiosInstance.get("/donations/admin/all");
