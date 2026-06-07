import axiosInstance from "./axiosInstance";

export const getUserOrders = (params = {}) =>
  axiosInstance.get("/orders", { params });

export const getOrderById = (orderId) =>
  axiosInstance.get(`/orders/${orderId}`);

export const getAdminOrders = (params = {}) =>
  axiosInstance.get("/orders/admin/all-orders", { params });

export const updateOrderStatus = (orderId, status) =>
  axiosInstance.put(`/orders/${orderId}/status`, { status });

export const getAdminBestsellers = (params = {}) =>
  axiosInstance.get("/orders/admin/bestsellers", { params });
