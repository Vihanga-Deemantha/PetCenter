import axiosInstance from "./axiosInstance.js";

// Fetch public platform feedbacks (for homepage)
export const getPublicFeedbacks = () => {
  return axiosInstance.get("/feedback/public");
};

// Submit feedback (logged in user)
export const submitFeedback = (rating, comment) => {
  return axiosInstance.post("/feedback", { rating, comment });
};
