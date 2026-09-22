import axiosInstance from "./axiosInstance";

export const getUserOrders = (params = {}) =>
  axiosInstance.get("/orders", { params });

export const getOrderById = (orderId) =>
  axiosInstance.get(`/orders/${orderId}`);

export const getAdminOrders = (params = {}) =>
  axiosInstance.get("/orders/admin/all-orders", { params });

export const updateOrderStatus = (orderId, status, extra = {}) =>
  axiosInstance.put(`/orders/${orderId}/status`, { status, ...extra });

export const getAdminBestsellers = (params = {}) =>
  axiosInstance.get("/orders/admin/bestsellers", { params });

export const cancelOrder = (orderId) =>
  axiosInstance.put(`/orders/${orderId}/cancel`);
