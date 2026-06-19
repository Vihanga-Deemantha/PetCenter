import axiosInstance from "./axiosInstance";

export const getProductReviews = (productId, params = {}) =>
  axiosInstance.get(`/products/${productId}/reviews`, { params });

export const getReviewEligibility = (productId) =>
  axiosInstance.get(`/products/${productId}/reviews/eligibility`);

export const createReview = (productId, data) =>
  axiosInstance.post(`/products/${productId}/reviews`, data);

export const updateReview = (reviewId, data) =>
  axiosInstance.put(`/reviews/${reviewId}`, data);

export const deleteReview = (reviewId) =>
  axiosInstance.delete(`/reviews/${reviewId}`);

export const adminGetReviews = (params = {}) =>
  axiosInstance.get("/admin/reviews", { params });

export const adminHideReview = (reviewId) =>
  axiosInstance.patch(`/admin/reviews/${reviewId}/hide`);
